import type { ExternalEvent, EventPlatform, EventAggregationConfig } from '../types/external-events';

// Service for aggregating events from multiple platforms
export class EventAggregatorService {
  private configs: Map<EventPlatform, EventAggregationConfig> = new Map();
  
  constructor() {
    // Initialize platform configurations
    this.configs.set('partiful', {
      platform: 'partiful',
      enabled: true,
      rateLimit: 60, // requests per hour
    });
    
    this.configs.set('meetup', {
      platform: 'meetup',
      enabled: true,
      rateLimit: 100,
    });
    
    this.configs.set('eventbrite', {
      platform: 'eventbrite',
      enabled: true,
      rateLimit: 1000,
    });
    
    this.configs.set('facebook', {
      platform: 'facebook',
      enabled: true,
      rateLimit: 200,
    });
  }

  // Main method to fetch all events
  async fetchAllEvents(location: { lat: number; lng: number }, radius: number = 5): Promise<ExternalEvent[]> {
    const allEvents: ExternalEvent[] = [];
    const enabledPlatforms = Array.from(this.configs.entries())
      .filter(([, config]) => config.enabled);

    // Fetch events from each platform in parallel
    const promises = enabledPlatforms.map(([platform, config]) => 
      this.fetchPlatformEvents(platform, location, radius, config)
    );

    const results = await Promise.allSettled(promises);
    
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        allEvents.push(...result.value);
      }
    });

    // Sort by date
    return allEvents.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  // Fetch events from a specific platform
  private async fetchPlatformEvents(
    platform: EventPlatform,
    location: { lat: number; lng: number },
    radius: number,
    _config: EventAggregationConfig
  ): Promise<ExternalEvent[]> {
    try {
      switch (platform) {
        case 'partiful':
          return await this.fetchPartifulEvents(location, radius);
        case 'meetup':
          return await this.fetchMeetupEvents(location, radius);
        case 'eventbrite':
          return await this.fetchEventbriteEvents(location, radius);
        case 'facebook':
          return await this.fetchFacebookEvents(location, radius);
        default:
          return [];
      }
    } catch (error) {
      console.error(`Error fetching ${platform} events:`, error);
      return [];
    }
  }

  // Platform-specific fetchers (to be implemented with actual APIs)
  private async fetchPartifulEvents(_location: { lat: number; lng: number }, _radius: number): Promise<ExternalEvent[]> {
    // TODO: Implement Partiful API integration
    // For now, return mock data
    return [];
  }

  private async fetchMeetupEvents(_location: { lat: number; lng: number }, _radius: number): Promise<ExternalEvent[]> {
    // TODO: Implement Meetup API integration
    // Meetup API: https://www.meetup.com/api/
    return [];
  }

  private async fetchEventbriteEvents(_location: { lat: number; lng: number }, _radius: number): Promise<ExternalEvent[]> {
    // TODO: Implement Eventbrite API integration
    // Eventbrite API: https://www.eventbrite.com/platform/api
    return [];
  }

  private async fetchFacebookEvents(_location: { lat: number; lng: number }, _radius: number): Promise<ExternalEvent[]> {
    // TODO: Implement Facebook Graph API integration
    // Facebook Events API: https://developers.facebook.com/docs/graph-api/reference/event
    return [];
  }

  // Calculate distance between two coordinates
  private calculateDistance(
    lat1: number, 
    lng1: number, 
    lat2: number, 
    lng2: number
  ): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

// Singleton instance
export const eventAggregator = new EventAggregatorService();