# Master AI Frontend Generation Prompt for Harmony Spaces

## Project Context and Foundation

**Project**: Harmony Spaces - A holistic community platform for organizing and discovering local wellness events and sharing community spaces.

**Tech Stack**:
- Frontend Framework: React 18 with TypeScript
- Build Tool: Vite
- Routing: React Router DOM v6
- Styling: Tailwind CSS with custom design tokens
- State Management: React Context API + Custom Hooks
- Backend: Supabase (PostgreSQL, Auth, Real-time, Storage)
- Icons: Lucide React
- Date Handling: date-fns

**Design System**:
- Colors: Primary (Forest Green #4d7c2a), Secondary (Earth Orange #e08638), Accent (Sky Blue #87ceeb)
- Typography: Inter font family, mobile-first scaling
- Spacing: 4px base unit system
- Animations: Custom Tailwind animations (fade-in, slide-up, pulse-gentle)

---

## EXAMPLE PROMPT STRUCTURE

### 1. High-Level Goal
Create a responsive event discovery map page with floating controls and multi-category filtering, following our forest/earth design theme.

### 2. Detailed Instructions

1. **Mobile-First Layout (< 768px)**:
   - Full-screen map as the base layer
   - Floating search bar at top with rounded corners and shadow
   - Filter button integrated into search bar
   - Event counter below search showing "X events nearby"
   - Slide-out filter panel from right (80% screen width)
   - Map markers with category-specific icons

2. **Tablet Adaptation (768-1024px)**:
   - Increase search bar width to 600px max
   - Filter panel width reduced to 400px
   - Larger touch targets for map markers

3. **Desktop Enhancement (> 1024px)**:
   - Search bar centered with max-width 800px
   - Filter panel as modal overlay (480px width)
   - Hover states on all interactive elements
   - Map controls in bottom-right corner

4. **Component Structure**:
   ```typescript
   // File: src/pages/Map.tsx
   const Map: React.FC = () => {
     const [selectedCategories, setSelectedCategories] = useState<string[]>(['all']);
     const [showFilters, setShowFilters] = useState(false);
     const [radius, setRadius] = useState('nearby');
     // ... rest of component
   }
   ```

5. **Filter Panel Features**:
   - Multi-select category checkboxes with custom styling
   - Radius selector with 3 options (nearby, local, global)
   - Apply/Clear buttons at bottom
   - Smooth slide-in animation

### 3. Code Examples & Constraints

**Category Data Structure**:
```typescript
const categories = [
  { id: 'all', name: 'All Events', icon: Filter, color: 'text-forest-600' },
  { id: 'gardening', name: 'Gardening', icon: Sprout, color: 'text-green-600' },
  { id: 'yoga', name: 'Yoga & Meditation', icon: Lotus, color: 'text-purple-600' },
  // ... more categories
];
```

**Styling Requirements**:
- Use ONLY Tailwind CSS classes
- Follow existing color tokens (forest-*, earth-*, sky-*)
- Maintain 4px spacing unit system
- All buttons must have hover and active states
- Shadows use shadow-sm, shadow-md, shadow-lg scale

**API Integration**:
```typescript
// Use existing Supabase client
import { supabase, getEvents } from '../lib/supabase';

// Fetch events with filters
const { data: events } = await getEvents({ 
  status: 'published',
  categories: selectedCategories,
  radius: radius 
});
```

**DO NOT**:
- Create new color variables
- Use inline styles
- Modify existing components
- Add external dependencies
- Change the routing structure

### 4. Strict Scope Definition

**Files to Create/Modify**:
- ONLY modify `src/pages/Map.tsx`
- Can import from existing components in `src/components/*`
- Can use existing hooks from `src/hooks/*`

**Files to Leave Untouched**:
- All components in `src/components/` directory
- Navigation components (Navbar, Sidebar, MobileMenu)
- Authentication-related files
- Supabase configuration

---

## COMPONENT-SPECIFIC PROMPTS

### Event Card Component
```
Create a responsive event card component that displays:
- Event image with 16:9 aspect ratio
- Title, date, time, location
- Organizer info with avatar
- Participant count and capacity
- Quick action buttons (register, save, share)
Mobile: Stack elements vertically, full width
Desktop: 3-column grid layout
Use forest-green for primary actions, earth-orange for secondary
Include skeleton loading state
```

### Search System Component
```
Build an advanced search interface with:
- Autocomplete suggestions from Supabase
- Category filters as colored chips
- Date range picker using native inputs
- Location-based search with radius
- Results count and sorting options
Mobile: Full-screen overlay
Desktop: Dropdown below search bar
Implement debouncing for API calls
Show recent searches in localStorage
```

### User Profile Page
```
Design a comprehensive user profile page showing:
- Cover photo with avatar overlay
- User stats (events attended, hosted, connections)
- Bio section with interests tags
- Upcoming events horizontal scroll
- Activity feed with infinite scroll
- Settings and edit buttons
Mobile: Single column, sticky header
Desktop: 2-column layout with sidebar
Use card-based design with subtle shadows
```

---

## CRITICAL REMINDERS

1. **Mobile-First Development**: Always describe mobile layout first, then scale up
2. **Accessibility**: Include ARIA labels, keyboard navigation, focus management
3. **Performance**: Use React.lazy() for route components, implement virtual scrolling for long lists
4. **Error Handling**: Show user-friendly error states, implement retry mechanisms
5. **Loading States**: Use skeleton loaders matching component shapes
6. **Type Safety**: Define all props with TypeScript interfaces
7. **Component Reusability**: Extract repeated UI patterns into separate components

---

## USAGE INSTRUCTIONS

1. Copy the relevant prompt section above
2. Replace placeholder content with your specific requirements
3. Add any additional context (screenshots, Figma links, etc.)
4. Paste into your AI tool (Vercel v0, Lovable.ai, etc.)
5. Iterate based on results - don't expect perfection on first try
6. Always review generated code for security, performance, and accessibility

**Remember**: AI-generated code requires thorough human review and testing before production use. Use it as a starting point, not the final solution.