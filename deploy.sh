#!/bin/bash
# deploy.sh - Deploy worldunderwater.org to VPS (107.174.42.198)
# Usage: ./deploy.sh [--build|--up|--down|--logs|--restart|--full]

set -e

# Configuration
VPS_HOST="root@107.174.42.198"
VPS_PATH="/opt/docker-projects/heavy-tasks/worldunderwater.org"
LOCAL_PATH="/Volumes/SSD/skills/server-ops/vps/107.174.42.198/heavy-tasks/worldunderwater.org"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Sync code to VPS
sync_code() {
    log_info "Syncing code to VPS..."
    rsync -avz --delete \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude '.next' \
        --exclude '.env' \
        --exclude '.env.*' \
        --exclude '!.env.production.example' \
        --exclude '*.md' \
        --exclude '.DS_Store' \
        --exclude 'secrets' \
        --exclude 'docs' \
        --exclude 'tsconfig.tsbuildinfo' \
        "$LOCAL_PATH/" "$VPS_HOST:$VPS_PATH/"
    log_info "Code synced successfully"
}

# Check if .env.production exists on VPS
check_env() {
    log_info "Checking .env.production on VPS..."
    if ! ssh "$VPS_HOST" "test -f $VPS_PATH/.env.production"; then
        log_error ".env.production not found on VPS!"
        log_warn "Create it from .env.production.example:"
        log_warn "  ssh $VPS_HOST"
        log_warn "  cd $VPS_PATH"
        log_warn "  cp .env.production.example .env.production"
        log_warn "  vim .env.production  # Add secrets"
        exit 1
    fi
    log_info ".env.production exists"
}

# Build and start containers
deploy() {
    log_info "Building and deploying containers..."
    ssh "$VPS_HOST" "cd $VPS_PATH && docker-compose -f docker-compose.prod.yml up -d --build"
    log_info "Deployment complete"
}

# Start containers (no build)
up() {
    log_info "Starting containers..."
    ssh "$VPS_HOST" "cd $VPS_PATH && docker-compose -f docker-compose.prod.yml up -d"
    log_info "Containers started"
}

# Stop containers
down() {
    log_info "Stopping containers..."
    ssh "$VPS_HOST" "cd $VPS_PATH && docker-compose -f docker-compose.prod.yml down"
    log_info "Containers stopped"
}

# View logs
logs() {
    log_info "Fetching logs..."
    ssh "$VPS_HOST" "cd $VPS_PATH && docker-compose -f docker-compose.prod.yml logs -f --tail=100"
}

# Restart containers
restart() {
    log_info "Restarting containers..."
    ssh "$VPS_HOST" "cd $VPS_PATH && docker-compose -f docker-compose.prod.yml restart"
    log_info "Containers restarted"
}

# Check status
status() {
    log_info "Container status:"
    ssh "$VPS_HOST" "docker ps --filter 'name=worldunderwater' --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
}

# Full deployment (sync + build + deploy)
full_deploy() {
    log_info "=== Full Deployment ==="
    sync_code
    check_env
    deploy
    sleep 5
    status
    log_info "=== Deployment Complete ==="
    log_info "Web: http://107.174.42.198:3024"
    log_info "CMS: http://107.174.42.198:3025/admin"
}

# Help
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  --full      Full deploy (sync + build + start)"
    echo "  --sync      Sync code to VPS only"
    echo "  --build     Sync + build + start"
    echo "  --up        Start containers (no build)"
    echo "  --down      Stop containers"
    echo "  --restart   Restart containers"
    echo "  --logs      View container logs"
    echo "  --status    Show container status"
    echo "  --help      Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 --full    # First time deployment"
    echo "  $0 --build   # Update with code changes"
    echo "  $0 --restart # Quick restart"
}

# Main
case "${1:-}" in
    --full)
        full_deploy
        ;;
    --sync)
        sync_code
        ;;
    --build)
        sync_code
        check_env
        deploy
        ;;
    --up)
        up
        ;;
    --down)
        down
        ;;
    --restart)
        restart
        ;;
    --logs)
        logs
        ;;
    --status)
        status
        ;;
    --help|"")
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
