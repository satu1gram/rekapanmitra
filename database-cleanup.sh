#!/bin/bash

# ============================================================================
# AUTOMATED DATABASE CLEANUP RUNNER
# ============================================================================
# 
# Script ini mengotomatisasi cleanup dan verification database.
# Penggunaan:
#   ./database-cleanup.sh [verify|cleanup|fix|full]
# 
# Pilihan:
#   verify - hanya jalankan verification (pre-cleanup check)
#   cleanup - jalankan cleanup duplicate customers
#   fix - jalankan fix triggers dan history
#   full - jalankan semua (verify -> cleanup -> fix -> verify)
#
# ============================================================================

set -e  # Exit jika ada error

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SUPABASE_PROJECT_ID="${SUPABASE_PROJECT_ID:-}"
SUPABASE_DB_PASSWORD="${SUPABASE_DB_PASSWORD:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

print_header() {
  echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║${NC} $1"
  echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}\n"
}

print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

print_step() {
  echo -e "\n${BLUE}▶${NC} $1"
}

confirm() {
  local prompt="$1"
  local response
  read -p "$(echo -e ${YELLOW}$prompt${NC} ${RED}(yes/no)${NC}: )" response
  [[ "$response" == "yes" ]] && return 0 || return 1
}

# ============================================================================
# CHECK PREREQUISITES
# ============================================================================

check_requirements() {
  print_step "Checking prerequisites..."
  
  # Check if psql is installed
  if ! command -v psql &> /dev/null; then
    print_error "psql not found. Please install postgresql client."
    echo "  macOS: brew install libpq"
    echo "  Ubuntu: sudo apt-get install postgresql-client"
    return 1
  fi
  print_success "psql found"
  
  # Check if Supabase project is configured
  if [[ -z "$SUPABASE_PROJECT_ID" || -z "$SUPABASE_DB_PASSWORD" ]]; then
    print_warning "SUPABASE_PROJECT_ID or SUPABASE_DB_PASSWORD not set"
    echo "Set them as environment variables:"
    echo "  export SUPABASE_PROJECT_ID='your-project-id'"
    echo "  export SUPABASE_DB_PASSWORD='your-db-password'"
    return 1
  fi
  print_success "Supabase credentials found"
  
  return 0
}

# ============================================================================
# DATABASE OPERATIONS
# ============================================================================

run_sql_file() {
  local sql_file="$1"
  local step_name="$2"
  
  if [[ ! -f "$sql_file" ]]; then
    print_error "File not found: $sql_file"
    return 1
  fi
  
  print_step "Running: $step_name"
  print_warning "Executing SQL script: $(basename $sql_file)"
  
  PGPASSWORD="$SUPABASE_DB_PASSWORD" psql \
    -h "${SUPABASE_PROJECT_ID}.db.supabase.co" \
    -U postgres \
    -d postgres \
    -f "$sql_file" 2>&1 | tee "/tmp/cleanup_$(basename $sql_file .sql)_$(date +%s).log"
  
  if [[ $? -eq 0 ]]; then
    print_success "$step_name completed successfully"
    return 0
  else
    print_error "$step_name failed. Check log above."
    return 1
  fi
}

backup_database() {
  print_step "Creating database backup..."
  
  local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"
  
  PGPASSWORD="$SUPABASE_DB_PASSWORD" pg_dump \
    -h "${SUPABASE_PROJECT_ID}.db.supabase.co" \
    -U postgres \
    -d postgres \
    --format=plain \
    --file="$backup_file"
  
  if [[ $? -eq 0 ]]; then
    print_success "Database backed up to: $backup_file"
    return 0
  else
    print_error "Backup failed"
    return 1
  fi
}

# ============================================================================
# MAIN WORKFLOW
# ============================================================================

run_verification() {
  print_header "VERIFICATION PHASE"
  run_sql_file "$SCRIPT_DIR/verify_statistics.sql" "Database Statistics Verification"
}

run_cleanup() {
  print_header "CLEANUP PHASE"
  
  if ! confirm "This will merge duplicate customers. Continue?"; then
    print_error "Cleanup cancelled"
    return 1
  fi
  
  # Backup before cleanup
  if confirm "Create backup before cleanup?"; then
    backup_database || return 1
  fi
  
  run_sql_file "$SCRIPT_DIR/cleanup_duplicate_customers.sql" "Duplicate Customer Cleanup"
}

run_fix_triggers() {
  print_header "FIX TRIGGERS & HISTORY PHASE"
  run_sql_file "$SCRIPT_DIR/fix_triggers_and_history.sql" "Trigger & History System Fix"
}

run_full_cleanup() {
  print_header "FULL CLEANUP WORKFLOW"
  print_warning "This will run all phases: Verify → Cleanup → Fix → Verify"
  
  if ! confirm "Continue with full cleanup?"; then
    print_error "Cleanup cancelled"
    return 1
  fi
  
  run_verification || return 1
  run_cleanup || return 1
  run_fix_triggers || return 1
  
  print_step "Final Verification after cleanup..."
  run_verification || return 1
  
  print_header "CLEANUP COMPLETE"
  print_success "Database cleanup and fixes completed successfully"
}

# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

main() {
  local command="${1:-full}"
  
  print_header "DATABASE CLEANUP SCRIPT"
  
  if ! check_requirements; then
    return 1
  fi
  
  case "$command" in
    verify)
      run_verification
      ;;
    cleanup)
      run_cleanup
      ;;
    fix)
      run_fix_triggers
      ;;
    full)
      run_full_cleanup
      ;;
    *)
      print_error "Unknown command: $command"
      echo "Usage: $0 [verify|cleanup|fix|full]"
      return 1
      ;;
  esac
  
  return $?
}

# Run main function
main "$@"
