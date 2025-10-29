# HARMONIK SPACE - COMPREHENSIVE UI CATALOG

## 1. COMPONENT LIBRARY (96 Total Components)

### Core UI Components (src/components/ui/)

#### Button Component
- **File**: `/home/koh/Documents/harmonize/src/components/ui/button.tsx`
- **Purpose**: Core button component with multiple variants
- **Variants**: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
- **Sizes**: `default`, `sm`, `lg`, `icon`
- **Features**:
  - Built with class-variance-authority (CVA)
  - Uses Radix UI Slot for flexible rendering
  - Focus ring styling: `focus-visible:ring-2 focus-visible:ring-forest-600`
  - Full keyboard navigation support
  - Disabled state handling

#### Card Components
- **File**: `/home/koh/Documents/harmonize/src/components/ui/card.tsx`
- **Exports**:
  - `Card` - Main container
  - `CardHeader` - Title section (p-6, flex-col)
  - `CardTitle` - Heading (text-2xl, font-semibold)
  - `CardDescription` - Subtitle (text-sm, text-gray-500)
  - `CardContent` - Body (p-6 pt-0)
  - `CardFooter` - Footer (flex items-center, p-6 pt-0)
- **Features**: Rounded-lg border gray-200, bg-white, shadow-sm

#### Tabs Component
- **File**: `/home/koh/Documents/harmonize/src/components/ui/tabs.tsx`
- **Features**: Tab switching with keyboard navigation

#### DateTime Picker
- **File**: `/home/koh/Documents/harmonize/src/components/ui/date-time-picker.tsx`
- **Features**: Date and time selection

---

### Layout Components

#### DesktopHeader
- **File**: `/home/koh/Documents/harmonize/src/components/DesktopHeader.tsx`
- **Purpose**: Main navigation header for desktop (hidden on mobile)
- **Key Features**:
  - Fixed top-0 left-0 right-0 z-40
  - Grid layout (3 columns): Menu | Search | Profile
  - Search bar with real-time query navigation
  - Profile dropdown with avatar
  - Auto-hide on scroll (show on scroll up, hide on scroll down)
  - Menu button hidden for unauthenticated users
  - Responsive logo
- **Key Props**:
  - `onMenuClick`: Toggle sidebar
  - `isSidebarOpen`: Current sidebar state
- **Dropdown Menu Items**:
  - Profile, Create Event, Dashboard, Settings, Sign Out
- **Icons Used**: Menu, User, Settings, LogOut, CalendarPlus, LayoutDashboard, Search, Sprout

#### BottomNavbar
- **File**: `/home/koh/Documents/harmonize/src/components/BottomNavbar.tsx`
- **Purpose**: Mobile bottom navigation bar
- **Key Features**:
  - Fixed bottom-0 left-0 right-0 z-50 md:hidden
  - Grid cols-5 layout
  - Navigation items with badges
  - Active indicator (top underline bar)
  - Floating action button for create event
  - Hidden for unauthenticated users
  - Hidden on /admin, /settings, /create-event paths
- **Navigation Items**:
  1. Home → /activities
  2. Discover → /map
  3. Local → /hyperlocal
  4. Messages → /messages (with badge)
  5. Profile → /profile
- **Floating Button**: Create Event at bottom-20 right-4 (14px × 14px)

#### Navbar
- **File**: `/home/koh/Documents/harmonize/src/components/Navbar.tsx`
- **Purpose**: Mobile header/menu navigation
- **Key Features**: Menu icon with sidebar toggle

#### Sidebar
- **File**: `/home/koh/Documents/harmonize/src/components/Sidebar.tsx`
- **Purpose**: Desktop/mobile side navigation panel
- **Key Features**:
  - Fixed left-0 top-16 h-[calc(100vh-4rem)] z-30 w-64
  - Slides in/out based on state
  - Favorite Spaces section with icons
  - Main navigation with icons and labels
  - User profile section at bottom
  - Sign in/join buttons for unauthenticated users
- **Sections**:
  1. Favorite Spaces (collapsible)
  2. Main Navigation (12+ items)
  3. Admin link (if admin)
  4. User profile card (if authenticated)
- **Navigation Items**:
  - Home, Discover, Neighborhoods, Hyperlocal, Global Feed
  - Calendar, Create Event, My Templates, My Activities
  - Messages, Profile, Settings, Admin (if eligible)

---

### Card Components

#### EventCard
- **File**: `/home/koh/Documents/harmonize/src/components/EventCard.tsx`
- **Purpose**: Display individual event with full details
- **Key Features**:
  - Image with hover zoom effect (scale-110)
  - Top badges: Category, Today!, Trending, Almost Full, Verified, FREE
  - Action buttons: Bookmark, Share, Like (appear on hover)
  - Event title, organizer with ambassador badge
  - Details: Time, Location, Participants with progress bar
  - Meta: Event type, Donation suggestion
  - Join/Leave button with loading states
  - Error/Success messages
  - Event status indicators with color coding
  - Brand ambassador tier badges (Platinum, Gold, Silver, Bronze)
- **Props**:
  - `event`: Event object
  - `showManagement`: Show manage button
  - `onUpdate`: Callback on changes
- **Colors**: Gradient categories, progress bar color-coded

#### EventCardV2
- **File**: `/home/koh/Documents/harmonize/src/components/EventCardV2.tsx`
- **Purpose**: Alternative event card layout

#### MobileEventCard
- **File**: `/home/koh/Documents/harmonize/src/components/MobileEventCard.tsx`
- **Purpose**: Mobile-optimized event card

#### SpaceCard
- **File**: `/home/koh/Documents/harmonize/src/components/SpaceCard.tsx`
- **Purpose**: Display shared community spaces
- **Key Features**:
  - Space image with hover effects
  - Space type badge (home, garden, studio, outdoor, etc.)
  - Verified, Public listing, Facilitator application badges
  - Action buttons: Bookmark, Share, Like
  - Space title and owner info
  - Details: Address, Capacity, Pet-friendly, Owner's pets, Amenities
  - Amenity chips (4 visible + "more" indicator)
  - Meta: Visibility (Global/Local), Contribution
  - Primary action: Apply as Facilitator OR Book Space
  - Secondary action: Book Space (if facilitator applications enabled)
