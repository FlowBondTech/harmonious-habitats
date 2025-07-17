import React, { useState, useEffect } from 'react';
import { X, Plus, Home, Edit, Eye, Trash2, Calendar, MapPin, Users, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Space } from '../lib/supabase';

interface SpaceManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CreateSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

const CreateSpaceModal: React.FC<CreateSpaceModalProps> = ({ isOpen, onClose, onSubmit }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Create New Space</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>
          <p className="text-gray-600 mb-6">
            This will redirect you to the full space creation form where you can add all the details for your new space.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSubmit();
                window.location.href = '/share-space';
              }}
              className="px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors"
            >
              Continue to Form
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SpaceManagementModal: React.FC<SpaceManagementModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadSpaces();
    }
  }, [isOpen, user]);

  const loadSpaces = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('spaces')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSpaces(data || []);
    } catch (error) {
      console.error('Error loading spaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50';
      case 'pending_approval': return 'text-yellow-600 bg-yellow-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Active';
      case 'pending_approval': return 'Pending Review';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-forest-100 rounded-lg">
                <Home className="h-6 w-6 text-forest-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Manage Your Spaces</h2>
                <p className="text-sm text-gray-600">Create and manage your shared spaces</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 border-2 border-forest-600/30 border-t-forest-600 rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Create New Space Button */}
                <div className="mb-6">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center space-x-2 px-4 py-3 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Create New Space</span>
                  </button>
                </div>

                {/* Spaces List */}
                {spaces.length === 0 ? (
                  <div className="text-center py-12">
                    <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No spaces yet</h3>
                    <p className="text-gray-600 mb-6">Create your first space to start sharing with the community</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Create Your First Space</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {spaces.map((space) => (
                      <div key={space.id} className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{space.name}</h3>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(space.status)}`}>
                                {getStatusText(space.status)}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <MapPin className="h-4 w-4" />
                                <span>{space.address}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Users className="h-4 w-4" />
                                <span>Capacity: {space.capacity}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Home className="h-4 w-4" />
                                <span className="capitalize">{space.type.replace('_', ' ')}</span>
                              </div>
                            </div>

                            {space.description && (
                              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{space.description}</p>
                            )}

                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>Created: {new Date(space.created_at).toLocaleDateString()}</span>
                              {space.verified && (
                                <div className="flex items-center space-x-1 text-green-600">
                                  <Star className="h-4 w-4 fill-current" />
                                  <span>Verified</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit Space"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="View Bookings"
                            >
                              <Calendar className="h-4 w-4" />
                            </button>
                            <button
                              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Space"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Create Space Modal */}
      <CreateSpaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={() => setShowCreateModal(false)}
      />
    </>
  );
};