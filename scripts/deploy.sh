#!/bin/bash

# Unified Interactive Deployment Script
# Supports both production and preview environments
# Usage: ./scripts/deploy.sh [production|preview]
#   Defaults to production if no argument provided

set -e  # Exit on any error
set -o pipefail  # Exit on pipe failures (important for tee commands)

# Determine environment from argument or script name
ENV="${1:-production}"
if [ "$ENV" != "production" ] && [ "$ENV" != "preview" ]; then
    echo "Usage: $0 [production|preview]"
    exit 1
fi

# Set environment-specific variables
if [ "$ENV" = "preview" ]; then
    ENV_FILE=".env.preview"
    ENV_NAME="PREVIEW"
    ENV_DISPLAY="Preview"
    ENV_DISPLAY_LOWER="preview"
    PROJECT_REF_VAR="PREVIEW_PROJECT_REF"
    BRANCH_CHECK="preview"
    NETLIFY_BRANCH="preview"
    SEED_CMD="pnpm supa:seed:preview"
else
    ENV_FILE=".env.production"
    ENV_NAME="PRODUCTION"
    ENV_DISPLAY="Production"
    ENV_DISPLAY_LOWER="production"
    PROJECT_REF_VAR="PROD_PROJECT_REF"
    BRANCH_CHECK="main"
    NETLIFY_BRANCH="main"
    SEED_CMD="pnpm supa:seed"
fi

echo "🚀 Interactive ${ENV_DISPLAY} Deployment"
echo "========================================"
if [ "$ENV" = "preview" ]; then
    echo -e "${YELLOW}⚠️  PREVIEW ENVIRONMENT - Not Production${NC}"
fi

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Error: ${ENV_FILE} file not found${NC}"
    echo "   Create ${ENV_FILE} with your ${ENV_DISPLAY_LOWER} credentials"
    if [ "$ENV" = "preview" ]; then
        echo "   This should point to your preview Supabase fork/project"
    fi
    exit 1
fi

# Source environment
set -a
source "$ENV_FILE"
set +a

# Pre-flight checks
echo ""
echo "🔍 Pre-flight Checks"
echo "========================================"

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}⚠️  Warning: You have uncommitted changes${NC}"
    echo ""
    read -p "Continue anyway? (y/n): " CONTINUE
    if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}⏹️  Deployment cancelled${NC}"
        exit 0
    fi
else
    echo -e "${GREEN}✅ No uncommitted changes${NC}"
fi

# Verify we're on correct branch (optional check)
CURRENT_BRANCH=$(git branch --show-current)
if [ "$ENV" = "preview" ]; then
    if [ "$CURRENT_BRANCH" != "preview" ] && [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
        echo -e "${YELLOW}⚠️  Warning: You're on branch '$CURRENT_BRANCH', not 'preview'${NC}"
        echo "   Make sure you're deploying to the correct environment"
        echo ""
        read -p "Continue anyway? (y/n): " CONTINUE
        if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}⏹️  Deployment cancelled${NC}"
            exit 0
        fi
    fi
fi

# Check Supabase configuration
echo ""
echo -e "${BLUE}Checking Supabase Configuration...${NC}"

# Verify URL and extract project ref
if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ]; then
    echo -e "${RED}❌ EXPO_PUBLIC_SUPABASE_URL not found in ${ENV_FILE}${NC}"
    echo "   Please set EXPO_PUBLIC_SUPABASE_URL in ${ENV_FILE}"
    exit 1
fi

