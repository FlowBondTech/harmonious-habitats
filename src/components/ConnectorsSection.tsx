import React, { useState } from 'react';
import { Share2, Calendar, Facebook, Twitter, Instagram, Linkedin, ExternalLink, Check } from 'lucide-react';
import { EventPlatformConnectors } from './EventPlatformConnectors';

interface ConnectorsSectionProps {
  userId: string;
}

export const ConnectorsSection: React.FC<ConnectorsSectionProps> = ({ userId }) => {
  const [connectedSocial, setConnectedSocial] = useState<string[]>(['instagram']);
  const [connectingSocial, setConnectingSocial] = useState<string | null>(null);

  const socialPlatforms = [
    { 
      id: 'facebook', 
      name: 'Facebook', 
      icon: Facebook,
      color: 'text-blue-600',
      bgColor: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
      description: 'Share your events and connect with friends'
    },
    { 
      id: 'twitter', 
      name: 'Twitter', 
      icon: Twitter,
      color: 'text-sky-500',
      bgColor: 'bg-sky-500',
      hoverColor: 'hover:bg-sky-600',
      description: 'Tweet about your events and activities'
    },
    { 
      id: 'instagram', 
      name: 'Instagram', 
      icon: Instagram,
      color: 'text-pink-600',
      bgColor: 'bg-pink-600',
      hoverColor: 'hover:bg-pink-700',
      description: 'Share event photos and stories'
    },
    { 
      id: 'linkedin', 
      name: 'LinkedIn', 
      icon: Linkedin,
      color: 'text-blue-700',
      bgColor: 'bg-blue-700',
      hoverColor: 'hover:bg-blue-800',
      description: 'Connect with professional networks'
    }
  ];

  const handleSocialConnect = async (platformId: string) => {
    setConnectingSocial(platformId);
    
    // Simulate connection process
    setTimeout(() => {
      if (connectedSocial.includes(platformId)) {
        setConnectedSocial(prev => prev.filter(id => id !== platformId));
      } else {
        setConnectedSocial(prev => [...prev, platformId]);
      }
      setConnectingSocial(null);
    }, 1500);
  };

  const isSocialConnected = (platformId: string) => connectedSocial.includes(platformId);

  return (
    <div className="space-y-8">
      {/* Social Media Connections */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="h-5 w-5 text-forest" />
          <h3 className="text-lg font-semibold text-gray-900">Social Media Connections</h3>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-6">
            Connect your social media accounts to share events and engage with your community.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {socialPlatforms.map((platform) => {
              const Icon = platform.icon;
              const connected = isSocialConnected(platform.id);
              const isConnecting = connectingSocial === platform.id;
              
              return (
                <div 
                  key={platform.id} 
                  className={`relative rounded-lg border transition-all ${
                    connected 
                      ? 'border-green-300 bg-green-50/50' 
                      : 'border-gray-200 bg-white hover:shadow-md'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${platform.bgColor} ${platform.hoverColor} rounded-lg flex items-center justify-center text-white transition-colors`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{platform.name}</h4>
                          {connected && (
                            <span className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                              <Check className="h-3 w-3" />
                              Connected
                            </span>
                          )}
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      {platform.description}
                    </p>
                    
                    <button
                      onClick={() => handleSocialConnect(platform.id)}
                      disabled={isConnecting}
                      className={`w-full py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                        connected
                          ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          : `${platform.bgColor} ${platform.hoverColor} text-white`
                      } ${isConnecting ? 'opacity-50 cursor-wait' : ''}`}
                    >
                      {isConnecting ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          {connected ? 'Disconnecting...' : 'Connecting...'}
                        </span>
                      ) : connected ? (
                        'Disconnect'
                      ) : (
                        `Connect ${platform.name}`
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Event Platform Connections */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-forest" />
          <h3 className="text-lg font-semibold text-gray-900">Event Platform Connections</h3>
        </div>
        
        <EventPlatformConnectors userId={userId} />
      </div>
    </div>
  );
};