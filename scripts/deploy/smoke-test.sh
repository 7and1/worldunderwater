#!/usr/bin/env bash
#
# smoke-test.sh - Post-deployment smoke tests
#
# Run after deployment to verify system health.
# Exits with non-zero code on failure to block deployment.
#
# Usage:
#   ./smoke-test.sh [--url BASE_URL] [--timeout SECONDS] [--verbose]
#
# Environment variables:
#   BASE_URL   - Base URL of deployed application (default: http://localhost:3000)
#   TIMEOUT    - Request timeout in seconds (default: 30)
#   VERBOSE    - Enable verbose output (default: false)
#

set -euo pipefail

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
TIMEOUT="${TIMEOUT:-30}"
VERBOSE="${VERBOSE:-false}"
FAILED_TESTS=()
PASSED_TESTS=()

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $*"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $*"
    PASSED_TESTS+=("$1")
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $*" >&2
    FAILED_TESTS+=("$1")
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $*" >&2
}

log_debug() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${YELLOW}[DEBUG]${NC} $*"
    fi
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --url)
            BASE_URL="$2"
            shift 2
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        *)
            echo "Unknown option: $1" >&2
            echo "Usage: $0 [--url BASE_URL] [--timeout SECONDS] [--verbose]" >&2
            exit 1
            ;;
    esac
done

# Remove trailing slash
BASE_URL="${BASE_URL%/}"

log_info "Starting smoke tests for ${BASE_URL}"
log_info "Timeout: ${TIMEOUT}s, Verbose: ${VERBOSE}"
echo ""

# HTTP request helper
http_request() {
    local url="$1"
    local expected_status="${2:-200}"
    local method="${3:-GET}"
    local data="${4:-}"

    log_debug "Request: ${method} ${url}"

    local args=(
        -s -o /dev/null -w "%{http_code}"
        --max-time "$TIMEOUT"
        --connect-timeout 10
    )

    if [[ -n "$data" ]]; then
        args+=(-X "$method" -H "Content-Type: application/json" -d "$data")
    else
        args+=(-X "$method")
    fi

    local response
    response=$(curl "${args[@]}" "${url}" 2>&1) || true

    log_debug "Response status: ${response}"

    if [[ "$response" == "$expected_status" ]]; then
        return 0
    else
        return 1
    fi
}

# Get JSON value from API response
get_json_value() {
    local url="$1"
    local key="$2"

    curl -s --max-time "$TIMEOUT" "${url}" | jq -r ".${key} // empty" 2>/dev/null || echo ""
}

# Test 1: Health endpoint
test_health_endpoint() {
    local name="Health Check Endpoint"
    log_info "Testing: ${name}"

    local url="${BASE_URL}/api/health"
    local status

    status=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$url" 2>&1) || true

    if [[ "$status" == "200" ]] || [[ "$status" == "503" ]]; then
        # Get health check details
        local body
        body=$(curl -s --max-time "$TIMEOUT" "$url" 2>&1) || true

        local overall_status
        overall_status=$(echo "$body" | jq -r '.status // empty' 2>/dev/null || echo "")

        log_debug "Health status: ${overall_status}"

        if [[ "$overall_status" == "healthy" ]] || [[ "$overall_status" == "degraded" ]]; then
            log_success "${name} - Status: ${overall_status}"

            # Check individual components
            local db_status
            db_status=$(echo "$body" | jq -r '.checks.database.status // empty' 2>/dev/null || echo "")

            if [[ "$db_status" == "healthy" ]]; then
                log_success "  - Database connection: OK"
            else
                log_error "  - Database connection: ${db_status}"
            fi

            return 0
        else
            log_error "${name} - Unexpected status: ${overall_status}"
            return 1
        fi
    else
        log_error "${name} - HTTP ${status}"
        return 1
    fi
}

# Test 2: Metrics endpoint
test_metrics_endpoint() {
    local name="Metrics Endpoint"
    log_info "Testing: ${name}"

    local url="${BASE_URL}/api/metrics"
    local status

    status=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$url" 2>&1) || true

    # Accept 401 (auth required) or 200 (success)
    if [[ "$status" == "200" ]] || [[ "$status" == "401" ]]; then
        log_success "${name} - HTTP ${status}"
        return 0
    else
        log_error "${name} - HTTP ${status}"
        return 1
    fi
}

