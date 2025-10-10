import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Check,
  X,
  Trash2,
  Mail,
  Clock,
  AlertCircle,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { supabase, EventFacilitator, FacilitatorRole, Profile } from '../lib/supabase';

interface EventFacilitatorManagerProps {
  eventId: string;
  isOrganizer: boolean;
}

const ROLE_LABELS: Record<FacilitatorRole, string> = {
  activity_lead: 'Activity Lead',
  co_facilitator: 'Co-Facilitator',
  preparer: 'Preparer',
  setup: 'Setup',
  cleaner: 'Cleaner',
  breakdown: 'Breakdown',
  post_event_cleanup: 'Post-Event Cleanup',
  helper: 'Helper'
};

const ROLE_COLORS: Record<FacilitatorRole, string> = {
  activity_lead: 'bg-purple-100 text-purple-800',
  co_facilitator: 'bg-blue-100 text-blue-800',
  preparer: 'bg-green-100 text-green-800',
  setup: 'bg-yellow-100 text-yellow-800',
  cleaner: 'bg-pink-100 text-pink-800',
  breakdown: 'bg-orange-100 text-orange-800',
  post_event_cleanup: 'bg-red-100 text-red-800',
  helper: 'bg-gray-100 text-gray-800'
};

export const EventFacilitatorManager: React.FC<EventFacilitatorManagerProps> = ({
  eventId,
  isOrganizer
}) => {
  const { user } = useAuthContext();
  const [facilitators, setFacilitators] = useState<EventFacilitator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadFacilitators();
  }, [eventId]);

  const loadFacilitators = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_event_facilitators', {
        p_event_id: eventId
      });

      if (error) throw error;
      setFacilitators(data || []);
    } catch (err) {
      console.error('Error loading facilitators:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, bio, is_available_facilitator')
        .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const inviteFacilitator = async (userId: string, role: FacilitatorRole, notes?: string) => {
    if (!user || !isOrganizer) return;

    try {
      setInviting(true);
      const { data, error } = await supabase.rpc('invite_event_facilitator', {
        p_event_id: eventId,
        p_user_id: userId,
        p_role: role,
        p_notes: notes || null
      });

      if (error) throw error;

      // Reload facilitators
      await loadFacilitators();
      setShowInviteModal(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err: any) {
      console.error('Error inviting facilitator:', err);
      alert(err.message || 'Failed to invite facilitator');
    } finally {
      setInviting(false);
    }
  };

  const removeFacilitator = async (facilitatorId: string) => {
    if (!isOrganizer) return;
    if (!confirm('Are you sure you want to remove this facilitator?')) return;

    try {
      const { error } = await supabase
        .from('event_facilitators')
        .update({ status: 'removed' })
        .eq('id', facilitatorId);

      if (error) throw error;
      await loadFacilitators();
    } catch (err) {
      console.error('Error removing facilitator:', err);
    }
  };

  const updateFacilitatorRole = async (facilitatorId: string, newRole: FacilitatorRole) => {
    if (!isOrganizer) return;

    try {
      const { error } = await supabase
        .from('event_facilitators')
        .update({ role: newRole })
        .eq('id', facilitatorId);

      if (error) throw error;
      await loadFacilitators();
    } catch (err) {
      console.error('Error updating role:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Check className="h-3 w-3 mr-1" />
            Confirmed
          </span>
        );
      case 'invited':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <X className="h-3 w-3 mr-1" />
            Declined
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-forest-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-forest-800 flex items-center space-x-2">
            <Users className="h-6 w-6" />
            <span>Event Facilitators</span>
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {facilitators.length} facilitator{facilitators.length !== 1 ? 's' : ''}
          </p>
        </div>

        {isOrganizer && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-forest-600 hover:bg-forest-700 text-white rounded-lg transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            <span>Invite Facilitator</span>
          </button>
        )}
      </div>

      {/* Facilitators List */}
      <div className="space-y-3">
        {facilitators.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No facilitators assigned yet</p>
            {isOrganizer && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="mt-4 text-forest-600 hover:text-forest-800 font-medium"
              >
                Invite your first facilitator
              </button>
            )}
          </div>
        ) : (
          facilitators.map((facilitator) => (
            <div
              key={facilitator.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {facilitator.user_avatar_url ? (
                      <img
                        src={facilitator.user_avatar_url}
                        alt={facilitator.user_full_name || 'User'}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-forest-100 flex items-center justify-center">
                        <span className="text-forest-700 font-semibold">
                          {facilitator.user_full_name?.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-lg font-medium text-gray-900">
                        {facilitator.user_full_name}
                      </h4>
                      {getStatusBadge(facilitator.status)}
                    </div>

                    <div className="flex items-center space-x-2 mt-1">
                      {/* Role Badge */}
                      {isOrganizer ? (
                        <select
                          value={facilitator.role}
                          onChange={(e) =>
                            updateFacilitatorRole(facilitator.id, e.target.value as FacilitatorRole)
                          }
                          className={`px-2 py-1 rounded-md text-xs font-medium border-0 ${
                            ROLE_COLORS[facilitator.role as FacilitatorRole]
                          }`}
                        >
                          {Object.entries(ROLE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-medium ${
                            ROLE_COLORS[facilitator.role as FacilitatorRole]
                          }`}
                        >
                          {ROLE_LABELS[facilitator.role as FacilitatorRole]}
                        </span>
                      )}
                    </div>

                    {facilitator.notes && (
                      <p className="text-sm text-gray-600 mt-2">{facilitator.notes}</p>
                    )}

                    {facilitator.user_bio && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {facilitator.user_bio}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {isOrganizer && (
                  <button
                    onClick={() => removeFacilitator(facilitator.id)}
                    className="ml-4 text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove facilitator"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-forest-800">Invite Facilitator</h3>
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search for a facilitator
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500"
                  />
                  {searching && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {searchResults.map((profile) => (
                    <InviteUserCard
                      key={profile.id}
                      profile={profile}
                      onInvite={inviteFacilitator}
                      inviting={inviting}
                      alreadyInvited={facilitators.some((f) => f.user_id === profile.id)}
                    />
                  ))}
                </div>
              )}

              {searchQuery && !searching && searchResults.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No users found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Invite User Card Component
const InviteUserCard: React.FC<{
  profile: Profile;
  onInvite: (userId: string, role: FacilitatorRole, notes?: string) => void;
  inviting: boolean;
  alreadyInvited: boolean;
}> = ({ profile, onInvite, inviting, alreadyInvited }) => {
  const [selectedRole, setSelectedRole] = useState<FacilitatorRole>('helper');
  const [notes, setNotes] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name || 'User'}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-forest-100 flex items-center justify-center">
              <span className="text-forest-700 font-semibold">
                {profile.full_name?.charAt(0) || '?'}
              </span>
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <p className="font-medium text-gray-900">{profile.full_name}</p>
              {profile.is_available_facilitator && (
                <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                  Active Facilitator
                </span>
              )}
            </div>
            {profile.bio && (
              <p className="text-sm text-gray-500 line-clamp-1">{profile.bio}</p>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="ml-2 text-gray-400 hover:text-gray-600"
        >
          <ChevronDown
            className={`h-5 w-5 transition-transform ${showDetails ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as FacilitatorRole)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500"
            >
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any specific responsibilities or notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500"
            />
          </div>

          <button
            onClick={() => onInvite(profile.id, selectedRole, notes)}
            disabled={inviting || alreadyInvited}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              alreadyInvited
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-forest-600 hover:bg-forest-700 text-white'
            }`}
          >
            {inviting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : alreadyInvited ? (
              <>
                <Check className="h-5 w-5" />
                <span>Already Invited</span>
              </>
            ) : (
              <>
                <Mail className="h-5 w-5" />
                <span>Send Invitation</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default EventFacilitatorManager;
