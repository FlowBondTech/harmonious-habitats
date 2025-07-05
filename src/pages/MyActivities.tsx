import React, { useState } from 'react';
import { useEffect } from 'react';
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
import EventCard from '../components/EventCard';
import SpaceCard from '../components/SpaceCard';

const MyActivities = () => {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('attending');
  const [attendingEvents, setAttendingEvents] = useState<Event[]>([]);
  const [hostingEvents, setHostingEvents] = useState<Event[]>([]);
  const [mySpaces, setMySpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user's activities
  useEffect(() => {
    loadActivities();
  }, [user]);
  
  // Define loadActivities as a function that can be called elsewhere
  const loadActivities = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Load events the user is attending
        const { data: attendingData, error: attendingError } = await getUserAttendingEvents(user.id);
        
        if (attendingError) {
          console.error('Error loading attending events:', attendingError);
        } else {
          setAttendingEvents(attendingData || []);
        }
        
        // Load events user is hosting
        const { data: hostingData, error: hostingError } = await supabase
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
          .eq('organizer_id', user.id)
          .order('date', { ascending: true });
        
        if (hostingError) {
          console.error('Error loading hosting events:', hostingError);
        } else {
          setHostingEvents(hostingData || []);
        }
        
        // Load user's spaces
        const { data: spacesData } = await getSpaces();
        const userSpaces = spacesData?.filter(space => space.owner_id === user.id) || [];
        setMySpaces(userSpaces);
        
      } catch (error) {
        console.error('Error loading activities:', error);
      } finally {
        setLoading(false);
      }
  };

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
                {loading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-forest-200 border-t-forest-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-forest-600">Loading your events...</p>
                  </div>
                ) : attendingEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-forest-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-forest-800 mb-2">No events joined yet</h3>
                    <p className="text-forest-600 mb-6">Discover and join events in your community!</p>
                    <Link
                      to="/map"
                      className="bg-forest-600 hover:bg-forest-700 text-white px-6 py-3 rounded-xl font-medium transition-colors inline-flex items-center space-x-2"
                    >
                      <MapPin className="h-4 w-4" />
                      <span>Find Events</span>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {attendingEvents.map((event) => (
                      <EventCard 
                        key={event.id} 
                        event={event} 
                        onUpdate={loadActivities}
                      />
                    ))}
                  </div>
                )}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {hostingEvents.map((event) => (
                      <EventCard 
                        key={event.id} 
                        event={event} 
                        showManagement={true}
                        onUpdate={loadActivities}
                      />
                    ))}
                  </div>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {mySpaces.map((space) => (
                      <SpaceCard key={space.id} space={space} />
                    ))}
                  </div>
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