# Test 3: Database connectivity via health check
test_database_connectivity() {
    local name="Database Connectivity"
    log_info "Testing: ${name}"

    local url="${BASE_URL}/api/health"
    local body

    body=$(curl -s --max-time "$TIMEOUT" "$url" 2>&1) || true

    local db_status
    db_status=$(echo "$body" | jq -r '.checks.database.status // empty' 2>/dev/null || echo "")

    if [[ "$db_status" == "healthy" ]]; then
        local latency
        latency=$(echo "$body" | jq -r '.checks.database.latencyMs // empty' 2>/dev/null || echo "")

        log_success "${name} - Latency: ${latency}ms"
        return 0
    else
        log_error "${name} - Status: ${db_status}"
        return 1
    fi
}

# Test 4: External API availability (NASA EONET)
test_external_api_eonet() {
    local name="External API - NASA EONET"
    log_info "Testing: ${name}"

    local url="${BASE_URL}/api/health"
    local body

    body=$(curl -s --max-time "$TIMEOUT" "$url" 2>&1) || true

    local api_status
    api_status=$(echo "$body" | jq -r '.checks.nasaEonet.status // empty' 2>/dev/null || echo "")

    if [[ "$api_status" == "healthy" ]]; then
        local latency
        latency=$(echo "$body" | jq -r '.checks.nasaEonet.latencyMs // empty' 2>/dev/null || echo "")

        log_success "${name} - Latency: ${latency}ms"
        return 0
    else
        log_warn "${name} - Status: ${api_status} (may be temporary)"
        # Don't fail on external API issues
        return 0
    fi
}

# Test 5: External API availability (USGS)
test_external_api_usgs() {
    local name="External API - USGS"
    log_info "Testing: ${name}"

    local url="${BASE_URL}/api/health"
    local body

    body=$(curl -s --max-time "$TIMEOUT" "$url" 2>&1) || true

    local api_status
    api_status=$(echo "$body" | jq -r '.checks.usgsApi.status // empty' 2>/dev/null || echo "")

    if [[ "$api_status" == "healthy" ]]; then
        local latency
        latency=$(echo "$body" | jq -r '.checks.usgsApi.latencyMs // empty' 2>/dev/null || echo "")

        log_success "${name} - Latency: ${latency}ms"
        return 0
    else
        log_warn "${name} - Status: ${api_status} (may be temporary)"
        # Don't fail on external API issues
        return 0
    fi
}

# Test 6: Revalidation endpoint (POST)
test_revalidation_endpoint() {
    local name="Revalidation Endpoint"
    log_info "Testing: ${name}"

    local url="${BASE_URL}/api/revalidate"
    local status

    # May return 401/403 without auth, but endpoint should exist
    status=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" -X POST "$url" 2>&1) || true

    if [[ "$status" == "200" ]] || [[ "$status" == "401" ]] || [[ "$status" == "403" ]] || [[ "$status" == "405" ]]; then
        log_success "${name} - HTTP ${status}"
        return 0
    else
        log_error "${name} - HTTP ${status}"
        return 1
    fi
}

# Test 7: Robots.txt
test_static_file() {
    local name="Static Files (robots.txt)"
    log_info "Testing: ${name}"

    local url="${BASE_URL}/robots.txt"
    local status

    status=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$url" 2>&1) || true

    if [[ "$status" == "200" ]]; then
        log_success "${name}"
        return 0
    else
        log_error "${name} - HTTP ${status}"
        return 1
    fi
}

# Test 8: Home page
test_home_page() {
    local name="Home Page"
    log_info "Testing: ${name}"

    local url="${BASE_URL}/"
    local status

    status=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$url" 2>&1) || true

    if [[ "$status" == "200" ]]; then
        log_success "${name}"
        return 0
    else
        log_error "${name} - HTTP ${status}"
        return 1
    fi
}

# Run all tests
run_all_tests() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}     Running Smoke Tests${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""

    test_health_endpoint
    test_metrics_endpoint
    test_database_connectivity
    test_external_api_eonet
    test_external_api_usgs
    test_revalidation_endpoint
    test_static_file
    test_home_page

    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}     Test Summary${NC}"
    echo -e "${BLUE}========================================${NC}"

    local total_tests=$((${#PASSED_TESTS[@]} + ${#FAILED_TESTS[@]}))

    echo ""
    echo -e "Total tests: ${total_tests}"
    echo -e "${GREEN}Passed: ${#PASSED_TESTS[@]}${NC}"
    echo -e "${RED}Failed: ${#FAILED_TESTS[@]}${NC}"

    if [[ ${#FAILED_TESTS[@]} -gt 0 ]]; then
        echo ""
        echo -e "${RED}Failed tests:${NC}"
        for test in "${FAILED_TESTS[@]}"; do
            echo "  - ${test}"
        done
        echo ""
        return 1
    else
        echo ""
        echo -e "${GREEN}All smoke tests passed!${NC}"
        echo ""
        return 0
    fi
}

# Run tests
run_all_tests
exit $?
