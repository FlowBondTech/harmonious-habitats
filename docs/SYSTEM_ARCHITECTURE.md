# Harmony Spaces - System Architecture Design

**Version**: 1.0  
**Date**: 2025-01-17  
**Type**: Full-Stack React + Supabase Architecture  

---

## 🎯 System Overview

### Purpose
Harmony Spaces is a holistic community platform that connects neighbors through wellness practices, shared spaces, and mindful events. The platform facilitates local community building through location-based discovery, event creation, and space sharing.

### Core Value Proposition
- **Local Community Focus**: Events and spaces within walking distance
- **Holistic Wellness**: Yoga, meditation, gardening, cooking, and mindful practices
- **Neighbor Connection**: Direct messaging and community building
- **Space Sharing**: Utilize existing community spaces efficiently

---

## 🏛️ Architecture Overview

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (React SPA)                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │   Pages     │  │ Components  │  │   Hooks     │  │   Lib   │ │
│  │             │  │             │  │             │  │         │ │
│  │ • Home      │  │ • EventCard │  │ • useAuth   │  │ • logger│ │
│  │ • Map       │  │ • SpaceCard │  │             │  │ • utils │ │
│  │ • Search    │  │ • Auth      │  │             │  │         │ │
│  │ • Profile   │  │ • Messaging │  │             │  │         │ │
│  │ • Admin     │  │ • Loading   │  │             │  │         │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTP/WebSocket
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API LAYER (Supabase)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │    Auth     │  │  Database   │  │   Storage   │  │Real-time│ │
│  │             │  │             │  │             │  │         │ │
│  │ • JWT       │  │ • Postgres  │  │ • Files     │  │ • Subs  │ │
│  │ • RLS       │  │ • Functions │  │ • Images    │  │ • Events│ │
│  │ • Policies  │  │ • Triggers  │  │ • Uploads   │  │         │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Custom Design System
- **State Management**: React Context + Hooks
- **Routing**: React Router v6
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Real-time)
- **Deployment**: Vercel/Netlify (Frontend) + Supabase (Backend)

---

## 🧩 Component Architecture

### Component Hierarchy
```
App
├── AuthProvider (Context)
├── Router
├── MobileOptimization
├── KeyboardNavHelper
├── ScrollToTop
├── Navbar
├── NotificationCenter
├── Routes
│   ├── Public Routes
│   │   ├── Home
│   │   ├── Map
│   │   ├── Search
│   │   └── GlobalFeed
│   └── Protected Routes
│       ├── CreateEvent
│       ├── ShareSpace
│       ├── MyActivities
│       ├── Messages
│       ├── Profile
│       └── AdminDashboard
└── Modals
    ├── AuthModal
    ├── EventDetailsModal
    ├── SpaceDetailsModal
    └── MessageModals
```

### Component Categories

#### 1. **Layout Components**
- **Navbar**: Main navigation with authentication state
- **MobileOptimization**: Mobile-specific enhancements
- **KeyboardNavHelper**: Accessibility navigation
- **ScrollToTop**: Route-based scroll management

#### 2. **Authentication Components**
- **AuthProvider**: Global authentication context
- **AuthModal**: Sign-in/sign-up modal
- **ProtectedRoute**: Route protection wrapper

#### 3. **Core Feature Components**
- **EventCard**: Event display with interactions
- **SpaceCard**: Space listing with booking
- **SearchSystem**: Advanced search with filters
- **MessagingSystem**: Real-time messaging
- **CommunityDashboard**: Analytics and insights

#### 4. **UI Enhancement Components**
- **LoadingStates**: Professional loading experiences
- **Modal**: Reusable modal wrapper
- **NotificationCenter**: System notifications

#### 5. **Admin Components**
- **AdminDashboard**: Platform management
- **AnalyticsDashboard**: Usage analytics
- **AdminActions**: Content moderation

---

## 🗄️ Database Architecture

### Entity Relationship Model
```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  profiles   │      │   events    │      │   spaces    │
│             │      │             │      │             │
│ • id (PK)   │◄────┤ • organizer │      │ • owner_id  │
│ • username  │      │ • title     │      │ • name      │
│ • email     │      │ • category  │      │ • type      │
│ • location  │      │ • location  │      │ • address   │
│ • verified  │      │ • capacity  │      │ • capacity  │
└─────────────┘      └─────────────┘      └─────────────┘
       │                     │                     │
       │                     │                     │
       ▼                     ▼                     ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ user_roles  │      │event_partic│      │space_booking│
│             │      │             │      │             │
│ • user_id   │      │ • event_id  │      │ • space_id  │
│ • role_id   │      │ • user_id   │      │ • user_id   │
│ • assigned  │      │ • status    │      │ • date      │
└─────────────┘      └─────────────┘      └─────────────┘
```

