# UI Consistency Guide - Harmony Spaces

## CRITICAL: This guide documents the exact UI specifications that must be maintained across all responsive breakpoints. DO NOT modify these values.

---

## 🎯 Core Principle

ALL UI elements must look EXACTLY the same across ALL breakpoints (mobile, tablet, desktop). No responsive utilities that change sizes, padding, or styling.

---

## 📐 Sidebar Specifications

### Fixed Values (NEVER CHANGE):
- **Width**: `w-64` (256px) - Same on ALL screen sizes
- **Font Size**: `text-sm` (14px) - Applied to `<aside>` element
- **Section Padding**: `p-4` (16px) - For all sidebar sections
- **Nav Item Padding**: `px-4 py-2.5` (16px horizontal, 10px vertical)
- **Icon Sizes**: 
  - Navigation icons: `h-5 w-5` (20x20px)
  - Small icons: `h-4 w-4` (16x16px)
- **Avatar Size**: `size="md"` → `w-10 h-10` (40x40px)
- **Button Text**: `text-sm` (14px) for all buttons
- **Z-Index**: `z-30` - Below header (z-40)

### Behavior:
- **Toggle**: Opens/closes via menu button (same on all devices)
- **Position**: Always `fixed left-0 top-16 h-[calc(100vh-4rem)]` (starts below header)
- **No Backdrop**: No overlay/shadow on ANY device
- **Animation**: `transition-all duration-300` with `translate-x` transform

### Key Files:
- `/src/components/Sidebar.tsx`

---

## 🔝 Header/Navbar Specifications

### Fixed Values (NEVER CHANGE):
- **Height**: `h-16` (64px) via `min-h-16`
- **Padding**: `px-4` (16px horizontal)
- **Logo Text**: `text-lg font-bold` (18px bold)
- **Menu Icon**: `h-6 w-6` (24x24px)
- **Search Icon**: `h-5 w-5` (20x20px)
- **Spacing**:
  - Left section: `space-x-3` (12px gap)
  - Right section: `space-x-2` (8px gap)
- **Auth Buttons**:
  - Height: `h-9` (36px)
  - Padding: `px-3 py-2` (12px horizontal, 8px vertical)
  - Text: `text-sm font-medium` (14px medium weight)
  - Classes: `inline-flex items-center` for vertical centering

### Behavior:
- **Scroll**: Hides on scroll down, shows on scroll up
- **Persistence**: Always visible when sidebar is open
- **Z-Index**: 
  - Mobile Navbar: `z-[100]`
  - Desktop Header: `z-40`

### Key Files:
- `/src/components/Navbar.tsx` (Mobile/Tablet)
- `/src/components/DesktopHeader.tsx` (Desktop)

---

## 🚫 What NOT to Do

1. **NO Responsive Utilities**: Never use `sm:`, `md:`, `lg:`, `xl:`, `2xl:` prefixes
2. **NO Variable Sizes**: Don't use different sizes at different breakpoints
3. **NO Design System Classes**: Avoid classes that might have responsive behavior
4. **NO Backdrop/Overlay**: No shadow overlays on mobile when sidebar is open
5. **NO Different Behaviors**: Same toggle behavior on all devices

---

## ✅ Consistency Checklist

When making UI changes, verify:

- [ ] Same font sizes across all breakpoints
- [ ] Same padding/spacing across all breakpoints
- [ ] Same icon sizes across all breakpoints
- [ ] Same button heights across all breakpoints
- [ ] No responsive utility classes used
- [ ] No backdrop/overlay on mobile
- [ ] Header stays visible when sidebar is open
- [ ] Menu button style identical on mobile and desktop

---

## 📱 Breakpoint Reference

While we don't use responsive styling, these are the viewport breakpoints:
- Default: <640px
- sm: 640-767px
- md: 768-1023px
- lg: 1024-1279px
- xl: 1280-1535px
- 2xl: 1536px+

**Remember**: UI must look IDENTICAL at ALL these breakpoints!

---

## 🔍 Quick Reference

### Sidebar:
```css
width: 256px (w-64)
font-size: 14px (text-sm)
padding: 16px (p-4)
```

### Header:
```css
height: 64px (h-16)
logo: 18px bold (text-lg font-bold)
menu-icon: 24x24px (h-6 w-6)
auth-buttons: 36px height (h-9)
```

### Universal:
```css
No overlays
No responsive changes
Consistent behavior
```

---

**Last Updated**: When these specifications were locked in after extensive testing
**Maintained By**: Development Team
**Status**: FINAL - Do not modify without team consensus