- **Space Type Colors**: Home (earth), Garden (green), Studio (purple), Outdoor (blue)

#### MobileSpaceCard
- **File**: `/home/koh/Documents/harmonize/src/components/MobileSpaceCard.tsx`
- **Purpose**: Mobile-optimized space card

---

### Form Components

#### Form Container
- **File**: `/home/koh/Documents/harmonize/src/components/forms/Form.tsx`
- **Purpose**: Base form with error/success states
- **Features**:
  - Error message with icon and styling
  - Success message with icon and styling
  - Children rendering with space-y-8
  - AlertCircle icon for errors, CheckCircle for success

#### FormField
- **File**: `/home/koh/Documents/harmonize/src/components/forms/FormField.tsx`
- **Purpose**: Labeled input field wrapper
- **Features**: Label, input, error display

#### FormCheckbox
- **File**: `/home/koh/Documents/harmonize/src/components/forms/FormCheckbox.tsx`
- **Purpose**: Checkbox input with label
- **Features**: Checkbox styling with forest-600 accent

#### FormButton
- **File**: `/home/koh/Documents/harmonize/src/components/forms/FormButton.tsx`
- **Purpose**: Submit button for forms

#### FormSection
- **File**: `/home/koh/Documents/harmonize/src/components/forms/FormSection.tsx`
- **Purpose**: Section container for grouped form fields

---

### Modal & Dialog Components

#### Modal
- **File**: `/home/koh/Documents/harmonize/src/components/Modal.tsx`
- **Purpose**: Base modal dialog component
- **Key Features**:
  - Fixed inset-0 z-50 with overlay
  - Gradient header (forest to earth)
  - Close button (X icon)
  - Keyboard navigation (Escape to close, Tab cycling)
  - Focus management (focus on close button when opened)
  - Backdrop blur and dark overlay (bg-black/50)
  - Rounded-2xl container with shadow-2xl
  - Body content with p-6
- **Props**:
  - `isOpen`, `onClose`, `title`, `children`, `className`

#### AuthModal
- **File**: `/home/koh/Documents/harmonize/src/components/AuthModal.tsx`
- **Purpose**: Sign in/Sign up modal

#### OnboardingModal
- **File**: `/home/koh/Documents/harmonize/src/components/OnboardingModal.tsx`
- **Purpose**: User onboarding wizard

#### EventDetailsModal
- **File**: `/home/koh/Documents/harmonize/src/components/EventDetailsModal.tsx`
- **Purpose**: Full event details in modal view

#### EventManagementModal
- **File**: `/home/koh/Documents/harmonize/src/components/EventManagementModal.tsx`
- **Purpose**: Event editing and management

#### EventEditModal
- **File**: `/home/koh/Documents/harmonize/src/components/EventEditModal.tsx`
- **Purpose**: Event editing interface

#### EventRegistrationModal
- **File**: `/home/koh/Documents/harmonize/src/components/EventRegistrationModal.tsx`
- **Purpose**: Event registration flow

#### SpaceDetailsModal
- **File**: `/home/koh/Documents/harmonize/src/components/SpaceDetailsModal.tsx`
- **Purpose**: Full space details view

#### SpaceManagementModal
- **File**: `/home/koh/Documents/harmonize/src/components/SpaceManagementModal.tsx`
- **Purpose**: Space owner management tools

#### ShareModal & ShareContentModal
- **File**: `/home/koh/Documents/harmonize/src/components/ShareModal.tsx`, `ShareContentModal.tsx`
- **Purpose**: Share event/space to social platforms

#### ShareChoiceModal
- **File**: `/home/koh/Documents/harmonize/src/components/ShareChoiceModal.tsx`
- **Purpose**: Select what to share

#### ShareOptionsModal
- **File**: `/home/koh/Documents/harmonize/src/components/ShareOptionsModal.tsx`
- **Purpose**: Share options and methods

#### UserRatingModal
- **File**: `/home/koh/Documents/harmonize/src/components/UserRatingModal.tsx`
- **Purpose**: User rating interface

#### NewConversationModal
- **File**: `/home/koh/Documents/harmonize/src/components/NewConversationModal.tsx`
- **Purpose**: Start new messaging conversation

---

### Feedback & Notification Components

#### NotificationCenter
- **File**: `/home/koh/Documents/harmonize/src/components/NotificationCenter.tsx`
- **Purpose**: Bell icon with dropdown notification panel
- **Key Features**:
  - Fixed position top notification bell
  - Unread count badge (red, 9+ format)
  - Dropdown panel (fixed right-2/top-16 on mobile, responsive)
  - Filter tabs: All, Unread, Reminders, Feedback, Applications, Messages
  - Notification icon color-coding by type
  - Badge colors: Blue (reminders), Green (positive), Orange (updates), Red (negatives), Purple (applications)
  - Type icons: Calendar, Star, CheckCircle, AlertCircle, Send, MessageSquare, Users, Shield
  - Action buttons per notification type (View Message, Leave Feedback, Approve/Decline/Review)
  - Mark all as read button
  - Admin link at bottom (if admin)
  - Smooth animations with fade-in-up
- **Props**: None (uses auth context)
- **Notification Types**:
  - event_reminder_24h, event_reminder_1h, event_starting_soon
  - feedback_request
  - registration_confirmed, waitlist_promoted
  - event_cancelled, event_updated, registration_cancelled
  - space_booking_request, space_booking_approved, space_booking_rejected
  - new_message

