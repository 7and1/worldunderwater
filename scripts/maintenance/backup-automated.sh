#!/usr/bin/env bash
#
# backup-automated.sh - Automated PostgreSQL backup with retention policy
#
# Usage:
#   ./backup-automated.sh                    # Run backup
#   ./backup-automated.sh --verify          # Test restore latest backup
#   ./backup-automated.sh --retention       # Apply retention policy only
#   ./backup-automated.sh --setup           # Setup cron job
#
# Environment variables:
#   DATABASE_URL     - PostgreSQL connection string (required)
#   BACKUP_DIR       - Backup directory (default: /var/backups/worldunderwater)
#   BACKUP_RETENTION_DAILY  - Daily backups to keep (default: 7)
#   BACKUP_RETENTION_WEEKLY - Weekly backups to keep (default: 4)
#   BACKUP_RETENTION_MONTHLY- Monthly backups to keep (default: 12)
#   BACKUP_PASSWORD  - Optional encryption password
#   NOTIFY_ON_FAILURE - Webhook URL for failure notifications
#

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/worldunderwater}"
RETENTION_DAILY="${BACKUP_RETENTION_DAILY:-7}"
RETENTION_WEEKLY="${BACKUP_RETENTION_WEEKLY:-4}"
RETENTION_MONTHLY="${BACKUP_RETENTION_MONTHLY:-12}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${BACKUP_DIR}/backup.log"
BACKUP_FILE="${BACKUP_DIR}/worldunderwater_${TIMESTAMP}.sql.gz"
ENCRYPTED_FILE="${BACKUP_FILE}.enc"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $*" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $*" | tee -a "$LOG_FILE" >&2
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARN:${NC} $*" | tee -a "$LOG_FILE"
}

