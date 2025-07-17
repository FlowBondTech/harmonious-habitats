# Harmony Spaces - Component Design Specifications

**Version**: 1.0  
**Date**: 2025-01-17  
**Type**: React Component Architecture & Design System  

---

## 🎨 Design System Overview

### Design Principles
- **Holistic Aesthetics**: Nature-inspired colors, organic shapes
- **Accessibility First**: WCAG 2.1 AA compliance
- **Mobile-First**: Responsive design for all devices
- **Performance-Conscious**: Optimized animations and interactions
- **Consistent**: Reusable components with predictable patterns

### Color System
```css
/* Primary Colors */
--forest-50: #f0f7ed;   /* Light background */
--forest-500: #4d7c2a;  /* Primary brand */
--forest-700: #234012;  /* Dark accents */

/* Secondary Colors */
--earth-50: #fdf7f0;    /* Warm background */
--earth-500: #e08638;   /* Secondary brand */
--earth-700: #a75225;   /* Dark warm */

/* Accent Colors */
--sky-200: #bae6fd;     /* Light accent */
--sky-500: #87ceeb;     /* Sky blue */
--sky-700: #0284c7;     /* Deep blue */
```

### Typography Scale
```css
/* Headings */
.heading-xl:   32px / 1.2 / 700  /* Hero titles */
.heading-lg:   24px / 1.3 / 600  /* Page titles */
.heading-md:   20px / 1.4 / 600  /* Section titles */
.heading-sm:   16px / 1.5 / 600  /* Card titles */

/* Body Text */
.body-lg:      18px / 1.6 / 400  /* Large body */
.body-md:      16px / 1.6 / 400  /* Default body */
.body-sm:      14px / 1.5 / 400  /* Small text */
.body-xs:      12px / 1.4 / 400  /* Captions */
```

### Spacing System
```css
/* Spacing Scale (Tailwind) */
4px:   1      /* Tight spacing */
8px:   2      /* Close spacing */
12px:  3      /* Small gaps */
16px:  4      /* Default spacing */
24px:  6      /* Medium gaps */
32px:  8      /* Large gaps */
48px:  12     /* Section spacing */
64px:  16     /* Page spacing */
```

---

## 🧩 Core Component Specifications

### 1. **EventCard Component**

#### Purpose
Display event information with interactive elements and booking capabilities.

#### Design Specification
```tsx
interface EventCardProps {
  event: Event;
  variant?: 'default' | 'compact' | 'detailed';
  showManagement?: boolean;
  onUpdate?: () => void;
  className?: string;
}

interface EventCardState {
  isJoining: boolean;
  hasJoined: boolean;
  isBookmarked: boolean;
  showDetailsModal: boolean;
}
```

#### Visual Design
```css
.event-card {
  /* Container */
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
}

.event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
}

.event-card-image {
  height: 200px;
  object-fit: cover;
  transition: transform 0.7s ease;
}

.event-card:hover .event-card-image {
  transform: scale(1.05);
}
```

#### Interactive Elements
- **Hover Effects**: Smooth scale and shadow transitions
- **Action Buttons**: Bookmark, share, join with feedback
- **Status Indicators**: Verified badge, capacity warnings
- **Loading States**: Skeleton and spinner variations

#### Accessibility Features
- **ARIA Labels**: Descriptive labels for screen readers
- **Keyboard Navigation**: Focus management and shortcuts
- **Color Contrast**: Minimum 4.5:1 contrast ratio
- **Touch Targets**: Minimum 44px touch targets

---

### 2. **SearchSystem Component**

#### Purpose
Advanced search interface with filtering, suggestions, and real-time results.

#### Design Specification
```tsx
interface SearchSystemProps {
  onResults?: (results: SearchResults) => void;
  placeholder?: string;
  showFilters?: boolean;
  isFullPage?: boolean;
  variant?: 'default' | 'compact' | 'hero';
}

interface SearchFilters {
  type: 'all' | 'events' | 'spaces' | 'users';
  category: string;
  dateRange: string;
  location: string;
  radius: number;
  skillLevel: string;
  verified: boolean;
}
```