#### LoadingStates
- **File**: `/home/koh/Documents/harmonize/src/components/LoadingStates.tsx`
- **Exports**:
  - **LoadingSpinner**: Animated icon with text
    - Sizes: sm, md, lg
    - Variants: default, primary, success, pulse
  - **LoadingButton**: Button with loading state
    - Variants: primary, secondary, success, outline
    - Disabled while loading
  - **EventCardSkeleton**: Shimmer loading animation
  - **SpaceCardSkeleton**: Shimmer loading animation
  - **DashboardStatsSkeleton**: 4-column grid skeleton
  - **SearchResultsSkeleton**: Events and spaces skeleton
  - **PageLoader**: Full-page branded loader with progress dots
  - **ModalLoader**: Modal-sized loader
  - **FloatingActionButton**: FAB with loading state
- **Animation**: Shimmer effect (2s infinite), bounce, spin, pulse

#### LoadingSkeleton
- **File**: `/home/koh/Documents/harmonize/src/components/LoadingSkeleton.tsx`
- **Purpose**: Skeleton placeholder components
- **Features**: Shimmer animation, responsive sizing

#### ErrorBoundary
- **File**: `/home/koh/Documents/harmonize/src/components/ErrorBoundary.tsx`
- **Purpose**: Catch React errors
- **Features**: Error fallback UI, restart button

---

### Search & Discovery Components

#### SearchSystem
- **File**: `/home/koh/Documents/harmonize/src/components/SearchSystem.tsx`
- **Purpose**: Advanced search with filters and results
- **Key Features**:
  - Search input with icon
  - Advanced filters button (toggles filter panel)
  - Debounced search (300ms)
  - Filter types:
    - Search in: All, Events Only, Spaces Only, Users
    - Category: Gardening, Yoga, Cooking, Art, Healing, Music
    - Event Type: Local, Virtual, Global Physical
    - Space Type: Backyard, Garage, Basement, etc.
    - Skill Level: Beginner, Intermediate, Advanced, All
    - Pet Friendly with animal type selection
    - Verified only checkbox
    - Radius slider
  - Results display with preview images
  - Recent searches (last 5)
  - Popular searches (hardcoded: Yoga, Gardening, Meditation, Cooking, Art workshop)
  - Full page mode vs dropdown mode
  - Event and space result cards in dropdown
  - Full page grid layout for results
  - Save search, Get alerts buttons (for full page)
- **Props**:
  - `onResults`, `placeholder`, `showFilters`, `isFullPage`

#### EventSearchAndDiscovery
- **File**: `/home/koh/Documents/harmonize/src/components/EventSearchAndDiscovery.tsx`
- **Purpose**: Event-specific search and filtering

#### LocationBasedSuggestions
- **File**: `/home/koh/Documents/harmonize/src/components/LocationBasedSuggestions.tsx`
- **Purpose**: Suggest events/spaces based on location

#### LocationInput
- **File**: `/home/koh/Documents/harmonize/src/components/LocationInput.tsx`
- **Purpose**: Location search and selection
- **Features**: Autocomplete, maps integration

#### LocationSettings
- **File**: `/home/koh/Documents/harmonize/src/components/LocationSettings.tsx`
- **Purpose**: User location preferences

#### RadiusSelector
- **File**: `/home/koh/Documents/harmonize/src/components/RadiusSelector.tsx`
- **Purpose**: Search radius slider

---

### Input & Selection Components

#### MobileInput
- **File**: `/home/koh/Documents/harmonize/src/components/MobileInput.tsx`
- **Purpose**: Mobile-optimized text input
- **Features**:
  - Eye/EyeOff toggle for password fields
  - Min-height 44px for touch targets
  - Font-size 16px to prevent iOS zoom
  - Rounded corners

#### MobileSelect
- **File**: `/home/koh/Documents/harmonize/src/components/MobileSelect.tsx`
- **Purpose**: Mobile-optimized select dropdown
- **Features**: Touch-friendly sizing and spacing

#### DateTimePicker
- **File**: `/home/koh/Documents/harmonize/src/components/DateTimePicker.tsx`
- **Purpose**: Date and time selection combined
- **Features**: Calendar and clock icons, navigation arrows

#### HolisticCategorySelector
- **File**: `/home/koh/Documents/harmonize/src/components/HolisticCategorySelector.tsx`
- **Purpose**: Select from holistic practice categories

---

### Avatar & User Components

#### Avatar
- **File**: `/home/koh/Documents/harmonize/src/components/Avatar.tsx`
- **Purpose**: User profile picture component
- **Key Features**:
  - Sizes: xs (w-6 h-6), sm (w-8 h-8), md (w-10 h-10), lg (w-12 h-12), xl (w-16 h-16)
  - Shows image if available
  - Falls back to initials with color-coded background
  - Falls back to User icon if no name
  - Color generation from name string
  - Rounded-full with object-cover
- **Props**:
  - `name`, `imageUrl`, `size`, `className`
- **Colors**: 8 distinct background colors from string hash

#### ConversationList
- **File**: `/home/koh/Documents/harmonize/src/components/ConversationList.tsx`
- **Purpose**: List of messaging conversations

#### ConversationView
- **File**: `/home/koh/Documents/harmonize/src/components/ConversationView.tsx`
- **Purpose**: Single conversation interface

#### ConversationInfo
- **File**: `/home/koh/Documents/harmonize/src/components/ConversationInfo.tsx`
- **Purpose**: Conversation metadata and settings

---

### Profile & User Section Components

#### ProfileSkillsSection
- **File**: `/home/koh/Documents/harmonize/src/components/ProfileSkillsSection.tsx`
- **Purpose**: Display and edit user skills
- **Features**:
  - Add/remove skills with + button
  - Star rating for each skill
  - Icons: Plus, X, Star, GraduationCap, Users, BookOpen, Award
  - Collapsible sections (ChevronDown/Up)

#### ProfileOfferingsSection
- **File**: `/home/koh/Documents/harmonize/src/components/ProfileOfferingsSection.tsx`
- **Purpose**: Services/offerings user provides

