# HARMONIK SPACE UI DOCUMENTATION INDEX

## Overview

This directory contains comprehensive documentation of the Harmonik Space UI/UX system. Use these guides to understand, maintain, and extend the component library.

---

## Documentation Files

### 1. UI_CATALOG.md (1,294 lines)
**Complete Reference Guide** - Everything you need to know about the UI system.

#### Sections:
1. **Component Library** (96 total)
   - Core UI components (Button, Card, Tabs, DateTime)
   - Layout components (Header, Navbar, Sidebar, Footer)
   - Card components (Event, Space, Mobile variants)
   - Form components (5 core forms)
   - Modal dialogs (15+ specialized)
   - Feedback & notifications
   - Search & discovery
   - Input & selection
   - Avatar & user components
   - Profile & facilitator components
   - Messaging components
   - Space management
   - Event management
   - Dashboard & analytics
   - Utility & helpers

2. **Page Components** (32 total)
   - Main pages (Home, Profile, Settings)
   - Discovery pages (Map, Neighborhoods, Search)
   - Event pages (Create, Detail, Calendar)
   - Space pages (Browse, Detail, Share)
   - User pages (Activities, Messages)
   - Facilitator pages (Directory, Onboarding)
   - Admin pages (Dashboard, Moderator)
   - Special pages (Ambassadors, Stats)

3. **Reusable Patterns**
   - Card patterns
   - Button patterns
   - Form patterns
   - List patterns
   - Loading states
   - Modal patterns
   - Navigation patterns

4. **Design System** (Detailed)
   - Color palette (Forest, Earth, Sky + neutrals)
   - Typography (Inter font, sizing, weights)
   - Spacing scale (4px base units)
   - Border radius (4 sizes)
   - Shadows (5 depths)
   - Animations (7 keyframes)
   - Backdrops & glass effects

5. **Interactive Elements**
   - Button states & types
   - Input fields & validation
   - Dropdowns & selects
   - Checkboxes & toggles
   - Badges & chips
   - Progress bars
   - Tooltips

6. **Feedback Elements**
   - Toast/Alert messages
   - Status badges
   - Notification colors
   - Success/Error/Warning/Info styles

7. **Layout Components**
   - Header layout (fixed, z-40)
   - Sidebar layout (w-64, z-30)
   - Main content area
   - Bottom navigation (mobile)
   - Footer layout
   - Grid layouts
   - Container widths

8. **Icons** (80+ Lucide icons)
   - Navigation icons
   - Content & communication
   - Location & time
   - Media & visibility
   - User & profile
   - Status & feedback
   - Business icons

9. **Animations & Transitions**
   - Hover effects
   - Focus states
   - Loading animations
   - Page transitions
   - Duration classes

10. **Mobile-Specific Elements**
    - Touch targets (44px)
    - Responsive typography
    - Mobile navigation
    - Mobile forms
    - Safe area support
    - PWA features
    - Mobile-specific CSS

11. **Responsive Breakpoints**
    - Screen sizes (mobile to 2xl)
    - Mobile-first pattern
    - Common responsive classes

---

### 2. UI_QUICK_REFERENCE.md (496 lines)
**Fast Lookup Guide** - Quick reference for common patterns and components.

#### Sections:
1. **At a Glance**
   - Component count summary
   - Color system table
   - Desktop/mobile layout diagrams

2. **Component Quick Lookup**
   - Navigation (4 components)
   - Cards (5 variants)
   - Forms (5 components)
   - Modals (3 categories)
   - Feedback (3 components)
   - Search (3 components)

3. **Styling Quick Reference**
   - Button patterns (4 examples)
   - Card patterns (3 examples)
   - Input patterns (3 examples)
   - Loading patterns (3 examples)
   - Modal pattern

4. **Responsive Breakpoints** (6 sizes)

5. **Animation Classes** (6 animations with specs)

6. **Icon Library Quick Reference**

7. **Accessibility Features**
   - Built-in features
   - To-implement items

8. **Mobile Optimizations**
   - Implemented features
   - Best practices

9. **File Structure Overview** (Full directory tree)

10. **Design Tokens**
    - Spacing scale
    - Border radius
    - Shadow depths

11. **Common Patterns** (5 code examples)

12. **Key Features by Component**
    - EventCard (10 features)
    - SpaceCard (9 features)
    - SearchSystem (8 features)
    - NotificationCenter (4 features)

13. **Deployment Notes**
    - Bundle size estimates
    - Performance notes
    - Browser support

14. **Future Enhancements**
    - Planned items
    - Considered items

---

### 3. UI_CONSISTENCY_GUIDE.md (134 lines)
**Design Consistency Standards** - Rules and guidelines for maintaining UI consistency.

#### Content:
- Naming conventions
- File organization
- Color usage rules
- Typography guidelines
- Spacing rules
- Component structure
- Export patterns
- Documentation requirements

---

## How to Use These Guides

### I'm building a new feature
1. Start with **UI_QUICK_REFERENCE.md** to find similar components
2. Reference **UI_CATALOG.md** § 1 for detailed component specifications
3. Check **UI_CONSISTENCY_GUIDE.md** for code patterns

### I need to understand a component
1. Use the component name in **UI_CATALOG.md**'s index
2. Look up specific features in relevant sections (§ 5-7)
3. See code examples in **UI_QUICK_REFERENCE.md** § 11