#### Visual Design
```css
.search-container {
  position: relative;
  max-width: 768px;
  margin: 0 auto;
}

.search-input {
  width: 100%;
  padding: 16px 48px 16px 48px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 24px;
  font-size: 16px;
  transition: all 0.3s ease;
}

.search-input:focus {
  border-color: var(--forest-500);
  box-shadow: 0 0 0 3px var(--forest-500 / 0.1);
  outline: none;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
  max-height: 400px;
  overflow-y: auto;
  z-index: 50;
}
```

#### Advanced Features
- **Debounced Search**: 300ms delay for performance
- **Real-time Suggestions**: Popular and recent searches
- **Advanced Filters**: Collapsible filter panel
- **Keyboard Navigation**: Arrow keys and shortcuts
- **Loading States**: Skeleton results during search

---

### 3. **CommunityDashboard Component**

#### Purpose
Display community analytics, personal stats, and engagement metrics.

#### Design Specification
```tsx
interface CommunityDashboardProps {
  variant?: 'full' | 'compact' | 'widget';
  showPersonalStats?: boolean;
  timeRange?: 'week' | 'month' | 'year';
  onActionClick?: (action: string) => void;
}

interface CommunityStats {
  totalEvents: number;
  totalSpaces: number;
  totalMembers: number;
  userParticipation: number;
  personalStats: PersonalStats;
  popularCategories: CategoryData[];
}
```

#### Visual Design
```css
.dashboard-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  padding: 24px;
}

.stat-card {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: var(--forest-800);
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: var(--forest-600);
  font-weight: 500;
}
```

#### Data Visualization
- **Progress Bars**: Animated progress indicators
- **Trend Charts**: Simple line charts for growth
- **Category Pie Charts**: Distribution visualizations
- **Interactive Elements**: Hover states and click actions

---

### 4. **LoadingStates Component Library**

#### Purpose
Comprehensive loading experiences to improve perceived performance.

#### Component Collection
```tsx
// Spinner Variations
<LoadingSpinner 
  size="sm" | "md" | "lg"
  variant="default" | "primary" | "success" | "pulse"
  text="Loading..."
/>

// Button States
<LoadingButton 
  loading={isLoading}
  variant="primary" | "secondary" | "outline"
  onClick={handleClick}
>
  Submit
</LoadingButton>

// Skeleton Loaders
<EventCardSkeleton />
<SpaceCardSkeleton />
<DashboardStatsSkeleton />
<SearchResultsSkeleton />

// Page Loaders
<PageLoader message="Loading community..." />
<ModalLoader message="Saving..." />
```

#### Design Specifications
```css
.loading-spinner {
  display: inline-block;
  animation: spin 1s linear infinite;
}

.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    #f0f0f0 0%,
    #e0e0e0 50%,
    #f0f0f0 100%
  );
  background-size: 400% 100%;
  animation: shimmer 2s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: -400% 0; }
  100% { background-position: 400% 0; }
}

.page-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  gap: 16px;
}
```

---

### 5. **Modal Component System**

#### Purpose
Reusable modal wrapper with consistent behavior and styling.

#### Design Specification
```tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'default' | 'success' | 'warning' | 'danger';
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  children: React.ReactNode;
}
```

#### Visual Design
```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  animation: fade-in 0.3s ease;
}

.modal-content {
  background: white;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  animation: scale-in 0.3s ease;
}

.modal-header {
  padding: 24px 24px 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
}

.modal-footer {
  padding: 16px 24px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
```

#### Accessibility Features
- **Focus Trap**: Keyboard navigation within modal
- **Escape Key**: Close modal on ESC press
- **ARIA Attributes**: Proper modal semantics
- **Focus Management**: Return focus to trigger element

---

## 🎯 Component Patterns

### 1. **Compound Components**
```tsx
// Example: EventCard with compound pattern
<EventCard event={event}>
  <EventCard.Image />
  <EventCard.Content>
    <EventCard.Title />
    <EventCard.Description />
    <EventCard.Actions />
  </EventCard.Content>
</EventCard>
```

