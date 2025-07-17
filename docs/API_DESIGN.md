# Harmony Spaces - API Design & Interface Specifications

**Version**: 1.0  
**Date**: 2025-01-17  
**Type**: Supabase API Architecture & Custom Functions  

---

## 🌐 API Architecture Overview

### API Stack
- **Primary**: Supabase REST API (PostgREST)
- **Real-time**: Supabase Realtime (WebSocket)
- **Authentication**: Supabase Auth (JWT)
- **Storage**: Supabase Storage (REST)
- **Functions**: Supabase Edge Functions (Deno)

### Base Configuration
```typescript
// API Client Configuration
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
```

---

## 🔐 Authentication API

### Authentication Endpoints
```typescript
// Sign Up
POST /auth/v1/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "data": {
    "full_name": "John Doe",
    "username": "johndoe",
    "neighborhood": "Downtown"
  }
}

// Response
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "email_confirmed_at": "2025-01-17T10:00:00Z",
    "user_metadata": {
      "full_name": "John Doe",
      "username": "johndoe"
    }
  },
  "session": {
    "access_token": "jwt-token",
    "refresh_token": "refresh-token",
    "expires_in": 3600
  }
}
```

### Authentication Functions
```typescript
// Sign In
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
};

// Sign Out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Get Current User
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

// Password Reset
export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  });
  return { data, error };
};
```

---

## 👤 Profile Management API

### Profile Endpoints
```typescript
// Get Profile
GET /rest/v1/profiles?id=eq.{user_id}
Authorization: Bearer {jwt_token}

// Update Profile
PATCH /rest/v1/profiles?id=eq.{user_id}
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "full_name": "John Doe Updated",
  "bio": "Holistic wellness enthusiast",
  "neighborhood": "Uptown",
  "discovery_radius": 10,
  "holistic_interests": ["yoga", "meditation", "gardening"],
  "notification_preferences": {
    "newEvents": true,
    "messages": true,
    "reminders": false,
    "community": true
  }
}
```

### Profile Functions
```typescript
// Get User Profile
export const getUserProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) {
    logError(error, 'getUserProfile');
    return null;
  }
  
  return data;
};

// Update Profile
export const updateProfile = async (
  userId: string, 
  updates: Partial<Profile>
): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();
  
  if (error) {
    logError(error, 'updateProfile');
    return null;
  }
  
  return data;
};

// Search Profiles
export const searchProfiles = async (
  query: string,
  filters?: {
    neighborhood?: string;
    interests?: string[];
    verified?: boolean;
  }
): Promise<Profile[]> => {
  let queryBuilder = supabase
    .from('profiles')
    .select('*')
    .or(`full_name.ilike.%${query}%,username.ilike.%${query}%,bio.ilike.%${query}%`);
  
  if (filters?.neighborhood) {
    queryBuilder = queryBuilder.eq('neighborhood', filters.neighborhood);
  }
  
  if (filters?.interests?.length) {
    queryBuilder = queryBuilder.overlaps('holistic_interests', filters.interests);
  }
  
  if (filters?.verified !== undefined) {
    queryBuilder = queryBuilder.eq('verified', filters.verified);
  }
  
  const { data, error } = await queryBuilder.limit(20);
  
  if (error) {
    logError(error, 'searchProfiles');
    return [];
  }
  
  return data || [];
};
```

---

## 📅 Event Management API

### Event Endpoints
```typescript
// Create Event
POST /rest/v1/events
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "title": "Morning Yoga Session",
  "description": "Gentle yoga practice for all levels",
  "category": "Yoga",
  "event_type": "local",
  "date": "2025-01-20",
  "start_time": "07:00:00",
  "end_time": "08:30:00",
  "location_name": "Central Park",
  "address": "123 Park Ave, City, State",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "capacity": 15,
  "skill_level": "all",
  "donation_suggested": "$10-15",
  "materials_needed": ["yoga mat", "water bottle"]
}

// Get Events
GET /rest/v1/events?status=eq.active&date=gte.2025-01-17&order=date.asc
Authorization: Bearer {jwt_token}

// Join Event
POST /rest/v1/event_participants
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "event_id": "event-uuid",
  "user_id": "user-uuid",
  "status": "confirmed"
}
```

