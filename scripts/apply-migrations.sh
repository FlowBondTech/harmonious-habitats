#!/bin/bash

# Apply pending migrations to Supabase
# Usage: ./scripts/apply-migrations.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Applying pending migrations to Supabase...${NC}\n"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Please create .env with SUPABASE_SERVICE_ROLE_KEY and DATABASE_URL"
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Check if required env vars are set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL not set in .env${NC}"
    exit 1
fi

# Migrations directory
MIGRATIONS_DIR="supabase/migrations"

if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo -e "${RED}Error: $MIGRATIONS_DIR directory not found${NC}"
    exit 1
fi

# Apply each migration in order
for migration in "$MIGRATIONS_DIR"/*.sql; do
    if [ -f "$migration" ]; then
        filename=$(basename "$migration")
        echo -e "${YELLOW}Applying: $filename${NC}"

        psql "$DATABASE_URL" -f "$migration"

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Successfully applied: $filename${NC}\n"
        else
            echo -e "${RED}✗ Failed to apply: $filename${NC}\n"
            exit 1
        fi
    fi
done

echo -e "${GREEN}All migrations applied successfully!${NC}"