### 2. **Render Props Pattern**
```tsx
// Example: SearchSystem with render props
<SearchSystem>
  {({ results, loading, error }) => (
    <div>
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage />}
      {results.map(result => <ResultCard key={result.id} />)}
    </div>
  )}
</SearchSystem>
```

### 3. **Hook-Based State Management**
```tsx
// Custom hooks for component logic
const useEventCard = (event: Event) => {
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  
  const handleJoin = useCallback(async () => {
    setIsJoining(true);
    try {
      await joinEvent(event.id);
      setHasJoined(true);
    } catch (error) {
      logError(error, 'joinEvent');
    } finally {
      setIsJoining(false);
    }
  }, [event.id]);
  
  return { isJoining, hasJoined, handleJoin };
};
```

---

## 📱 Responsive Design Patterns

### Breakpoint Strategy
```css
/* Mobile First Approach */
.component {
  /* Mobile styles (default) */
  padding: 16px;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .component {
    /* Tablet styles */
    padding: 24px;
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 1024px) {
  .component {
    /* Desktop styles */
    padding: 32px;
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Touch Optimization
```css
.touch-target {
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.touch-feedback {
  transition: all 0.2s ease;
  transform-origin: center;
}

.touch-feedback:active {
  transform: scale(0.95);
}
```

---

## 🔄 Animation Guidelines

### Micro-Interactions
```css
/* Hover Effects */
.interactive:hover {
  transform: translateY(-2px);
  transition: transform 0.2s ease;
}

/* Focus States */
.interactive:focus {
  outline: 2px solid var(--forest-500);
  outline-offset: 2px;
}

/* Loading States */
.loading {
  opacity: 0.6;
  pointer-events: none;
  animation: pulse 2s infinite;
}

/* Success States */
.success {
  animation: bounce-in 0.5s ease;
}

@keyframes bounce-in {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); opacity: 1; }
}
```

### Performance Considerations
- **Transform over Position**: Use transform for animations
- **Opacity over Display**: Use opacity for fade effects
- **Will-Change**: Add for complex animations
- **Reduced Motion**: Respect user preferences

---

## 🧪 Testing Strategy

### Component Testing
```tsx
// Example: EventCard test
describe('EventCard', () => {
  it('renders event information correctly', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText(mockEvent.title)).toBeInTheDocument();
    expect(screen.getByText(mockEvent.location)).toBeInTheDocument();
  });
  
  it('handles join event interaction', async () => {
    const mockJoin = jest.fn();
    render(<EventCard event={mockEvent} onJoin={mockJoin} />);
    
    fireEvent.click(screen.getByText('Join Event'));
    await waitFor(() => {
      expect(mockJoin).toHaveBeenCalledWith(mockEvent.id);
    });
  });
});
```

### Visual Regression Testing
```tsx
// Storybook stories for visual testing
export const Default = () => <EventCard event={mockEvent} />;
export const Loading = () => <EventCard event={mockEvent} loading />;
export const Joined = () => <EventCard event={mockEvent} hasJoined />;
```

---

## 📚 Documentation Standards

### Component Documentation
```tsx
/**
 * EventCard displays event information with interactive elements
 * 
 * @param event - Event object containing all event details
 * @param variant - Display variant (default, compact, detailed)
 * @param showManagement - Show management controls for organizers
 * @param onUpdate - Callback when event is updated
 * 
 * @example
 * <EventCard 
 *   event={event} 
 *   variant="compact"
 *   onUpdate={() => refetchEvents()}
 * />
 */
```

### Design Tokens
```tsx
// Design tokens for consistent theming
export const tokens = {
  colors: {
    primary: {
      50: '#f0f7ed',
      500: '#4d7c2a',
      700: '#234012',
    },
    secondary: {
      50: '#fdf7f0',
      500: '#e08638',
      700: '#a75225',
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  typography: {
    sizes: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
    }
  }
};
```

---

This component design system provides a comprehensive foundation for building consistent, accessible, and performant UI components for the Harmony Spaces platform. Each component follows established patterns and maintains the holistic design language while providing excellent user experience across all devices.