### Event Functions
```typescript
// Get Events with Filters
export const getEvents = async (filters?: {
  category?: string;
  event_type?: string;
  location?: { lat: number; lng: number; radius: number };
  date_range?: { start: string; end: string };
  skill_level?: string;
  verified?: boolean;
  limit?: number;
}): Promise<Event[]> => {
  let query = supabase
    .from('events')
    .select(`
      *,
      organizer:profiles!events_organizer_id_fkey(id, full_name, avatar_url, verified),
      participants:event_participants(
        user_id,
        status,
        user:profiles!event_participants_user_id_fkey(id, full_name, avatar_url)
      )
    `)
    .eq('status', 'active');
  
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  
  if (filters?.event_type) {
    query = query.eq('event_type', filters.event_type);
  }
  
  if (filters?.date_range) {
    query = query
      .gte('date', filters.date_range.start)
      .lte('date', filters.date_range.end);
  }
  
  if (filters?.skill_level) {
    query = query.eq('skill_level', filters.skill_level);
  }
  
  if (filters?.verified !== undefined) {
    query = query.eq('verified', filters.verified);
  }
  
  if (filters?.location) {
    // Use PostGIS for location-based queries
    query = query.rpc('events_within_radius', {
      lat: filters.location.lat,
      lng: filters.location.lng,
      radius_km: filters.location.radius
    });
  }
  
  query = query
    .order('date', { ascending: true })
    .limit(filters?.limit || 20);
  
  const { data, error } = await query;
  
  if (error) {
    logError(error, 'getEvents');
    return [];
  }
  
  return data || [];
};

// Create Event
export const createEvent = async (eventData: Partial<Event>): Promise<Event | null> => {
  const { data, error } = await supabase
    .from('events')
    .insert(eventData)
    .select(`
      *,
      organizer:profiles!events_organizer_id_fkey(id, full_name, avatar_url, verified)
    `)
    .single();
  
  if (error) {
    logError(error, 'createEvent');
    return null;
  }
  
  return data;
};

// Join Event
export const joinEvent = async (eventId: string, userId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('event_participants')
    .insert({
      event_id: eventId,
      user_id: userId,
      status: 'confirmed',
      joined_at: new Date().toISOString()
    });
  
  if (error) {
    logError(error, 'joinEvent');
    return false;
  }
  
  return true;
};

// Leave Event
export const leaveEvent = async (eventId: string, userId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('event_participants')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', userId);
  
  if (error) {
    logError(error, 'leaveEvent');
    return false;
  }
  
  return true;
};
```

---

## 🏠 Space Management API

### Space Endpoints
```typescript
// Create Space
POST /rest/v1/spaces
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "name": "Zen Garden Backyard",
  "type": "backyard",
  "description": "Peaceful outdoor space perfect for meditation",
  "address": "456 Elm St, City, State",
  "latitude": 40.7589,
  "longitude": -73.9851,
  "capacity": 8,
  "list_publicly": true,
  "guidelines": "Please remove shoes, no loud music",
  "donation_suggested": "$5-10 per session",
  "animals_allowed": false,
  "image_urls": ["https://storage.supabase.co/..."]
}

// Get Spaces
GET /rest/v1/spaces?status=eq.available&list_publicly=eq.true
Authorization: Bearer {jwt_token}

// Book Space
POST /rest/v1/space_bookings
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "space_id": "space-uuid",
  "user_id": "user-uuid",
  "booking_date": "2025-01-20",
  "start_time": "10:00:00",
  "end_time": "12:00:00",
  "purpose": "Meditation session"
}
```

### Space Functions
```typescript
// Get Spaces with Filters
export const getSpaces = async (filters?: {
  type?: string;
  location?: { lat: number; lng: number; radius: number };
  capacity?: number;
  animals_allowed?: boolean;
  verified?: boolean;
  available_date?: string;
  limit?: number;
}): Promise<Space[]> => {
  let query = supabase
    .from('spaces')
    .select(`
      *,
      owner:profiles!spaces_owner_id_fkey(id, full_name, avatar_url, verified),
      amenities:space_amenities(amenity),
      accessibility_features:space_accessibility_features(feature)
    `)
    .eq('status', 'available')
    .eq('list_publicly', true);
  
  if (filters?.type) {
    query = query.eq('type', filters.type);
  }
  
  if (filters?.capacity) {
    query = query.gte('capacity', filters.capacity);
  }
  
  if (filters?.animals_allowed !== undefined) {
    query = query.eq('animals_allowed', filters.animals_allowed);
  }
  
  if (filters?.verified !== undefined) {
    query = query.eq('verified', filters.verified);
  }
  
  if (filters?.location) {
    query = query.rpc('spaces_within_radius', {
      lat: filters.location.lat,
      lng: filters.location.lng,
      radius_km: filters.location.radius
    });
  }
  
  query = query
    .order('created_at', { ascending: false })
    .limit(filters?.limit || 20);
  
  const { data, error } = await query;
  
  if (error) {
    logError(error, 'getSpaces');
    return [];
  }
  
  return data || [];
};

// Create Space
export const createSpace = async (spaceData: Partial<Space>): Promise<Space | null> => {
  const { data, error } = await supabase
    .from('spaces')
    .insert(spaceData)
    .select(`
      *,
      owner:profiles!spaces_owner_id_fkey(id, full_name, avatar_url, verified)
    `)
    .single();
  
  if (error) {
    logError(error, 'createSpace');
    return null;
  }
  
  return data;
};

// Book Space
export const bookSpace = async (bookingData: {
  space_id: string;
  user_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  purpose?: string;
}): Promise<boolean> => {
  const { error } = await supabase
    .from('space_bookings')
    .insert({
      ...bookingData,
      status: 'confirmed',
      created_at: new Date().toISOString()
    });
  
  if (error) {
    logError(error, 'bookSpace');
    return false;
  }
  
  return true;
};
```

