#!/bin/bash

# Holistic Wellness Platform - Development Environment Setup
# Based on BMad DevOps patterns

set -e

echo "🌿 Holistic Wellness Platform - Development Setup"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 is not installed${NC}"
        echo "Please install $1 before continuing"
        exit 1
    else
        echo -e "${GREEN}✅ $1 is installed${NC}"
    fi
}

echo -e "\n${YELLOW}Checking prerequisites...${NC}"
check_command node
check_command npm
check_command git

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo -e "${RED}❌ Node.js version must be 16 or higher${NC}"
    exit 1
fi

# Check for Supabase CLI (optional but recommended)
if command -v supabase &> /dev/null; then
    echo -e "${GREEN}✅ Supabase CLI is installed${NC}"
else
    echo -e "${YELLOW}⚠️  Supabase CLI not found (optional)${NC}"
    echo "Install with: npm install -g supabase"
fi

# Setup environment
echo -e "\n${YELLOW}Setting up environment...${NC}"

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}Creating .env.local file...${NC}"
    cat > .env.local << EOF
# Supabase Configuration
VITE_SUPABASE_URL=your-project-url-here
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Development Settings
VITE_DEV_MODE=true
VITE_ENABLE_MOCK_DATA=false
EOF
    echo -e "${GREEN}✅ Created .env.local${NC}"
    echo -e "${YELLOW}⚠️  Please update .env.local with your Supabase credentials${NC}"
else
    echo -e "${GREEN}✅ .env.local already exists${NC}"
fi

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
npm install

# Create necessary directories
echo -e "\n${YELLOW}Creating directory structure...${NC}"
mkdir -p docs/runbooks
mkdir -p scripts/migrations
mkdir -p .github/workflows
echo -e "${GREEN}✅ Directory structure created${NC}"

# Database setup instructions
echo -e "\n${YELLOW}Database Setup Instructions:${NC}"
echo "1. Create a new Supabase project at https://app.supabase.com"
echo "2. Copy your project URL and anon key to .env.local"
echo "3. Run the migrations in supabase/migrations/ folder"
echo "   - You can use Supabase dashboard SQL editor"
echo "   - Or use Supabase CLI: supabase db push"

# Development server instructions
echo -e "\n${YELLOW}To start development:${NC}"
echo "1. npm run dev          - Start development server"
echo "2. npm run build        - Build for production"
echo "3. npm run preview      - Preview production build"
echo "4. npm run typecheck    - Run TypeScript checks"

# Git hooks setup
echo -e "\n${YELLOW}Setting up Git hooks...${NC}"
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Pre-commit hook for code quality

echo "🔍 Running pre-commit checks..."

# Type checking
echo "📝 Type checking..."
npm run typecheck || {
    echo "❌ Type check failed"
    exit 1
}

echo "✅ All checks passed!"
EOF

chmod +x .git/hooks/pre-commit
echo -e "${GREEN}✅ Git hooks configured${NC}"

# Create development documentation
echo -e "\n${YELLOW}Creating development documentation...${NC}"
cat > docs/DEVELOPMENT.md << 'EOF'
# Development Guide

## Quick Start

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and update values
3. Start dev server: `npm run dev`

## Project Structure

```
/
├── src/              # Application source code
├── supabase/         # Database migrations and functions
├── docs/             # Documentation
├── scripts/          # Utility scripts
└── .github/          # GitHub Actions workflows
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run typecheck` - TypeScript type checking
- `npm test` - Run tests

## Database Management

### Running Migrations
```bash
# Using Supabase Dashboard
# 1. Go to SQL Editor
# 2. Paste migration content
# 3. Run

# Using Supabase CLI
supabase db push
```

### Creating New Migrations
```bash
# Create a new migration file
touch supabase/migrations/$(date +%Y%m%d%H%M%S)_migration_name.sql
```

## Debugging

1. Check browser console for errors
2. Verify environment variables are loaded
3. Check network tab for API failures
4. Review Supabase logs in dashboard

## Code Style

- TypeScript for type safety
- Tailwind CSS for styling
- React hooks for state management
- Supabase client for data fetching
EOF

echo -e "${GREEN}✅ Development documentation created${NC}"

# Final summary
echo -e "\n${GREEN}🎉 Development environment setup complete!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Update .env.local with your Supabase credentials"
echo "2. Run database migrations"
echo "3. Start development with: npm run dev"
echo -e "\n${GREEN}Happy coding! 🚀${NC}"