#### FacilitatorAvailability
- **File**: `/home/koh/Documents/harmonize/src/components/FacilitatorAvailability.tsx`
- **Purpose**: Availability scheduling for facilitators

#### FacilitatorOnboardingWizard
- **File**: `/home/koh/Documents/harmonize/src/components/FacilitatorOnboardingWizard.tsx`
- **Purpose**: Step-by-step facilitator setup

#### FacilitatorApplicationModal
- **File**: `/home/koh/Documents/harmonize/src/components/FacilitatorApplicationModal.tsx`
- **Purpose**: Apply to use a space as facilitator

#### FacilitatorSettingsPage
- **File**: `/home/koh/Documents/harmonize/src/components/FacilitatorSettingsPage.tsx`
- **Purpose**: Facilitator profile management

---

### Messaging Components

#### MessagingSystem
- **File**: `/home/koh/Documents/harmonize/src/components/MessagingSystem.tsx`
- **Purpose**: Full messaging interface

#### EnhancedMessagingSystem
- **File**: `/home/koh/Documents/harmonize/src/components/EnhancedMessagingSystem.tsx`
- **Purpose**: Advanced messaging features

#### MessageComposer
- **File**: `/home/koh/Documents/harmonize/src/components/MessageComposer.tsx`
- **Purpose**: Message input and sending

---

### Space Management Components

#### BookingSystem
- **File**: `/home/koh/Documents/harmonize/src/components/BookingSystem.tsx`
- **Purpose**: Space booking calendar and form

#### BookingManagement
- **File**: `/home/koh/Documents/harmonize/src/components/BookingManagement.tsx`
- **Purpose**: Manage space bookings

#### SpaceOwnerSignoffModal
- **File**: `/home/koh/Documents/harmonize/src/components/SpaceOwnerSignoffModal.tsx`
- **Purpose**: Space owner approval workflow

#### SpaceSharerApplicationModal
- **File**: `/home/koh/Documents/harmonize/src/components/SpaceSharerApplicationModal.tsx`
- **Purpose**: Apply to share a space

#### HolderApplicationModal
- **File**: `/home/koh/Documents/harmonize/src/components/HolderApplicationModal.tsx`
- **Purpose**: Apply to hold/own a space

#### TimeManagementModal
- **File**: `/home/koh/Documents/harmonize/src/components/TimeManagementModal.tsx`
- **Purpose**: Manage time availability

---

### Event Management Components

#### EventFacilitatorManager
- **File**: `/home/koh/Documents/harmonize/src/components/EventFacilitatorManager.tsx`
- **Purpose**: Manage facilitators for an event

#### EventPractitionerManager
- **File**: `/home/koh/Documents/harmonize/src/components/EventPractitionerManager.tsx`
- **Purpose**: Manage practitioners for an event

#### EventParticipantManagement
- **File**: `/home/koh/Documents/harmonize/src/components/EventParticipantManagement.tsx`
- **Purpose**: Manage event participants

#### EventFeedbackForm
- **File**: `/home/koh/Documents/harmonize/src/components/EventFeedbackForm.tsx`
- **Purpose**: Post-event feedback collection

#### EventPlatformConnectors
- **File**: `/home/koh/Documents/harmonize/src/components/EventPlatformConnectors.tsx`
- **Purpose**: Connect to Eventbrite, Facebook, etc.

#### ConnectorsSection
- **File**: `/home/koh/Documents/harmonize/src/components/ConnectorsSection.tsx`
- **Purpose**: Third-party platform integrations

---

### Dashboard & Analytics Components

#### CommunityDashboard
- **File**: `/home/koh/Documents/harmonize/src/components/CommunityDashboard.tsx`
- **Purpose**: Community stats overview

#### AnalyticsDashboard
- **File**: `/home/koh/Documents/harmonize/src/components/AnalyticsDashboard.tsx`
- **Purpose**: Analytics charts and stats

#### AnalyticsChart
- **File**: `/home/koh/Documents/harmonize/src/components/AnalyticsChart.tsx`
- **Purpose**: Generic chart component

#### EventAnalyticsDashboard
- **File**: `/home/koh/Documents/harmonize/src/components/EventAnalyticsDashboard.tsx`
- **Purpose**: Event-specific analytics

#### ReferralStats
- **File**: `/home/koh/Documents/harmonize/src/components/ReferralStats.tsx`
- **Purpose**: Referral program statistics

#### AdminActions
- **File**: `/home/koh/Documents/harmonize/src/components/AdminActions.tsx`
- **Purpose**: Admin-only action buttons

#### FeedbackModerationDashboard
- **File**: `/home/koh/Documents/harmonize/src/components/FeedbackModerationDashboard.tsx`
- **Purpose**: Moderate user feedback

---

### Utility & Helper Components

#### ProtectedRoute
- **File**: `/home/koh/Documents/harmonize/src/components/ProtectedRoute.tsx`
- **Purpose**: Require authentication for routes
- **Features**: Redirect to home if unauthenticated

#### AuthProvider
- **File**: `/home/koh/Documents/harmonize/src/components/AuthProvider.tsx`
- **Purpose**: Global auth context provider
- **Features**:
  - User state management
  - Auth modal control
  - Sign in/Sign up modes
  - Admin check
  - Onboarding state
  - Global auth modal and onboarding

#### AuthButton
- **File**: `/home/koh/Documents/harmonize/src/components/AuthButton.tsx`
- **Purpose**: Sign in/Sign up button

#### AuthModal
- **File**: `/home/koh/Documents/harmonize/src/components/AuthModal.tsx`
- **Purpose**: Authentication form modal
- **Features**: Email, password inputs, sign in/up modes

#### VibeGuard
- **File**: `/home/koh/Documents/harmonize/src/components/VibeGuard.tsx`
- **Purpose**: Content safety/moderation component

#### KeyboardNavHelper
- **File**: `/home/koh/Documents/harmonize/src/components/KeyboardNavHelper.tsx`
- **Purpose**: Keyboard accessibility helper

