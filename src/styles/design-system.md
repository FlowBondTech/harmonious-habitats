# Harmonious Habitats Design System

## 🎨 Design Philosophy

Our design system is inspired by nature and holistic wellness, creating a calm and inviting digital environment that promotes community connection and mindful living.

### Core Principles
1. **Nature-Inspired**: Earth tones, organic shapes, and natural imagery
2. **Accessible**: WCAG 2.1 AA compliant with clear contrast and readable typography
3. **Mobile-First**: Optimized for touch interactions and small screens
4. **Performant**: Smooth animations that enhance rather than distract
5. **Consistent**: Predictable patterns that users can learn and trust

## 🎯 Color System

### Primary Colors
```css
/* Forest (Primary Green) */
--forest-600: #4d7c2a;  /* Primary actions */
--forest-700: #2d5016;  /* Hover states */
--forest-800: #234012;  /* Active states */

/* Earth (Secondary Brown/Orange) */
--earth-500: #e08638;   /* Secondary actions */
--earth-600: #c96b2a;   /* Hover states */

/* Sky (Accent Blue) */
--sky-500: #87ceeb;     /* Highlights */
--sky-600: #0ea5e9;     /* Links */
```

### Semantic Colors
```css
/* Status Colors */
--success: #10b981;     /* Green */
--warning: #f59e0b;     /* Amber */
--error: #ef4444;       /* Red */
--info: #3b82f6;        /* Blue */
```

### Category Gradients
```css
.category-gardening { @apply bg-gradient-to-r from-green-100 to-green-200 text-green-800; }
.category-yoga { @apply bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800; }
.category-cooking { @apply bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800; }
.category-art { @apply bg-gradient-to-r from-pink-100 to-pink-200 text-pink-800; }
.category-healing { @apply bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800; }
.category-music { @apply bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800; }
```

## 📐 Typography

### Font Stack
```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

### Type Scale
```css
/* Headings */
.text-h1 { @apply text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight; }
.text-h2 { @apply text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight; }
.text-h3 { @apply text-xl sm:text-2xl lg:text-3xl font-semibold; }
.text-h4 { @apply text-lg sm:text-xl lg:text-2xl font-semibold; }
.text-h5 { @apply text-base sm:text-lg lg:text-xl font-medium; }

/* Body */
.text-body { @apply text-base leading-relaxed; }
.text-body-sm { @apply text-sm leading-relaxed; }
.text-body-xs { @apply text-xs leading-relaxed; }

/* Text Colors */
.text-primary { @apply text-forest-800; }
.text-secondary { @apply text-forest-600; }
.text-muted { @apply text-gray-500; }
```

## 🔲 Spacing System

### Base Unit: 4px (0.25rem)
```css
/* Spacing Scale */
--space-0: 0;
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
```

### Standard Padding
```css
/* Cards */
.card-padding { @apply p-5 sm:p-6; }

/* Sections */
.section-padding { @apply px-4 sm:px-6 lg:px-8; }

/* Modals */
.modal-padding { @apply px-6 py-6 sm:py-8; }
```

## 🎛️ Components

### Buttons

#### Sizes
```css
.btn-sm { @apply px-3 py-2 text-sm; }
.btn-md { @apply px-4 py-3 text-base; }
.btn-lg { @apply px-6 py-4 text-lg; }
```

#### Variants
```css
/* Primary */
.btn-primary {
  @apply bg-gradient-to-r from-forest-600 to-forest-700 
         hover:from-forest-700 hover:to-forest-800 
         text-white font-semibold rounded-lg
         transition-all duration-200 transform hover:scale-[1.02]
         disabled:from-forest-300 disabled:to-forest-400 
         disabled:cursor-not-allowed shadow-sm hover:shadow-md;
}

/* Secondary */
.btn-secondary {
  @apply bg-gradient-to-r from-earth-500 to-earth-600 
         hover:from-earth-600 hover:to-earth-700 
         text-white font-semibold rounded-lg
         transition-all duration-200 transform hover:scale-[1.02];
}

/* Outline */
.btn-outline {
  @apply border-2 border-forest-300 text-forest-700 
         hover:bg-forest-50 hover:border-forest-400
         font-medium rounded-lg transition-all duration-200;
}

/* Ghost */
.btn-ghost {
  @apply text-forest-600 hover:bg-forest-50 hover:text-forest-700
         font-medium rounded-lg transition-all duration-200;
}
```

#### Touch Targets
- Minimum height: 44px (mobile)
- Minimum width: 44px (icons)
- Spacing between targets: 8px minimum

### Cards

```css
/* Base Card */
.card {
  @apply bg-white rounded-2xl shadow-sm border border-gray-100
         overflow-hidden transition-all duration-300;
}

/* Interactive Card */
.card-interactive {
  @apply card hover:shadow-lg hover:-translate-y-1
         transform transition-all duration-300;
}

/* Card Sections */
.card-header { @apply p-5 sm:p-6 border-b border-gray-100; }
.card-body { @apply p-5 sm:p-6; }
.card-footer { @apply p-5 sm:p-6 border-t border-gray-100 bg-gray-50; }
```

### Form Inputs

```css
/* Base Input */
.input-base {
  @apply w-full px-4 py-3 min-h-[44px] 
         border border-forest-200 rounded-lg
         focus:outline-none focus:ring-2 focus:ring-forest-500 
         focus:border-transparent text-base
         placeholder:text-gray-400
         disabled:bg-gray-50 disabled:cursor-not-allowed;
}

/* Input with Icon */
.input-with-icon {
  @apply input-base pl-10;
}

