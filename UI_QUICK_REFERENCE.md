# HARMONIK SPACE - UI SYSTEM QUICK REFERENCE

## AT A GLANCE

### Component Count
- **Total Components**: 96
- **Total Pages**: 32
- **Forms**: 5 core components
- **Modals**: 15+ specialized dialogs
- **Cards**: 5 variants (Event, Space, Mobile, Skeleton, Custom)

### Color System
| Color | Primary | Usage |
|-------|---------|-------|
| **Forest** | #2d5016 | Primary actions, active states |
| **Earth** | #c96b2a | Secondary actions, accents |
| **Sky** | #0ea5e9 | Accent elements |
| **Gray** | #999 | Neutral, backgrounds |

### Core Layouts

#### Desktop Flow
```
┌─────────────────────────────────────┐
│      DesktopHeader (fixed, z-40)    │
├──────────────┬──────────────────────┤
│  Sidebar     │  Main Content        │
│  (w-64)      │  (responsive grid)   │
│  (z-30)      │                      │
└──────────────┴──────────────────────┘
```

#### Mobile Flow
```
┌─────────────────────────────────────┐
│  Navbar (mobile header)             │
├─────────────────────────────────────┤
│  Main Content                       │
│  (full width, responsive)           │
├─────────────────────────────────────┤
│  BottomNavbar (5 items, z-50)      │
└─────────────────────────────────────┘
```

---

## COMPONENT QUICK LOOKUP

### Navigation
| Component | File | File Path |
|-----------|------|-----------|
| DesktopHeader | ✓ | components/DesktopHeader.tsx |
| BottomNavbar | ✓ | components/BottomNavbar.tsx |
| Sidebar | ✓ | components/Sidebar.tsx |
| Navbar | ✓ | components/Navbar.tsx |

### Cards
| Component | File | Best For |
|-----------|------|----------|
| EventCard | ✓ | Event display |
| SpaceCard | ✓ | Space listing |
| MobileEventCard | ✓ | Mobile view |
| MobileSpaceCard | ✓ | Mobile view |
| EventCardSkeleton | ✓ | Loading state |

### Forms
| Component | File | Purpose |
|-----------|------|---------|
| Form | ✓ | Wrapper with error/success |
| FormField | ✓ | Input wrapper |
| FormCheckbox | ✓ | Checkbox input |
| FormButton | ✓ | Submit button |
| FormSection | ✓ | Field grouping |

### Modals
| Component | Count | Common Features |
|-----------|-------|-----------------|
| Event Modals | 5+ | Details, Edit, Register, Management |
| Space Modals | 4+ | Details, Manage, Application |
| Auth Modals | 1 | Sign in/up |
| Share Modals | 3 | Content sharing |

### Feedback & Notifications
| Component | File | Feature |
|-----------|------|---------|
| NotificationCenter | ✓ | Bell + dropdown, filters, actions |
| LoadingStates | ✓ | 8 variants (Spinner, Button, Skeleton, Loader, FAB) |
| ErrorBoundary | ✓ | Error catching |

### Search & Discovery
| Component | File | Filter Support |
|-----------|------|-----------------|
| SearchSystem | ✓ | 10+ filter types |
| EventSearchAndDiscovery | ✓ | Event-specific |
| LocationBasedSuggestions | ✓ | Location-aware |

---

## STYLING QUICK REFERENCE

### Button Patterns
```tsx
// Primary action
<button className="btn-primary btn-lg">Click Me</button>

// Secondary action
<button className="btn-secondary">Secondary</button>

// Outline style
<button className="btn-outline">Outline</button>

// Minimal
<button className="btn-ghost">Ghost</button>
```

### Card Patterns
```tsx
// Basic card
<div className="card">Content</div>

// Interactive (hover effects)
<div className="card-interactive">Clickable</div>

// Gradient background
<div className="card-gradient">Special</div>
```

### Input Patterns
```tsx
// Primary input
<input className="input-primary" />

// With label
<label>
  <span>Label</span>
  <input className="input-primary" />
</label>

// With error
<input className="input-primary border-red-300" />
<span className="text-red-600">Error message</span>
```

### Loading Patterns
```tsx
import { LoadingSpinner, EventCardSkeleton } from './LoadingStates';

// Spinner
<LoadingSpinner size="md" variant="primary" text="Loading..." />

// Skeleton
<EventCardSkeleton />

// Button with loader
<LoadingButton loading={isLoading}>Submit</LoadingButton>
```

### Modal Pattern
```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Modal Title"
>
  Modal content here
</Modal>
```

