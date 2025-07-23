# CLAUDE.md - Claude Code Assistant Guide for Harmony Spaces

This document provides essential information for Claude Code instances working on the Harmony Spaces codebase.

## 🎯 Project Overview

**Harmony Spaces** is a community platform for discovering and sharing holistic practices, events, and spaces within neighborhoods. It connects neighbors through mindful practices, wellness events, and shared spaces with a focus on local community building.

**Tech Stack:**
- Frontend: React 18, TypeScript, Tailwind CSS
- Backend: Supabase (PostgreSQL, Authentication, Real-time)
- Routing: React Router DOM v6
- Icons: Lucide React
- Build Tool: Vite
- UI Components: Radix UI (for accessible primitives)

## 📁 Project Structure

```
hspacex/
├── src/
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components (routes)
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and API
│   │   └── supabase.ts    # Main Supabase client and types
│   ├── types/             # TypeScript type definitions
│   ├── App.tsx            # Main app component with routing
│   └── main.tsx           # App entry point
├── public/                # Static assets
├── scripts/               # Database management scripts
│   └── db-manager.mjs     # CLI tool for database operations
├── supabase/              # Supabase migrations
├── .env                   # Environment variables (gitignored)
└── FUTURE_PROOF_SQL_FUNCTION.sql  # SQL execution functions
```

## 🚀 Quick Start Commands

```bash
# Development
npm run dev              # Start dev server (port 5173)
npm run build           # Build for production
npm run preview         # Preview production build
npm run lint            # Run ESLint
npm run type-check      # Run TypeScript type checking

# Database Management (requires service role key)
node scripts/db-manager.mjs check        # Check database status
node scripts/db-manager.mjs tables       # List all tables
node scripts/db-manager.mjs sql "query"  # Execute SQL query
node scripts/db-manager.mjs info         # Show database info
```

## 🔑 Environment Variables

Required in `.env`:
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# For database management (admin operations)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

## 📊 Database Architecture

### Core Tables
- **profiles**: User profiles with extensive metadata
- **events**: Community events and gatherings
- **spaces**: Shared community spaces
- **neighborhoods**: Neighborhood groups
- **messages**: User-to-user messaging
- **notifications**: In-app notifications

### Feature-Specific Tables
- **event_participants**: Event registration tracking
- **space_applications**: Facilitator space applications
- **space_bookings**: Space reservation system
- **facilitator_availability**: Facilitator scheduling
- **facilitator_specialties**: Facilitator expertise areas
- **neighborhood_members**: Neighborhood membership

### Important Relationships
- Users can be regular users, space holders, time holders, or facilitators
- Events can be local (neighborhood), virtual, or global physical
- Spaces can be neighborhood-only or publicly listed
- Facilitators can apply to use spaces for their offerings

## 🛠️ Common Tasks

### Adding a New Page
1. Create component in `src/pages/`
2. Add route in `src/App.tsx`
3. Update navigation if needed (`DesktopHeader.tsx`, `Navbar.tsx`, `Sidebar.tsx`)

### Working with Supabase
- All database types are defined in `src/lib/supabase.ts`
- Use the helper functions provided (e.g., `getEvents()`, `updateProfile()`)
- RLS (Row Level Security) is enabled - operations require proper authentication

### Styling Guidelines
- Use Tailwind CSS classes
- Follow existing color scheme (forest, sage, clay, sand)
- Components should be mobile-first responsive
- Use Radix UI primitives for accessible interactive components

### Database Management
The project includes SQL execution functions that allow direct database management:
- `exec_sql()`: Execute DDL/DML commands
- `query_sql()`: Execute SELECT queries

Access these through the `db-manager.mjs` script.

## 🔧 Recent Features & Known Issues

### Recently Added
- Facilitator system with availability and specialties
- Direct database management from Claude
- Three-column profile layout
- Back button on Settings page
- Profile avatars in navigation (removed dropdown arrows)

### Active Features
- Event creation and management
- Space sharing and applications
- Neighborhood groups
- Messaging system
- Admin dashboard
- Facilitator booking system

### Database Tables Created via SQL Functions
- facilitator_availability
- facilitator_specialties
- facilitator_availability_overrides
- facilitator_booking_requests

## 🎨 UI/UX Patterns

### Navigation
- Desktop: Header with profile dropdown
- Mobile: Bottom navbar
- Admin: Sidebar navigation

### Common Components
- `Avatar`: User profile images with fallback
- `EventCard`: Event display cards
- `SpaceCard`: Space display cards
- `Button`: Consistent button styling
- `LoadingSpinner`: Loading states

### Color Palette
```css
--forest: #1a3d2e (primary green)
--sage: #87a96b (lighter green)
--clay: #b87333 (accent orange)
--sand: #f4f1e8 (background)
```

## 📝 Code Style

### TypeScript
- Use strict typing (avoid `any`)
- Define interfaces for all data structures
- Use type imports: `import type { ... }`

### React
- Functional components with hooks
- Custom hooks in `src/hooks/`
- Error boundaries for robustness
- Suspense for code splitting

### File Organization
- One component per file
- Co-locate related components
- Keep components focused and small
- Use index files for clean imports

## 🚨 Important Notes

1. **Authentication**: Always check user authentication state before protected operations
2. **RLS Policies**: Database operations respect Row Level Security - ensure proper user context
3. **Service Role Key**: Only use for admin operations, never expose to client
4. **Error Handling**: Use try-catch blocks and show user-friendly error messages
5. **Mobile First**: Design for mobile, enhance for desktop
6. **Accessibility**: Use semantic HTML and ARIA labels

## 🔄 Git Workflow

1. Make changes
2. Test locally (`npm run dev`)
3. Run linting (`npm run lint`)
4. Run type checking (`npm run type-check`)
5. Commit with descriptive messages
6. Push to repository

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Router Documentation](https://reactrouter.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/)
- [Lucide Icons](https://lucide.dev/)

## 🤝 Contributing Guidelines

1. Follow existing code patterns
2. Maintain TypeScript strict mode compliance
3. Write descriptive commit messages
4. Test on both desktop and mobile
5. Consider accessibility in all changes
6. Update types when modifying database schema

---

*This guide is maintained for Claude Code instances. Update it when making significant architectural changes.*