#### ScrollToTop
- **File**: `/home/koh/Documents/harmonize/src/components/ScrollToTop.tsx`
- **Purpose**: Auto-scroll to top on route change

#### MobileOptimization
- **File**: `/home/koh/Documents/harmonize/src/components/MobileOptimization.tsx`
- **Purpose**: Mobile-specific optimizations and PWA
- **Features**:
  - PWA install prompt
  - Offline detection with red banner
  - Touch-friendly sizing (44px minimum)
  - Safe area adjustments
  - Mobile scrolling optimization
  - Hardware acceleration
  - Overflow scrolling with momentum
  - Swipe gestures support

#### CommunityFeatures
- **File**: `/home/koh/Documents/harmonize/src/components/CommunityFeatures.tsx`
- **Purpose**: Highlight community features

---

## 2. PAGE COMPONENTS (32 Total Pages)

### Main Pages

#### Home
- **File**: `/home/koh/Documents/harmonize/src/pages/Home.tsx`
- **Purpose**: Landing/home page

#### HomeMobile
- **File**: `/home/koh/Documents/harmonize/src/pages/HomeMobile.tsx`
- **Purpose**: Mobile-specific home page

#### Profile
- **File**: `/home/koh/Documents/harmonize/src/pages/Profile.tsx`
- **Purpose**: User profile view
- **Sections**:
  - Profile header with avatar, name, bio
  - About, Skills, Offerings tabs
  - Edit profile button
  - Social connections

#### Settings
- **File**: `/home/koh/Documents/harmonize/src/pages/Settings.tsx`
- **Purpose**: User settings and preferences
- **Sections**:
  - Edit profile
  - Notifications
  - Privacy settings
  - Location preferences

---

### Discovery Pages

#### Map
- **File**: `/home/koh/Documents/harmonize/src/pages/Map.tsx`
- **Purpose**: Map view of events/spaces
- **Features**: Google Maps integration, location-based filtering

#### GlobalFeed
- **File**: `/home/koh/Documents/harmonize/src/pages/GlobalFeed.tsx`
- **Purpose**: Feed of global events

#### HyperlocalEvents
- **File**: `/home/koh/Documents/harmonize/src/pages/HyperlocalEvents.tsx`
- **Purpose**: Ultra-local events near user
- **Features**: Radius-based filtering

#### Search
- **File**: `/home/koh/Documents/harmonize/src/pages/Search.tsx`
- **Purpose**: Full-page search interface
- **Components**: SearchSystem with isFullPage=true

#### Neighborhoods
- **File**: `/home/koh/Documents/harmonize/src/pages/Neighborhoods.tsx`
- **Purpose**: Browse neighborhood groups
- **Features**: Neighborhood discovery and joining

#### NeighborhoodDetail
- **File**: `/home/koh/Documents/harmonize/src/pages/NeighborhoodDetail.tsx`
- **Purpose**: Single neighborhood view
- **Sections**: Info, members, events, spaces

---

### Event Pages

#### CreateEvent
- **File**: `/home/koh/Documents/harmonize/src/pages/CreateEvent.tsx`
- **Purpose**: Comprehensive event creation form

#### CreateEventSimple
- **File**: `/home/koh/Documents/harmonize/src/pages/CreateEventSimple.tsx`
- **Purpose**: Simplified event creation

#### TestMinimalEvent
- **File**: `/home/koh/Documents/harmonize/src/pages/TestMinimalEvent.tsx`
- **Purpose**: Testing minimal event form

#### EventDetail
- **File**: `/home/koh/Documents/harmonize/src/pages/EventDetail.tsx`
- **Purpose**: Full event detail page
- **Sections**: Details, participants, comments, related events

#### EventCalendar
- **File**: `/home/koh/Documents/harmonize/src/pages/EventCalendar.tsx`
- **Purpose**: Calendar view of events
- **Features**: Month/week/day views, event filtering

#### EventCheckIn
- **File**: `/home/koh/Documents/harmonize/src/pages/EventCheckIn.tsx`
- **Purpose**: Check-in at event location

#### EventTemplates
- **File**: `/home/koh/Documents/harmonize/src/pages/EventTemplates.tsx`
- **Purpose**: Manage event templates for quick creation

---

### Space Pages

#### Spaces
- **File**: `/home/koh/Documents/harmonize/src/pages/Spaces.tsx`
- **Purpose**: Browse all spaces
- **Features**: Grid/list view, filtering

#### SpaceDetail
- **File**: `/home/koh/Documents/harmonize/src/pages/SpaceDetail.tsx`
- **Purpose**: Single space detail page
- **Sections**: Gallery, details, amenities, booking

#### ShareSpace
- **File**: `/home/koh/Documents/harmonize/src/pages/ShareSpace.tsx`
- **Purpose**: List space for sharing
- **Form Fields**:
  - Space type (home, garden, studio, outdoor, etc.)
  - Name, description, address
  - Capacity, amenities, accessibility features
  - Pet policy, owner's pets
  - Photos/gallery
  - Donation suggestion
  - Visibility (public/private)
  - Facilitator applications allowed

#### SpaceHolderDashboard
- **File**: `/home/koh/Documents/harmonize/src/pages/SpaceHolderDashboard.tsx`
- **Purpose**: Manage owned/shared spaces
- **Features**:
  - Space list management
  - Bookings calendar
  - Applications review
  - Facilitator management

---

### User Pages

#### MyActivities
- **File**: `/home/koh/Documents/harmonize/src/pages/MyActivities.tsx`
- **Purpose**: User's registered events and activities
- **Sections**:
  - Upcoming events
  - Past events
  - Bookmarked spaces
  - Saved searches

#### Messages
- **File**: `/home/koh/Documents/harmonize/src/pages/Messages.tsx`
- **Purpose**: Full messaging interface
- **Sections**:
  - Conversation list
  - Active conversation
  - New message button

---

### Facilitator Pages