# Verify service role key is set (needed for database operations)
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${YELLOW}⚠️  SUPABASE_SERVICE_ROLE_KEY not found in ${ENV_FILE}${NC}"
    echo "   Database operations may fail without this key"
    echo "   Please set SUPABASE_SERVICE_ROLE_KEY in ${ENV_FILE}"
    echo ""
    read -p "Continue anyway? (y/n): " CONTINUE_KEY
    if [[ ! "$CONTINUE_KEY" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}⏹️  Deployment cancelled${NC}"
        exit 0
    fi
else
    echo -e "${GREEN}✅ SUPABASE_SERVICE_ROLE_KEY found${NC}"
fi

# Check for database URL or password (needed for db operations with --db-url)
if [ -n "$DATABASE_URL" ]; then
    echo -e "${GREEN}✅ DATABASE_URL found${NC}"
    DB_URL="$DATABASE_URL"
elif [ -n "$SUPABASE_DB_PASSWORD" ]; then
    # Construct database URL from project ref and password
    DB_URL="postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres"
    echo -e "${GREEN}✅ Database URL constructed from SUPABASE_DB_PASSWORD${NC}"
else
    echo -e "${YELLOW}⚠️  DATABASE_URL or SUPABASE_DB_PASSWORD not found in ${ENV_FILE}${NC}"
    echo "   Database operations require either:"
    echo "   - DATABASE_URL (full connection string), or"
    echo "   - SUPABASE_DB_PASSWORD (password for postgres user)"
    echo ""
    read -p "Continue anyway? (y/n): " CONTINUE_DB
    if [[ ! "$CONTINUE_DB" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}⏹️  Deployment cancelled${NC}"
        exit 0
    fi
    DB_URL=""
fi

# Extract project ref from URL (e.g., https://xxx.supabase.co -> xxx)
PROJECT_REF=$(echo "$EXPO_PUBLIC_SUPABASE_URL" | sed 's|https://||' | sed 's|\.supabase\.co.*||')
if [ -z "$PROJECT_REF" ]; then
    echo -e "${RED}❌ Could not extract project ref from EXPO_PUBLIC_SUPABASE_URL${NC}"
    echo "   URL: $EXPO_PUBLIC_SUPABASE_URL"
    exit 1
fi

echo -e "${GREEN}✅ ${ENV_DISPLAY} Supabase URL: $EXPO_PUBLIC_SUPABASE_URL${NC}"
echo -e "${GREEN}✅ ${ENV_DISPLAY} Project Ref: ${PROJECT_REF}${NC}"

# Check if a project is linked (informational only)
LINKED_PROJECT=""
if pnpm supa projects list > /dev/null 2>&1; then
    if pnpm supa projects list 2>/dev/null | grep -q "●"; then
        LINKED_PROJECT=$(pnpm supa projects list 2>/dev/null | grep "●" | awk '{print $NF}')
        if [ "$LINKED_PROJECT" = "$PROJECT_REF" ]; then
            echo -e "${GREEN}✅ Linked project matches ${ENV_DISPLAY_LOWER} project${NC}"
        else
            echo -e "${YELLOW}⚠️  Linked project (${LINKED_PROJECT}) differs from ${ENV_DISPLAY_LOWER} (${PROJECT_REF})${NC}"
            echo "   This is OK - we'll use explicit --project-ref flags"
        fi
    else
        echo -e "${BLUE}ℹ️  No project currently linked (this is OK - using explicit project-ref)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Could not check linked projects (this is OK - using explicit project-ref)${NC}"
fi

# Deployment options
echo ""
echo -e "${BLUE}📋 Select Deployment Options${NC}"
echo "========================================"
echo ""
echo "Available options:"
echo "  1) Migrations (database schema changes)"
echo "  2) Functions (Supabase Edge Functions)"
if [ "$ENV" = "preview" ]; then
    echo "  3) Seed (seed preview database)"
    echo "  4) Netlify (web app deployment)"
    echo "  5) Database Reset (DESTRUCTIVE - resets preview database)"
else
    echo "  3) Seed (seed production database)"
    echo "  4) Netlify (web app deployment)"
    echo "  5) Database Reset (DESTRUCTIVE - resets production database)"
fi
echo ""
read -p "Select options (comma-separated, e.g., 1,2,3): " SELECTIONS

# Parse selections
DEPLOY_MIGRATIONS=false
DEPLOY_FUNCTIONS=false
DEPLOY_SEED=false
DEPLOY_NETLIFY=false
DEPLOY_RESET=false

IFS=',' read -ra ADDR <<< "$SELECTIONS"
for i in "${ADDR[@]}"; do
    case $i in
        1) DEPLOY_MIGRATIONS=true ;;
        2) DEPLOY_FUNCTIONS=true ;;
        3) DEPLOY_SEED=true ;;
        4) DEPLOY_NETLIFY=true ;;
        5) DEPLOY_RESET=true ;;
        *) echo -e "${YELLOW}⚠️  Ignoring invalid option: $i${NC}" ;;
    esac
done

# Validate at least one option selected
if [ "$DEPLOY_MIGRATIONS" = false ] && [ "$DEPLOY_FUNCTIONS" = false ] && [ "$DEPLOY_SEED" = false ] && [ "$DEPLOY_NETLIFY" = false ] && [ "$DEPLOY_RESET" = false ]; then
    echo -e "${RED}❌ No valid options selected${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}Selected deployments (${ENV_NAME} ENVIRONMENT):${NC}"
