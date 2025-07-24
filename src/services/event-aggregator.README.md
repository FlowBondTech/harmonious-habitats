# Event Aggregator Service Implementation Guide

This guide documents how to implement the actual API integrations for the hyperlocal events aggregation feature.

## Overview

The Event Aggregator service fetches events from multiple platforms:
- Partiful
- Meetup
- Eventbrite
- Facebook Events

## API Integration Requirements

### 1. Partiful API
- **Documentation**: Contact Partiful for API access
- **Authentication**: API key required
- **Rate Limits**: 60 requests/hour
- **Required Scopes**: Event search, event details

### 2. Meetup API
- **Documentation**: https://www.meetup.com/api/
- **Authentication**: OAuth 2.0
- **Rate Limits**: 100 requests/hour
- **Endpoints Needed**:
  - `/find/upcoming_events` - Search for events by location
  - `/2/events` - Get event details

### 3. Eventbrite API
- **Documentation**: https://www.eventbrite.com/platform/api
- **Authentication**: OAuth 2.0 or Private token
- **Rate Limits**: 1000 requests/hour
- **Endpoints Needed**:
  - `/v3/events/search/` - Search events by location
  - `/v3/events/{id}/` - Get event details

### 4. Facebook Graph API
- **Documentation**: https://developers.facebook.com/docs/graph-api
- **Authentication**: App Access Token
- **Rate Limits**: 200 requests/hour
- **Permissions Required**:
  - `pages_read_engagement`
  - `pages_show_list`
- **Endpoints Needed**:
  - `/search?type=event&q=*&center={lat},{lng}&distance={radius}`

## Implementation Steps

### 1. Environment Variables
Add to `.env`:
```bash
# Partiful
VITE_PARTIFUL_API_KEY=your_key_here

# Meetup
VITE_MEETUP_CLIENT_ID=your_client_id
VITE_MEETUP_CLIENT_SECRET=your_secret

# Eventbrite
VITE_EVENTBRITE_PRIVATE_TOKEN=your_token

# Facebook
VITE_FACEBOOK_APP_ID=your_app_id
VITE_FACEBOOK_APP_SECRET=your_secret
```

### 2. Update Platform Fetchers

Example implementation for Meetup:

```typescript
private async fetchMeetupEvents(location: { lat: number; lng: number }, radius: number): Promise<ExternalEvent[]> {
  const response = await fetch(
    `https://api.meetup.com/find/upcoming_events?` +
    `lat=${location.lat}&lon=${location.lng}&radius=${radius}&page=20`,
    {
      headers: {
        'Authorization': `Bearer ${this.getMeetupToken()}`
      }
    }
  );
  
  const data = await response.json();
  
  return data.events.map((event: any) => ({
    id: `meetup-${event.id}`,
    platform: 'meetup' as EventPlatform,
    title: event.name,
    description: event.description || '',
    date: event.local_date + 'T' + event.local_time,
    location: event.venue ? 
      `${event.venue.name}, ${event.venue.address_1}, ${event.venue.city}` : 
      'Online Event',
    url: event.link,
    imageUrl: event.featured_photo?.photo_link,
    attendees: event.yes_rsvp_count,
    distance: this.calculateDistance(
      location.lat, 
      location.lng, 
      event.venue?.lat || location.lat, 
      event.venue?.lon || location.lng
    ),
    originalId: event.id,
    lastUpdated: new Date().toISOString()
  }));
}
```

### 3. Authentication Management

Create an auth manager for each platform:

```typescript
class MeetupAuth {
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  
  async getToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }
    
    // Refresh token logic here
    const response = await fetch('/api/meetup/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: import.meta.env.VITE_MEETUP_CLIENT_ID,
        client_secret: import.meta.env.VITE_MEETUP_CLIENT_SECRET,
        grant_type: 'client_credentials'
      })
    });
    
    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);
    
    return this.accessToken;
  }
}
```

### 4. Caching Strategy

Implement caching to reduce API calls:

```typescript
class EventCache {
  private cache = new Map<string, { data: ExternalEvent[], expiry: Date }>();
  
  set(key: string, events: ExternalEvent[], ttl: number = 3600000) { // 1 hour default
    this.cache.set(key, {
      data: events,
      expiry: new Date(Date.now() + ttl)
    });
  }
  
  get(key: string): ExternalEvent[] | null {
    const cached = this.cache.get(key);
    if (!cached || cached.expiry < new Date()) {
      this.cache.delete(key);
      return null;
    }
    return cached.data;
  }
}
```

### 5. Rate Limiting

Implement rate limiting to respect API limits:

```typescript
class RateLimiter {
  private requests = new Map<string, number[]>();
  
  canMakeRequest(platform: string, limit: number): boolean {
    const now = Date.now();
    const hourAgo = now - 3600000;
    
    const platformRequests = this.requests.get(platform) || [];
    const recentRequests = platformRequests.filter(time => time > hourAgo);
    
    this.requests.set(platform, recentRequests);
    
    return recentRequests.length < limit;
  }
  
  recordRequest(platform: string) {
    const requests = this.requests.get(platform) || [];
    requests.push(Date.now());
    this.requests.set(platform, requests);
  }
}
```

## Security Considerations

1. **Never expose API keys in client code** - Use a backend proxy
2. **Implement CORS properly** on your backend
3. **Validate and sanitize all external data**
4. **Use HTTPS for all API calls**
5. **Store tokens securely** (consider using httpOnly cookies)

## Testing

1. Create mock responses for each platform
2. Test rate limiting behavior
3. Test error handling for API failures
4. Test location-based filtering accuracy
5. Test caching behavior

## Future Enhancements

1. **Backend Proxy Service**: Move API calls to backend for security
2. **Webhook Support**: Real-time event updates
3. **User Preferences**: Save platform preferences per user
4. **Event Deduplication**: Detect same events across platforms
5. **Advanced Filtering**: Categories, price ranges, accessibility
6. **Push Notifications**: Alert users about new events
7. **Calendar Integration**: Add events to user's calendar
8. **Social Features**: See which friends are attending