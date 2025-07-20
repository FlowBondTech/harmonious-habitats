import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Users, 
  MapPin, 
  Shield, 
  Calendar,
  Home,
  UserCheck,
  UserPlus,
  Mail,
  AlertCircle,
  Lock,
  Sparkles,
  X,
  Check,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { useAuthContext } from '../components/AuthProvider';
import { 
  getNeighborhoodBySlug,
  getNeighborhoodMembers,
  getNeighborhoodEvents,
  getNeighborhoodSpaces,
  requestToJoinNeighborhood,
  inviteToNeighborhood,
  respondToInvite,
  Neighborhood,
  NeighborhoodMember,
  Event,
  Space
} from '../lib/supabase';
import { LoadingSpinner } from '../components/LoadingStates';
import { format } from 'date-fns';

const NeighborhoodDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuthContext();
  
  const [neighborhood, setNeighborhood] = useState<Neighborhood | null>(null);
  const [members, setMembers] = useState<NeighborhoodMember[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'events' | 'spaces'>('members');
  
  const currentUserMembership = members.find(m => m.user_id === user?.id);
  const isGateHolder = currentUserMembership?.is_gate_holder;
  const isMember = currentUserMembership?.status === 'verified' || currentUserMembership?.status === 'invited';
  const isPending = currentUserMembership?.status === 'pending';

  useEffect(() => {
    if (slug) {
      loadNeighborhoodData();
    }
  }, [slug, user]);

  const loadNeighborhoodData = async () => {
    if (!slug) return;
    
    try {
      setLoading(true);
      
      // Load neighborhood details
      const { data: neighborhoodData, error: neighborhoodError } = await getNeighborhoodBySlug(slug);
      if (neighborhoodError) throw neighborhoodError;
      if (!neighborhoodData) {
        navigate('/neighborhoods');
        return;
      }
      setNeighborhood(neighborhoodData);
      
      // Load members if user is a member
      if (user) {
        const { data: membersData, error: membersError } = await getNeighborhoodMembers(neighborhoodData.id);
        if (!membersError && membersData) {
          setMembers(membersData);
        }
      }
      
      // Load events and spaces
      const [eventsResult, spacesResult] = await Promise.all([
        getNeighborhoodEvents(neighborhoodData.id),
        getNeighborhoodSpaces(neighborhoodData.id)
      ]);
      
      if (eventsResult.data) setEvents(eventsResult.data);
      if (spacesResult.data) setSpaces(spacesResult.data);
      
    } catch (error) {
      console.error('Error loading neighborhood:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRequest = async () => {
    if (!user || !neighborhood) return;
    
    try {
      setSending(true);
      const { error } = await requestToJoinNeighborhood(neighborhood.id, user.id);
      if (error) throw error;
      
      // Reload data to show pending status
      await loadNeighborhoodData();
    } catch (error) {
      console.error('Error requesting to join:', error);
      alert('Failed to request membership. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!neighborhood || !isGateHolder) return;
    
    try {
      setSending(true);
      const { error } = await inviteToNeighborhood(
        neighborhood.id,
        inviteEmail,
        user!.id,
        inviteMessage
      );
      
      if (error) throw error;
      
      alert('Invitation sent successfully!');
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteMessage('');
    } catch (error) {
      console.error('Error sending invite:', error);
      alert('Failed to send invitation. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!currentUserMembership || currentUserMembership.status !== 'invited') return;
    
    try {
      setSending(true);
      const { error } = await respondToInvite(currentUserMembership.id, 'accept');
      if (error) throw error;
      
      await loadNeighborhoodData();
    } catch (error) {
      console.error('Error accepting invite:', error);
      alert('Failed to accept invitation. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading neighborhood..." />
      </div>
    );
  }

  if (!neighborhood) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Neighborhood not found</h2>
          <button
            onClick={() => navigate('/neighborhoods')}
            className="bg-forest-600 hover:bg-forest-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Back to Neighborhoods
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-forest-600 to-earth-600 text-white">
        <div className="container-responsive py-8">
          <button
            onClick={() => navigate('/neighborhoods')}
            className="flex items-center text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Neighborhoods
          </button>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{neighborhood.name}</h1>
                {neighborhood.is_premium && (
                  <div className="flex items-center space-x-1 px-3 py-1 bg-amber-500 text-white rounded-full text-sm">
                    <Sparkles className="h-3 w-3" />
                    <span>Premium</span>
                  </div>
                )}
              </div>
              
              {neighborhood.description && (
                <p className="text-white/80 mb-4 max-w-2xl">{neighborhood.description}</p>
              )}
              
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{neighborhood.member_count} members</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{neighborhood.radius_miles || 2} mile radius</span>
                </div>
                {neighborhood.settings?.require_verification && (
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 mr-1" />
                    <span>Verification Required</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-2 min-w-[200px]">
              {!user ? (
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors"
                >
                  Sign in to Join
                </button>
              ) : currentUserMembership?.status === 'invited' ? (
                <button
                  onClick={handleAcceptInvite}
                  disabled={sending}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  Accept Invitation
                </button>
              ) : isMember ? (
                <>
                  <div className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-500/20 text-green-100 rounded-lg">
                    <UserCheck className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {currentUserMembership?.status === 'verified' ? 'Verified Member' : 'Invited Member'}
                    </span>
                  </div>
                  {isGateHolder && (
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      Invite Someone
                    </button>
                  )}
                </>
              ) : isPending ? (
                <div className="flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-500/20 text-yellow-100 rounded-lg">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Verification Pending</span>
                </div>
              ) : neighborhood.is_premium && !profile?.neighborhood_premium ? (
                <button
                  onClick={() => navigate('/account?tab=premium')}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  Upgrade to Join
                </button>
              ) : (
                <button
                  onClick={handleJoinRequest}
                  disabled={sending}
                  className="px-6 py-3 bg-white hover:bg-gray-100 text-forest-700 rounded-lg font-medium transition-colors"
                >
                  Request to Join
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Premium Gate for Non-Premium Users */}
      {neighborhood.is_premium && !profile?.neighborhood_premium && !isMember && (
        <div className="container-responsive py-6">
          <div className="p-6 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Lock className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-amber-900 mb-2">
                  Premium Neighborhood
                </h3>
                <p className="text-amber-700 mb-4">
                  This is a premium neighborhood. Upgrade your account to request verification 
                  and join your local community.
                </p>
                <button
                  onClick={() => navigate('/account?tab=premium')}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Upgrade to Premium
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Tabs */}
      <div className="container-responsive py-6">
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-white rounded-lg shadow-sm p-1">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'members'
                ? 'bg-forest-600 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Members ({members.filter(m => m.status === 'verified' || m.status === 'invited').length})
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'events'
                ? 'bg-forest-600 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Events ({events.length})
          </button>
          <button
            onClick={() => setActiveTab('spaces')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'spaces'
                ? 'bg-forest-600 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Spaces ({spaces.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'members' && (
          <div>
            {!isMember ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Members Only
                </h3>
                <p className="text-gray-500">
                  Join this neighborhood to see who's in your community
                </p>
              </div>
            ) : members.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members
                  .filter(m => m.status === 'verified' || m.status === 'invited')
                  .map((member) => (
                    <div
                      key={member.id}
                      className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-forest-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-forest-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {member.profiles?.username || 'Community Member'}
                            </p>
                            {member.is_gate_holder && (
                              <span className="text-xs text-forest-600 font-medium">Gate Holder</span>
                            )}
                          </div>
                        </div>
                        
                        {member.status === 'invited' && (
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                            Invited
                          </span>
                        )}
                      </div>
                      
                      {member.invited_by && member.status === 'invited' && (
                        <p className="text-xs text-gray-500 mt-2">
                          Invited by {member.inviter?.username}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No members yet
                </h3>
                <p className="text-gray-500">
                  Be the first to join this neighborhood!
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div>
            {events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => navigate(`/events/${event.id}`)}
                    className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="h-32 bg-gradient-to-br from-forest-400 to-earth-500 flex items-center justify-center">
                      <Calendar className="h-8 w-8 text-white/50" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-1">{event.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {format(new Date(event.date), 'PPP')}
                      </p>
                      {event.neighborhood_only && (
                        <span className="text-xs px-2 py-1 bg-forest-100 text-forest-700 rounded-full">
                          Neighborhood Only
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No neighborhood events yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Events created by neighborhood members will appear here
                </p>
                {isMember && (
                  <button
                    onClick={() => navigate('/events/create')}
                    className="bg-forest-600 hover:bg-forest-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Create Event
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'spaces' && (
          <div>
            {spaces.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {spaces.map((space) => (
                  <div
                    key={space.id}
                    onClick={() => navigate(`/spaces/${space.slug}`)}
                    className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="h-32 bg-gradient-to-br from-earth-400 to-forest-500 flex items-center justify-center">
                      <Home className="h-8 w-8 text-white/50" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-1">{space.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{space.city}, {space.state_province}</p>
                      {space.neighborhood_only && (
                        <span className="text-xs px-2 py-1 bg-forest-100 text-forest-700 rounded-full">
                          Neighborhood Only
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <Home className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No neighborhood spaces yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Spaces shared by neighborhood members will appear here
                </p>
                {isMember && (
                  <button
                    onClick={() => navigate('/host')}
                    className="bg-forest-600 hover:bg-forest-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Share a Space
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Invite to Neighborhood</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleInvite}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                  placeholder="friend@example.com"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personal Message (Optional)
                </label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
                  placeholder="I'd like to invite you to join our neighborhood community..."
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span>
                    You have {(neighborhood.settings?.max_invites_per_member || 5) - (members.filter(m => m.invited_by === user?.id).length || 0)} invites remaining
                  </span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 px-4 py-2 bg-forest-600 hover:bg-forest-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Send Invite
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NeighborhoodDetail;