import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  MapPin, 
  Shield, 
  Plus, 
  Search,
  Lock,
  Sparkles,
  Home,
  UserCheck,
  Globe,
  Filter
} from 'lucide-react';
import { useAuthContext } from '../components/AuthProvider';
import { 
  getNeighborhoods, 
  getUserNeighborhoods,
  Neighborhood,
  NeighborhoodMember
} from '../lib/supabase';
import { LoadingSpinner } from '../components/LoadingStates';

const Neighborhoods = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuthContext();
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [userMemberships, setUserMemberships] = useState<NeighborhoodMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyMember, setShowOnlyMember] = useState(false);

  useEffect(() => {
    loadNeighborhoods();
    if (user) {
      loadUserMemberships();
    }
  }, [user]);

  const loadNeighborhoods = async () => {
    try {
      const { data, error } = await getNeighborhoods({ is_active: true });
      if (error) throw error;
      setNeighborhoods(data || []);
    } catch (error) {
      console.error('Error loading neighborhoods:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserMemberships = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await getUserNeighborhoods(user.id);
      if (error) throw error;
      setUserMemberships(data || []);
    } catch (error) {
      console.error('Error loading user memberships:', error);
    }
  };

  const isMemberOf = (neighborhoodId: string) => {
    return userMemberships.some(m => m.neighborhood_id === neighborhoodId);
  };

  const getMembershipStatus = (neighborhoodId: string) => {
    const membership = userMemberships.find(m => m.neighborhood_id === neighborhoodId);
    return membership?.status;
  };

  const filteredNeighborhoods = neighborhoods.filter(n => {
    if (searchQuery && !n.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    if (showOnlyMember && !isMemberOf(n.id)) {
      return false;
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading neighborhoods..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      <div className="container-responsive py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-forest-800">Neighborhoods</h1>
            {profile?.neighborhood_premium && (
              <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 rounded-lg">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">Premium Member</span>
              </div>
            )}
          </div>
          <p className="text-forest-600">
            Connect with your local community and discover neighborhood-exclusive events and spaces
          </p>
        </div>

        {/* Premium Banner for non-premium users */}
        {!profile?.neighborhood_premium && (
          <div className="mb-6 p-6 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Lock className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-amber-900 mb-2">
                  Unlock Premium Neighborhoods
                </h3>
                <p className="text-amber-700 mb-4">
                  Get verified access to your local neighborhood, connect with real neighbors, 
                  and discover hyperlocal events and spaces exclusive to your community.
                </p>
                <button className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                  Upgrade to Premium
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search neighborhoods..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
              />
            </div>
            
            {user && userMemberships.length > 0 && (
              <button
                onClick={() => setShowOnlyMember(!showOnlyMember)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  showOnlyMember 
                    ? 'bg-forest-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <Filter className="h-4 w-4" />
                My Neighborhoods
              </button>
            )}
          </div>
        </div>

        {/* Neighborhoods Grid */}
        {filteredNeighborhoods.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNeighborhoods.map((neighborhood) => {
              const memberStatus = getMembershipStatus(neighborhood.id);
              const isMember = memberStatus === 'verified' || memberStatus === 'invited';
              
              return (
                <div
                  key={neighborhood.id}
                  onClick={() => navigate(`/neighborhoods/${neighborhood.slug}`)}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
                >
                  {/* Neighborhood Header Image */}
                  <div className="h-48 bg-gradient-to-br from-forest-400 to-earth-500 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Home className="h-16 w-16 text-white/30" />
                    </div>
                    
                    {/* Status Badge */}
                    {memberStatus && (
                      <div className="absolute top-4 right-4">
                        {memberStatus === 'verified' && (
                          <div className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white rounded-full text-sm">
                            <UserCheck className="h-3 w-3" />
                            <span>Verified</span>
                          </div>
                        )}
                        {memberStatus === 'invited' && (
                          <div className="flex items-center space-x-1 px-3 py-1 bg-blue-500 text-white rounded-full text-sm">
                            <UserCheck className="h-3 w-3" />
                            <span>Invited</span>
                          </div>
                        )}
                        {memberStatus === 'pending' && (
                          <div className="px-3 py-1 bg-yellow-500 text-white rounded-full text-sm">
                            Pending
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Premium Badge */}
                    {neighborhood.is_premium && (
                      <div className="absolute top-4 left-4">
                        <div className="flex items-center space-x-1 px-3 py-1 bg-amber-500 text-white rounded-full text-sm">
                          <Sparkles className="h-3 w-3" />
                          <span>Premium</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Neighborhood Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-forest-800 mb-2 group-hover:text-forest-900">
                      {neighborhood.name}
                    </h3>
                    
                    {neighborhood.description && (
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {neighborhood.description}
                      </p>
                    )}
                    
                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center text-gray-600">
                          <Users className="h-4 w-4 mr-1" />
                          <span>{neighborhood.member_count} members</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{neighborhood.radius_miles || 2} mi radius</span>
                        </div>
                      </div>
                      
                      {neighborhood.settings?.require_verification && (
                        <Shield className="h-4 w-4 text-forest-600" title="Verification Required" />
                      )}
                    </div>
                    
                    {/* Action Button */}
                    <div className="mt-4">
                      {!user ? (
                        <button className="w-full py-2 px-4 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                          Sign in to Join
                        </button>
                      ) : isMember ? (
                        <button className="w-full py-2 px-4 bg-forest-100 text-forest-700 rounded-lg text-sm font-medium">
                          View Community
                        </button>
                      ) : memberStatus === 'pending' ? (
                        <button className="w-full py-2 px-4 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium" disabled>
                          Verification Pending
                        </button>
                      ) : (
                        <button className="w-full py-2 px-4 bg-forest-600 hover:bg-forest-700 text-white rounded-lg text-sm font-medium transition-colors">
                          Request to Join
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Home className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No neighborhoods found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery 
                ? "Try adjusting your search criteria" 
                : "No neighborhoods have been created yet"}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="bg-forest-600 hover:bg-forest-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Neighborhoods;