---

## RESPONSIVE BREAKPOINTS

| Breakpoint | Size | Usage |
|-----------|------|-------|
| Mobile | < 640px | Default styles |
| SM | 640px | Small devices |
| MD | 768px | Tablets start |
| LG | 1024px | Desktop, sidebar visible |
| XL | 1280px | Large desktop |
| 2XL | 1536px | Extra large |

### Common Responsive Pattern
```tsx
// Mobile first
<div className="
  grid grid-cols-1           // 1 column on mobile
  md:grid-cols-2             // 2 columns at tablet
  lg:grid-cols-3             // 3 columns at desktop
  gap-4 md:gap-6 lg:gap-8    // Responsive spacing
">
```

---

## ANIMATION CLASSES

| Class | Duration | Ease | Use Case |
|-------|----------|------|----------|
| animate-fade-in | 0.6s | ease-in-out | Page transitions |
| animate-slide-up | 0.4s | ease-out | Modals, cards entering |
| animate-scale-in | 0.3s | ease-out | Buttons, icons appearing |
| animate-bounce-gentle | 0.6s | ease-out | Loading states |
| animate-shimmer | 2s | infinite | Skeleton loading |
| animate-float | 3s | infinite | Floating elements |

---

## ICON LIBRARY (Lucide React)

### Most Used Icons
- **Navigation**: Menu, ChevronLeft, ChevronRight, ChevronDown
- **Actions**: Plus, X, Edit, Trash2, Download, Upload
- **Content**: Calendar, Clock, MapPin, Home, Heart, Star
- **Status**: CheckCircle, AlertCircle, XCircle, Loader2
- **UI**: Bell, Mail, Settings, LogOut, LogIn, Eye, EyeOff
- **Special**: Sprout (branding), Badge, Shield, Trophy, Crown

---

## ACCESSIBILITY FEATURES

### Built-in
✓ Keyboard navigation (Tab, Escape, Arrow keys)
✓ Focus management (modals, dropdowns)
✓ ARIA labels and roles
✓ Color contrast (WCAG AA)
✓ Touch targets 44px minimum on mobile

### To Implement
- [ ] Screen reader testing
- [ ] Keyboard-only navigation testing
- [ ] High contrast mode support
- [ ] Focus indicators on all interactive elements

---

## MOBILE OPTIMIZATIONS

### Implemented
✓ Bottom navigation instead of top menu
✓ Touch-friendly sizing (44px+ buttons)
✓ Safe area padding (notch support)
✓ Mobile-first responsive design
✓ PWA install prompt
✓ Offline detection banner
✓ Hardware acceleration on cards
✓ Swipe gesture support

### Best Practices
- Min font size: 16px (prevents iOS zoom)
- Min touch target: 44x44px
- Safe area insets: Top, bottom, left, right
- Momentum scrolling (-webkit-overflow-scrolling)

---

## FILE STRUCTURE OVERVIEW

```
src/
├── components/
│   ├── ui/                    # Base UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── tabs.tsx
│   │   └── date-time-picker.tsx
│   │
│   ├── Layout components      # Navigation & layout
│   │   ├── DesktopHeader.tsx
│   │   ├── BottomNavbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── Navbar.tsx
│   │
│   ├── Cards                  # Card variants
│   │   ├── EventCard.tsx
│   │   ├── EventCardV2.tsx
│   │   ├── MobileEventCard.tsx
│   │   ├── SpaceCard.tsx
│   │   └── MobileSpaceCard.tsx
│   │
│   ├── Forms                  # Form components
│   │   ├── Form.tsx
│   │   ├── FormField.tsx
│   │   ├── FormCheckbox.tsx
│   │   ├── FormButton.tsx
│   │   └── FormSection.tsx
│   │
│   ├── Modals                 # Modal dialogs
│   │   ├── Modal.tsx
│   │   ├── AuthModal.tsx
│   │   ├── EventDetailsModal.tsx
│   │   ├── EventManagementModal.tsx
│   │   └── ... (15+ more)
│   │
│   ├── Feedback               # Notifications & loading
│   │   ├── NotificationCenter.tsx
│   │   ├── LoadingStates.tsx
│   │   └── ErrorBoundary.tsx
│   │
│   ├── Search                 # Search components
│   │   ├── SearchSystem.tsx
│   │   ├── EventSearchAndDiscovery.tsx
│   │   └── LocationInput.tsx
│   │
│   ├── ... (40+ more specialized components)
│   │
│   └── forms/                 # Form component folder
│       └── (5 form components)
│
├── pages/                     # Page components (32 total)
│   ├── Home.tsx
│   ├── Profile.tsx
│   ├── CreateEvent.tsx
│   ├── EventDetail.tsx
│   ├── Spaces.tsx
│   └── ... (27 more pages)
│
├── App.tsx                    # Router setup
├── index.tsx                  # Entry point
├── index.css                  # Global styles
│
└── styles/
    └── design-system.css      # Design tokens
```