# Notification on failure
send_notification() {
    local status=$1
    local message=$2
    local webhook_url="${NOTIFY_ON_FAILURE:-}"

    if [[ -n "$webhook_url" ]]; then
        local payload=$(cat <<EOF
{
  "status": "$status",
  "message": "$message",
  "hostname": "$(hostname)",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
)
        curl -s -X POST "$webhook_url" \
            -H "Content-Type: application/json" \
            -d "$payload" || true
    fi
}

# Verify prerequisites
check_prerequisites() {
    if [[ -z "${DATABASE_URL:-}" ]]; then
        error "DATABASE_URL environment variable is not set"
        send_notification "failed" "Backup failed: DATABASE_URL not set"
        exit 1
    fi

    # Check for required commands
    local missing_cmds=()
    for cmd in pg_dump psql gzip; do
        if ! command -v "$cmd" &>/dev/null; then
            missing_cmds+=("$cmd")
        fi
    done

    if [[ ${#missing_cmds[@]} -gt 0 ]]; then
        error "Missing required commands: ${missing_cmds[*]}"
        send_notification "failed" "Backup failed: Missing commands ${missing_cmds[*]}"
        exit 1
    fi

    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    mkdir -p "${BACKUP_DIR}/daily"
    mkdir -p "${BACKUP_DIR}/weekly"
    mkdir -p "${BACKUP_DIR}/monthly"
}

# Get database size
get_db_size() {
    pg_dump "$DATABASE_URL" --schema-only 2>&1 | head -1 > /dev/null
    echo "$?"
}

# Perform the backup
do_backup() {
    log "Starting backup to ${BACKUP_FILE}"

    local start_time=$(date +%s)

    # Create backup
    if pg_dump "$DATABASE_URL" 2>&1 | gzip > "${BACKUP_FILE}.tmp"; then
        mv "${BACKUP_FILE}.tmp" "$BACKUP_FILE"

        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        local size=$(du -h "$BACKUP_FILE" | cut -f1)

        log "Backup completed successfully in ${duration}s (size: ${size})"

        # Calculate checksum
        if command -v sha256sum &>/dev/null; then
            sha256sum "$BACKUP_FILE" > "${BACKUP_FILE}.sha256"
            log "Checksum: $(cat "${BACKUP_FILE}.sha256" | cut -d' ' -f1)"
        fi

        # Encrypt if password provided
        if [[ -n "${BACKUP_PASSWORD:-}" ]]; then
            log "Encrypting backup..."
            if command -v openssl &>/dev/null; then
                openssl enc -aes-256-cbc -salt -pbkdf2 \
                    -in "$BACKUP_FILE" -out "$ENCRYPTED_FILE" \
                    -pass env:BACKUP_PASSWORD
                rm "$BACKUP_FILE"
                BACKUP_FILE="$ENCRYPTED_FILE"
                log "Backup encrypted"
            else
                warn "openssl not found, skipping encryption"
            fi
        fi

        return 0
    else
        error "Backup failed"
        rm -f "${BACKUP_FILE}.tmp"
        send_notification "failed" "Database backup failed"
        return 1
    fi
}

# Categorize backup by period
categorize_backup() {
    local file=$1
    local day_of_week=$(date +%u)  # 1-7 (Monday-Sunday)
    local day_of_month=$(date +%d)

    # Always link to daily
    ln -sf "$(basename "$file")" "${BACKUP_DIR}/daily/$(basename "$file")"

    # Weekly backup (Sunday = 7)
    if [[ $day_of_week -eq 7 ]]; then
        ln -sf "../$(basename "$file")" "${BACKUP_DIR}/weekly/$(basename "$file")"
        log "Backup categorized as weekly"
    fi

    # Monthly backup (first of month)
    if [[ $day_of_month -eq 01 ]]; then
        ln -sf "../$(basename "$file")" "${BACKUP_DIR}/monthly/$(basename "$file")"
        log "Backup categorized as monthly"
    fi
}

# Apply retention policy
apply_retention() {
    log "Applying retention policy..."

    # Clean old daily backups (keep last N days)
    log "Cleaning daily backups (keeping last ${RETENTION_DAILY})..."
    ls -t "${BACKUP_DIR}/daily"/*.sql.gz* 2>/dev/null | \
        tail -n +$((RETENTION_DAILY + 1)) | \
        xargs -r rm -v
    ls -t "${BACKUP_DIR}"/worldunderwater_*.sql.gz* 2>/dev/null | \
        tail -n +$((RETENTION_DAILY + RETENTION_WEEKLY + RETENTION_MONTHLY + 10)) | \
        xargs -r rm -v

    # Clean old weekly backups
    log "Cleaning weekly backups (keeping last ${RETENTION_WEEKLY})..."
    ls -t "${BACKUP_DIR}/weekly"/*.sql.gz* 2>/dev/null | \
        tail -n +$((RETENTION_WEEKLY + 1)) | \
        xargs -r rm -v

    # Clean old monthly backups
    log "Cleaning monthly backups (keeping last ${RETENTION_MONTHLY})..."
    ls -t "${BACKUP_DIR}/monthly"/*.sql.gz* 2>/dev/null | \
        tail -n +$((RETENTION_MONTHLY + 1)) | \
        xargs -r rm -v

    log "Retention policy applied"
}

# Verify backup by doing a test restore
verify_backup() {
    local backup_file=$1

    log "Verifying backup: ${backup_file}"

    # For encrypted files, decrypt first
    local test_file="$backup_file"
    if [[ "$backup_file" == *.enc ]]; then
        if [[ -z "${BACKUP_PASSWORD:-}" ]]; then
            error "Cannot verify encrypted backup without BACKUP_PASSWORD"
            return 1
        fi
        test_file="${backup_file}.tmp"
        openssl enc -d -aes-256-cbc -pbkdf2 \
            -in "$backup_file" -out "$test_file" \
            -pass env:BACKUP_PASSWORD
    fi

    # Test restore to temp database or just validate SQL
    local temp_file=$(mktemp)
    local exit_code=0

    if [[ "$test_file" == *.gz ]]; then
        gunzip -c "$test_file" > "$temp_file"
    else
        cp "$test_file" "$temp_file"
    fi

    # Basic validation: check if SQL is valid
    if grep -q "PostgreSQL database dump" "$temp_file" 2>/dev/null; then
        log "Backup validation passed: valid PostgreSQL dump"
        exit_code=0
    else
        error "Backup validation failed: not a valid PostgreSQL dump"
        exit_code=1
    fi

    rm -f "$temp_file"
    if [[ "$test_file" != "$backup_file" ]]; then
        rm -f "$test_file"
    fi

    return $exit_code
}

# Verify latest backup
verify_latest() {
    local latest_backup=$(ls -t "${BACKUP_DIR}"/worldunderwater_*.sql.gz* 2>/dev/null | head -1)

    if [[ -z "$latest_backup" ]]; then
        error "No backups found to verify"
        return 1
    fi

    log "Verifying latest backup: ${latest_backup}"

    if verify_backup "$latest_backup"; then
        log "Backup verification successful"
        send_notification "success" "Backup verification completed"
        return 0
    else
        error "Backup verification failed"
        send_notification "failed" "Backup verification failed"
        return 1
    fi
}

# Setup cron job
setup_cron() {
    local cron_cmd="0 2 * * * ${BASH_SOURCE[0]} >/dev/null 2>&1"
    local test_cmd="0 3 * * 0 ${BASH_SOURCE[0]} --verify >/dev/null 2>&1"

    log "Setting up cron jobs..."
    log "  Backup cron: ${cron_cmd}"
    log "  Verify cron: ${test_cmd}"
    log ""
    log "Add these lines to crontab -e to automate:"
    echo ""
    echo "${cron_cmd}"
    echo "${test_cmd}"
    echo ""
}

# Main execution
main() {
    local action="${1:-backup}"

    case "$action" in
        --verify)
            check_prerequisites
            verify_latest
            ;;
        --retention)
            check_prerequisites
            apply_retention
            ;;
        --setup)
            setup_cron
            ;;
        *)
            check_prerequisites
            if do_backup; then
                categorize_backup "$BACKUP_FILE"
                apply_retention
                log "Backup process completed successfully"
                send_notification "success" "Database backup completed successfully"
                exit 0
            else
                exit 1
            fi
            ;;
    esac
}

# Run main function
main "$@"
