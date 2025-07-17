import React, { useState } from 'react';
import { 
  Search as SearchIcon, 
  Filter, 
  MapPin, 
  Users, 
  Star, 
  X,
  Zap,
  Globe,
  Home,
  Heart,
  Bell,
  Bookmark,
  Sprout,
  History
} from 'lucide-react';
import { useAuthContext } from '../components/AuthProvider';
import SearchSystem from '../components/SearchSystem';
import { Link } from 'react-router-dom';

const Search = () => {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('all');
  
  const savedSearches = [
    { query: 'Yoga near me', date: '2 days ago', count: 12 },
    { query: 'Community gardens', date: '1 week ago', count: 8 },
    { query: 'Meditation spaces', date: '2 weeks ago', count: 5 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-forest-800 mb-2">Search & Discover</h1>
          <p className="text-forest-600">Find events, spaces, and community members</p>
        </div>

        {/* Main Search */}
        <div className="mb-12">
          <SearchSystem 
            isFullPage={true}
            placeholder="Search for events, spaces, or community members..."
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="border-b border-forest-100">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'all', label: 'All', icon: Filter },
                { id: 'saved', label: 'Saved Searches', icon: Bookmark },
                { id: 'history', label: 'Search History', icon: History }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-forest-500 text-forest-600'
                        : 'border-transparent text-forest-400 hover:text-forest-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Saved Searches */}
            {activeTab === 'saved' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-forest-800 mb-4">Your Saved Searches</h3>
                
                {savedSearches.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedSearches.map((search, index) => (
                      <div key={index} className="bg-forest-50 rounded-xl p-4 hover:bg-forest-100 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center">
                            <SearchIcon className="h-4 w-4 text-forest-600 mr-2" />
                            <h4 className="font-medium text-forest-800">{search.query}</h4>
                          </div>
                          <button className="text-forest-400 hover:text-forest-600">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-forest-600">{search.date}</span>
                          <span className="bg-forest-200 text-forest-700 px-2 py-1 rounded-full">
                            {search.count} results
                          </span>
                        </div>
                        <button className="w-full mt-3 bg-forest-100 hover:bg-forest-200 text-forest-700 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2">
                          <SearchIcon className="h-3 w-3" />
                          <span>Run Search</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Bookmark className="h-16 w-16 text-forest-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-forest-800 mb-2">No saved searches</h3>
                    <p className="text-forest-600 mb-6">
                      Save your searches to quickly access them later
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Search History */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-forest-800">Recent Search History</h3>
                  <button className="text-sm text-forest-600 hover:text-forest-800">
                    Clear history
                  </button>
                </div>
                
                <div className="space-y-2">
                  {[
                    { query: 'Yoga classes', date: 'Today, 2:30 PM' },
                    { query: 'Community garden', date: 'Today, 10:15 AM' },
                    { query: 'Meditation spaces', date: 'Yesterday, 4:45 PM' },
                    { query: 'Cooking workshop', date: 'Yesterday, 11:20 AM' },
                    { query: 'Art classes', date: '2 days ago' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-forest-50 hover:bg-forest-100 rounded-lg transition-colors">
                      <div className="flex items-center">
                        <History className="h-4 w-4 text-forest-500 mr-3" />
                        <span className="text-forest-700">{item.query}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-forest-500">{item.date}</span>
                        <button className="p-1 text-forest-400 hover:text-forest-600">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All */}
            {activeTab === 'all' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-forest-800 mb-4">Trending Searches</h3>
                  <div className="flex flex-wrap gap-3">
                    {[
                      'Yoga retreat', 'Community garden', 'Meditation circle', 
                      'Cooking class', 'Art workshop', 'Healing session',
                      'Music jam', 'Sustainable living', 'Herbal workshop'
                    ].map((term, index) => (
                      <Link 
                        key={index}
                        to={`/search?q=${encodeURIComponent(term)}`}
                        className="px-4 py-2 bg-forest-50 hover:bg-forest-100 text-forest-700 rounded-lg transition-colors text-sm flex items-center space-x-2"
                      >
                        <Zap className="h-3 w-3 text-earth-500" />
                        <span>{term}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-forest-800 mb-4">Discover By Category</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {[
                      { name: 'Gardening', icon: Sprout, color: 'bg-green-100 text-green-600' },
                      { name: 'Yoga & Meditation', icon: Users, color: 'bg-purple-100 text-purple-600' },
                      { name: 'Cooking', icon: Home, color: 'bg-orange-100 text-orange-600' },
                      { name: 'Art & Creativity', icon: Star, color: 'bg-pink-100 text-pink-600' },
                      { name: 'Healing & Wellness', icon: Heart, color: 'bg-blue-100 text-blue-600' },
                      { name: 'Music & Movement', icon: Bell, color: 'bg-indigo-100 text-indigo-600' },
                      { name: 'Sustainable Living', icon: Globe, color: 'bg-earth-100 text-earth-600' },
                      { name: 'Community Spaces', icon: Users, color: 'bg-forest-100 text-forest-600' }
                    ].map((category, index) => {
                      const Icon = category.icon;
                      return (
                        <Link
                          key={index}
                          to={`/search?category=${encodeURIComponent(category.name)}`}
                          className="bg-white rounded-xl p-4 hover:shadow-md transition-all duration-200 border border-forest-50 flex items-center space-x-3"
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${category.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <span className="font-medium text-forest-800">{category.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-forest-800 mb-4">Search Tips</h3>
                  <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <SearchIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-blue-800">Use specific keywords</p>
                          <p className="text-sm text-blue-600">Try "beginner yoga" instead of just "yoga"</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <MapPin className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-blue-800">Include location terms</p>
                          <p className="text-sm text-blue-600">Add "near me" or your neighborhood name</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Filter className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-blue-800">Use filters</p>
                          <p className="text-sm text-blue-600">Narrow results by date, type, or category</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;