### Core Tables

#### **profiles** (User Management)
```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    neighborhood TEXT,
    rating NUMERIC DEFAULT 5.0,
    total_reviews INTEGER DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    discovery_radius INTEGER DEFAULT 5,
    holistic_interests TEXT[],
    notification_preferences JSONB DEFAULT '{
        "newEvents": true,
        "messages": true,
        "reminders": true,
        "community": true
    }'::jsonb
);
```

#### **events** (Event Management)
```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    organizer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    event_type TEXT DEFAULT 'local' CHECK (event_type IN ('local', 'virtual', 'global_physical')),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location_name TEXT,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    capacity INTEGER NOT NULL,
    skill_level TEXT DEFAULT 'all' CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'all')),
    donation_suggested TEXT,
    image_url TEXT,
    verified BOOLEAN DEFAULT FALSE,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern TEXT,
    materials_needed TEXT[],
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed', 'pending_approval'))
);
```

#### **spaces** (Space Management)
```sql
CREATE TABLE spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    capacity INTEGER NOT NULL,
    max_radius INTEGER DEFAULT 5,
    list_publicly BOOLEAN DEFAULT TRUE,
    guidelines TEXT,
    donation_suggested TEXT,
    image_urls TEXT[],
    verified BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'unavailable', 'pending_approval', 'suspended')),
    animals_allowed BOOLEAN DEFAULT FALSE
);
```

---

## 🔐 Security Architecture

### Authentication Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │  Supabase   │    │  Database   │
│             │    │    Auth     │    │             │
│ 1. Login    │───▶│ 2. Validate │───▶│ 3. Profile  │
│ Request     │    │ Credentials │    │ Creation    │
│             │    │             │    │             │
│ 4. JWT +    │◄───│ 5. Generate │◄───│ 6. Return   │
│ User Data   │    │ Token       │    │ User Info   │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Row Level Security (RLS)
```sql
-- Profile access policy
CREATE POLICY "Users can view public profiles" ON profiles
FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Event access policy
CREATE POLICY "Users can view active events" ON events
FOR SELECT USING (status = 'active');

CREATE POLICY "Users can create events" ON events
FOR INSERT WITH CHECK (auth.uid() = organizer_id);

-- Space access policy
CREATE POLICY "Users can view public spaces" ON spaces
FOR SELECT USING (list_publicly = true AND status = 'available');

CREATE POLICY "Users can manage own spaces" ON spaces
FOR ALL USING (auth.uid() = owner_id);
```

### Authorization Levels
1. **Public**: View events, spaces, profiles
2. **Authenticated**: Create events, share spaces, message
3. **Moderator**: Edit content, manage reports
4. **Admin**: Full platform management

---

## 📡 API Architecture

### RESTful Endpoints (via Supabase)
```
Authentication
POST   /auth/v1/signup
POST   /auth/v1/token
DELETE /auth/v1/logout

Profiles
GET    /rest/v1/profiles
POST   /rest/v1/profiles
PATCH  /rest/v1/profiles?id=eq.{id}

Events
GET    /rest/v1/events
POST   /rest/v1/events
PATCH  /rest/v1/events?id=eq.{id}
DELETE /rest/v1/events?id=eq.{id}

Spaces
GET    /rest/v1/spaces
POST   /rest/v1/spaces
PATCH  /rest/v1/spaces?id=eq.{id}
DELETE /rest/v1/spaces?id=eq.{id}

Messaging
GET    /rest/v1/conversations
POST   /rest/v1/conversations
GET    /rest/v1/messages
POST   /rest/v1/messages
```

### Real-time Subscriptions
```typescript
// Event updates
supabase
  .channel('events')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'events' 
  }, handleEventChange)
  .subscribe();

// Message updates
supabase
  .channel('messages')
  .on('postgres_changes', { 
    event: 'INSERT', 
    schema: 'public', 
    table: 'messages' 
  }, handleNewMessage)
  .subscribe();
```

---

## 🚀 Performance Architecture

