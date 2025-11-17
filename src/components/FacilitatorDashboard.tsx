import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Clock, Plus, Trash2, Edit, Save, X, AlertCircle, Loader2 } from 'lucide-react';
import {
  getFacilitatorAvailability,
  saveFacilitatorAvailability,
  deleteFacilitatorAvailability,
  getFacilitatorServiceAreas,
  addFacilitatorServiceArea,
  removeFacilitatorServiceArea,
  getFacilitatorWhitelists,
  addFacilitatorWhitelist,
  removeFacilitatorWhitelist,
  type FacilitatorAvailability,
  type FacilitatorServiceArea,
  type FacilitatorWhitelist,
  type AvailabilityType,
  type WhitelistType
} from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { logger, logError } from '../lib/logger';

interface FacilitatorDashboardProps {
  facilitatorId: string;
}

type TabType = 'availability' | 'areas' | 'whitelist';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
];

export const FacilitatorDashboard: React.FC<FacilitatorDashboardProps> = ({ facilitatorId }) => {
  const [activeTab, setActiveTab] = useState<TabType>('availability');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Availability state
  const [availability, setAvailability] = useState<FacilitatorAvailability[]>([]);
  const [showAddAvailability, setShowAddAvailability] = useState(false);
  const [newAvailability, setNewAvailability] = useState({
    type: 'recurring' as AvailabilityType,
    day_of_week: 1,
    specific_date: '',
    start_time: '09:00',
    end_time: '17:00',
    notes: ''
  });

  // Service areas state
  const [serviceAreas, setServiceAreas] = useState<FacilitatorServiceArea[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Array<{ id: string; name: string; city: string }>>([]);
  const [showAddArea, setShowAddArea] = useState(false);
  const [newArea, setNewArea] = useState({
    neighborhood_id: '',
    max_distance_miles: 10,
    priority: 3
  });

  // Whitelist state
  const [whitelists, setWhitelists] = useState<FacilitatorWhitelist[]>([]);
  const [showAddWhitelist, setShowAddWhitelist] = useState(false);
  const [whitelistSearch, setWhitelistSearch] = useState('');
  const [whitelistType, setWhitelistType] = useState<'user' | 'space'>('user');
  const [newWhitelist, setNewWhitelist] = useState({
    type: 'preferred' as WhitelistType,
    target_id: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
    loadNeighborhoods();
  }, [facilitatorId, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'availability') {
        const { data, error } = await getFacilitatorAvailability(facilitatorId);
        if (error) throw error;
        setAvailability(data || []);
      } else if (activeTab === 'areas') {
        const { data, error } = await getFacilitatorServiceAreas(facilitatorId);
        if (error) throw error;
        setServiceAreas(data || []);
      } else if (activeTab === 'whitelist') {
        const { data, error } = await getFacilitatorWhitelists(facilitatorId);
        if (error) throw error;
        setWhitelists(data || []);
      }
    } catch (err) {
      logError(err as Error, 'loadData');
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadNeighborhoods = async () => {
    try {
      const { data, error } = await supabase
        .from('neighborhoods')
        .select('id, name, city')
        .order('name');

      if (error) throw error;
      setNeighborhoods(data || []);
    } catch (err) {
      logError(err as Error, 'loadNeighborhoods');
    }
  };

  const handleAddAvailability = async () => {
    try {
      setError(null);

      const availabilityData: any = {
        facilitator_id: facilitatorId,
        availability_type: newAvailability.type,
        is_available: true,
        start_time: newAvailability.start_time,
        end_time: newAvailability.end_time,
        notes: newAvailability.notes || undefined
      };

      if (newAvailability.type === 'recurring') {
        availabilityData.day_of_week = newAvailability.day_of_week;
      } else {
        availabilityData.specific_date = newAvailability.specific_date;
      }

      const { error } = await saveFacilitatorAvailability(availabilityData);
      if (error) throw error;

      await loadData();
      setShowAddAvailability(false);
      setNewAvailability({
        type: 'recurring',
        day_of_week: 1,
        specific_date: '',
        start_time: '09:00',
        end_time: '17:00',
        notes: ''
      });

      logger.log('Availability added successfully');
    } catch (err) {
      logError(err as Error, 'handleAddAvailability');
      setError('Failed to add availability');
    }
  };

  const handleDeleteAvailability = async (id: string) => {
    if (!confirm('Delete this availability slot?')) return;

    try {
      setError(null);
      const { error } = await deleteFacilitatorAvailability(id);
      if (error) throw error;

      await loadData();
      logger.log('Availability deleted');
    } catch (err) {
      logError(err as Error, 'handleDeleteAvailability');
      setError('Failed to delete availability');
    }
  };

  const handleAddServiceArea = async () => {
    if (!newArea.neighborhood_id) {
      setError('Please select a neighborhood');
      return;
    }

    try {
      setError(null);

      const { error } = await addFacilitatorServiceArea({
        facilitator_id: facilitatorId,
        neighborhood_id: newArea.neighborhood_id,
        max_distance_miles: newArea.max_distance_miles,
        priority: newArea.priority
      });

      if (error) throw error;

      await loadData();
      setShowAddArea(false);
      setNewArea({
        neighborhood_id: '',
        max_distance_miles: 10,
        priority: 3
      });

      logger.log('Service area added');
    } catch (err) {
      logError(err as Error, 'handleAddServiceArea');
      setError('Failed to add service area');
    }
  };

  const handleRemoveServiceArea = async (id: string) => {
    if (!confirm('Remove this service area?')) return;

    try {
      setError(null);
      const { error } = await removeFacilitatorServiceArea(id);
      if (error) throw error;

      await loadData();
      logger.log('Service area removed');
    } catch (err) {
      logError(err as Error, 'handleRemoveServiceArea');
      setError('Failed to remove service area');
    }
  };

  const handleAddWhitelist = async () => {
    if (!newWhitelist.target_id) {
      setError('Please select a user or space');
      return;
    }

    try {
      setError(null);

      const whitelistData: any = {
        facilitator_id: facilitatorId,
        whitelist_type: newWhitelist.type,
        notes: newWhitelist.notes || undefined
      };

      if (whitelistType === 'user') {
        whitelistData.whitelisted_user_id = newWhitelist.target_id;
      } else {
        whitelistData.whitelisted_space_id = newWhitelist.target_id;
      }

      const { error } = await addFacilitatorWhitelist(whitelistData);
      if (error) throw error;

      await loadData();
      setShowAddWhitelist(false);
      setWhitelistSearch('');
      setNewWhitelist({
        type: 'preferred',
        target_id: '',
        notes: ''
      });

      logger.log('Whitelist entry added');
    } catch (err) {
      logError(err as Error, 'handleAddWhitelist');
      setError('Failed to add whitelist entry');
    }
  };

  const handleRemoveWhitelist = async (id: string) => {
    if (!confirm('Remove this whitelist entry?')) return;

    try {
      setError(null);
      const { error } = await removeFacilitatorWhitelist(id);
      if (error) throw error;

      await loadData();
      logger.log('Whitelist entry removed');
    } catch (err) {
      logError(err as Error, 'handleRemoveWhitelist');
      setError('Failed to remove whitelist entry');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Facilitator Dashboard</h2>
        <p className="text-gray-600 mt-1">
          Manage your availability, service areas, and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('availability')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'availability'
              ? 'border-forest text-forest'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Clock className="w-4 h-4 inline mr-2" />
          Availability
        </button>
        <button
          onClick={() => setActiveTab('areas')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'areas'
              ? 'border-forest text-forest'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <MapPin className="w-4 h-4 inline mr-2" />
          Service Areas
        </button>
        <button
          onClick={() => setActiveTab('whitelist')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'whitelist'
              ? 'border-forest text-forest'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Preferences
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-forest animate-spin" />
        </div>
      ) : (
        <>
          {/* Availability Tab */}
          {activeTab === 'availability' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Your Availability</h3>
                <button
                  onClick={() => setShowAddAvailability(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-forest text-white rounded-lg font-medium hover:bg-forest/90"
                >
                  <Plus className="w-4 h-4" />
                  Add Availability
                </button>
              </div>

              {availability.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No availability set</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Add your weekly schedule or specific dates
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availability.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {slot.availability_type === 'recurring'
                            ? DAYS_OF_WEEK.find(d => d.value === slot.day_of_week)?.label
                            : new Date(slot.specific_date!).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {slot.start_time} - {slot.end_time}
                        </p>
                        {slot.notes && (
                          <p className="text-sm text-gray-500 mt-1">{slot.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteAvailability(slot.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Availability Modal */}
              {showAddAvailability && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-xl max-w-md w-full p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      Add Availability
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Type
                        </label>
                        <select
                          value={newAvailability.type}
                          onChange={(e) => setNewAvailability({ ...newAvailability, type: e.target.value as AvailabilityType })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                        >
                          <option value="recurring">Weekly Schedule</option>
                          <option value="one_time">Specific Date</option>
                          <option value="blocked">Block Time</option>
                        </select>
                      </div>

                      {newAvailability.type === 'recurring' ? (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Day of Week
                          </label>
                          <select
                            value={newAvailability.day_of_week}
                            onChange={(e) => setNewAvailability({ ...newAvailability, day_of_week: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                          >
                            {DAYS_OF_WEEK.map(day => (
                              <option key={day.value} value={day.value}>{day.label}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date
                          </label>
                          <input
                            type="date"
                            value={newAvailability.specific_date}
                            onChange={(e) => setNewAvailability({ ...newAvailability, specific_date: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Start Time
                          </label>
                          <input
                            type="time"
                            value={newAvailability.start_time}
                            onChange={(e) => setNewAvailability({ ...newAvailability, start_time: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            End Time
                          </label>
                          <input
                            type="time"
                            value={newAvailability.end_time}
                            onChange={(e) => setNewAvailability({ ...newAvailability, end_time: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes (Optional)
                        </label>
                        <textarea
                          value={newAvailability.notes}
                          onChange={(e) => setNewAvailability({ ...newAvailability, notes: e.target.value })}
                          rows={2}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent resize-none"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => setShowAddAvailability(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddAvailability}
                        className="flex-1 px-4 py-2 bg-forest text-white rounded-lg font-medium hover:bg-forest/90"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Service Areas Tab */}
          {activeTab === 'areas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Service Areas</h3>
                <button
                  onClick={() => setShowAddArea(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-forest text-white rounded-lg font-medium hover:bg-forest/90"
                >
                  <Plus className="w-4 h-4" />
                  Add Area
                </button>
              </div>

              {serviceAreas.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No service areas set</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Add neighborhoods where you're willing to facilitate
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {serviceAreas.map((area) => (
                    <div key={area.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {area.neighborhood?.name}, {area.neighborhood?.city}
                        </p>
                        <p className="text-sm text-gray-600">
                          Up to {area.max_distance_miles} miles • Priority: {area.priority}/5
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveServiceArea(area.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Service Area Modal */}
              {showAddArea && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-xl max-w-md w-full p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      Add Service Area
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Neighborhood
                        </label>
                        <select
                          value={newArea.neighborhood_id}
                          onChange={(e) => setNewArea({ ...newArea, neighborhood_id: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                        >
                          <option value="">Select a neighborhood</option>
                          {neighborhoods.map(n => (
                            <option key={n.id} value={n.id}>
                              {n.name}, {n.city}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Distance (miles)
                        </label>
                        <input
                          type="number"
                          value={newArea.max_distance_miles}
                          onChange={(e) => setNewArea({ ...newArea, max_distance_miles: parseFloat(e.target.value) })}
                          min="1"
                          max="100"
                          step="1"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Priority (1-5, higher = more preferred)
                        </label>
                        <input
                          type="number"
                          value={newArea.priority}
                          onChange={(e) => setNewArea({ ...newArea, priority: parseInt(e.target.value) })}
                          min="1"
                          max="5"
                          step="1"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => setShowAddArea(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddServiceArea}
                        className="flex-1 px-4 py-2 bg-forest text-white rounded-lg font-medium hover:bg-forest/90"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Whitelist Tab */}
          {activeTab === 'whitelist' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Relationship Preferences</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage preferred or blocked users and spaces
                  </p>
                </div>
                <button
                  onClick={() => setShowAddWhitelist(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-forest text-white rounded-lg font-medium hover:bg-forest/90"
                >
                  <Plus className="w-4 h-4" />
                  Add Preference
                </button>
              </div>

              {whitelists.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No preferences set</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Add preferred or blocked users and spaces
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {whitelists.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">
                            {entry.whitelisted_user?.full_name || entry.whitelisted_space?.name}
                          </p>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            entry.whitelist_type === 'preferred' ? 'bg-green-100 text-green-700' :
                            entry.whitelist_type === 'exclusive' ? 'bg-blue-100 text-blue-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {entry.whitelist_type}
                          </span>
                        </div>
                        {entry.notes && (
                          <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveWhitelist(entry.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Whitelist Modal - Implementation simplified for now */}
              {showAddWhitelist && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-xl max-w-md w-full p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      Add Preference
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Type
                        </label>
                        <select
                          value={newWhitelist.type}
                          onChange={(e) => setNewWhitelist({ ...newWhitelist, type: e.target.value as WhitelistType })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                        >
                          <option value="preferred">Preferred (high priority)</option>
                          <option value="exclusive">Exclusive (only work with these)</option>
                          <option value="blocked">Blocked (won't work with)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes (Optional)
                        </label>
                        <textarea
                          value={newWhitelist.notes}
                          onChange={(e) => setNewWhitelist({ ...newWhitelist, notes: e.target.value })}
                          placeholder="Reason for this preference..."
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent resize-none"
                        />
                      </div>

                      <p className="text-sm text-gray-500">
                        User/space search will be added in next update
                      </p>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => setShowAddWhitelist(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
