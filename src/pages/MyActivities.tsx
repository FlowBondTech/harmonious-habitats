import React, { useState } from 'react';
import { useState, useEffect } from 'react';
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
import { useAuthContext } from '../components/AuthProvider';
import { getEvents, getSpaces, Event, Space } from '../lib/supabase';

const MyActivities = () => {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('attending');
  const [attendingEvents, setAttendingEvents] = useState<Event[]>([]);
  const [hostingEvents, setHostingEvents] = useState<Event[]>([]);
  const [mySpaces, setMySpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user's activities
  useEffect(() => {
    const loadActivities = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Load events user is hosting
        const { data: hostingData } = await getEvents();
        const userHostingEvents = hostingData?.filter(event => event.organizer_id === user.id) || [];
        setHostingEvents(userHostingEvents);
        
        // Load user's spaces
        const { data: spacesData } = await getSpaces();
        const userSpaces = spacesData?.filter(space => space.owner_id === user.id) || [];
        setMySpaces(userSpaces);
        
        // TODO: Load events user is attending (requires participant data)
        setAttendingEvents([]);
        
      } catch (error) {
        console.error('Error loading activities:', error);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, [user]);
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const formatTime = (startTime: string, endTime: string) => {
    const formatHour = (time: string) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    };
    
    return `${formatHour(startTime)} - ${formatHour(endTime)}`;
  };

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
    { id: 'spaces', label: 'My Spaces', count: mySpaces.length },
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
                {loading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-forest-200 border-t-forest-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-forest-600">Loading your events...</p>
                  </div>
                ) : hostingEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-forest-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-forest-800 mb-2">No events hosted yet</h3>
                    <p className="text-forest-600 mb-6">Start sharing your practice with the community!</p>
                    <a
                      href="/create-event"
                      className="bg-forest-600 hover:bg-forest-700 text-white px-6 py-3 rounded-xl font-medium transition-colors inline-flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Create Event</span>
                    </a>
                  </div>
                ) : (
                  hostingEvents.map((event) => (
                  <div key={event.id} className="bg-gradient-to-r from-earth-50 to-forest-50 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-forest-800 mb-1">{event.title}</h3>
                        <p className="text-forest-600 mb-2">You're facilitating this event</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          event.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : event.status === 'pending_approval'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {event.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{formatTime(event.start_time, event.end_time)}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{event.location_name}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-white/60 rounded-lg p-3">
                      <div className="flex items-center text-sm text-forest-600">
                        <Users className="h-4 w-4 mr-2" />
                        <span>{event.participants?.length || 0}/{event.capacity} participants</span>
                      </div>
                      <button className="bg-forest-600 hover:bg-forest-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Manage Event
                      </button>
                    </div>
                  </div>
                  ))
                )}
              </div>
            )}

            {/* My Spaces */}
            {activeTab === 'spaces' && (
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-forest-200 border-t-forest-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-forest-600">Loading your spaces...</p>
                  </div>
                ) : mySpaces.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-forest-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-forest-800 mb-2">No spaces shared yet</h3>
                    <p className="text-forest-600 mb-6">Open your space to community events and gatherings!</p>
                    <a
                      href="/share-space"
                      className="bg-earth-500 hover:bg-earth-600 text-white px-6 py-3 rounded-xl font-medium transition-colors inline-flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Share Space</span>
                    </a>
                  </div>
                ) : (
                  mySpaces.map((space) => (
                    <div key={space.id} className="bg-gradient-to-r from-earth-50 to-forest-50 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-forest-800 mb-1">{space.name}</h3>
                          <p className="text-forest-600 mb-2">You're sharing this space</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            space.status === 'available' 
                              ? 'bg-green-100 text-green-800'
                              : space.status === 'pending_approval'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {space.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
                          <Users className="h-4 w-4 mr-2" />
                          <span>Up to {space.capacity} people</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{space.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                        </div>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 mr-2" />
                          <span>{space.list_publicly ? 'Global' : 'Local'} visibility</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between bg-white/60 rounded-lg p-3">
                        <div className="flex items-center text-sm text-forest-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>0 upcoming bookings</span>
                        </div>
                        <button className="bg-earth-500 hover:bg-earth-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                          Manage Space
                        </button>
                      </div>
                    </div>
                  ))
                )}
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