---

## 💬 Messaging API

### Message Endpoints
```typescript
// Create Conversation
POST /rest/v1/conversations
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "type": "direct",
  "participants": ["user1-uuid", "user2-uuid"],
  "title": "Event Planning Discussion"
}

// Send Message
POST /rest/v1/messages
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "conversation_id": "conversation-uuid",
  "sender_id": "user-uuid",
  "content": "Hello! I'm interested in your yoga event.",
  "message_type": "text"
}

// Get Messages
GET /rest/v1/messages?conversation_id=eq.{conversation_id}&order=created_at.asc
Authorization: Bearer {jwt_token}
```

### Messaging Functions
```typescript
// Get Conversations
export const getConversations = async (userId: string): Promise<Conversation[]> => {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      participants:conversation_participants(
        user_id,
        user:profiles!conversation_participants_user_id_fkey(id, full_name, avatar_url)
      ),
      last_message:messages(content, created_at, sender_id)
    `)
    .eq('conversation_participants.user_id', userId)
    .order('updated_at', { ascending: false });
  
  if (error) {
    logError(error, 'getConversations');
    return [];
  }
  
  return data || [];
};

// Send Message
export const sendMessage = async (messageData: {
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type?: 'text' | 'image' | 'file';
}): Promise<Message | null> => {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      ...messageData,
      created_at: new Date().toISOString()
    })
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)
    `)
    .single();
  
  if (error) {
    logError(error, 'sendMessage');
    return null;
  }
  
  return data;
};

// Mark Messages as Read
export const markMessagesAsRead = async (
  conversationId: string,
  userId: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .is('read_at', null);
  
  if (error) {
    logError(error, 'markMessagesAsRead');
    return false;
  }
  
  return true;
};
```

---

## 🗄️ Storage API

### File Upload
```typescript
// Upload Image
export const uploadImage = async (
  file: File,
  bucket: string = 'space-images',
  userId: string
): Promise<string | null> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    logError(error, 'uploadImage');
    return null;
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);
  
  return publicUrl;
};

// Delete Image
export const deleteImage = async (
  url: string,
  bucket: string = 'space-images'
): Promise<boolean> => {
  const fileName = url.split('/').pop();
  if (!fileName) return false;
  
  const { error } = await supabase.storage
    .from(bucket)
    .remove([fileName]);
  
  if (error) {
    logError(error, 'deleteImage');
    return false;
  }
  
  return true;
};
```

---

## 📡 Real-time API