[ "$DEPLOY_MIGRATIONS" = true ] && echo "  ✅ Migrations"
[ "$DEPLOY_FUNCTIONS" = true ] && echo "  ✅ Functions"
[ "$DEPLOY_SEED" = true ] && echo "  ✅ Seed"
[ "$DEPLOY_NETLIFY" = true ] && echo "  ✅ Netlify"
[ "$DEPLOY_RESET" = true ] && echo "  🔴 Database Reset (DESTRUCTIVE)"
echo ""

# Function to prompt yes/no
prompt_continue() {
    local prompt_text="$1"
    read -p "$prompt_text (y/n): " response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        return 1
    fi
    return 0
}

# Deploy Database Reset (must come before migrations)
if [ "$DEPLOY_RESET" = true ]; then
    echo ""
    echo "═══════════════════════════════════════"
    echo "🔴 Database Reset (DESTRUCTIVE)"
    echo "═══════════════════════════════════════"
    
    echo -e "${RED}⚠️  WARNING: This will RESET the ${ENV_NAME} database!${NC}"
    echo "   Database URL: $EXPO_PUBLIC_SUPABASE_URL"
    echo ""
    echo "   This will:"
    echo "   1. DROP all tables and data"
    echo "   2. Apply all migrations"
    echo "   3. Seed ${ENV_DISPLAY_LOWER} data"
    echo ""
    read -p "   Type 'RESET' to continue: " CONFIRM
    
    if [ "$CONFIRM" != "RESET" ]; then
        echo -e "${YELLOW}⏹️  Database reset cancelled${NC}"
        DEPLOY_RESET=false
    else
        echo ""
        echo -e "${BLUE}Resetting ${ENV_DISPLAY_LOWER} database...${NC}"
        
        if [ -z "$DB_URL" ]; then
            echo -e "${RED}❌ Cannot run db reset: DATABASE_URL or SUPABASE_DB_PASSWORD required${NC}"
            echo "   Please set DATABASE_URL or SUPABASE_DB_PASSWORD in ${ENV_FILE}"
            DEPLOY_RESET=false
        else
            echo -e "${CYAN}Command being executed:${NC}"
            echo "  dotenv -e ../../${ENV_FILE} -- pnpx supabase db reset --db-url \"[REDACTED]\""
            echo ""
            echo -e "${CYAN}Target:${NC}"
            echo "  Project: ${PROJECT_REF}"
            echo "  Environment: ${ENV_DISPLAY_LOWER}"
            echo ""
            
            cd packages/supabase
            if dotenv -e ../../${ENV_FILE} -- pnpx supabase db reset --db-url "$DB_URL" 2>&1 | tee /tmp/supabase-reset-${ENV}.log; then
                cd ../..
                echo -e "${GREEN}✅ Database reset and migrations applied successfully${NC}"
            else
                cd ../..
                echo -e "${RED}❌ Database reset failed${NC}"
                if [ -f /tmp/supabase-reset-${ENV}.log ]; then
                    echo ""
                    echo -e "${YELLOW}📋 Reset logs:${NC}"
                    cat /tmp/supabase-reset-${ENV}.log
                fi
                echo -e "${YELLOW}⚠️  Continuing with other deployments...${NC}"
                DEPLOY_RESET=false
            fi
            rm -f /tmp/supabase-reset-${ENV}.log
        fi
    fi
fi

