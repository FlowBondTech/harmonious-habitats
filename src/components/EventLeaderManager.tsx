import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, Edit, Trash2, Search, AlertCircle, Loader2, Check, X } from 'lucide-react';
import {
  getEventLeaders,
  addEventLeader,
  updateEventLeaderPermissions,
  removeEventLeader,
  type EventLeader
} from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { logger, logError } from '../lib/logger';

interface EventLeaderManagerProps {
  eventId: string;
  isOrganizer: boolean;
  onLeadersChange?: () => void;
}

interface LeaderWithProfile extends EventLeader {
  leader: {
    id: string;
    full_name: string;
    username?: string;
    avatar_url?: string;
  };
  added_by_profile?: {
    id: string;
    full_name: string;
    username?: string;
  };
}

interface UserSearchResult {
  id: string;
  full_name: string;
  username?: string;
  avatar_url?: string;
}

export const EventLeaderManager: React.FC<EventLeaderManagerProps> = ({
  eventId,
  isOrganizer,
  onLeadersChange
}) => {
  const [leaders, setLeaders] = useState<LeaderWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add leader state
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [permissions, setPermissions] = useState({
    can_edit_event: true,
    can_manage_facilitators: true,
    can_send_invites: true,
    can_manage_volunteers: true,
    can_view_participants: true,
    role: 'co-organizer'
  });
  const [adding, setAdding] = useState(false);

  // Edit permissions state
  const [editingLeaderId, setEditingLeaderId] = useState<string | null>(null);
  const [editPermissions, setEditPermissions] = useState<Partial<EventLeader>>({});
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadLeaders();
  }, [eventId]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadLeaders = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await getEventLeaders(eventId);
      if (fetchError) throw fetchError;

      setLeaders((data || []) as LeaderWithProfile[]);
    } catch (err) {
      logError(err as Error, 'loadLeaders');
      setError('Failed to load event leaders');
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    try {
      setSearching(true);

      const { data, error: searchError } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
        .limit(10);

      if (searchError) throw searchError;

      // Filter out users who are already leaders
      const existingLeaderIds = leaders.map(l => l.leader_id);
      const filtered = (data || []).filter(u => !existingLeaderIds.includes(u.id));

      setSearchResults(filtered);
    } catch (err) {
      logError(err as Error, 'searchUsers');
    } finally {
      setSearching(false);
    }
  };

  const handleAddLeader = async () => {
    if (!selectedUser) return;

    try {
      setAdding(true);
      setError(null);

      const { error: addError } = await addEventLeader(
        eventId,
        selectedUser.id,
        permissions
      );

      if (addError) throw addError;

      // Reload leaders
      await loadLeaders();

      // Reset form
      setShowAddModal(false);
      setSelectedUser(null);
      setSearchQuery('');
      setSearchResults([]);
      setPermissions({
        can_edit_event: true,
        can_manage_facilitators: true,
        can_send_invites: true,
        can_manage_volunteers: true,
        can_view_participants: true,
        role: 'co-organizer'
      });

      if (onLeadersChange) onLeadersChange();
      logger.log('Event leader added successfully');
    } catch (err) {
      logError(err as Error, 'handleAddLeader');
      setError('Failed to add event leader');
    } finally {
      setAdding(false);
    }
  };

  const handleUpdatePermissions = async (leaderId: string) => {
    try {
      setUpdating(true);
      setError(null);

      const { error: updateError } = await updateEventLeaderPermissions(
        leaderId,
        editPermissions
      );

      if (updateError) throw updateError;

      // Reload leaders
      await loadLeaders();

      // Reset edit state
      setEditingLeaderId(null);
      setEditPermissions({});

      if (onLeadersChange) onLeadersChange();
      logger.log('Leader permissions updated');
    } catch (err) {
      logError(err as Error, 'handleUpdatePermissions');
      setError('Failed to update permissions');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveLeader = async (leaderId: string, leaderName: string) => {
    if (!confirm(`Remove ${leaderName} as event leader?`)) return;

    try {
      setError(null);

      const { error: removeError } = await removeEventLeader(leaderId);
      if (removeError) throw removeError;

      // Reload leaders
      await loadLeaders();

      if (onLeadersChange) onLeadersChange();
      logger.log('Event leader removed');
    } catch (err) {
      logError(err as Error, 'handleRemoveLeader');
      setError('Failed to remove event leader');
    }
  };

  const startEditing = (leader: LeaderWithProfile) => {
    setEditingLeaderId(leader.id);
    setEditPermissions({
      can_edit_event: leader.can_edit_event,
      can_manage_facilitators: leader.can_manage_facilitators,
      can_send_invites: leader.can_send_invites,
      can_manage_volunteers: leader.can_manage_volunteers,
      can_view_participants: leader.can_view_participants,
      role: leader.role
    });
  };

  if (!isOrganizer) {
    return null; // Only organizers can manage leaders
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-forest animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Event Leaders</h3>
          <p className="text-sm text-gray-600 mt-1">
            Co-organizers who can help manage this event
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-forest text-white rounded-lg font-medium hover:bg-forest/90 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add Leader
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Leaders List */}
      <div className="space-y-3">
        {leaders.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No event leaders added yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Add co-organizers to help manage this event
            </p>
          </div>
        ) : (
          leaders.map((leader) => (
            <div key={leader.id} className="border border-gray-200 rounded-lg p-4">
              {/* Leader Info */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  {leader.leader.avatar_url ? (
                    <img
                      src={leader.leader.avatar_url}
                      alt={leader.leader.full_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-forest/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-forest">
                        {leader.leader.full_name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {leader.leader.full_name}
                    </h4>
                    <p className="text-sm text-gray-600">{leader.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {editingLeaderId === leader.id ? (
                    <>
                      <button
                        onClick={() => handleUpdatePermissions(leader.id)}
                        disabled={updating}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Save changes"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingLeaderId(null);
                          setEditPermissions({});
                        }}
                        disabled={updating}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditing(leader)}
                        className="p-2 text-forest hover:bg-forest/10 rounded-lg transition-colors"
                        title="Edit permissions"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveLeader(leader.id, leader.leader.full_name)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove leader"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Permissions */}
              {editingLeaderId === leader.id ? (
                <div className="space-y-2 pl-13">
                  <input
                    type="text"
                    value={editPermissions.role || ''}
                    onChange={(e) => setEditPermissions({ ...editPermissions, role: e.target.value })}
                    placeholder="Role (e.g., co-organizer)"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                  />
                  {[
                    { key: 'can_edit_event', label: 'Edit event details' },
                    { key: 'can_manage_facilitators', label: 'Manage facilitators' },
                    { key: 'can_send_invites', label: 'Send invitations' },
                    { key: 'can_manage_volunteers', label: 'Manage volunteers' },
                    { key: 'can_view_participants', label: 'View participants' }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={editPermissions[key as keyof typeof editPermissions] as boolean}
                        onChange={(e) => setEditPermissions({ ...editPermissions, [key]: e.target.checked })}
                        className="w-4 h-4 text-forest border-gray-300 rounded focus:ring-forest"
                      />
                      <span className="text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 pl-13">
                  {leader.can_edit_event && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                      Edit Event
                    </span>
                  )}
                  {leader.can_manage_facilitators && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
                      Facilitators
                    </span>
                  )}
                  {leader.can_send_invites && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                      Invites
                    </span>
                  )}
                  {leader.can_manage_volunteers && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-100 px-2 py-1 rounded-full">
                      Volunteers
                    </span>
                  )}
                  {leader.can_view_participants && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
                      Participants
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Leader Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Add Event Leader
            </h3>

            {/* User Search */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search for user
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or username..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                />
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-lg divide-y">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setSelectedUser(user);
                        setSearchResults([]);
                        setSearchQuery('');
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.full_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-forest/10 flex items-center justify-center">
                          <span className="text-xs font-semibold text-forest">
                            {user.full_name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{user.full_name}</p>
                        {user.username && (
                          <p className="text-sm text-gray-600">@{user.username}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected User */}
              {selectedUser && (
                <div className="mt-3 p-3 bg-forest/5 border border-forest/20 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selectedUser.avatar_url ? (
                      <img
                        src={selectedUser.avatar_url}
                        alt={selectedUser.full_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-forest/10 flex items-center justify-center">
                        <span className="text-xs font-semibold text-forest">
                          {selectedUser.full_name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{selectedUser.full_name}</p>
                      {selectedUser.username && (
                        <p className="text-sm text-gray-600">@{selectedUser.username}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Role */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <input
                type="text"
                value={permissions.role}
                onChange={(e) => setPermissions({ ...permissions, role: e.target.value })}
                placeholder="e.g., co-organizer, facilitator lead"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
              />
            </div>

            {/* Permissions */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Permissions
              </label>
              <div className="space-y-2">
                {[
                  { key: 'can_edit_event', label: 'Edit event details', desc: 'Modify title, description, time, location, etc.' },
                  { key: 'can_manage_facilitators', label: 'Manage facilitators', desc: 'Invite and manage event facilitators' },
                  { key: 'can_send_invites', label: 'Send invitations', desc: 'Invite participants to the event' },
                  { key: 'can_manage_volunteers', label: 'Manage volunteers', desc: 'Coordinate volunteer assignments' },
                  { key: 'can_view_participants', label: 'View participants', desc: 'See who has registered for the event' }
                ].map(({ key, label, desc }) => (
                  <label key={key} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                    <input
                      type="checkbox"
                      checked={permissions[key as keyof typeof permissions] as boolean}
                      onChange={(e) => setPermissions({ ...permissions, [key]: e.target.checked })}
                      className="w-4 h-4 mt-0.5 text-forest border-gray-300 rounded focus:ring-forest"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{label}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedUser(null);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                disabled={adding}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLeader}
                disabled={!selectedUser || adding}
                className="flex-1 px-4 py-2 bg-forest text-white rounded-lg font-medium hover:bg-forest/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {adding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Leader'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