#### BecomeFacilitator
- **File**: `/home/koh/Documents/harmonize/src/pages/BecomeFacilitator.tsx`
- **Purpose**: Facilitator onboarding wizard
- **Sections**:
  - Introduction
  - Specialties selection
  - Bio and photo
  - Availability setup
  - Pricing/donation

#### FacilitatorDirectory
- **File**: `/home/koh/Documents/harmonize/src/pages/FacilitatorDirectory.tsx`
- **Purpose**: Browse facilitators
- **Features**:
  - Search by specialty
  - Location filtering
  - Rating/reviews

#### Onboard
- **File**: `/home/koh/Documents/harmonize/src/pages/Onboard.tsx`
- **Purpose**: User onboarding flow
- **Steps**:
  - Welcome
  - Location setup
  - Interest selection
  - Profile creation

---

### Admin & Special Pages

#### AdminDashboard
- **File**: `/home/koh/Documents/harmonize/src/pages/AdminDashboard.tsx`
- **Purpose**: Admin control panel
- **Sections**:
  - User management
  - Event moderation
  - Space verification
  - Analytics
  - System settings

#### BrandAmbassadors
- **File**: `/home/koh/Documents/harmonize/src/pages/BrandAmbassadors.tsx`
- **Purpose**: Ambassador program details and management
- **Tiers**:
  - Platinum (Crown icon)
  - Gold (Trophy icon)
  - Silver (Medal icon)
  - Bronze (Award icon)

#### LocationStats
- **File**: `/home/koh/Documents/harmonize/src/pages/LocationStats.tsx`
- **Purpose**: Analytics by location
- **Features**: Heat maps, event counts, demographics

---

### Test Pages

#### TestEventCreation
- **File**: `/home/koh/Documents/harmonize/src/pages/TestEventCreation.tsx`
- **Purpose**: Test event creation flow

---

## 3. REUSABLE PATTERNS

### Cards & Containers
- **Pattern**: `.card` - Base styling with shadow, border, rounded corners
- **Interactive**: `.card-interactive` - Adds hover scale, lift effect
- **Gradient**: `.card-gradient` - Gradient background with glass effect

### Buttons
- **Primary**: `.btn-primary` - Forest gradient with scale hover
- **Secondary**: `.btn-secondary` - Earth gradient with scale hover
- **Outline**: `.btn-outline` - Border-based styling
- **Ghost**: `.btn-ghost` - Minimal styling

### Forms
- **Input**: `.input-primary` - Consistent input styling
- **Error State**: Red border and text
- **Success State**: Green border and text
- **Focus Ring**: Focus:ring-4 focus:ring-forest-100

### Lists
- **Divider**: border-t border-gray-100 or border-forest-50
- **Hover Effects**: hover:bg-gray-50 or hover:bg-forest-50
- **Item Spacing**: space-y-1, space-y-2, space-y-3

### Loading States
- **Spinner**: Animated Loader2 icon with rotate
- **Skeleton**: Shimmer animation (2s infinite)
- **Button**: Loading state with spinner overlay

### Modals
- **Overlay**: Fixed inset-0 with bg-black/50 backdrop-blur-sm
- **Content**: Rounded-2xl bg-white shadow-2xl
- **Header**: Gradient background with white text
- **Close**: X icon button with hover state

### Navigation
- **Active Item**: Background highlight + text color change
- **Badge**: Small numbered indicator on icons
- **Dropdown**: Absolute positioned menu with animations

---

## 4. DESIGN SYSTEM ELEMENTS

### Color Palette (Tailwind Extended)

#### Forest (Primary Green)
```
50: #f0f7ed    100: #dcebcf    200: #bdd8a4    300: #94be70
400: #6fa047   500: #4d7c2a    600: #2d5016    700: #234012
800: #1c3310   900: #162a0d
```

#### Earth (Secondary Orange/Brown)
```
50: #fdf7f0    100: #f9ebd9    200: #f4d4b0    300: #edb67e
400: #f4a460   500: #e08638    600: #c96b2a    700: #a75225
800: #874325   900: #6d3820
```

#### Sky (Accent Blue)
```
50: #f0f9ff    100: #e0f2fe    200: #bae6fd    300: #7dd3fc
400: #38bdf8   500: #87ceeb    600: #0ea5e9    700: #0284c7
800: #0369a1   900: #0c4a6e
```

#### Neutral Colors
- Gray: Standard Tailwind grays
- White: #ffffff
- Black: #000000

### Typography

#### Font Family
- Primary: Inter (400, 500, 600, 700, 800)
- Fallback: system-ui, -apple-system, sans-serif

#### Font Sizes
- h1, h2, h3, h4, h5, h6: font-weight 600, line-height 1.3
- Body text: font-weight 400, line-height 1.6

#### Line Height
- Headings: 1.3
- Body: 1.6
- Letter spacing: -0.01em (body), -0.02em (headings)

### Spacing Scale
- Base units: 4px
- Common: 4px (1), 8px (2), 12px (3), 16px (4), 20px (5), 24px (6)
- Large: 32px (8), 40px (10), 48px (12), 56px (14), 64px (16)
- Extra: 88px (22)

### Border Radius
- Small: rounded-lg (8px)
- Medium: rounded-xl (12px)
- Large: rounded-2xl (16px)
- Extra: rounded-3xl (24px)
- Full: rounded-full

### Shadows
- Shadow-sm: 0 1px 2px rgb(0 0 0 / 0.05)
- Shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
- Shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1)
- Shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25)

### Animations (Defined in tailwind.config.js)

#### Keyframes
1. **fadeIn** (0.6s): opacity 0→1, translateY 10px→0
2. **slideUp** (0.4s): translateY 20px→0, opacity 0→1
3. **pulseGentle** (2s): opacity 1→0.8→1
4. **scaleIn** (0.3s): scale 0.95→1, opacity 0→1
5. **bounceGentle** (0.6s): translateY -4px→0→-2px
6. **shimmer** (2s): backgroundPosition -400%→400%
7. **float** (3s): translateY 0→-10px→0

