import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Star,
  UserCheck,
  X,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthContext } from './AuthProvider';
import Avatar from './Avatar';

interface Practitioner {
  practitioner_id: string;
  role: 'lead' | 'support' | 'assistant';
  responsibilities: string;
  is_confirmed: boolean;
  confirmed_at: string | null;
  full_name: string;
  avatar_url: string | null;
  is_facilitator: boolean;
}

interface EventPractitionerManagerProps {
  eventId: string;
  organizerId: string;
  isOpen: boolean;
  onClose: () => void;
}

const EventPractitionerManager: React.FC<EventPractitionerManagerProps> = ({
  eventId,
  organizerId,
  isOpen,
  onClose
}) => {
  const { user } = useAuthContext();
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [availableFacilitators, setAvailableFacilitators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addMode, setAddMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'lead' | 'support' | 'assistant'>('support');
  const [selectedPractitioner, setSelectedPractitioner] = useState('');
  const [responsibilities, setResponsibilities] = useState('');

  useEffect(() => {
    if (isOpen && eventId) {
      loadPractitioners();
      loadAvailableFacilitators();
    }
  }, [isOpen, eventId]);

  const loadPractitioners = async () => {
    try {
      const { data, error } = await supabase
        .from('event_practitioners')
        .select(`
          *,
          practitioner:profiles!event_practitioners_practitioner_id_fkey(
            id,
            full_name,
            avatar_url,
            is_facilitator
          )
        `)
        .eq('event_id', eventId)
        .order('role');

      if (error) throw error;

      const formattedData = data?.map(item => ({
        practitioner_id: item.practitioner_id,
        role: item.role,
        responsibilities: item.responsibilities,
        is_confirmed: item.is_confirmed,
        confirmed_at: item.confirmed_at,
        full_name: item.practitioner?.full_name || 'Unknown',
        avatar_url: item.practitioner?.avatar_url,
        is_facilitator: item.practitioner?.is_facilitator || false
      })) || [];

      setPractitioners(formattedData);
    } catch (error) {
      console.error('Error loading practitioners:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableFacilitators = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, is_facilitator')
        .eq('is_facilitator', true)
        .order('full_name');

      if (error) throw error;

      // Filter out already assigned practitioners
      const assigned = practitioners.map(p => p.practitioner_id);
      const available = data?.filter(f => !assigned.includes(f.id)) || [];
      setAvailableFacilitators(available);
    } catch (error) {
      console.error('Error loading facilitators:', error);
    }
  };

  const addPractitioner = async () => {
    if (!selectedPractitioner) return;

    try {
      const { data, error } = await supabase.rpc('add_event_practitioner', {
        p_event_id: eventId,
        p_practitioner_id: selectedPractitioner,
        p_role: selectedRole,
        p_responsibilities: responsibilities || null
      });

      if (error) throw error;

      if (data?.success) {
        await loadPractitioners();
        await loadAvailableFacilitators();
        setAddMode(false);
        setSelectedPractitioner('');
        setResponsibilities('');
        setSelectedRole('support');
      }
    } catch (error) {
      console.error('Error adding practitioner:', error);
    }
  };

  const removePractitioner = async (practitionerId: string) => {
    try {
      const { error } = await supabase
        .from('event_practitioners')
        .delete()
        .eq('event_id', eventId)
        .eq('practitioner_id', practitionerId);

      if (error) throw error;

      await loadPractitioners();
      await loadAvailableFacilitators();
    } catch (error) {
      console.error('Error removing practitioner:', error);
    }
  };

  const updateRole = async (practitionerId: string, newRole: 'lead' | 'support' | 'assistant') => {
    try {
      const { error } = await supabase
        .from('event_practitioners')
        .update({ role: newRole })
        .eq('event_id', eventId)
        .eq('practitioner_id', practitionerId);

      if (error) throw error;

      await loadPractitioners();
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'lead':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'support':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'assistant':
        return <UserCheck className="h-4 w-4 text-gray-500" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'lead':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'support':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'assistant':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!isOpen) return null;

  const isOrganizer = user?.id === organizerId;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="relative w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-forest-600 to-earth-500 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Users className="h-6 w-6" />
                <h2 className="text-xl font-semibold">Event Practitioners</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-white/80 text-sm">
              Manage practitioners for this event - assign lead, support, and assistant roles
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {isOrganizer && (
              <div className="mb-6">
                {!addMode ? (
                  <button
                    onClick={() => setAddMode(true)}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Add Practitioner</span>
                  </button>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Practitioner
                        </label>
                        <select
                          value={selectedPractitioner}
                          onChange={(e) => setSelectedPractitioner(e.target.value)}
                          className="w-full p-2 border rounded-lg"
                        >
                          <option value="">Choose a practitioner...</option>
                          {availableFacilitators.map((facilitator) => (
                            <option key={facilitator.id} value={facilitator.id}>
                              {facilitator.full_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Role
                        </label>
                        <select
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value as any)}
                          className="w-full p-2 border rounded-lg"
                        >
                          <option value="lead">Lead Practitioner</option>
                          <option value="support">Support (Prep/Cleanup)</option>
                          <option value="assistant">Assistant</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Responsibilities (Optional)
                      </label>
                      <textarea
                        value={responsibilities}
                        onChange={(e) => setResponsibilities(e.target.value)}
                        placeholder="Describe specific responsibilities..."
                        className="w-full p-2 border rounded-lg"
                        rows={2}
                      />
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={addPractitioner}
                        disabled={!selectedPractitioner}
                        className="btn-primary"
                      >
                        Add Practitioner
                      </button>
                      <button
                        onClick={() => {
                          setAddMode(false);
                          setSelectedPractitioner('');
                          setResponsibilities('');
                        }}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Practitioners List */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  Loading practitioners...
                </div>
              ) : practitioners.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No practitioners assigned yet</p>
                </div>
              ) : (
                practitioners.map((practitioner) => (
                  <div
                    key={practitioner.practitioner_id}
                    className="bg-white border rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar
                          name={practitioner.full_name}
                          imageUrl={practitioner.avatar_url}
                          size="md"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">{practitioner.full_name}</p>
                            {false && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(practitioner.role)}`}>
                              {getRoleIcon(practitioner.role)}
                              <span className="capitalize">{practitioner.role}</span>
                            </span>
                            {practitioner.is_confirmed ? (
                              <span className="text-xs text-green-600 flex items-center space-x-1">
                                <CheckCircle className="h-3 w-3" />
                                <span>Confirmed</span>
                              </span>
                            ) : (
                              <span className="text-xs text-yellow-600 flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>Pending</span>
                              </span>
                            )}
                          </div>
                          {practitioner.responsibilities && (
                            <p className="text-sm text-gray-600 mt-2">
                              {practitioner.responsibilities}
                            </p>
                          )}
                        </div>
                      </div>

                      {isOrganizer && (
                        <div className="flex items-center space-x-2">
                          <select
                            value={practitioner.role}
                            onChange={(e) => updateRole(practitioner.practitioner_id, e.target.value as any)}
                            className="text-sm border rounded px-2 py-1"
                          >
                            <option value="lead">Lead</option>
                            <option value="support">Support</option>
                            <option value="assistant">Assistant</option>
                          </select>
                          <button
                            onClick={() => removePractitioner(practitioner.practitioner_id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">About Event Practitioners</p>
                  <ul className="space-y-1 list-disc list-inside text-blue-700">
                    <li><strong>Lead:</strong> Main facilitator who leads the activity</li>
                    <li><strong>Support:</strong> Helps with preparation, cleanliness, and cleanup</li>
                    <li><strong>Assistant:</strong> Additional support as needed</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPractitionerManager;