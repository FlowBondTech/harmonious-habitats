import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Users, Heart, Sprout, Bot as Lotus, ChefHat, Palette, Music, BookOpen, Stethoscope, HandHeart, ArrowRight, Calendar, Star } from 'lucide-react';
import { useAuthContext } from '../components/AuthProvider';
import EventCard from '../components/EventCard';
import RadiusSelector from '../components/RadiusSelector';

const Home = () => {
  const { user, openAuthModalGlobal } = useAuthContext();

  const holisticCategories = [
    { icon: Sprout, name: 'Gardening', color: 'text-green-600 bg-green-50', count: 12 },
    { icon: Lotus, name: 'Yoga & Meditation', color: 'text-purple-600 bg-purple-50', count: 8 },
    { icon: ChefHat, name: 'Cooking', color: 'text-orange-600 bg-orange-50', count: 15 },
    { icon: Palette, name: 'Art & Creativity', color: 'text-pink-600 bg-pink-50', count: 6 },
    { icon: Stethoscope, name: 'Healing & Wellness', color: 'text-blue-600 bg-blue-50', count: 9 },
    { icon: Music, name: 'Music & Movement', color: 'text-indigo-600 bg-indigo-50', count: 4 },
  ];

  const todayEvents = [
    {
      id: 1,
      title: 'Community Garden Workday',
      facilitator: 'Sarah Martinez',
      time: '9:00 AM - 12:00 PM',
      location: 'Maple Street Community Garden',
      distance: '0.3 miles',
      category: 'Gardening',
      participants: 8,
      maxParticipants: 12,
      donation: 'Free',
      image: 'https://images.pexels.com/photos/4503273/pexels-photo-4503273.jpeg?auto=compress&cs=tinysrgb&w=400',
      verified: true
    },
    {
      id: 2,
      title: 'Morning Yoga in the Park',
      facilitator: 'Emma Thompson',
      time: '7:30 AM - 8:30 AM',
      location: 'Riverside Park Pavilion',
      distance: '0.7 miles',
      category: 'Yoga',
      participants: 15,
      maxParticipants: 20,
      donation: '$5-10',
      image: 'https://images.pexels.com/photos/3822647/pexels-photo-3822647.jpeg?auto=compress&cs=tinysrgb&w=400',
      verified: true
    },
    {
      id: 3,
      title: 'Fermentation Workshop',
      facilitator: 'Dr. Michael Chen',
      time: '2:00 PM - 4:00 PM',
      location: 'Community Kitchen Co-op',
      distance: '1.1 miles',
      category: 'Cooking',
      participants: 6,
      maxParticipants: 10,
      donation: '$15-20',
      image: 'https://images.pexels.com/photos/4057663/pexels-photo-4057663.jpeg?auto=compress&cs=tinysrgb&w=400',
      verified: true
    }
  ];

  const weeklyRegulars = [
    {
      title: 'Tuesday Meditation Circle',
      facilitator: 'The Mindful Neighbors',
      time: 'Tuesdays 6:30 PM',
      location: '0.4 miles away',
      participants: 12
    },
    {
      title: 'Saturday Permaculture Study',
      facilitator: 'Green Thumb Collective',
      time: 'Saturdays 10:00 AM',
      location: '0.8 miles away',
      participants: 18
    },
    {
      title: 'Friday Art Circle',
      facilitator: 'Creative Spirits',
      time: 'Fridays 7:00 PM',
      location: '0.6 miles away',
      participants: 8
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-forest-600 via-forest-500 to-earth-500 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/8633077/pexels-photo-8633077.jpeg?auto=compress&cs=tinysrgb&w=1200')] bg-cover bg-center opacity-30"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-6 animate-fade-in leading-tight">
              Connect with Your
              <span className="block text-earth-200 mt-2">Neighborhood Community</span>
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl mb-8 text-forest-100 animate-slide-up max-w-3xl mx-auto leading-relaxed">
              Discover holistic events, share spaces, and build meaningful connections within walking distance of home.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              {user ? (
                <>
                  <Link
                    to="/map"
                    className="w-full sm:w-auto bg-gradient-to-r from-earth-400 to-earth-500 hover:from-earth-500 hover:to-earth-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                  >
                    <MapPin className="h-5 w-5" />
                    <span>Explore Your Neighborhood</span>
                  </Link>
                  <Link
                    to="/create-event"
                    className="w-full sm:w-auto bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2 hover:scale-105"
                  >
                    <Heart className="h-5 w-5" />
                    <span>Share Your Practice</span>
                  </Link>
                </>
              ) : (
                <button
                  onClick={() => openAuthModalGlobal('signin')}
                  className="w-full sm:w-auto bg-gradient-to-r from-earth-400 to-earth-500 hover:from-earth-500 hover:to-earth-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  <Heart className="h-5 w-5" />
                  <span>Join</span>
                </button>
              )}
            </div>

            {user && (
              <div className="mb-12">
                <RadiusSelector />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-center">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-200">
                <div className="flex justify-center mb-4">
                  <Users className="h-8 w-8 text-earth-200" />
                </div>
                <h3 className="text-xl font-semibold mb-2">127 Neighbors</h3>
                <p className="text-forest-100 text-sm">Active in your 1-mile radius</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-200">
                <div className="flex justify-center mb-4">
                  <Calendar className="h-8 w-8 text-earth-200" />
                </div>
                <h3 className="text-xl font-semibold mb-2">23 Events</h3>
                <p className="text-forest-100 text-sm">This week in your area</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-200">
                <div className="flex justify-center mb-4">
                  <Clock className="h-8 w-8 text-earth-200" />
                </div>
                <h3 className="text-xl font-semibold mb-2">8 min walk</h3>
                <p className="text-forest-100 text-sm">Average distance to events</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Today's Events */}
      {user && (
        <section className="py-12 sm:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-12">
              <div className="mb-4 sm:mb-0">
                <h2 className="text-2xl sm:text-3xl font-bold text-forest-800 mb-2">Today's Events</h2>
                <p className="text-forest-600">Happening now in your neighborhood</p>
              </div>
              <Link
                to="/map"
                className="text-earth-500 hover:text-earth-600 font-medium flex items-center space-x-1 transition-colors group"
              >
                <span>View all</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
              {todayEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Holistic Categories */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-forest-50 to-earth-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-forest-800 mb-4">Explore Holistic Practices</h2>
            <p className="text-forest-600 text-lg max-w-2xl mx-auto">
              Discover wellness, creativity, and growth opportunities in your community
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {holisticCategories.map(({ icon: Icon, name, color, count }) => (
              <div
                key={name}
                className="bg-white rounded-2xl p-4 sm:p-6 text-center hover:shadow-lg transition-all duration-300 transform hover:scale-105 group border border-forest-50 cursor-pointer"
                onClick={() => user ? null : openAuthModalGlobal('signup')}
              >
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl mx-auto mb-3 sm:mb-4 flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
                  <Icon className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>
                <h3 className="font-semibold text-forest-800 mb-1 text-sm sm:text-base">{name}</h3>
                <p className="text-xs sm:text-sm text-forest-600">{count} events</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Weekly Regulars */}
      {user && (
        <section className="py-12 sm:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-12">
              <div className="mb-4 sm:mb-0">
                <h2 className="text-2xl sm:text-3xl font-bold text-forest-800 mb-2">Weekly Regulars</h2>
                <p className="text-forest-600">Ongoing community gatherings you can join</p>
              </div>
              <Link
                to="/activities"
                className="text-earth-500 hover:text-earth-600 font-medium flex items-center space-x-1 transition-colors group"
              >
                <span>View schedule</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {weeklyRegulars.map((regular, index) => (
                <div key={index} className="bg-gradient-to-br from-forest-50 to-earth-50 rounded-2xl p-6 hover:shadow-md transition-all duration-200 border border-forest-100/50">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-forest-800 text-lg leading-tight">{regular.title}</h3>
                    <Star className="h-5 w-5 text-earth-400 fill-current flex-shrink-0 ml-2" />
                  </div>
                  <p className="text-forest-600 mb-2 font-medium">{regular.facilitator}</p>
                  <p className="text-forest-700 font-semibold mb-2">{regular.time}</p>
                  <p className="text-forest-600 mb-4">{regular.location}</p>
                  <div className="flex items-center text-sm text-forest-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{regular.participants} regular participants</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Community Impact */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-forest-600 to-earth-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Building Stronger Communities</h2>
            <p className="text-forest-100 text-lg max-w-2xl mx-auto">
              Every connection made, every skill shared, every space opened strengthens our neighborhood fabric
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 text-center mb-12">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20">
              <div className="text-2xl sm:text-3xl font-bold mb-2">847</div>
              <div className="text-forest-100 text-sm sm:text-base">Neighbor connections made</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20">
              <div className="text-2xl sm:text-3xl font-bold mb-2">1,230</div>
              <div className="text-forest-100 text-sm sm:text-base">Hours of community time</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20">
              <div className="text-2xl sm:text-3xl font-bold mb-2">156</div>
              <div className="text-forest-100 text-sm sm:text-base">Spaces shared with neighbors</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20">
              <div className="text-2xl sm:text-3xl font-bold mb-2">$2,340</div>
              <div className="text-forest-100 text-sm sm:text-base">Community donations raised</div>
            </div>
          </div>

          <div className="text-center">
            {user ? (
              <Link
                to="/profile"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-earth-400 to-earth-500 hover:from-earth-500 hover:to-earth-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <HandHeart className="h-5 w-5" />
                <span>View Your Impact</span>
              </Link>
            ) : (
              <button
                onClick={() => openAuthModalGlobal('signup')}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-earth-400 to-earth-500 hover:from-earth-500 hover:to-earth-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <HandHeart className="h-5 w-5" />
                <span>Join</span>
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;