/* Input Icon */
.input-icon {
  @apply absolute left-3 top-1/2 transform -translate-y-1/2 
         h-4 w-4 text-forest-400;
}

/* Error State */
.input-error {
  @apply border-red-300 focus:ring-red-500;
}

/* Success State */
.input-success {
  @apply border-green-300 focus:ring-green-500;
}
```

### Modals

```css
/* Modal Backdrop */
.modal-backdrop {
  @apply fixed inset-0 bg-black/50 backdrop-blur-sm 
         transition-opacity z-50;
}

/* Modal Container */
.modal-container {
  @apply relative w-full max-w-md transform overflow-hidden 
         rounded-2xl bg-white shadow-2xl transition-all;
}

/* Mobile Bottom Sheet */
@media (max-width: 640px) {
  .modal-container {
    @apply rounded-t-2xl rounded-b-none;
  }
}

/* Modal Header */
.modal-header {
  @apply bg-gradient-to-r from-forest-600 to-earth-500 
         px-6 py-6 sm:py-8 text-white;
}

/* Modal Body */
.modal-body {
  @apply px-6 py-6 sm:py-8 max-h-[70vh] overflow-y-auto;
}
```

## 🎭 Animation System

### Transitions
```css
/* Standard Durations */
--duration-fast: 200ms;     /* Color changes, small interactions */
--duration-medium: 300ms;   /* Transforms, standard interactions */
--duration-slow: 500ms;     /* Complex animations, page transitions */

/* Common Transitions */
.transition-base { @apply transition-all duration-300; }
.transition-fast { @apply transition-all duration-200; }
.transition-colors { @apply transition-colors duration-200; }
.transition-transform { @apply transition-transform duration-300; }
```

### Hover Effects
```css
/* Scale */
.hover-scale { @apply hover:scale-[1.02]; }
.hover-scale-sm { @apply hover:scale-[1.01]; }
.hover-scale-lg { @apply hover:scale-110; }

/* Lift */
.hover-lift { @apply hover:-translate-y-1; }
.hover-lift-sm { @apply hover:-translate-y-0.5; }

/* Shadow */
.hover-shadow { @apply hover:shadow-lg; }
.hover-shadow-sm { @apply hover:shadow-md; }
```

### Loading States
```css
/* Spinner */
.spinner {
  @apply animate-spin h-5 w-5 text-forest-600;
}

/* Skeleton */
.skeleton {
  @apply animate-pulse bg-gray-200 rounded;
}

/* Skeleton Text */
.skeleton-text {
  @apply h-4 bg-gray-200 rounded animate-pulse;
}
```

## 📱 Responsive Design

### Breakpoints
```css
/* Mobile First */
xs: 475px   /* Larger phones */
sm: 640px   /* Tablets */
md: 768px   /* Small laptops */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large screens */
2xl: 1536px /* Extra large */
```

### Mobile Patterns
- Bottom navigation for primary actions
- Bottom sheets instead of centered modals
- Larger touch targets (min 44px)
- Simplified navigation
- Single column layouts

### Container
```css
.container-responsive {
  @apply w-full px-4 sm:px-6 lg:px-8 mx-auto;
  max-width: 1280px;
}
```

## 🎪 Special Effects

### Glass Morphism
```css
.glass {
  @apply backdrop-blur-md bg-white/80 border border-white/20;
}

.glass-dark {
  @apply backdrop-blur-md bg-black/20 border border-white/10;
}
```

### Gradients
```css
/* Text Gradient */
.text-gradient {
  @apply bg-gradient-to-r from-forest-600 to-earth-600 
         bg-clip-text text-transparent;
}

/* Background Gradients */
.bg-gradient-forest {
  @apply bg-gradient-to-r from-forest-600 to-forest-700;
}

.bg-gradient-earth {
  @apply bg-gradient-to-r from-earth-500 to-earth-600;
}

.bg-gradient-nature {
  @apply bg-gradient-to-br from-forest-100 to-earth-100;
}
```

## 🎯 Usage Guidelines

### Do's
- ✅ Use semantic color names (primary, secondary) not color values
- ✅ Maintain consistent spacing using the scale
- ✅ Test all interactions on mobile devices
- ✅ Ensure 44px minimum touch targets
- ✅ Use transitions for smooth interactions
- ✅ Follow the established patterns

### Don'ts
- ❌ Create one-off color values
- ❌ Use arbitrary spacing values
- ❌ Mix animation durations
- ❌ Override focus states
- ❌ Use different border radius values
- ❌ Create custom shadows without adding to system

## 🔧 Implementation

### Component Structure
```jsx
// Example: Consistent Button Component
<button className="btn-primary btn-md">
  <Icon className="h-4 w-4 mr-2" />
  Button Text
</button>

// Example: Consistent Card
<div className="card-interactive">
  <div className="relative h-48 overflow-hidden">
    <img className="w-full h-full object-cover" />
  </div>
  <div className="card-body">
    <h3 className="text-h4 text-primary mb-2">Title</h3>
    <p className="text-body text-secondary">Description</p>
  </div>
</div>

// Example: Consistent Form Input
<div className="relative">
  <Icon className="input-icon" />
  <input type="text" className="input-with-icon" placeholder="Enter text" />
</div>
```

## 🚀 Future Enhancements

1. **Dark Mode**: Add dark mode variants for all components
2. **Micro-interactions**: Add subtle animations for delightful UX
3. **Component Library**: Build a Storybook for visual testing
4. **Design Tokens**: Export design system as JSON tokens
5. **Accessibility Modes**: High contrast and reduced motion options