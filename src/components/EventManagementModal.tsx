import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  Edit, 
  Trash2, 
  MessageCircle, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Download,
  Mail,
  Phone,
  MoreVertical,
  UserCheck,
  UserX,
  Star,
  Badge
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { supabase, Event } from '../lib/supabase';

interface EventManagementModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

const EventManagementModal: React.FC<EventManagementModalProps> = ({
  event,
  isOpen,
  onClose,
  onUpdate
}) => {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('participants');
  const [participants, setParticipants] = useState<any[]>([]);
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (event && isOpen) {
      loadParticipants();
      loadWaitlist();
    }
  }, [event, isOpen]);

  const loadParticipants = async () => {
    if (!event) return;

    try {
      console.log("Loading participants for event", event.id);
      const { data } = await supabase
        .from('event_participants')
        .select(`
          *,
          user:profiles!event_participants_user_id_fkey(
            id, 
            full_name, 
            avatar_url, 
            verified, 
            username, 
            neighborhood,
            rating,
            total_reviews
          )
        `)
        .eq('event_id', event.id)
        .order('joined_at', { ascending: false });

      setParticipants(data || []);
    } catch (error) {
      console.error('Error loading participants:', error);
    }
  };

  const loadWaitlist = async () => {
    if (!event) return;

    console.log("Loading waitlist for event", event.id);
    try {
      const { data } = await supabase
        .from('event_waitlist')
        .select(`
          *,
          user:profiles!event_waitlist_user_id_fkey(
            id, 
            full_name, 
            avatar_url, 
            verified, 
            username, 
            neighborhood
          )
        `)
        .eq('event_id', event.id)
        .order('created_at', { ascending: true });

      setWaitlist(data || []);
    } catch (error) {
      console.error('Error loading waitlist:', error);
    }
  };

  const handleRemoveParticipant = async (userId: string) => {
    if (!event || !confirm('Are you sure you want to remove this participant?')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', event.id)
        .eq('user_id', userId);

      if (error) throw error;

      setSuccess('Participant removed successfully');
      await loadParticipants();
      onUpdate?.();
    } catch (err: any) {
      setError(err.message || 'Failed to remove participant');
    } finally {
      setLoading(false);
    }
  };

  const handlePromoteFromWaitlist = async (userId: string) => {
    if (!event) return;

    setLoading(true);
    try {
      // Add to participants
      const { error: addError } = await supabase
        .from('event_participants')
        .insert([{
          event_id: event.id,
          user_id: userId,
          status: 'confirmed'
        }]);

      if (addError) throw addError;

      // Update waitlist status
      const { error: updateError } = await supabase
        .from('event_waitlist')
        .update({ status: 'promoted' })
        .eq('event_id', event.id)
        .eq('user_id', userId);

      if (updateError) throw updateError;

      setSuccess('Participant promoted from waitlist');
      await Promise.all([loadParticipants(), loadWaitlist()]);
      onUpdate?.();
    } catch (err: any) {
      setError(err.message || 'Failed to promote participant');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEvent = async () => {
    if (!event || !confirm('Are you sure you want to cancel this event? This action cannot be undone.')) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('events')
        .update({ status: 'cancelled' })
        .eq('id', event.id);

      if (error) throw error;

      setSuccess('Event cancelled successfully');
      setTimeout(() => {
        onUpdate?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel event');
    } finally {
      setLoading(false);
    }
  };

  const exportParticipants = () => {
    if (!participants.length) return;

    const csvContent = [
      ['Name', 'Username', 'Neighborhood', 'Status', 'Joined Date', 'Rating'].join(','),
      ...participants.map(p => [
        p.user?.full_name || '',
        p.user?.username || '',
        p.user?.neighborhood || '',
        p.status,
        new Date(p.joined_at).toLocaleDateString(),
        p.user?.rating || '0'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event?.title}-participants.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const tabs = [
    { id: 'participants', label: 'Participants', count: participants.length },
    { id: 'waitlist', label: 'Waitlist', count: waitlist.length },
    { id: 'settings', label: 'Settings', count: null },
    { id: 'analytics', label: 'Analytics', count: null }
  ];

  if (!isOpen || !event) return null;

  const confirmedParticipants = participants.filter(p => p.status === 'confirmed');
  const cancelledParticipants = participants.filter(p => p.status === 'cancelled');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
          {/* Header */}
          <div className="bg-gradient-to-r from-forest-600 to-earth-500 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">Manage Event</h2>
                <h3 className="text-xl text-forest-100">{event.title}</h3>
                <div className="flex items-center space-x-4 mt-2 text-sm text-forest-100">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{event.start_time} - {event.end_time}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{confirmedParticipants.length}/{event.capacity}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          {success && (
            <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-600">{success}</p>
            </div>
          )}

          {/* Tabs */}
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
                  {tab.count !== null && (
                    <span className="ml-2 bg-forest-100 text-forest-600 py-1 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 max-h-96 overflow-y-auto">
            {/* Participants Tab */}
            {activeTab === 'participants' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-forest-800">
                    Event Participants ({confirmedParticipants.length})
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={exportParticipants}
                      className="flex items-center space-x-2 bg-forest-100 text-forest-700 hover:bg-forest-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>Export</span>
                    </button>
                    <button className="flex items-center space-x-2 bg-earth-100 text-earth-700 hover:bg-earth-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      <Mail className="h-4 w-4" />
                      <span>Message All</span>
                    </button>
                  </div>
                </div>

                {confirmedParticipants.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-forest-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-forest-800 mb-2">No participants yet</h3>
                    <p className="text-forest-600">Share your event to get people excited!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {confirmedParticipants.map((participant) => (
                      <div key={participant.user_id} className="bg-forest-50 rounded-xl p-4 hover:bg-forest-100 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <img
                              src={participant.user?.avatar_url || "https://images.pexels.com/photos/3772622/pexels-photo-3772622.jpeg?auto=compress&cs=tinysrgb&w=100"}
                              alt={participant.user?.full_name || 'Participant'}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-semibold text-forest-800">
                                  {participant.user?.full_name || 'Community Member'}
                                </h4>
                                {participant.user?.verified && (
                                  <Badge className="h-4 w-4 text-forest-600" />
                                )}
                              </div>
                              <p className="text-sm text-forest-600">
                                @{participant.user?.username || 'member'} • {participant.user?.neighborhood || 'Local'}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <div className="flex items-center space-x-1">
                                  <Star className="h-3 w-3 text-earth-400 fill-current" />
                                  <span className="text-xs text-forest-600">
                                    {participant.user?.rating?.toFixed(1) || '0.0'} ({participant.user?.total_reviews || 0})
                                  </span>
                                </div>
                                <span className="text-xs text-forest-500">
                                  Joined {formatDate(participant.joined_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              className="p-2 text-forest-600 hover:bg-white/60 rounded-lg transition-colors"
                              title="Message participant"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRemoveParticipant(participant.user_id)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="Remove participant"
                            >
                              <UserX className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Cancelled Participants */}
                {cancelledParticipants.length > 0 && (
                  <div className="mt-8">
                    <h4 className="text-md font-semibold text-forest-800 mb-4">
                      Cancelled ({cancelledParticipants.length})
                    </h4>
                    <div className="space-y-2">
                      {cancelledParticipants.map((participant) => (
                        <div key={participant.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <img
                              src={participant.user?.avatar_url || "https://images.pexels.com/photos/3772622/pexels-photo-3772622.jpeg?auto=compress&cs=tinysrgb&w=100"}
                              alt={participant.user?.full_name || 'Participant'}
                              className="w-8 h-8 rounded-full object-cover opacity-60"
                            />
                            <div>
                              <p className="font-medium text-gray-600">
                                {participant.user?.full_name || 'Community Member'}
                              </p>
                              <p className="text-sm text-gray-500">Cancelled</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Waitlist Tab */}
            {activeTab === 'waitlist' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-forest-800">
                    Waitlist ({waitlist.filter(w => w.status === 'pending').length})
                  </h3>
                  <p className="text-sm text-forest-600">
                    People waiting for spots to open up
                  </p>
                </div>

                {waitlist.filter(w => w.status === 'pending').length === 0 ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="h-16 w-16 text-forest-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-forest-800 mb-2">No one on waitlist</h3>
                    <p className="text-forest-600">When your event fills up, interested people will be added here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {waitlist.filter(w => w.status === 'pending').map((waitlistEntry, index) => (
                      <div key={waitlistEntry.user_id} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className="bg-yellow-100 text-yellow-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <img
                            src={waitlistEntry.user?.avatar_url || "https://images.pexels.com/photos/3772622/pexels-photo-3772622.jpeg?auto=compress&cs=tinysrgb&w=100"}
                            alt={waitlistEntry.user?.full_name || 'Participant'}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <h4 className="font-semibold text-forest-800">
                              {waitlistEntry.user?.full_name || 'Community Member'}
                            </h4>
                            <p className="text-sm text-forest-600">
                              Joined waitlist {formatDate(waitlistEntry.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handlePromoteFromWaitlist(waitlistEntry.user_id)}
                            disabled={confirmedParticipants.length >= event.capacity}
                            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            <UserCheck className="h-4 w-4" />
                            <span>Promote</span>
                          </button>
                          <button className="p-2 text-forest-600 hover:bg-white/60 rounded-lg transition-colors">
                            <MessageCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-forest-800">Event Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-forest-50 rounded-xl p-4">
                      <h4 className="font-semibold text-forest-800 mb-2">Edit Event</h4>
                      <p className="text-sm text-forest-600 mb-3">Update event details, time, or location</p>
                      <button className="flex items-center space-x-2 bg-forest-600 hover:bg-forest-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        <Edit className="h-4 w-4" />
                        <span>Edit Event</span>
                      </button>
                    </div>

                    <div className="bg-earth-50 rounded-xl p-4">
                      <h4 className="font-semibold text-forest-800 mb-2">Duplicate Event</h4>
                      <p className="text-sm text-forest-600 mb-3">Create a copy of this event for future dates</p>
                      <button className="flex items-center space-x-2 bg-earth-600 hover:bg-earth-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        <Calendar className="h-4 w-4" />
                        <span>Duplicate</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-xl p-4">
                      <h4 className="font-semibold text-forest-800 mb-2">Event Status</h4>
                      <p className="text-sm text-forest-600 mb-3">Current status: <span className="font-medium capitalize">{event.status}</span></p>
                      <div className="flex space-x-2">
                        {event.status === 'active' && (
                          <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                            <CheckCircle className="h-4 w-4" />
                            <span>Mark Complete</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <h4 className="font-semibold text-red-800 mb-2">Danger Zone</h4>
                      <p className="text-sm text-red-600 mb-3">Cancel this event. This action cannot be undone.</p>
                      <button
                        onClick={handleCancelEvent}
                        className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Cancel Event</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-forest-800">Event Analytics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-forest-50 rounded-xl p-6 text-center">
                    <div className="text-3xl font-bold text-forest-800 mb-2">{confirmedParticipants.length}</div>
                    <div className="text-sm text-forest-600">Confirmed Participants</div>
                  </div>
                  
                  <div className="bg-yellow-50 rounded-xl p-6 text-center">
                    <div className="text-3xl font-bold text-yellow-800 mb-2">{waitlist.length}</div>
                    <div className="text-sm text-yellow-600">Waitlist Size</div>
                  </div>
                  
                  <div className="bg-blue-50 rounded-xl p-6 text-center">
                    <div className="text-3xl font-bold text-blue-800 mb-2">
                      {event.capacity > 0 ? Math.round((confirmedParticipants.length / event.capacity) * 100) : 0}%
                    </div>
                    <div className="text-sm text-blue-600">Capacity Filled</div>
                  </div>
                </div>

                <div className="bg-white border border-forest-100 rounded-xl p-6">
                  <h4 className="font-semibold text-forest-800 mb-4">Registration Timeline</h4>
                  <div className="space-y-3">
                    {participants.slice(0, 5).map((participant, index) => (
                      <div key={participant.user_id} className="flex items-center justify-between py-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-forest-500 rounded-full"></div>
                          <span className="text-sm text-forest-700">
                            {participant.user?.full_name || 'Community Member'} joined
                          </span>
                        </div>
                        <span className="text-xs text-forest-500">
                          {formatDate(participant.joined_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventManagementModal;