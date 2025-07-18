import React from 'react';
import { Globe } from 'lucide-react';
import EventSearchAndDiscovery from '../components/EventSearchAndDiscovery';

const GlobalFeed = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      {/* Header */}
      <div className="bg-white border-b border-forest-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-gradient-to-br from-forest-600 to-forest-700 p-3 rounded-xl">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-forest-800">Global Events</h1>
          </div>
          <p className="text-forest-600 ml-14">
            Discover virtual and global holistic events happening around the world
          </p>
        </div>
      </div>

      {/* Event Search and Discovery Component */}
      <EventSearchAndDiscovery />
    </div>
  );
};

export default GlobalFeed;