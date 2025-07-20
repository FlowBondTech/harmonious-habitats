# Harmony Spaces Brownfield Architecture Document

## Introduction

This document captures the CURRENT STATE of the Harmony Spaces codebase, including technical debt, workarounds, and real-world patterns. It serves as a reference for AI agents working on enhancements.

### Document Scope

Comprehensive documentation of entire system - a React-based community platform for holistic wellness space sharing and events.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-01-20 | 1.0 | Initial brownfield analysis | AI Analyst |

## Quick Reference - Key Files and Entry Points

### Critical Files for Understanding the System

- **Main Entry**: `src/main.tsx` - React 18 app entry point
- **App Shell**: `src/App.tsx` - Routes, layout, auth modal control (457 lines)
- **Configuration**: `vite.config.ts`, `.env` (requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)
- **Core Types & API**: `src/lib/supabase.ts` - ALL types and Supabase operations (1857 lines - NEEDS REFACTORING)
- **Authentication**: `src/hooks/useAuth.ts` - Global auth state and profile management
- **Database Schema**: `supabase/migrations/` - 14 migration files defining complete schema
- **Key Business Logic**: 
  - `src/pages/CreateEventSimple.tsx` - Event creation flow
  - `src/pages/Spaces.tsx` - Space listing and discovery
  - `src/pages/Account.tsx` - User profile management (1640 lines - NEEDS SPLITTING)

## High Level Architecture

### Technical Summary

Modern React SPA with Supabase backend-as-a-service, focused on community building and holistic wellness practices. The app enables users to share spaces, create events, and connect with local practitioners.

### Actual Tech Stack (from package.json)

| Category | Technology | Version | Notes |
|----------|------------|---------|--------|
| Runtime | Node.js | 18.x | Netlify deployment |
| Framework | React | 18.3.1 | With TypeScript |
| Build Tool | Vite | 5.4.2 | Fast HMR, manual chunking |
| Styling | Tailwind CSS | 3.4.13 | Custom forest/earth themes |
| Backend | Supabase | 2.46.1 | PostgreSQL, Auth, Storage, Realtime |
| Routing | React Router | 6.27.0 | Client-side routing |
| Date Handling | date-fns | 4.1.0 | Timezone-aware |
| Icons | Lucide React | 0.454.0 | Consistent icon set |
| TypeScript | TypeScript | 5.6.2 | Partial adoption |

### Repository Structure Reality Check

- Type: **Monorepo** with frontend and Supabase migrations
- Package Manager: **npm** (v10.x)
- Notable: No backend code - all business logic in frontend or database

## Source Tree and Module Organization

### Project Structure (Actual)

```text
hspacex/
├── src/
│   ├── components/      # 87 reusable UI components (some with business logic mixed in)
│   ├── pages/          # 25 route pages (LARGE files, mixed concerns)
│   ├── hooks/          # 2 custom hooks (useAuth, useVibeSession)
│   ├── lib/            # Supabase client and types (MONOLITHIC 1857 line file)
│   ├── styles/         # Tailwind config and global CSS
│   ├── utils/          # 11 helper functions
│   └── types/          # EMPTY - types actually in lib/supabase.ts
├── supabase/
│   └── migrations/     # 14 SQL files defining schema evolution
├── public/             # Static assets
├── docs/              # Limited documentation
├── web-bundles/       # Agent configurations
└── scripts/           # Dev setup and linting scripts
```

### Key Modules and Their Issues

- **Supabase Integration**: `src/lib/supabase.ts` - CRITICAL: 1857 lines mixing types, client setup, and helper functions. Contains ALL type definitions and should be split
- **Authentication**: `src/hooks/useAuth.ts` - Well-structured auth hook with retry logic for profile creation
- **App Shell**: `src/App.tsx` - Complex conditional rendering for mobile/desktop, handles modals and routing
- **Event System**: Spread across multiple files with no central service
- **Space Management**: Direct Supabase queries in components, no abstraction layer
- **Notifications**: `src/components/NotificationCenter.tsx` - Direct database queries, no real-time updates

## Data Models and APIs

### Data Models

Instead of duplicating, reference actual model definitions:
- **All Types**: See `src/lib/supabase.ts` lines 10-872 for complete TypeScript interfaces
- **Key Entities**: Profile, Event, Space, TimeOffering, Booking, Notification, HolderApplication
- **Note**: Some interfaces are duplicated (e.g., Notification defined twice at lines 436 and 785)

### API Specifications

- **No REST API**: Direct Supabase client calls from frontend
- **RPC Functions**: None defined - all logic in frontend or RLS policies
- **Real-time**: Only auth state changes subscribed, no data subscriptions
- **File Storage**: Two buckets configured - `profile-images` (10MB limit) and `space-images` (50MB limit)

## Technical Debt and Known Issues

### Critical Technical Debt

1. **Monolithic Type File**: `src/lib/supabase.ts` contains everything - types, client, helpers (1857 lines)
2. **Large Page Components**: `src/pages/Account.tsx` is 1640 lines with mixed concerns
3. **No State Management**: Only local component state, causing data duplication and refetching
4. **Direct Database Access**: No service layer, business logic scattered in components
5. **Inconsistent Error Handling**: Mix of console.error, inline errors, and alerts
6. **Manual Form Management**: No form library, manual validation or none at all
7. **No Real-time Data**: Components don't subscribe to changes, requires manual refresh
8. **Type Safety Issues**: Many `any` types, optional typing, TypeScript not fully utilized

