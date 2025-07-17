import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Calendar,
  Award,
  Shield,
  Search
} from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import { 
  getSpaceApplicationsForOwner, 
  updateSpaceApplication, 
  SpaceApplication 
} from '../lib/supabase';
import { logger } from '../lib/logger';
import { LoadingSpinner, LoadingButton } from './LoadingStates';

interface ApplicationManagementProps {
  ownerId?: string;
}

const ApplicationManagement: React.FC<ApplicationManagementProps> = ({ ownerId }) => {
  const { user } = useAuthContext();
  const [applications, setApplications] = useState<SpaceApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<SpaceApplication | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const targetOwnerId = ownerId || user?.id;

  const loadApplications = useCallback(async () => {
    if (!targetOwnerId) return;

    setLoading(true);
    try {
      const { data, error } = await getSpaceApplicationsForOwner(
        targetOwnerId, 
        filter === 'all' ? undefined : filter
      );

      if (error) {
        logger.error('Error loading applications:', error);
        return;
      }

      setApplications(data || []);
    } catch (error) {
      logger.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  }, [targetOwnerId, filter]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleApplicationAction = async (
    applicationId: string, 
    status: 'approved' | 'rejected',
    message?: string
  ) => {
    setActionLoading(applicationId);
    try {
      const { error } = await updateSpaceApplication(applicationId, {
        status,
        owner_response: {
          message: message || (status === 'approved' ? 'Your application has been approved!' : 'Thank you for your application.'),
          ...(status === 'approved' && {
            approved_terms: {
              donation_amount: selectedApplication?.space?.donation_suggested || '',
              schedule_constraints: 'Please coordinate scheduling in advance.',
              house_rules: selectedApplication?.space?.guidelines || ''
            }
          })
        }
      });

      if (error) {
        throw error;
      }

      // Refresh applications
      await loadApplications();
      setSelectedApplication(null);
    } catch (error) {
      logger.error('Error updating application:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredApplications = applications.filter(app => 
    searchQuery === '' || 
    app.facilitator?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.space?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.application_data?.event_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'withdrawn':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-8">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-forest-600 mt-4">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-forest-800">Application Management</h2>
          <p className="text-forest-600">Review and manage facilitator applications for your spaces</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex space-x-1 bg-forest-50 rounded-lg p-1">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-white text-forest-700 shadow-sm'
                    : 'text-forest-600 hover:text-forest-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status !== 'all' && (
                  <span className="ml-2 bg-forest-200 text-forest-700 px-2 py-0.5 rounded-full text-xs">
                    {applications.filter(app => app.status === status).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-forest-400" />
            <input
              type="text"
              placeholder="Search facilitators, spaces, or practices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {filteredApplications.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-16 w-16 text-forest-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-forest-800 mb-2">
              No applications {filter !== 'all' ? `with status "${filter}"` : ''}
            </h3>
            <p className="text-forest-600">
              {filter === 'pending' 
                ? "You don't have any pending applications to review."
                : "Applications will appear here when facilitators apply to use your spaces."
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-forest-100">
            {filteredApplications.map((application) => (
              <div
                key={application.id}
                className="p-6 hover:bg-forest-25 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Facilitator Avatar */}
                    <img
                      src={application.facilitator?.avatar_url || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100'}
                      alt={application.facilitator?.full_name || 'Facilitator'}
                      className="w-12 h-12 rounded-full object-cover border-2 border-forest-100"
                    />

                    <div className="flex-1 min-w-0">
                      {/* Header Info */}
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-forest-800">
                          {application.facilitator?.full_name || 'Unknown Facilitator'}
                        </h3>
                        {application.facilitator?.verified && (
                          <div className="flex items-center space-x-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                            <Shield className="h-3 w-3" />
                            <span>Verified</span>
                          </div>
                        )}
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                          {getStatusIcon(application.status)}
                          <span className="capitalize">{application.status}</span>
                        </div>
                      </div>

                      {/* Application Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div className="flex items-center space-x-2 text-sm text-forest-600">
                          <Calendar className="h-4 w-4 text-forest-500" />
                          <span>{application.application_data?.event_type || 'Unknown Practice'}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-forest-600">
                          <Users className="h-4 w-4 text-forest-500" />
                          <span>{application.application_data?.expected_attendance || 0} participants</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-forest-600">
                          <Clock className="h-4 w-4 text-forest-500" />
                          <span className="capitalize">
                            {application.application_data?.frequency?.replace('_', ' ') || 'Unknown frequency'}
                          </span>
                        </div>
                      </div>

                      {/* Space Info */}
                      <div className="flex items-center space-x-2 text-sm text-forest-600 mb-3">
                        <span className="font-medium">For space:</span>
                        <span>{application.space?.name || 'Unknown Space'}</span>
                      </div>

                      {/* Practice Description */}
                      {application.application_data?.practice_description && (
                        <p className="text-sm text-forest-600 mb-3 line-clamp-2">
                          {application.application_data.practice_description}
                        </p>
                      )}

                      {/* Experience & Insurance */}
                      <div className="flex items-center space-x-4 text-xs text-forest-500">
                        <div className="flex items-center space-x-1">
                          <Award className="h-3 w-3" />
                          <span>{application.application_data?.experience_years || 0} years experience</span>
                        </div>
                        {application.application_data?.insurance_confirmed && (
                          <div className="flex items-center space-x-1">
                            <Shield className="h-3 w-3" />
                            <span>Insured</span>
                          </div>
                        )}
                        <span>{formatDate(application.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedApplication(application)}
                      className="p-2 text-forest-600 hover:bg-forest-100 rounded-lg transition-colors"
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {application.status === 'pending' && (
                      <>
                        <LoadingButton
                          onClick={() => handleApplicationAction(application.id, 'approved')}
                          loading={actionLoading === application.id}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </LoadingButton>
                        <LoadingButton
                          onClick={() => handleApplicationAction(application.id, 'rejected')}
                          loading={actionLoading === application.id}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Decline
                        </LoadingButton>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Application Details Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-forest-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-forest-800">Application Details</h2>
                <p className="text-forest-600">Review facilitator application</p>
              </div>
              <button
                onClick={() => setSelectedApplication(null)}
                className="p-2 hover:bg-forest-50 rounded-lg transition-colors"
              >
                <XCircle className="h-5 w-5 text-forest-500" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="p-6 space-y-6">
                {/* Facilitator Info */}
                <div className="bg-forest-50 rounded-lg p-6">
                  <h3 className="font-semibold text-forest-800 mb-4">Facilitator Information</h3>
                  <div className="flex items-start space-x-4">
                    <img
                      src={selectedApplication.facilitator?.avatar_url || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100'}
                      alt={selectedApplication.facilitator?.full_name || 'Facilitator'}
                      className="w-16 h-16 rounded-full object-cover border-2 border-white"
                    />
                    <div>
                      <h4 className="text-lg font-semibold text-forest-800">
                        {selectedApplication.facilitator?.full_name || 'Unknown Facilitator'}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        {selectedApplication.facilitator?.verified && (
                          <div className="flex items-center space-x-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                            <Shield className="h-3 w-3" />
                            <span>Verified</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1 text-sm text-forest-600">
                          <Award className="h-4 w-4" />
                          <span>{selectedApplication.application_data?.experience_years || 0} years experience</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Practice Details */}
                <div>
                  <h3 className="font-semibold text-forest-800 mb-4">Practice Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-forest-700">Practice Type</label>
                      <p className="text-forest-800">{selectedApplication.application_data?.event_type || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-forest-700">Frequency</label>
                      <p className="text-forest-800 capitalize">
                        {selectedApplication.application_data?.frequency?.replace('_', ' ') || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-forest-700">Expected Participants</label>
                      <p className="text-forest-800">{selectedApplication.application_data?.expected_attendance || 0}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-forest-700">Insurance</label>
                      <p className={`${selectedApplication.application_data?.insurance_confirmed ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedApplication.application_data?.insurance_confirmed ? 'Confirmed' : 'Not confirmed'}
                      </p>
                    </div>
                  </div>

                  {selectedApplication.application_data?.practice_description && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-forest-700">Practice Description</label>
                      <p className="text-forest-800 mt-1">{selectedApplication.application_data.practice_description}</p>
                    </div>
                  )}
                </div>

                {/* Message to Owner */}
                {selectedApplication.application_data?.message_to_owner && (
                  <div>
                    <h3 className="font-semibold text-forest-800 mb-2">Message from Facilitator</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-forest-700">{selectedApplication.application_data.message_to_owner}</p>
                    </div>
                  </div>
                )}

                {/* Equipment & Requirements */}
                {selectedApplication.application_data?.equipment_needed && selectedApplication.application_data.equipment_needed.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-forest-800 mb-2">Equipment Needed</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedApplication.application_data.equipment_needed.map((item, index) => (
                        <span
                          key={index}
                          className="bg-forest-100 text-forest-700 px-3 py-1 rounded-full text-sm"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Space Information */}
                <div>
                  <h3 className="font-semibold text-forest-800 mb-4">Space Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-forest-800">{selectedApplication.space?.name}</h4>
                    <p className="text-forest-600 text-sm mt-1">{selectedApplication.space?.address}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-forest-600">
                      <span>Capacity: {selectedApplication.space?.capacity} people</span>
                      <span>Type: {selectedApplication.space?.type?.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            {selectedApplication.status === 'pending' && (
              <div className="p-6 border-t border-forest-100 flex justify-end space-x-3">
                <LoadingButton
                  onClick={() => handleApplicationAction(selectedApplication.id, 'rejected')}
                  loading={actionLoading === selectedApplication.id}
                  className="px-6 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Decline
                </LoadingButton>
                <LoadingButton
                  onClick={() => handleApplicationAction(selectedApplication.id, 'approved')}
                  loading={actionLoading === selectedApplication.id}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Application
                </LoadingButton>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationManagement;