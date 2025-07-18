import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserX, 
  UserCheck, 
  MoreVertical,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import Modal from './Modal';

interface Participant {
  user_id: string;
  event_id: string;
  status: 'registered' | 'waitlisted' | 'cancelled' | 'attended' | 'no_show' | 'rejected';
  registered_at: string;
  rejected_at?: string;
  rejected_by?: string;
  rejection_reason?: string;
  reinstated_at?: string;
  reinstated_by?: string;
  profiles: {
    id: string;
    full_name: string;
    avatar_url?: string;
    email?: string;
    bio?: string;
  };
}

interface EventParticipantManagementProps {
  eventId: string;
  organizerId: string;
  isOpen: boolean;
  onClose: () => void;
}

const EventParticipantManagement: React.FC<EventParticipantManagementProps> = ({
  eventId,
  organizerId,
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'registered' | 'waitlisted' | 'rejected'>('all');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isOpen && user?.id === organizerId) {
      loadParticipants();
    }
  }, [isOpen, eventId, user, organizerId]);

  const loadParticipants = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('event_participants')
        .select(`
          *,
          profiles:user_id (
            id,
            full_name,
            avatar_url,
            email,
            bio
          )
        `)
        .eq('event_id', eventId)
        .order('registered_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading participants:', error);
        return;
      }

      setParticipants(data || []);
    } catch (error) {
      console.error('Error loading participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectParticipant = async () => {
    if (!selectedParticipant || !user || processing) return;

    setProcessing(true);
    try {
      const { error } = await supabase.rpc('reject_participant', {
        p_event_id: eventId,
        p_user_id: selectedParticipant.user_id,
        p_rejected_by: user.id,
        p_reason: rejectionReason.trim() || null
      });

      if (error) {
        console.error('Error rejecting participant:', error);
        return;
      }

      // Update local state
      setParticipants(prev =>
        prev.map(p =>
          p.user_id === selectedParticipant.user_id
            ? {
                ...p,
                status: 'rejected' as const,
                rejected_at: new Date().toISOString(),
                rejected_by: user.id,
                rejection_reason: rejectionReason.trim() || undefined
              }
            : p
        )
      );

      setShowRejectModal(false);
      setSelectedParticipant(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting participant:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleReinstateParticipant = async (participant: Participant) => {
    if (!user || processing) return;

    setProcessing(true);
    try {
      const { error } = await supabase.rpc('reinstate_participant', {
        p_event_id: eventId,
        p_user_id: participant.user_id,
        p_reinstated_by: user.id
      });

      if (error) {
        console.error('Error reinstating participant:', error);
        return;
      }

      // Update local state
      setParticipants(prev =>
        prev.map(p =>
          p.user_id === participant.user_id
            ? {
                ...p,
                status: 'registered' as const,
                reinstated_at: new Date().toISOString(),
                reinstated_by: user.id
              }
            : p
        )
      );
    } catch (error) {
      console.error('Error reinstating participant:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'registered':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'waitlisted':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'attended':
        return <UserCheck className="h-4 w-4 text-blue-600" />;
      case 'no_show':
        return <UserX className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'registered':
        return 'bg-green-100 text-green-800';
      case 'waitlisted':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'attended':
        return 'bg-blue-100 text-blue-800';
      case 'no_show':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  if (!isOpen || user?.id !== organizerId) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Manage Participants"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'registered', label: 'Registered' },
                { key: 'waitlisted', label: 'Waitlisted' },
                { key: 'rejected', label: 'Rejected' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => {
                    setFilter(key as any);
                    loadParticipants();
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === key
                      ? 'bg-forest-600 text-white'
                      : 'bg-forest-100 text-forest-700 hover:bg-forest-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={loadParticipants}
              className="p-2 text-forest-600 hover:bg-forest-50 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>

          {/* Participants List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-600"></div>
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No participants found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {participants.map((participant) => (
                <div
                  key={participant.user_id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-forest-300 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      {participant.profiles.avatar_url ? (
                        <img
                          src={participant.profiles.avatar_url}
                          alt={participant.profiles.full_name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-forest-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-forest-600" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {participant.profiles.full_name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        Registered {new Date(participant.registered_at).toLocaleDateString()}
                      </p>
                      {participant.rejected_at && (
                        <p className="text-xs text-red-600 mt-1">
                          Rejected on {new Date(participant.rejected_at).toLocaleDateString()}
                          {participant.rejection_reason && `: ${participant.rejection_reason}`}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(participant.status)}`}>
                      {getStatusIcon(participant.status)}
                      <span className="ml-1">{formatStatus(participant.status)}</span>
                    </span>

                    {/* Action Menu */}
                    {participant.status !== 'cancelled' && participant.status !== 'attended' && participant.status !== 'no_show' && (
                      <div className="relative group">
                        <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          {participant.status === 'rejected' ? (
                            <button
                              onClick={() => handleReinstateParticipant(participant)}
                              className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors rounded-lg"
                            >
                              <UserCheck className="h-4 w-4 inline mr-2" />
                              Reinstate Participant
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedParticipant(participant);
                                setShowRejectModal(true);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-lg"
                            >
                              <UserX className="h-4 w-4 inline mr-2" />
                              Reject Participant
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Reject Participant Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedParticipant(null);
          setRejectionReason('');
        }}
        title="Reject Participant"
        maxWidth="max-w-md"
      >
        {selectedParticipant && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    Are you sure you want to reject <strong>{selectedParticipant.profiles.full_name}</strong> from this event?
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    They will be notified of this action.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (Optional)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide a reason for rejection..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedParticipant(null);
                  setRejectionReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectParticipant}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing...' : 'Reject Participant'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default EventParticipantManagement;