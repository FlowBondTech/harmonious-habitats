import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Plus,
  Heart,
  Star,
  Edit,
  Share,
  MessageCircle
} from 'lucide-react';

const MyActivities = () => {
  const [activeTab, setActiveTab] = useState('attending');

  const attendingEvents = [
    {
      id: 1,
      title: 'Morning Yoga Flow',
      facilitator: 'Emma Thompson',
      date: 'Today, March 15',
      time: '7:30 AM - 8:30 AM',
      location: 'Riverside Park Pavilion',
      distance: '0.7 miles',
      status: 'confirmed'
    },
    {
      id: 2,
      title: 'Community Garden Workday',
      facilitator: 'Sarah Martinez',
      date: 'Tomorrow, March 16',
      time: '9:00 AM - 12:00 PM',
      location: 'Maple Street Community Garden',
      distance: '0.3 miles',
      status: 'confirmed'
    },
    {
      id: 3,
      title: 'Fermentation Workshop',
      facilitator: 'Dr. Michael Chen',
      date: 'Saturday, March 18',
      time: '2:00 PM - 4:00 PM',
      location: 'Community Kitchen Co-op',
      distance: '1.1 miles',
      status: 'waitlist'
    }
  ];

  const hostingEvents = [
    {
      id: 1,
      title: 'Meditation Circle',
      date: 'Sunday, March 19',
      time: '6:00 PM - 7:30 PM',
      location: 'My Backyard Garden',
      participants: 8,
      maxParticipants: 12,
      status: 'active'
    },
    {
      id: 2,
      title: 'Herb Walk & Wildcrafting',
      date: 'Next Sunday, March 26',
      time: '10:00 AM - 12:00 PM',
      location: 'Neighborhood Trails',
      participants: 6,
      maxParticipants: 10,
      status: 'active'
    }
  ];

  const favoriteEvents = [
    {
      id: 1,
      title: 'Tuesday Pottery Circle',
      facilitator: 'The Clay Collective',
      nextDate: 'Every Tuesday',
      time: '7:00 PM',
      location: 'Community Art Center',
      distance: '0.9 miles'
    },
    {
      id: 2,
      title: 'Saturday Permaculture Study',
      facilitator: 'Green Thumb Collective',
      nextDate: 'Every Saturday',
      time: '10:00 AM',
      location: 'Urban Farm Co-op',
      distance: '0.8 miles'
    }
  ];

  const tabs = [
    { id: 'attending', label: 'Attending', count: attendingEvents.length },
    { id: 'hosting', label: 'Hosting', count: hostingEvents.length },
    { id: 'favorites', label: 'Favorites', count: favoriteEvents.length },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-forest-800 mb-2">My Activities</h1>
            <p className="text-forest-600">Manage your community involvement and connections</p>
          </div>
          <div className="flex space-x-3">
            <button className="bg-earth-400 hover:bg-earth-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Create Event</span>
            </button>
            <button className="bg-forest-600 hover:bg-forest-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Share Space</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-forest-600 text-sm font-medium">Events Attended</p>
                <p className="text-2xl font-bold text-forest-800">47</p>
              </div>
              <Calendar className="h-8 w-8 text-earth-400" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-forest-600 text-sm font-medium">Hours Contributed</p>
                <p className="text-2xl font-bold text-forest-800">124</p>
              </div>
              <Clock className="h-8 w-8 text-earth-400" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-forest-600 text-sm font-medium">Neighbors Met</p>
                <p className="text-2xl font-bold text-forest-800">38</p>
              </div>
              <Users className="h-8 w-8 text-earth-400" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-forest-600 text-sm font-medium">Community Rating</p>
                <p className="text-2xl font-bold text-forest-800">4.9</p>
              </div>
              <Star className="h-8 w-8 text-earth-400 fill-current" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="border-b border-forest-100">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-forest-500 text-forest-600'
                      : 'border-transparent text-forest-400 hover:text-forest-600'
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 bg-forest-100 text-forest-600 py-1 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Attending Events */}
            {activeTab === 'attending' && (
              <div className="space-y-4">
                {attendingEvents.map((event) => (
                  <div key={event.id} className="bg-gradient-to-r from-forest-50 to-earth-50 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-forest-800 mb-1">{event.title}</h3>
                        <p className="text-forest-600 flex items-center mb-2">
                          <Star className="h-4 w-4 mr-1 text-earth-400 fill-current" />
                          {event.facilitator}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          event.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {event.status === 'confirmed' ? 'Confirmed' : 'Waitlist'}
                        </span>
                        <button className="p-2 text-forest-600 hover:bg-white/60 rounded-lg transition-colors">
                          <Share className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-forest-600 hover:bg-white/60 rounded-lg transition-colors">
                          <MessageCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-forest-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{event.location} • {event.distance}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Hosting Events */}
            {activeTab === 'hosting' && (
              <div className="space-y-4">
                {hostingEvents.map((event) => (
                  <div key={event.id} className="bg-gradient-to-r from-earth-50 to-forest-50 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-forest-800 mb-1">{event.title}</h3>
                        <p className="text-forest-600 mb-2">You're facilitating this event</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="bg-earth-100 text-earth-800 px-3 py-1 rounded-full text-xs font-medium">
                          Active
                        </span>
                        <button className="p-2 text-forest-600 hover:bg-white/60 rounded-lg transition-colors">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-forest-600 hover:bg-white/60 rounded-lg transition-colors">
                          <MessageCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-forest-600 mb-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{event.date}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-white/60 rounded-lg p-3">
                      <div className="flex items-center text-sm text-forest-600">
                        <Users className="h-4 w-4 mr-2" />
                        <span>{event.participants}/{event.maxParticipants} participants</span>
                      </div>
                      <button className="bg-forest-600 hover:bg-forest-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Manage Event
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Favorite Events */}
            {activeTab === 'favorites' && (
              <div className="space-y-4">
                {favoriteEvents.map((event) => (
                  <div key={event.id} className="bg-gradient-to-r from-forest-50 to-earth-50 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-forest-800 mb-1">{event.title}</h3>
                        <p className="text-forest-600 flex items-center mb-2">
                          <Star className="h-4 w-4 mr-1 text-earth-400 fill-current" />
                          {event.facilitator}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Heart className="h-5 w-5 text-red-500 fill-current" />
                        <button className="p-2 text-forest-600 hover:bg-white/60 rounded-lg transition-colors">
                          <MessageCircle className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-forest-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{event.nextDate}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{event.location} • {event.distance}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyActivities;