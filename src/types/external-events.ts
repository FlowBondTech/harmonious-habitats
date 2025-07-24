export type EventPlatform = 'partiful' | 'meetup' | 'eventbrite' | 'facebook' | 'internal';

export interface ExternalEvent {
  id: string;
  platform: EventPlatform;
  title: string;
  description: string;
  date: string; // ISO date string
  location?: string;
  url: string;
  imageUrl?: string;
  attendees?: number;
  distance?: number; // in miles
  originalId?: string; // ID from the source platform
  lastUpdated?: string; // ISO date string
}

export interface EventAggregationConfig {
  platform: EventPlatform;
  enabled: boolean;
  apiKey?: string;
  rateLimit?: number; // requests per hour
  lastSync?: string;
}

export interface EventFilter {
  platforms?: EventPlatform[];
  searchTerm?: string;
  dateRange?: 'today' | 'week' | 'month' | 'all';
  radius?: number; // miles
  minAttendees?: number;
  maxAttendees?: number;
}