### Real-time Subscriptions
```typescript
// Subscribe to Event Updates
export const subscribeToEvents = (
  callback: (payload: any) => void
): RealtimeSubscription => {
  return supabase
    .channel('events')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'events'
    }, callback)
    .subscribe();
};

// Subscribe to Messages
export const subscribeToMessages = (
  conversationId: string,
  callback: (payload: any) => void
): RealtimeSubscription => {
  return supabase
    .channel(`messages:${conversationId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`
    }, callback)
    .subscribe();
};

// Subscribe to User Presence
export const subscribeToPresence = (
  channel: string,
  userId: string,
  onJoin: (joins: any) => void,
  onLeave: (leaves: any) => void
): RealtimeSubscription => {
  return supabase
    .channel(channel)
    .on('presence', { event: 'sync' }, () => {
      const newState = channel.presenceState();
      onJoin(newState);
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      onJoin(newPresences);
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      onLeave(leftPresences);
    })
    .subscribe(async (status) => {
      if (status !== 'SUBSCRIBED') return;
      
      const presenceTrackStatus = await channel.track({
        user: userId,
        online_at: new Date().toISOString(),
      });
    });
};
```

---

## 🔍 Search API

### Advanced Search
```typescript
// Full-text search across multiple tables
export const globalSearch = async (
  query: string,
  filters?: {
    types?: ('events' | 'spaces' | 'users')[];
    location?: { lat: number; lng: number; radius: number };
    verified?: boolean;
  }
): Promise<{
  events: Event[];
  spaces: Space[];
  users: Profile[];
}> => {
  const results = {
    events: [] as Event[],
    spaces: [] as Space[],
    users: [] as Profile[]
  };
  
  if (!filters?.types || filters.types.includes('events')) {
    const { data: events } = await supabase
      .from('events')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
      .eq('status', 'active')
      .limit(10);
    
    results.events = events || [];
  }
  
  if (!filters?.types || filters.types.includes('spaces')) {
    const { data: spaces } = await supabase
      .from('spaces')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,type.ilike.%${query}%`)
      .eq('status', 'available')
      .eq('list_publicly', true)
      .limit(10);
    
    results.spaces = spaces || [];
  }
  
  if (!filters?.types || filters.types.includes('users')) {
    const { data: users } = await supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${query}%,username.ilike.%${query}%,bio.ilike.%${query}%`)
      .limit(10);
    
    results.users = users || [];
  }
  
  return results;
};
```

---

## 📊 Analytics API

### Usage Analytics
```typescript
// Track Event
export const trackEvent = async (eventData: {
  event_type: string;
  user_id?: string;
  properties: Record<string, any>;
}): Promise<void> => {
  const { error } = await supabase
    .from('analytics_events')
    .insert({
      ...eventData,
      timestamp: new Date().toISOString()
    });
  
  if (error) {
    logError(error, 'trackEvent');
  }
};

// Get Dashboard Analytics
export const getDashboardAnalytics = async (
  timeRange: 'week' | 'month' | 'year' = 'week'
): Promise<{
  stats: {
    totalUsers: number;
    activeEvents: number;
    availableSpaces: number;
    pendingReports: number;
  };
  trends: {
    userGrowth: number;
    eventGrowth: number;
    spaceGrowth: number;
  };
}> => {
  const [
    profilesResult,
    eventsResult,
    spacesResult,
    reportsResult
  ] = await Promise.all([
    getProfilesCountWithChange(),
    getActiveEventsCountWithChange(),
    getAvailableSpacesCountWithChange(),
    getPendingReportsCountWithChange()
  ]);
  
  return {
    stats: {
      totalUsers: profilesResult.count,
      activeEvents: eventsResult.count,
      availableSpaces: spacesResult.count,
      pendingReports: reportsResult.count
    },
    trends: {
      userGrowth: parseFloat(profilesResult.change.replace('%', '').replace('+', '')),
      eventGrowth: parseFloat(eventsResult.change.replace('%', '').replace('+', '')),
      spaceGrowth: parseFloat(spacesResult.change.replace('%', '').replace('+', ''))
    }
  };
};
```

---

## 🛡️ Security & Error Handling

### Error Handling Pattern
```typescript
// Standardized error response
interface APIError {
  message: string;
  code: string;
  details?: any;
  timestamp: string;
}

// Error handler
export const handleAPIError = (error: any, context: string): APIError => {
  const apiError: APIError = {
    message: error.message || 'An unexpected error occurred',
    code: error.code || 'UNKNOWN_ERROR',
    details: error.details || null,
    timestamp: new Date().toISOString()
  };
  
  logError(error, context);
  return apiError;
};

// Wrapper for API calls
export const withErrorHandling = async <T>(
  apiCall: () => Promise<T>,
  context: string
): Promise<{ data: T | null; error: APIError | null }> => {
  try {
    const data = await apiCall();
    return { data, error: null };
  } catch (error) {
    return { data: null, error: handleAPIError(error, context) };
  }
};
```

### Rate Limiting
```typescript
// Simple rate limiter using local storage
class RateLimiter {
  private limits: Map<string, number[]> = new Map();
  
  isAllowed(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.limits.has(key)) {
      this.limits.set(key, []);
    }
    
    const requests = this.limits.get(key)!;
    const validRequests = requests.filter(time => time > windowStart);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.limits.set(key, validRequests);
    return true;
  }
}

export const rateLimiter = new RateLimiter();
```

---

This API design provides a comprehensive interface for all Harmony Spaces functionality while maintaining security, performance, and scalability. The design follows RESTful principles and leverages Supabase's powerful features for real-time updates and authentication.