### Workarounds and Gotchas

- **Profile Creation**: Auto-retry logic in useAuth because profile creation can fail
- **Auth Modal**: Global state in App.tsx because no proper state management
- **Image Placeholders**: Hardcoded default images throughout components
- **No Loading Standardization**: Each component implements loading differently
- **Console Logs**: Production code has console.log statements left in
- **TODO Comments**: Unimplemented features marked with TODO (e.g., message sending)
- **Mixed Naming**: Database uses snake_case, frontend uses camelCase, causing confusion
- **No Pagination**: Some lists fetch all data then filter client-side

### Performance Issues

1. **Bundle Size**: No code splitting beyond route-based lazy loading
2. **Unoptimized Queries**: Fetching all data then filtering in frontend
3. **No Memoization**: Components re-render unnecessarily
4. **Large Components**: Some components over 1000 lines slow down HMR
5. **No Caching**: Same data fetched multiple times across components

## Integration Points and External Dependencies

### External Services

| Service | Purpose | Integration Type | Key Files |
|---------|---------|------------------|-----------|
| Supabase | Complete backend | JavaScript Client SDK | `src/lib/supabase.ts` |
| Netlify | Hosting & deployment | Build configuration | `netlify.toml` |

### Internal Integration Points

- **Frontend-Database**: Direct Supabase client calls, no API layer
- **Authentication**: Supabase Auth with custom profile management
- **File Storage**: Supabase Storage for images
- **Environment Variables**: Vite env vars for Supabase credentials

## Development and Deployment

### Local Development Setup

1. **Prerequisites**: Node.js 18+, npm
2. **Environment Setup**:
   ```bash
   # Copy .env.example to .env
   # Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
   ```
3. **Install & Run**:
   ```bash
   npm install
   npm run dev  # Starts on http://localhost:5173
   ```
4. **Known Issues**: 
   - No .env.example file in repo
   - Must have valid Supabase project
   - No seed data scripts

### Build and Deployment Process

- **Build Command**: `npm run build` (Vite production build)
- **Type Check**: `npm run type-check` (but many errors exist)
- **Linting**: `npm run lint` with auto-fix script available
- **Deployment**: Automatic via Netlify on push to main
- **Environments**: Only production (no staging)

## Testing Reality

### Current Test Coverage

- **Unit Tests**: 0% - No test files found
- **Integration Tests**: None
- **E2E Tests**: None  
- **Manual Testing**: Only testing method currently used

### Testing Commands

```bash
# No test commands defined in package.json
# Would need to add testing framework first
```

## Security Considerations

### Current Security Implementation

1. **Row Level Security**: Implemented in Supabase (see migrations)
2. **Authentication**: Supabase Auth with JWT tokens
3. **Environment Variables**: Properly separated but no validation
4. **Client-side Issues**: 
   - All business logic visible in browser
   - Direct database access from frontend
   - No rate limiting implemented

### Security Gaps

- No API layer to hide business logic
- Client-side data filtering instead of server-side
- No input sanitization beyond basic React escaping
- Missing Content Security Policy headers

## Recommended First Steps for Enhancements

### Immediate Priorities (Technical Debt)

1. **Split `src/lib/supabase.ts`**:
   - Move types to `src/types/` directory
   - Create separate files for each entity
   - Keep only client setup in lib file

2. **Implement Error Boundary**:
   - Prevent app crashes
   - Consistent error handling

3. **Add Loading/Error Components**:
   - Standardize UX patterns
   - Reduce code duplication

### Quick Wins

1. **Remove Console Logs**: Clean up production code
2. **Fix TypeScript Errors**: Run type-check and fix issues
3. **Add Form Validation**: Implement proper validation
4. **Implement TODO Items**: Complete unfinished features

### Architecture Improvements

1. **State Management**: Add Context providers for shared state
2. **Service Layer**: Abstract Supabase queries into services  
3. **Custom Hooks**: Extract common data fetching patterns
4. **Real-time Updates**: Add subscriptions for live data

## Appendix - Useful Commands and Scripts

### Frequently Used Commands

```bash
npm run dev         # Start development server on port 5173
npm run build       # Production build
npm run preview     # Preview production build
npm run type-check  # Check TypeScript (will show errors)
npm run lint        # Run ESLint
npm run format      # Format code

# Utility scripts
./scripts/quick-lint-fixes.sh  # Auto-fix lint issues
./scripts/setup-dev.sh         # Setup development environment
./scripts/start-dev-server.sh  # Start dev server wrapper
```

### Common Development Tasks

- **Add New Page**: Create in `src/pages/`, add route in `src/App.tsx`
- **Add New Component**: Create in `src/components/`
- **Update Types**: Edit massive `src/lib/supabase.ts` file
- **Database Changes**: Add migration in `supabase/migrations/`

### Debugging Tips

- **Auth Issues**: Check useAuth hook and Supabase dashboard
- **Data Not Updating**: No real-time subscriptions - need manual refresh
- **Type Errors**: Many `any` types mask issues - check runtime
- **Performance**: Use React DevTools to identify re-render issues