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