### I'm creating a new component
1. Review **UI_CONSISTENCY_GUIDE.md** for standards
2. Find similar components in **UI_CATALOG.md** § 1
3. Reference patterns in **UI_QUICK_REFERENCE.md** § 3

### I need to style something
1. Check color palette in **UI_CATALOG.md** § 4
2. Review design tokens in **UI_QUICK_REFERENCE.md** § 10
3. See responsive patterns in **UI_QUICK_REFERENCE.md** § 4

### I'm working on mobile
1. Review mobile flow diagram in **UI_QUICK_REFERENCE.md** § 1
2. Check mobile-specific styles in **UI_CATALOG.md** § 10
3. See mobile components in **UI_CATALOG.md** § 1 (Mobile* components)

### I need an icon
1. Browse icon list in **UI_CATALOG.md** § 8
2. Check quick reference in **UI_QUICK_REFERENCE.md** § 6

---

## File Statistics

| Document | Lines | Size | Purpose |
|----------|-------|------|---------|
| UI_CATALOG.md | 1,294 | 41 KB | Comprehensive reference |
| UI_QUICK_REFERENCE.md | 496 | 13 KB | Fast lookup |
| UI_CONSISTENCY_GUIDE.md | 134 | 3.8 KB | Standards & rules |
| **TOTAL** | **1,924** | **57.8 KB** | Complete UI documentation |

---

## Key Statistics

### Components
- **Total**: 96 components
- **UI Core**: 4 (Button, Card, Tabs, DateTime)
- **Layout**: 4 (Header, Navbar, Sidebar, Footer)
- **Cards**: 5 (Event, Space, Mobile, Skeleton, Custom)
- **Forms**: 5 (Form, Field, Checkbox, Button, Section)
- **Modals**: 15+ (Auth, Event, Space, Share, etc.)
- **Specialized**: 50+ (Dashboard, Messaging, Search, etc.)

### Pages
- **Total**: 32 pages
- **Main**: 4 (Home, Profile, Settings, Onboard)
- **Discovery**: 6 (Map, Feed, Neighborhoods, Search, etc.)
- **Events**: 7 (Create, Detail, Calendar, Templates, etc.)
- **Spaces**: 4 (Browse, Detail, Share, Manage)
- **User**: 2 (Activities, Messages)
- **Facilitator**: 3 (Directory, Become, Settings)
- **Admin/Special**: 6 (Dashboard, Ambassador, Stats, etc.)

### Design System
- **Colors**: 3 primary (Forest, Earth, Sky) + neutrals
- **Animations**: 7 keyframes with variants
- **Breakpoints**: 6 responsive sizes
- **Spacing**: Base 4px with 20+ scale units
- **Border Radius**: 4 sizes (lg, xl, 2xl, full)
- **Shadow Depths**: 5 levels (sm to 2xl)

### Icons
- **Total**: 80+ Lucide icons
- **Most Used**: Menu, ChevronLeft, Plus, Calendar, Clock, MapPin, Home, Heart, Star

---

## Quick Links

### Component Locations
- Core UI: `src/components/ui/`
- Layout: `src/components/DesktopHeader.tsx`, `Sidebar.tsx`, etc.
- Cards: `src/components/EventCard.tsx`, `SpaceCard.tsx`, etc.
- Forms: `src/components/forms/`
- Modals: `src/components/*Modal.tsx`
- Pages: `src/pages/`

### Key Files
- Styles: `src/index.css`
- Design Tokens: `src/styles/design-system.css`
- Tailwind Config: `tailwind.config.js`
- TypeScript Config: `tsconfig.json`

---

## Documentation Maintenance

### When to Update
- Adding new components
- Changing design system (colors, spacing, etc.)
- Adding new patterns or conventions
- Updating component specifications

### How to Update
1. Edit the relevant guide (CATALOG, QUICK_REFERENCE, or CONSISTENCY)
2. Keep statistics current
3. Update component counts if adding/removing
4. Cross-reference between documents
5. Maintain consistent formatting

### Format Standards
- Use Markdown (`.md`)
- Use `###` for main sections
- Use tables for structured data
- Include code examples with ```tsx``` blocks
- Keep line lengths under 100 characters for readability
- Number sections for easy reference

---

## Related Resources

### In Repository
- `/CLAUDE.md` - Project-level instructions
- `tailwind.config.js` - Design token configuration
- `tsconfig.json` - TypeScript settings
- `App.tsx` - Router and layout setup

### External References
- Tailwind CSS: https://tailwindcss.com/
- Lucide Icons: https://lucide.dev/
- React: https://react.dev/
- React Router: https://reactrouter.com/

---

## Support

For questions about:
- **Specific components**: Check UI_CATALOG.md § 1
- **Design decisions**: Check UI_CONSISTENCY_GUIDE.md
- **Responsive design**: Check UI_CATALOG.md § 11, UI_QUICK_REFERENCE.md § 4
- **Colors/spacing**: Check UI_CATALOG.md § 4, UI_QUICK_REFERENCE.md § 10
- **Code examples**: Check UI_QUICK_REFERENCE.md § 11
- **Mobile specifics**: Check UI_CATALOG.md § 10

---

**Last Updated**: October 28, 2025
**Version**: 1.0
**Maintainer**: Claude Code

