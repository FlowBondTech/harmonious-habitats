import React, { useState, useEffect } from 'react';
import { ExternalLink, Check, X, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
  comingSoon?: boolean;
}

interface EventPlatformConnectorsProps {
  userId: string;
}

export const EventPlatformConnectors: React.FC<EventPlatformConnectorsProps> = ({ userId }) => {
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);

  const platforms: Platform[] = [
    {
      id: 'meetup',
      name: 'Meetup',
      icon: '🤝',
      color: 'text-red-600',
      bgColor: 'bg-red-50 hover:bg-red-100',
      description: 'Import events from your Meetup groups'
    },
    {
      id: 'facebook',
      name: 'Facebook Events',
      icon: '📘',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      description: 'Sync events from Facebook pages and groups'
    },
    {
      id: 'eventbrite',
      name: 'Eventbrite',
      icon: '🎫',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100',
      description: 'Connect your Eventbrite organizer account'
    },
    {
      id: 'lu.ma',
      name: 'Lu.ma',
      icon: '🌙',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
      description: 'Import events from Lu.ma calendars'
    },
    {
      id: 'partiful',
      name: 'Partiful',
      icon: '🎉',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 hover:bg-pink-100',
      description: 'Sync your Partiful events and RSVPs'
    },
    {
      id: 'classpass',
      name: 'ClassPass',
      icon: '💪',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      description: 'Import fitness and wellness classes from ClassPass'
    },
    {
      id: 'google',
      name: 'Google Calendar',
      icon: '📅',
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
      description: 'Import events from Google Calendar',
      comingSoon: true
    },
    {
      id: 'ticketmaster',
      name: 'Ticketmaster',
      icon: '🎟️',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 hover:bg-indigo-100',
      description: 'Discover concerts and entertainment events',
      comingSoon: true
    },
    {
      id: 'yelp',
      name: 'Yelp Events',
      icon: '⭐',
      color: 'text-red-500',
      bgColor: 'bg-red-50 hover:bg-red-100',
      description: 'Find local business events and workshops',
      comingSoon: true
    }
  ];

  useEffect(() => {
    fetchConnectedPlatforms();
  }, [userId]);

  const fetchConnectedPlatforms = async () => {
    // In a real implementation, this would fetch from a user_platform_connections table
    // For now, we'll use a mock implementation
    const mockConnected = ['meetup', 'eventbrite'];
    setConnectedPlatforms(mockConnected);
  };

  const handleConnect = async (platformId: string) => {
    if (platforms.find(p => p.id === platformId)?.comingSoon) {
      return;
    }

    setConnecting(platformId);
    
    // Simulate connection process
    setTimeout(() => {
      if (connectedPlatforms.includes(platformId)) {
        // Disconnect
        setConnectedPlatforms(prev => prev.filter(id => id !== platformId));
      } else {
        // Connect
        setConnectedPlatforms(prev => [...prev, platformId]);
      }
      setConnecting(null);
    }, 1500);

    // In a real implementation, this would:
    // 1. Redirect to OAuth flow for the platform
    // 2. Store the access tokens securely
    // 3. Set up webhooks or periodic sync
  };

  const isConnected = (platformId: string) => connectedPlatforms.includes(platformId);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <p className="text-sm text-gray-600 mb-6">
        Link your event platform accounts to automatically import and sync events. Your events will appear in the Hyperlocal Events section.
      </p>

      {/* Platform Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platforms.map((platform) => {
          const connected = isConnected(platform.id);
          const isConnecting = connecting === platform.id;

          return (
            <div
              key={platform.id}
              className={`relative rounded-lg border transition-all ${
                platform.comingSoon
                  ? 'border-gray-200 bg-gray-50 opacity-75'
                  : connected
                  ? 'border-green-300 bg-green-50/50'
                  : 'border-gray-200 bg-white hover:shadow-md'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{platform.icon}</span>
                    <div>
                      <h3 className={`font-semibold ${platform.color}`}>
                        {platform.name}
                      </h3>
                      {connected && (
                        <span className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                          <Check className="h-3 w-3" />
                          Connected
                        </span>
                      )}
                      {platform.comingSoon && (
                        <span className="text-xs text-gray-500 font-medium">
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  {platform.description}
                </p>

                <button
                  onClick={() => handleConnect(platform.id)}
                  disabled={isConnecting || platform.comingSoon}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                    platform.comingSoon
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : connected
                      ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      : `${platform.bgColor} ${platform.color} border border-current`
                  } ${isConnecting ? 'opacity-50 cursor-wait' : ''}`}
                >
                  {isConnecting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      {connected ? 'Disconnecting...' : 'Connecting...'}
                    </span>
                  ) : platform.comingSoon ? (
                    'Coming Soon'
                  ) : connected ? (
                    'Disconnect'
                  ) : (
                    'Connect'
                  )}
                </button>

                {connected && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>Last synced: 5 minutes ago</span>
                      <button className="text-forest hover:text-forest-700 font-medium">
                        Sync Now
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};