---

## DESIGN TOKENS

### Spacing Scale (4px base)
```
1 = 4px,  2 = 8px,   3 = 12px,  4 = 16px
5 = 20px, 6 = 24px,  8 = 32px,  10 = 40px
12 = 48px, 14 = 56px, 16 = 64px, 22 = 88px
```

### Border Radius
```
sm = 8px    (rounded-lg)
md = 12px   (rounded-xl)
lg = 16px   (rounded-2xl)
xl = 24px   (rounded-3xl)
full = 50%  (rounded-full)
```

### Shadow Depths
```
sm:  0 1px 2px rgb(0 0 0 / 0.05)
md:  0 4px 6px rgb(0 0 0 / 0.1)
lg:  0 10px 15px rgb(0 0 0 / 0.1)
xl:  0 20px 25px rgb(0 0 0 / 0.1)
2xl: 0 25px 50px rgb(0 0 0 / 0.25)
```

---

## COMMON PATTERNS

### Event Card with Join Button
```tsx
<EventCard
  event={eventData}
  showManagement={user?.id === eventData.organizer_id}
  onUpdate={refreshEvents}
/>
```

### Space Card with Booking
```tsx
<SpaceCard
  space={spaceData}
  onUpdate={refreshSpaces}
/>
```

### Search with Filters
```tsx
<SearchSystem
  showFilters={true}
  isFullPage={false}
  placeholder="Search events and spaces..."
  onResults={(results) => setResults(results)}
/>
```

### Notification Center
```tsx
<NotificationCenter />
// Renders as bell icon with dropdown
// Includes 6 filter tabs
// Color-coded by type
```

### Loading State
```tsx
<div>
  {loading ? (
    <LoadingSpinner size="lg" variant="primary" text="Loading..." />
  ) : (
    <EventCard event={event} />
  )}
</div>
```

---

## KEY FEATURES BY COMPONENT

### EventCard
- Image with hover zoom
- 6 badge types (category, today, trending, full, verified, free)
- 3 action buttons (bookmark, share, like)
- 3 detail rows (time, location, participants)
- Progress bar with color coding
- Meta information (type, donation)
- Join/Leave button with states
- Error/Success messages
- Ambassador tier badges

### SpaceCard
- Image with hover effects
- 3+ badge types (type, verified, public, facilitator)
- Same 3 action buttons
- 5+ detail rows (address, capacity, pets, amenities)
- Amenity preview (4 visible + more)
- Primary action: Apply OR Book
- Secondary action: Book (conditional)

### SearchSystem
- Real-time search with debounce
- 10+ filter categories
- Recent searches (last 5)
- Popular searches (predefined)
- Results preview in dropdown
- Full-page results layout
- Save search & get alerts (full page only)

### NotificationCenter
- 6 filter tabs
- Color-coded icons & badges
- Context-specific actions per notification
- Mark all as read
- Admin link (if applicable)
- Smooth animations

---

## DEPLOYMENT NOTES

### Bundle Size
- Core components: ~50KB (minified)
- Lucide icons: ~60KB (tree-shakeable)
- Tailwind CSS: ~30KB (purged for production)

### Performance
- Code splitting on pages (lazy loading)
- Component memoization where needed
- Image optimization (responsive sizes)
- Animation GPU acceleration

### Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS 13+, Android 9+)

---

## FUTURE ENHANCEMENTS

### Planned
- [ ] Dark mode support (currently light only)
- [ ] Advanced animations library
- [ ] Component storybook
- [ ] Accessibility audit
- [ ] Performance monitoring

### Considered
- [ ] Custom icon set
- [ ] Theming system
- [ ] Multi-language support
- [ ] Analytics integration
- [ ] A/B testing framework

---

## QUESTIONS?

Refer to full documentation in `/UI_CATALOG.md`

For component-specific details:
- Button variants → UI_CATALOG.md § 5
- Colors & spacing → UI_CATALOG.md § 4
- Animations → UI_CATALOG.md § 9
- Mobile specifics → UI_CATALOG.md § 10