#### Animation Classes
- `animate-fade-in`: 0.6s ease-in-out
- `animate-slide-up`: 0.4s ease-out
- `animate-pulse-gentle`: 2s infinite
- `animate-scale-in`: 0.3s ease-out
- `animate-bounce-gentle`: 0.6s ease-out
- `animate-shimmer`: 2s infinite
- `animate-float`: 3s infinite

### Backdrops & Glass Effects
- `backdrop-blur-sm`: 4px blur
- `backdrop-blur-md`: 12px blur
- Custom: `backdrop-blur-xs`: 2px blur

---

## 5. INTERACTIVE ELEMENTS

### Buttons
#### States
- **Default**: bg-forest-600 text-white
- **Hover**: bg-forest-700 with scale-[1.02]
- **Active**: scale-[0.98]
- **Disabled**: opacity-50 cursor-not-allowed
- **Focus**: ring-4 ring-forest-200

#### Types
1. **Primary**: Forest gradient, white text, 44px+ touch target
2. **Secondary**: Earth gradient, white text
3. **Outline**: Border-based, forest colors
4. **Ghost**: Minimal, hover background only
5. **Danger**: Red/destructive styling
6. **Link**: Text-only, underline on hover

### Input Fields
- **Width**: Full (w-full) by default
- **Height**: Min 44px on mobile
- **Border**: 2px border-forest-200, focus ring-4 ring-forest-100
- **Focus Colors**: border-forest-400, ring-forest-500
- **Rounded**: rounded-xl (12px)
- **Padding**: px-4 py-3

### Dropdowns & Selects
- **Width**: Full (w-full)
- **Height**: Min 44px
- **Border**: 2px border-forest-200
- **Rounded**: rounded-lg
- **Focus**: ring-2 ring-forest-500
- **Options Styling**: forest-700 text-on options

### Checkboxes
- **Size**: w-4 h-4
- **Color**: accent-forest-600
- **Focus**: ring-forest-500
- **Rounded**: rounded

### Switches & Toggles
- **Size**: w-11 h-6 (standard)
- **Colors**: Checked (forest-600), Unchecked (gray-300)
- **Animation**: Smooth transition

### Badges & Chips
- **Padding**: px-3 py-1.5 (medium), px-2 py-1 (small)
- **Rounded**: rounded-full
- **Font Size**: text-xs font-semibold
- **Variants**:
  - Category badges: Gradient backgrounds
  - Status badges: Color-coded (green, yellow, red, etc.)
  - Ambassador badges: Tier-specific icons and colors

### Progress Bars
- **Height**: h-2
- **Border**: rounded-full
- **Colors**:
  - <50%: Green gradient
  - 50-80%: Yellow/Orange gradient
  - >80%: Red gradient
- **Animation**: Smooth transition (duration-500)

### Tooltips
- **Position**: absolute, positioned relative to parent
- **Background**: gray-900 or forest-800
- **Text**: white, text-xs
- **Padding**: px-2 py-1
- **Rounded**: rounded
- **Visibility**: opacity-0 group-hover:opacity-100
- **Pointer**: pointer-events-none

---

## 6. FEEDBACK ELEMENTS

### Toast/Alert Messages
#### Success
- **Background**: bg-green-50
- **Border**: border-green-200
- **Icon**: CheckCircle (green-600)
- **Text**: text-green-700
- **Animation**: fade-in-up

#### Error
- **Background**: bg-red-50
- **Border**: border-red-200
- **Icon**: AlertCircle (red-600)
- **Text**: text-red-700
- **Animation**: fade-in-up

#### Warning
- **Background**: bg-orange-50
- **Border**: border-orange-200
- **Icon**: AlertCircle (orange-600)
- **Text**: text-orange-700

#### Info
- **Background**: bg-blue-50
- **Border**: border-blue-200
- **Icon**: Info (blue-600)
- **Text**: text-blue-700

### Status Badges in Notifications
- **Colors by type**:
  - Reminders: Blue (bg-blue-100 text-blue-800)
  - Success/Approved: Green (bg-green-100 text-green-800)
  - Feedback: Green (bg-green-100 text-green-800)
  - Warnings/Updates: Orange (bg-orange-100 text-orange-800)
  - Errors/Rejected: Red (bg-red-100 text-red-800)
  - Applications: Purple (bg-purple-100 text-purple-800)
  - Messages: Blue (bg-blue-100 text-blue-800)

---

## 7. LAYOUT COMPONENTS

### Header Layout
- **Height**: h-16 (desktop), adaptive (mobile)
- **Position**: fixed top-0 left-0 right-0 z-40
- **Background**: bg-white/90 dark:bg-gray-900/90 backdrop-blur-md
- **Border**: border-b border-gray-200 dark:border-gray-700

### Sidebar Layout
- **Width**: w-64
- **Position**: fixed left-0 top-16 h-[calc(100vh-4rem)] z-30
- **Overflow**: overflow-y-auto sidebar-scroll
- **Sections**: Favorites (collapsible), Navigation, User Profile

### Main Content Area
- **Min height**: min-h-screen
- **Padding**: Responsive (p-4 md:p-6 lg:p-8)
- **Background**: Gradient (from-forest-50 via-white to-earth-50/30)

### Bottom Navigation (Mobile)
- **Height**: h-16
- **Position**: fixed bottom-0 left-0 right-0 z-50 md:hidden
- **Grid**: grid-cols-5
- **Spacer**: h-16 md:hidden (above content)

### Footer Layout
- **Full width**: w-full
- **Border top**: border-t border-gray-200
- **Background**: bg-white or bg-forest-50
- **Padding**: py-12 px-4 md:px-8

### Grid Layouts
- **1 column**: default, mobile first
- **2 columns**: md:grid-cols-2
- **3 columns**: lg:grid-cols-3
- **4 columns**: xl:grid-cols-4
- **Gap**: gap-4, gap-6, gap-8 (responsive)