### Frontend Optimization
```
┌─────────────────────────────────────────────────────────────────┐
│                    PERFORMANCE STRATEGIES                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │    Code     │  │   Asset     │  │   State     │  │ Network │ │
│  │  Splitting  │  │ Optimization│  │ Management  │  │ Caching │ │
│  │             │  │             │  │             │  │         │ │
│  │ • Routes    │  │ • Images    │  │ • Context   │  │ • API   │ │
│  │ • Components│  │ • Fonts     │  │ • Memoization│  │ • Assets│ │
│  │ • Lazy Load │  │ • Bundling  │  │ • Suspense  │  │ • CDN   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Loading Strategy
1. **Skeleton Loading**: Instant visual feedback
2. **Progressive Loading**: Critical content first
3. **Lazy Loading**: Non-critical components
4. **Caching**: API responses and assets

### Performance Budgets
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Bundle Size**: < 500KB initial, < 2MB total

---

## 📱 Mobile Architecture

### Responsive Design System
```
┌─────────────────────────────────────────────────────────────────┐
│                    RESPONSIVE BREAKPOINTS                       │
├─────────────────────────────────────────────────────────────────┤
│  Mobile    │  Tablet    │  Desktop   │  Large     │  XL        │
│  < 768px   │  768-1024  │  1024-1280 │  1280-1536 │  > 1536px  │
│            │            │            │            │            │
│  • Stack   │  • 2-col   │  • 3-col   │  • 4-col   │  • 5-col   │
│  • Touch   │  • Hybrid  │  • Hover   │  • Hover   │  • Hover   │
│  • Swipe   │  • Tap     │  • Click   │  • Click   │  • Click   │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile-First Components
- **MobileOptimization**: Touch enhancements
- **Bottom Navigation**: Mobile-specific navigation
- **Swipe Gestures**: Card interactions
- **Pull-to-Refresh**: Data updates

---

## 🔧 Development Architecture

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI elements
│   ├── features/       # Feature-specific components
│   └── layout/         # Layout components
├── pages/              # Route components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
│   ├── api/           # API functions
│   ├── utils/         # Helper functions
│   └── constants/     # App constants
├── types/              # TypeScript definitions
└── styles/             # Global styles
```

### Development Workflow
1. **Design**: Figma → Component specs
2. **Development**: TypeScript → React components
3. **Testing**: Jest + React Testing Library
4. **Integration**: Supabase → Database
5. **Deployment**: Vercel → Production

---

## 📊 Analytics Architecture

### Metrics Collection
```typescript
interface AnalyticsEvent {
  event: string;
  properties: {
    user_id?: string;
    event_id?: string;
    space_id?: string;
    category?: string;
    timestamp: Date;
  };
}

// Usage tracking
trackEvent('event_created', {
  user_id: user.id,
  category: 'yoga',
  timestamp: new Date()
});
```

### Key Metrics
- **User Engagement**: DAU, MAU, Session duration
- **Content Performance**: Event views, space bookings
- **Community Growth**: New users, retained users
- **Feature Usage**: Search queries, message counts

---

## 🔄 Deployment Architecture

### CI/CD Pipeline
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Git      │    │  Vercel     │    │   Build     │    │   Deploy    │
│   Push      │───▶│  Trigger    │───▶│  Process    │───▶│   Live      │
│             │    │             │    │             │    │             │
│ • Code      │    │ • Webhook   │    │ • Vite      │    │ • CDN       │
│ • Tests     │    │ • Validate  │    │ • Optimize  │    │ • Cache     │
│ • Lint      │    │ • Deploy    │    │ • Bundle    │    │ • Monitor   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Environment Management
- **Development**: Local + Supabase Dev
- **Staging**: Vercel Preview + Supabase Staging
- **Production**: Vercel Production + Supabase Production

---

## 📈 Scalability Considerations

### Horizontal Scaling
- **CDN**: Global asset distribution
- **Database**: Read replicas for heavy queries
- **Storage**: Multi-region file storage
- **Cache**: Redis for session and API caching

### Vertical Scaling
- **Code Splitting**: Reduce bundle size
- **Lazy Loading**: Load components on demand
- **Memoization**: Prevent unnecessary re-renders
- **Virtualization**: Handle large lists efficiently

---

## 🛡️ Security Considerations

### Data Protection
- **Encryption**: HTTPS, database encryption
- **Authentication**: JWT tokens, secure sessions
- **Authorization**: Role-based access control
- **Input Validation**: Sanitization, type checking

### Privacy Compliance
- **GDPR**: Data export, deletion rights
- **CCPA**: Privacy policy, opt-out mechanisms
- **User Control**: Privacy settings, data visibility

---

## 🔮 Future Architecture

### Planned Enhancements
1. **PWA**: Service worker, offline support
2. **Real-time**: WebSocket connections
3. **AI/ML**: Recommendation engine
4. **Mobile App**: React Native version
5. **Analytics**: Advanced insights platform

### Extensibility Points
- **Plugin System**: Third-party integrations
- **API Gateway**: External API access
- **Webhook System**: Event-driven integrations
- **Microservices**: Service decomposition

---

This architecture provides a solid foundation for a scalable, maintainable, and user-friendly holistic community platform. The design emphasizes performance, security, and user experience while maintaining flexibility for future enhancements.