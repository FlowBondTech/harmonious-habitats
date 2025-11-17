import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, Clock, DollarSign, UserCheck, AlertCircle, Loader2 } from 'lucide-react';
import { getAvailableFacilitators, inviteFacilitatorToEvent, type AvailableFacilitator, type CompensationType } from '../lib/supabase';
import { logger, logError } from '../lib/logger';

interface FacilitatorSelectorProps {
  eventId: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  latitude?: number;
  longitude?: number;
  onInviteSent?: (facilitatorId: string) => void;
}

interface InviteFormData {
  role: string;
  compensationType: CompensationType;
  compensationAmount: string;
  compensationNotes: string;
}

export const FacilitatorSelector: React.FC<FacilitatorSelectorProps> = ({
  eventId,
  eventDate,
  startTime,
  endTime,
  latitude,
  longitude,
  onInviteSent
}) => {
  const [facilitators, setFacilitators] = useState<AvailableFacilitator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAvailable, setFilterAvailable] = useState(true);
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'availability'>('availability');

  // Invitation state
  const [selectedFacilitator, setSelectedFacilitator] = useState<AvailableFacilitator | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState<InviteFormData>({
    role: 'Facilitator',
    compensationType: 'volunteer',
    compensationAmount: '',
    compensationNotes: ''
  });
  const [sendingInvite, setSendingInvite] = useState(false);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFacilitators();
  }, [eventDate, startTime, endTime, latitude, longitude]);

  const loadFacilitators = async () => {
    if (!latitude || !longitude) {
      setError('Event location is required to find facilitators');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await getAvailableFacilitators(
        eventDate,
        startTime,
        endTime,
        latitude,
        longitude,
        50 // Get more results for filtering
      );

      if (fetchError) throw fetchError;
      setFacilitators(data || []);
    } catch (err) {
      logError(err as Error, 'loadFacilitators');
      setError('Failed to load facilitators. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async () => {
    if (!selectedFacilitator) return;

    try {
      setSendingInvite(true);
      setError(null);

      const { error: inviteError } = await inviteFacilitatorToEvent(
        eventId,
        selectedFacilitator.facilitator_id,
        {
          role: inviteForm.role,
          compensation_type: inviteForm.compensationType,
          compensation_amount: inviteForm.compensationAmount ? parseFloat(inviteForm.compensationAmount) : undefined,
          compensation_notes: inviteForm.compensationNotes || undefined
        }
      );

      if (inviteError) throw inviteError;

      // Mark as invited
      setInvitedIds(prev => new Set(prev).add(selectedFacilitator.facilitator_id));

      // Close modal and reset form
      setShowInviteModal(false);
      setSelectedFacilitator(null);
      setInviteForm({
        role: 'Facilitator',
        compensationType: 'volunteer',
        compensationAmount: '',
        compensationNotes: ''
      });

      // Notify parent
      if (onInviteSent) {
        onInviteSent(selectedFacilitator.facilitator_id);
      }

      logger.log('Facilitator invitation sent successfully');
    } catch (err) {
      logError(err as Error, 'handleSendInvite');
      setError('Failed to send invitation. Please try again.');
    } finally {
      setSendingInvite(false);
    }
  };

  // Filter and sort facilitators
  const filteredFacilitators = facilitators
    .filter(f => {
      // Filter by search query
      if (searchQuery && !f.full_name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Filter by availability
      if (filterAvailable && !f.is_available) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return a.distance_miles - b.distance_miles;
        case 'rating':
          return b.average_rating - a.average_rating;
        case 'availability':
          // Available first, then by rating, then by distance
          if (a.is_available !== b.is_available) {
            return a.is_available ? -1 : 1;
          }
          if (Math.abs(a.average_rating - b.average_rating) > 0.1) {
            return b.average_rating - a.average_rating;
          }
          return a.distance_miles - b.distance_miles;
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-forest animate-spin" />
        <span className="ml-3 text-gray-600">Finding facilitators...</span>
      </div>
    );
  }

  if (!latitude || !longitude) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
          <div>
            <h3 className="font-medium text-yellow-900">Location Required</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Please set an event location to find available facilitators in your area.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Find Facilitators</h3>
        <p className="text-sm text-gray-600 mt-1">
          Browse and invite facilitators for your event. Sorted by availability, ratings, and distance.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
        >
          <option value="availability">Best Match</option>
          <option value="rating">Highest Rated</option>
          <option value="distance">Nearest</option>
        </select>

        <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="checkbox"
            checked={filterAvailable}
            onChange={(e) => setFilterAvailable(e.target.checked)}
            className="w-4 h-4 text-forest border-gray-300 rounded focus:ring-forest"
          />
          <span className="text-sm text-gray-700">Available only</span>
        </label>
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

      {/* Facilitator List */}
      <div className="space-y-3">
        {filteredFacilitators.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">
              {searchQuery || !filterAvailable
                ? 'No facilitators match your filters'
                : 'No available facilitators found for this time slot'}
            </p>
            {filterAvailable && (
              <button
                onClick={() => setFilterAvailable(false)}
                className="mt-3 text-sm text-forest hover:text-forest/80 font-medium"
              >
                Show unavailable facilitators
              </button>
            )}
          </div>
        ) : (
          filteredFacilitators.map((facilitator) => {
            const isInvited = invitedIds.has(facilitator.facilitator_id);

            return (
              <div
                key={facilitator.facilitator_id}
                className={`border rounded-lg p-4 transition-all ${
                  facilitator.is_available
                    ? 'border-forest/20 bg-forest/5'
                    : 'border-gray-200 bg-gray-50 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Name and Status */}
                    <div className="flex items-center gap-3 mb-2">
                      {facilitator.avatar_url ? (
                        <img
                          src={facilitator.avatar_url}
                          alt={facilitator.full_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-forest/10 flex items-center justify-center">
                          <span className="text-lg font-semibold text-forest">
                            {facilitator.full_name.charAt(0)}
                          </span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {facilitator.full_name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          {facilitator.is_available ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3" />
                              Available
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-200 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3" />
                              Unavailable
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {/* Rating */}
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">
                          {facilitator.average_rating > 0
                            ? facilitator.average_rating.toFixed(1)
                            : 'New'}
                        </span>
                        {facilitator.total_reviews > 0 && (
                          <span className="text-gray-500">
                            ({facilitator.total_reviews})
                          </span>
                        )}
                      </div>

                      {/* Distance */}
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{facilitator.distance_miles.toFixed(1)} mi</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div>
                    {isInvited ? (
                      <button
                        disabled
                        className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg font-medium cursor-not-allowed"
                      >
                        Invited
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedFacilitator(facilitator);
                          setShowInviteModal(true);
                        }}
                        className="px-4 py-2 bg-forest text-white rounded-lg font-medium hover:bg-forest/90 transition-colors"
                      >
                        Invite
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && selectedFacilitator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Invite {selectedFacilitator.full_name}
            </h3>

            <div className="space-y-4">
              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <input
                  type="text"
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  placeholder="e.g., Lead Facilitator, Assistant, Workshop Leader"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                />
              </div>

              {/* Compensation Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Compensation Type
                </label>
                <select
                  value={inviteForm.compensationType}
                  onChange={(e) => setInviteForm({ ...inviteForm, compensationType: e.target.value as CompensationType })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                >
                  <option value="volunteer">Volunteer</option>
                  <option value="paid">Paid</option>
                  <option value="donation">Donation-based</option>
                  <option value="exchange">Exchange/Barter</option>
                </select>
              </div>

              {/* Compensation Amount (if paid) */}
              {inviteForm.compensationType === 'paid' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount ($)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={inviteForm.compensationAmount}
                      onChange={(e) => setInviteForm({ ...inviteForm, compensationAmount: e.target.value })}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={inviteForm.compensationNotes}
                  onChange={(e) => setInviteForm({ ...inviteForm, compensationNotes: e.target.value })}
                  placeholder="Any additional details about the role or compensation..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setSelectedFacilitator(null);
                }}
                disabled={sendingInvite}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendInvite}
                disabled={sendingInvite}
                className="flex-1 px-4 py-2 bg-forest text-white rounded-lg font-medium hover:bg-forest/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sendingInvite ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Invitation'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