# Deploy Migrations
if [ "$DEPLOY_MIGRATIONS" = true ]; then
    echo ""
    echo "═══════════════════════════════════════"
    echo "📋 Migrations Deployment (${ENV_DISPLAY})"
    echo "═══════════════════════════════════════"
    
    echo ""
    echo -e "${BLUE}Step 1: Checking migration diff...${NC}"
    echo "----------------------------------------"
    
    # Show diff using explicit database URL
    if [ -z "$DB_URL" ]; then
        echo -e "${RED}❌ Cannot run db diff: DATABASE_URL or SUPABASE_DB_PASSWORD required${NC}"
        echo "   Please set DATABASE_URL or SUPABASE_DB_PASSWORD in ${ENV_FILE}"
        exit 1
    fi
    
    # Check if Docker is running (required for shadow database)
    if ! docker info > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Docker is not running${NC}"
        echo "   db diff requires Docker to create a shadow database"
        echo "   Please start Docker and try again"
        echo ""
        read -p "Continue anyway? (y/n): " CONTINUE_DOCKER
        if [[ ! "$CONTINUE_DOCKER" =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}⏹️  Skipping migration diff${NC}"
            DIFF_EXIT_CODE=1
            DIFF_OUTPUT="Docker not running"
        else
            echo -e "${CYAN}Command being executed:${NC}"
            echo "  dotenv -e ../../${ENV_FILE} -- pnpx supabase db diff --db-url \"[REDACTED]\""
            echo ""
            echo -e "${CYAN}Target:${NC}"
            echo "  Project: ${PROJECT_REF}"
            echo "  Environment: ${ENV_DISPLAY_LOWER}"
            echo ""
            echo -e "${YELLOW}⚠️  This may fail or hang without Docker${NC}"
            echo ""
            
            cd packages/supabase
            set +e
            # Add timeout to prevent indefinite hanging
            DIFF_OUTPUT=$(timeout 120 dotenv -e ../../${ENV_FILE} -- pnpx supabase db diff --db-url "$DB_URL" 2>&1)
            DIFF_EXIT_CODE=$?
            set -e
            cd ../..
        fi
    else
        echo -e "${CYAN}Command being executed:${NC}"
        echo "  dotenv -e ../../${ENV_FILE} -- pnpx supabase db diff --db-url \"[REDACTED]\""
        echo ""
        echo -e "${CYAN}Target:${NC}"
        echo "  Project: ${PROJECT_REF}"
        echo "  Environment: ${ENV_DISPLAY_LOWER}"
        echo ""
        echo -e "${BLUE}ℹ️  This will create a temporary shadow database (may take a minute)${NC}"
        echo ""
        
        cd packages/supabase
        set +e
        # Add timeout to prevent indefinite hanging (2 minutes should be enough)
        DIFF_OUTPUT=$(timeout 120 dotenv -e ../../${ENV_FILE} -- pnpx supabase db diff --db-url "$DB_URL" 2>&1)
        DIFF_EXIT_CODE=$?
        set -e
        cd ../..
    fi
    
    echo "$DIFF_OUTPUT" > /tmp/migration-diff-${ENV}.txt
    
    if [ $DIFF_EXIT_CODE -eq 0 ]; then
        DIFF_CONTENT="$DIFF_OUTPUT"
        if [ -z "$DIFF_CONTENT" ] || echo "$DIFF_CONTENT" | grep -q "No schema changes found"; then
            echo -e "${GREEN}✅ No schema changes detected${NC}"
            echo "   ${ENV_DISPLAY} database is up to date with local migrations"
            echo ""
            echo "Diff output:"
            echo "$DIFF_CONTENT"
        else
            echo -e "${YELLOW}📋 Schema changes detected:${NC}"
            echo ""
            echo "$DIFF_CONTENT"
            echo ""
            
            if ! prompt_continue "Apply these migrations to ${ENV_NAME} database?"; then
                echo -e "${YELLOW}⏹️  Skipping migrations${NC}"
            else
                echo ""
                echo -e "${BLUE}Step 2: Pushing migrations to ${ENV_DISPLAY_LOWER}...${NC}"
                echo "----------------------------------------"
                
                if [ -z "$DB_URL" ]; then
                    echo -e "${RED}❌ Cannot run db push: DATABASE_URL or SUPABASE_DB_PASSWORD required${NC}"
                    echo "   Please set DATABASE_URL or SUPABASE_DB_PASSWORD in ${ENV_FILE}"
                    echo -e "${YELLOW}⏹️  Skipping migration push${NC}"
                else
                    # Check if Docker is running (required for shadow database)
                    if ! docker info > /dev/null 2>&1; then
                        echo -e "${YELLOW}⚠️  Docker is not running${NC}"
                        echo "   db push requires Docker to create a shadow database"
                        echo "   Please start Docker and try again"
                        echo -e "${YELLOW}⏹️  Skipping migration push${NC}"
                        PUSH_EXIT_CODE=1
                        PUSH_OUTPUT="Docker not running"
                    else
                        echo -e "${CYAN}Command being executed:${NC}"
                        echo "  dotenv -e ../../${ENV_FILE} -- pnpx supabase db push --db-url \"[REDACTED]\" --include-all"
                        echo ""
                        echo -e "${CYAN}Target:${NC}"
                        echo "  Project: ${PROJECT_REF}"
                        echo "  Environment: ${ENV_DISPLAY_LOWER}"
                        echo ""
                        echo -e "${BLUE}ℹ️  This will create a temporary shadow database (may take a minute)${NC}"
                        echo ""
                        echo -e "${CYAN}Migration push output:${NC}"
                        echo "----------------------------------------"
                        
                        cd packages/supabase
                        set +e
                        # Add timeout to prevent indefinite hanging (5 minutes for push)
                        PUSH_OUTPUT=$(timeout 300 dotenv -e ../../${ENV_FILE} -- pnpx supabase db push --db-url "$DB_URL" --include-all 2>&1)
                        PUSH_EXIT_CODE=$?
                        set -e
                        cd ../..
                    fi
                
                    # Save and display output
                    echo "$PUSH_OUTPUT" > /tmp/supabase-migration-push-${ENV}.log
                    echo "$PUSH_OUTPUT"
                    echo "----------------------------------------"
                    echo ""
                    
                    if [ $PUSH_EXIT_CODE -eq 0 ]; then
                        echo -e "${GREEN}✅ Migrations pushed successfully to ${ENV_DISPLAY_LOWER} (exit code: 0)${NC}"
                    else
                        echo -e "${RED}❌ Migration push failed (exit code: ${PUSH_EXIT_CODE})${NC}"
                        echo ""
                        echo -e "${YELLOW}💡 Troubleshooting:${NC}"
                        echo "   Check full logs: cat /tmp/supabase-migration-push-${ENV}.log"
                        echo "   Verify database URL is correct"
                        echo -e "${YELLOW}⚠️  Continuing with other deployments...${NC}"
                    fi
                    rm -f /tmp/supabase-migration-push-${ENV}.log
                fi
            fi
        fi
    else
        echo -e "${YELLOW}⚠️  Could not check migration diff (exit code: ${DIFF_EXIT_CODE})${NC}"
        echo ""
        echo "Diff output:"
        echo "$DIFF_OUTPUT"
        echo ""
        if prompt_continue "Continue with migration push to ${ENV_DISPLAY_LOWER} anyway?"; then
            if [ -z "$DB_URL" ]; then
                echo -e "${RED}❌ Cannot run db push: DATABASE_URL or SUPABASE_DB_PASSWORD required${NC}"
                echo "   Please set DATABASE_URL or SUPABASE_DB_PASSWORD in ${ENV_FILE}"
            else
                # Check if Docker is running (required for shadow database)
                if ! docker info > /dev/null 2>&1; then
                    echo -e "${YELLOW}⚠️  Docker is not running${NC}"
                    echo "   db push requires Docker to create a shadow database"
                    echo "   Please start Docker and try again"
                    PUSH_EXIT_CODE=1
                    PUSH_OUTPUT="Docker not running"
                else
                    echo -e "${CYAN}Command being executed:${NC}"
                    echo "  dotenv -e ../../${ENV_FILE} -- pnpx supabase db push --db-url \"[REDACTED]\" --include-all"
                    echo ""
                    echo -e "${CYAN}Target:${NC}"
                    echo "  Project: ${PROJECT_REF}"
                    echo "  Environment: ${ENV_DISPLAY_LOWER}"
                    echo ""
                    echo -e "${BLUE}ℹ️  This will create a temporary shadow database (may take a minute)${NC}"
                    echo ""
                    
                    cd packages/supabase
                    set +e
                    # Add timeout to prevent indefinite hanging (5 minutes for push)
                    PUSH_OUTPUT=$(timeout 300 dotenv -e ../../${ENV_FILE} -- pnpx supabase db push --db-url "$DB_URL" --include-all 2>&1)
                    PUSH_EXIT_CODE=$?
                    set -e
                    cd ../..
                fi
            
                echo "$PUSH_OUTPUT" > /tmp/supabase-migration-push-${ENV}-fallback.log
                echo "$PUSH_OUTPUT"
                echo ""
                
                if [ $PUSH_EXIT_CODE -eq 0 ]; then
                    echo -e "${GREEN}✅ Migrations pushed successfully to ${ENV_DISPLAY_LOWER} (exit code: 0)${NC}"
                else
                    echo -e "${RED}❌ Migration push failed (exit code: ${PUSH_EXIT_CODE})${NC}"
                    echo -e "${YELLOW}⚠️  Continuing with other deployments...${NC}"
                fi
                rm -f /tmp/supabase-migration-push-${ENV}-fallback.log
            fi
        fi
    fi
    
    rm -f /tmp/migration-diff-${ENV}.txt
fi

# Deploy Functions
if [ "$DEPLOY_FUNCTIONS" = true ]; then
    echo ""
    echo "═══════════════════════════════════════"
    echo "📋 Functions Deployment (${ENV_DISPLAY})"
    echo "═══════════════════════════════════════"
    
    # List available functions
    echo ""
    echo -e "${BLUE}Available Edge Functions:${NC}"
    echo "  1) trpc (tRPC Router)"
    echo "  2) job-import (Job Import)"
    echo "  3) news (News Function)"
    echo ""
    read -p "Select functions to deploy (comma-separated, e.g., 1,2,3 or 'all'): " FUNC_SELECTIONS
    
    FUNCTIONS_TO_DEPLOY=()
    
    if [ "$FUNC_SELECTIONS" = "all" ]; then
        FUNCTIONS_TO_DEPLOY=("trpc" "job-import" "news")
    else
        IFS=',' read -ra FUNC_ADDR <<< "$FUNC_SELECTIONS"
        for i in "${FUNC_ADDR[@]}"; do
            case $i in
                1) FUNCTIONS_TO_DEPLOY+=("trpc") ;;
                2) FUNCTIONS_TO_DEPLOY+=("job-import") ;;
                3) FUNCTIONS_TO_DEPLOY+=("news") ;;
                *) echo -e "${YELLOW}⚠️  Ignoring invalid function option: $i${NC}" ;;
            esac
        done
    fi
    
    if [ ${#FUNCTIONS_TO_DEPLOY[@]} -eq 0 ]; then
        echo -e "${YELLOW}⏹️  No functions selected${NC}"
    else
        echo ""
        echo -e "${CYAN}Functions to deploy to ${ENV_NAME}:${NC}"
        for func in "${FUNCTIONS_TO_DEPLOY[@]}"; do
            echo "  • $func"
        done
        echo ""
        
        if prompt_continue "Deploy these functions to ${ENV_DISPLAY_LOWER}?"; then
            echo ""
            echo -e "${YELLOW}⚠️  Deploying to ${ENV_NAME} project: ${PROJECT_REF}${NC}"
            echo ""
            
            # Change to supabase directory and deploy with environment
            cd packages/supabase
            
            for func in "${FUNCTIONS_TO_DEPLOY[@]}"; do
                echo ""
                echo "═══════════════════════════════════════"
                echo -e "${BLUE}Deploying $func to ${ENV_DISPLAY_LOWER}${NC}"
                echo "═══════════════════════════════════════"
                echo ""
                echo -e "${CYAN}Configuration:${NC}"
                echo "  Function: $func"
                echo "  Environment: ${ENV_DISPLAY_LOWER}"
                echo "  Project Ref: ${PROJECT_REF}"
                echo "  Environment File: ${ENV_FILE}"
                echo "  Working Directory: $(pwd)"
                echo ""
                
                # Verify function exists
                if [ ! -d "functions/${func}" ]; then
                    echo -e "${RED}❌ Function directory not found: functions/${func}${NC}"
                    echo ""
                    echo "Available functions:"
                    ls -la functions/ | grep "^d" | awk '{print "  - " $NF}'
                    continue
                fi
                
                echo -e "${CYAN}Command being executed:${NC}"
                echo "  dotenv -e ../../${ENV_FILE} -- pnpx supabase functions deploy \"$func\" --project-ref \"${PROJECT_REF}\""
                echo ""
                echo -e "${CYAN}Deployment output:${NC}"
                echo "----------------------------------------"
                
                # Capture output and exit code separately
                set +e  # Temporarily disable exit on error to capture exit code
                DEPLOY_OUTPUT=$(dotenv -e ../../${ENV_FILE} -- pnpx supabase functions deploy "$func" --project-ref "$PROJECT_REF" 2>&1)
                DEPLOY_EXIT_CODE=$?
                set -e  # Re-enable exit on error
                
                # Save output to log file
                echo "$DEPLOY_OUTPUT" > /tmp/supabase-deploy-${ENV}-${func}.log
                
                # Display output with clear formatting
                echo "$DEPLOY_OUTPUT"
                echo "----------------------------------------"
                echo ""
                
                if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
                    echo -e "${GREEN}✅ Command completed with exit code 0${NC}"
                    echo ""
                    
                    # Verify deployment by checking function list
                    echo -e "${CYAN}Verifying deployment...${NC}"
                    set +e
                    VERIFY_OUTPUT=$(dotenv -e ../../${ENV_FILE} -- pnpx supabase functions list --project-ref "$PROJECT_REF" 2>&1)
                    VERIFY_EXIT_CODE=$?
                    set -e
                    
                    if [ $VERIFY_EXIT_CODE -eq 0 ]; then
                        if echo "$VERIFY_OUTPUT" | grep -q "$func"; then
                            echo -e "${GREEN}✅ Function '$func' found in project function list${NC}"
                            echo ""
                            echo -e "${CYAN}Function details:${NC}"
                            echo "$VERIFY_OUTPUT" | grep -A 5 "$func" || echo "$VERIFY_OUTPUT"
                        else
                            echo -e "${YELLOW}⚠️  Function '$func' not found in project function list${NC}"
                            echo ""
                            echo "Available functions:"
                            echo "$VERIFY_OUTPUT"
                        fi
                    else
                        echo -e "${YELLOW}⚠️  Could not verify deployment (exit code: ${VERIFY_EXIT_CODE})${NC}"
                        echo "Verification output:"
                        echo "$VERIFY_OUTPUT"
                    fi
                    echo ""
                    echo -e "${GREEN}✅ $func deployment completed${NC}"
                else
                    echo -e "${RED}❌ Command failed with exit code: ${DEPLOY_EXIT_CODE}${NC}"
                    echo ""
                    echo -e "${YELLOW}💡 Troubleshooting tips:${NC}"
                    echo "   1. Verify the function exists: ls -la functions/${func}/"
                    echo "   2. Check Supabase CLI version: pnpx supabase --version"
                    echo "   3. Verify project ref is correct: ${PROJECT_REF}"
                    echo "   4. Check authentication:"
                    echo "      dotenv -e ../../${ENV_FILE} -- pnpx supabase projects list"
                    echo "   5. Try deploying with debug:"
                    echo "      dotenv -e ../../${ENV_FILE} -- pnpx supabase functions deploy ${func} --project-ref ${PROJECT_REF} --debug"
                    echo "   6. Check full logs: cat /tmp/supabase-deploy-${ENV}-${func}.log"
                fi
                
                echo ""
                echo "═══════════════════════════════════════"
                echo ""
            done
            
            cd ../..
        else
            echo -e "${YELLOW}⏹️  Skipping functions deployment${NC}"
        fi
    fi
fi

# Deploy Seed
if [ "$DEPLOY_SEED" = true ]; then
    echo ""
    echo "═══════════════════════════════════════"
    echo "📋 Database Seeding (${ENV_DISPLAY})"
    echo "═══════════════════════════════════════"
    
    echo -e "${YELLOW}⚠️  WARNING: This will seed the ${ENV_NAME} database${NC}"
    echo "   This may add or modify data in your ${ENV_DISPLAY_LOWER} environment"
    echo ""
    
    if prompt_continue "Continue with seeding ${ENV_DISPLAY_LOWER} database?"; then
        echo ""
        echo -e "${BLUE}Seeding ${ENV_DISPLAY_LOWER} database...${NC}"
        
        if $SEED_CMD; then
            echo -e "${GREEN}✅ ${ENV_DISPLAY} database seeded successfully${NC}"
        else
            echo -e "${RED}❌ Database seeding failed${NC}"
            echo -e "${YELLOW}⚠️  Continuing with other deployments...${NC}"
        fi
    else
        echo -e "${YELLOW}⏹️  Skipping seed${NC}"
    fi
fi

# Deploy Netlify
if [ "$DEPLOY_NETLIFY" = true ]; then
    echo ""
    echo "═══════════════════════════════════════"
    echo "📋 Netlify Deployment (${ENV_DISPLAY})"
    echo "═══════════════════════════════════════"
    
    # Check if netlify CLI is installed
    if ! command -v netlify &> /dev/null; then
        echo -e "${RED}❌ Error: Netlify CLI not installed${NC}"
        echo ""
        echo "Install with:"
        echo "  npm install -g netlify-cli"
        echo ""
        echo -e "${YELLOW}⚠️  Skipping Netlify deployment${NC}"
    else
        echo ""
        echo "Select deployment method:"
        echo "  1) Direct Netlify deployment (local build)"
        echo "  2) GitHub Actions trigger"
        echo ""
        read -p "Select option (1 or 2): " NETLIFY_METHOD
        
        if [ "$NETLIFY_METHOD" = "1" ]; then
            # Direct Netlify deployment
            echo ""
            echo -e "${CYAN}Deployment configuration:${NC}"
            echo "  Environment: ${ENV_DISPLAY_LOWER}"
            echo "  Branch: ${NETLIFY_BRANCH}"
            echo "  Working Directory: $(pwd)"
            echo ""
            
            if prompt_continue "Continue with Netlify ${ENV_DISPLAY_LOWER} deployment?"; then
                echo ""
                echo -e "${BLUE}Step 1: Building application...${NC}"
                echo "----------------------------------------"
                
                # Build packages first
                echo "Building workspace packages..."
                if pnpm --filter @app/ui build && \
                   pnpm --filter @app/core build && \
                   pnpm --filter @app/schemas build; then
                    echo -e "${GREEN}✅ Workspace packages built${NC}"
                else
                    echo -e "${RED}❌ Package build failed${NC}"
                    echo -e "${YELLOW}⚠️  Skipping Netlify deployment${NC}"
                fi
                
                # Build web app
                echo ""
                echo "Building web application..."
                cd apps/expo
                
                if pnpm web:build; then
                    echo -e "${GREEN}✅ Web build complete${NC}"
                    
                    # Verify build output
                    if [ ! -d "dist" ]; then
                        echo -e "${RED}❌ Build output directory not found${NC}"
                        cd ../..
                    else
                        echo -e "${GREEN}✅ Build verified: dist/ directory exists${NC}"
                        cd ../..
                        
                        echo ""
                        echo -e "${BLUE}Step 2: Deploying to Netlify (${ENV_DISPLAY})...${NC}"
                        echo "----------------------------------------"
                        
                        if [ "$ENV" = "preview" ]; then
                            netlify deploy --dir=apps/expo/dist --branch=preview
                        else
                            netlify deploy --dir=apps/expo/dist --prod
                        fi
                        
                        echo -e "${GREEN}✅ Netlify ${ENV_DISPLAY_LOWER} deployment complete${NC}"
                    fi
                else
                    echo -e "${RED}❌ Web build failed${NC}"
                    cd ../..
                fi
            else
                echo -e "${YELLOW}⏹️  Skipping Netlify deployment${NC}"
            fi
        elif [ "$NETLIFY_METHOD" = "2" ]; then
            # GitHub Actions trigger
            echo ""
            echo -e "${BLUE}Triggering GitHub Actions workflow for ${ENV_DISPLAY_LOWER}...${NC}"
            
            if command -v gh &> /dev/null; then
                if gh workflow run deploy-web.yml --ref ${NETLIFY_BRANCH}; then
                    echo -e "${GREEN}✅ GitHub Actions workflow triggered for ${ENV_DISPLAY_LOWER}${NC}"
                    echo ""
                    echo "Monitor deployment:"
                    echo "  gh run list --workflow=deploy-web.yml"
                    echo "  or visit: https://github.com/$(git config --get remote.origin.url | sed 's/.*://;s/.git$//')/actions"
                else
                    echo -e "${YELLOW}⚠️  Failed to trigger GitHub Actions${NC}"
                    echo ""
                    echo "Manual deployment options:"
                    echo "  1. Push to ${NETLIFY_BRANCH} branch: git push origin ${NETLIFY_BRANCH}"
                    echo "  2. Trigger manually in GitHub Actions UI"
                fi
            else
                echo -e "${YELLOW}⚠️  GitHub CLI (gh) not installed${NC}"
                echo ""
                echo "Install gh CLI: brew install gh"
                echo ""
                echo "Alternative: Push to ${NETLIFY_BRANCH} branch to trigger deployment"
            fi
        else
            echo -e "${YELLOW}⏹️  Invalid option, skipping Netlify deployment${NC}"
        fi
    fi
fi

# Deployment Summary
echo ""
echo "═══════════════════════════════════════"
echo -e "${GREEN}🎉 ${ENV_DISPLAY} Deployment Complete!${NC}"
echo "═══════════════════════════════════════"
echo ""
echo "📊 Deployment Summary:"
echo "   Environment: ${ENV_NAME}"
if [ "$ENV" = "preview" ]; then
    echo "   Note: This was a PREVIEW deployment, not production"
fi
echo "   Date: $(date)"
echo "   Commit: $(git rev-parse --short HEAD)"
echo "   Branch: $(git branch --show-current)"
echo ""
[ "$DEPLOY_RESET" = true ] && echo -e "${RED}🔴 Database Reset${NC}"
[ "$DEPLOY_MIGRATIONS" = true ] && echo -e "${GREEN}✅ Migrations${NC}"
[ "$DEPLOY_FUNCTIONS" = true ] && echo -e "${GREEN}✅ Functions${NC}"
[ "$DEPLOY_SEED" = true ] && echo -e "${GREEN}✅ Seed${NC}"
[ "$DEPLOY_NETLIFY" = true ] && echo -e "${GREEN}✅ Netlify${NC}"
echo ""
echo "🔗 Important Links:"
echo "   Supabase: https://supabase.com/dashboard/project/${PROJECT_REF}"
echo "   Netlify: https://app.netlify.com/"
echo "   GitHub Actions: https://github.com/$(git config --get remote.origin.url | sed 's/.*://;s/.git$//')/actions"
echo ""
if [ "$ENV" = "preview" ]; then
    echo -e "${YELLOW}⚠️  Remember: This was a PREVIEW deployment, not production!${NC}"
fi
echo ""
