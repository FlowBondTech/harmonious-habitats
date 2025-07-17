# Harmony Spaces - Development Workflow

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📋 Development Scripts

### Core Commands
- `npm run dev` - Start development server (http://localhost:5173/)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

### Quality Assurance
- `npm run lint` - Run ESLint checks
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run type-check` - TypeScript type checking

### Analysis
- `npm run build:analyze` - Analyze bundle size

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components (44 components)
│   ├── AuthProvider.tsx
│   ├── EventCard.tsx
│   ├── SearchSystem.tsx
│   ├── LoadingStates.tsx
│   └── ...
├── pages/              # Route components (11 pages)
│   ├── Home.tsx
│   ├── Profile.tsx
│   ├── AdminDashboard.tsx
│   └── ...
├── lib/                # Utilities and services
│   ├── supabase.ts     # Database client
│   └── logger.ts       # Logging utility
├── hooks/              # Custom React hooks
│   └── useAuth.ts
└── App.tsx            # Main app component
```

## 🔧 Technology Stack

### Frontend
- **React 18.3.1** - UI framework
- **TypeScript 5.5.3** - Type safety
- **Vite 5.4.2** - Build tool
- **Tailwind CSS 3.4.1** - Styling
- **React Router 6.26.0** - Navigation

### Backend
- **Supabase** - Database, auth, storage, real-time
- **PostgreSQL** - Database with Row Level Security

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Lucide React** - Icons

## 🎯 Code Quality Standards

### Current Status
- **ESLint Errors**: 129 (down from 266)
- **TypeScript**: 100% coverage
- **Bundle Size**: 697KB (20 chunks)
- **Performance**: Optimized with code splitting

### Quality Gates
1. **TypeScript**: No type errors
2. **ESLint**: Critical errors resolved
3. **Build**: Successful production build
4. **Bundle**: Code splitting implemented

## 🔄 Development Workflow

### 1. Feature Development
```bash
# Start development
npm run dev

# Make changes
# Test locally

# Check code quality
npm run lint
npm run type-check

# Build and test
npm run build
npm run preview
```

### 2. Code Quality Checks
- Fix TypeScript errors first
- Address ESLint warnings
- Ensure responsive design
- Test all user flows

### 3. Production Deployment
```bash
# Final build
npm run build

# Verify bundle size
npm run build:analyze

# Deploy dist/ folder
```

## 🌟 Key Features

### Authentication
- Supabase Auth with JWT
- Role-based access control
- User profile management

### Core Features
- **Event Management**: Create, join, manage events
- **Space Sharing**: Share and book community spaces
- **Real-time Messaging**: User-to-user communication
- **Search System**: Advanced filtering and discovery
- **Admin Dashboard**: Platform management

### Technical Features
- **Code Splitting**: Lazy-loaded routes
- **Error Boundaries**: Graceful error handling
- **Loading States**: Professional loading experiences
- **Mobile Optimization**: Touch-friendly interactions
- **Accessibility**: WCAG compliance

## 🐛 Common Issues

### Build Errors
- **ESLint errors**: Run `npm run lint:fix`
- **TypeScript errors**: Run `npm run type-check`
- **Bundle size**: Check `npm run build:analyze`

### Development Issues
- **Hot reload**: Restart dev server
- **CSS changes**: Clear browser cache
- **Component updates**: Check React DevTools

## 📚 Documentation

### Architecture
- `docs/SYSTEM_ARCHITECTURE.md` - System overview
- `docs/COMPONENT_DESIGN.md` - Component specs
- `docs/API_DESIGN.md` - API documentation

### Development
- `DEVELOPMENT_LOG.md` - Session history
- `README.md` - Project overview
- `DEVELOPMENT_WORKFLOW.md` - This file

## 🚀 Performance Optimization

### Bundle Analysis
- Main bundle: 61.51 KB
- React vendor: 141.83 KB
- Supabase vendor: 112.84 KB
- Code splitting: 20 chunks

### Optimization Strategies
1. **Lazy Loading**: Route-based code splitting
2. **Tree Shaking**: Unused code elimination
3. **Compression**: Gzip compression enabled
4. **Caching**: Browser caching optimized

## 🔐 Environment Setup

### Required Variables
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Local Development
1. Copy `.env.example` to `.env`
2. Configure Supabase credentials
3. Run `npm run dev`

---

**Status**: Production Ready ✅  
**Last Updated**: 2025-01-17  
**Version**: 1.0.0