### Container Widths
- **Full**: w-full
- **Max**: max-w-7xl (default), max-w-4xl (narrow), max-w-sm (sidebar)
- **Centered**: mx-auto

---

## 8. ICONS (Lucide React)

### Most Commonly Used Icons

#### Navigation
- Home, Map, Menu, ChevronLeft, ChevronRight, ChevronDown, ChevronUp
- Settings, LogOut, LogIn, Sidebar

#### Content & Communication
- MessageCircle, Mail, Send, Bell, Heart, Star, Bookmark, BookmarkPlus
- Share2, Share, Copy, Link

#### Location & Time
- MapPin, Navigation, Calendar, Clock, Target
- Zap (for trending/lightning), Globe (for global)

#### Media & Visibility
- Eye, EyeOff, Image, Camera, Download, Upload
- AlertCircle, CheckCircle, XCircle, Info

#### User & Profile
- User, UserCheck, Users, Trophy, Medal, Award, Crown
- Plus, X, Trash2, Edit

#### Status & Feedback
- Check, Loader2 (for loading), AlertCircle, CheckCircle
- Heart, Star, Badge, Shield, Lock

#### Business
- DollarSign, CreditCard, Home, Briefcase, Cat, Dog

#### Other
- Sprout (Harmonik branding), Smartphone, Wifi, KeyRound, ArrowLeft, ArrowRight

---

## 9. ANIMATIONS & TRANSITIONS

### Hover Effects
- **Scale**: hover:scale-[1.02] for interactive cards
- **Translate**: group-hover:translate-y-0 translate-y-2 for revealed actions
- **Opacity**: opacity-0 group-hover:opacity-100 for action buttons
- **Color**: hover:text-forest-700, hover:bg-forest-50
- **Shadow**: hover:shadow-xl for depth

### Focus States
- **Ring**: focus:ring-4 focus:ring-forest-100 or focus:ring-forest-200
- **Border**: focus:border-forest-400
- **Outline**: focus-visible:outline-2 focus-visible:outline-offset-2

### Loading Animations
- **Spinner**: animate-spin on Loader2 icon
- **Pulse**: animate-pulse on text during loading
- **Skeleton**: animate-[shimmer_2s_infinite] on placeholder bars
- **Dots**: animate-bounce with staggered delays

### Page Transitions
- **Fade In**: animate-fade-in (0.6s)
- **Slide Up**: animate-slide-up (0.4s)
- **Scale**: animate-scale-in (0.3s)

### Duration Classes
- **Fast**: duration-200, duration-300
- **Medium**: duration-500
- **Slow**: duration-700, duration-1000

---

## 10. MOBILE-SPECIFIC ELEMENTS

### Touch Targets
- **Minimum size**: 44x44px for all interactive elements
- **Spacing**: 8px minimum between touch targets

### Responsive Typography
- **Mobile**: text-base, text-lg for headings
- **Desktop**: text-xl, text-2xl for headings
- **Font size**: 16px minimum on inputs (prevents iOS zoom)

### Mobile Navigation
- **Bottom Navbar**: 5-item grid navigation
- **FAB**: Floating action button at bottom-20 right-4
- **Sidebar**: Toggleable, full-height overlay on mobile
- **Hidden Items**: Menu button hidden for unauthenticated users

### Mobile Forms
- **Input height**: min-h-[44px]
- **Padding**: p-4 px-safe py-safe
- **Rounded**: rounded-xl (12px)
- **Spacing**: space-y-4 between form fields

### Safe Area Support
- `safe-area-top`: padding-top: max(16px, env(safe-area-inset-top))
- `safe-area-bottom`: padding-bottom: max(16px, env(safe-area-inset-bottom))
- Applied to bottom nav, modal bottoms, and full-height layouts

### PWA Features
- **Install prompt**: Bottom notification with icon
- **Offline banner**: Top red banner when offline
- **Icons**: Responsive icon sizes for mobile home screen
- **Standalone mode**: Special styles for app mode

### Mobile-Specific Styles
```css
@media (max-width: 768px) {
  .touch-target { min-height: 44px; min-width: 44px; }
  input, select, textarea { min-height: 44px; font-size: 16px; }
  button { min-height: 44px; }
  html { scroll-behavior: smooth; -webkit-overflow-scrolling: touch; }
  * { touch-action: manipulation; }
}
```

---

## 11. RESPONSIVE BREAKPOINTS

### Screen Sizes
- **Mobile**: < 640px (default)
- **SM**: 640px (sm:)
- **MD**: 768px (md:) - Start of tablet
- **LG**: 1024px (lg:) - Desktop header shows
- **XL**: 1280px (xl:)
- **2XL**: 1536px (2xl:)
- **Custom XS**: 475px (xs:)

### Mobile-First Pattern
```
Base styles (mobile)
→ sm: (small phone, landscape)
→ md: (tablet)
→ lg: (desktop)
→ xl: (large desktop)
```

### Common Responsive Classes
- Display: hidden lg:block (hide on mobile)
- Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Padding: p-4 md:p-6 lg:p-8
- Text: text-sm md:text-base lg:text-lg
- Width: w-full md:max-w-2xl lg:max-w-4xl

---

## SUMMARY STATISTICS

- **Total Components**: 96
- **Total Pages**: 32
- **Lucide Icons Used**: 80+
- **Color Palette**: 3 main colors (Forest, Earth, Sky) + neutrals
- **Animation Keyframes**: 7
- **Button Variants**: 5+
- **Responsive Breakpoints**: 6
- **Touch Target Size**: 44px minimum
- **Typography**: Inter font family, 6 weight options
- **Spacing Units**: Multiples of 4px
- **Border Radius**: 4 main sizes (lg, xl, 2xl, full)
- **Shadow Levels**: 4 (sm, lg, xl, 2xl)
- **Mobile Safe Areas**: Supported for notches and home indicators

