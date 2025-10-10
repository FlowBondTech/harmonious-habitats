import React, { useState } from 'react';
import { Home, Clock, ChevronRight, Plus, Calendar, MapPin, Users, Star, CheckCircle, X, AlertCircle } from 'lucide-react';
import { useAuthContext } from './AuthProvider';
// TODO: Create these modal components
// import { HolderApplicationModal } from './HolderApplicationModal';
// import { SpaceManagementModal } from './SpaceManagementModal';
// import { TimeManagementModal } from './TimeManagementModal';

interface ShareTabProps {}

export const ShareTab: React.FC<ShareTabProps> = () => {
  const { profile } = useAuthContext();
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationType, setApplicationType] = useState<'space' | 'time' | 'both' | null>(null);
  const [showSpaceManagement, setShowSpaceManagement] = useState(false);
  const [showTimeManagement, setShowTimeManagement] = useState(false);

  const spaceStatus = profile?.holder_status?.space || 'none';
  const timeStatus = profile?.holder_status?.time || 'none';

  const handleApplyClick = (type: 'space' | 'time' | 'both') => {
    setApplicationType(type);
    setShowApplicationModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'rejected':
        return <X className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusMessage = (type: 'space' | 'time', status: string) => {
    const typeLabel = type === 'space' ? 'Space Holder' : 'Time Holder';
    
    switch (status) {
      case 'approved':
        return `You're an approved ${typeLabel}!`;
      case 'pending':
        return `Your ${typeLabel} application is under review`;
      case 'rejected':
        return `Your ${typeLabel} application was not approved`;
      default:
        return null;
    }
  };

  const canApply = (type: 'space' | 'time' | 'both') => {
    if (type === 'both') {
      return spaceStatus !== 'pending' && timeStatus !== 'pending';
    }
    const status = type === 'space' ? spaceStatus : timeStatus;
    return status === 'none' || status === 'rejected';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-forest-800 mb-3">Share with Your Community</h2>
          <p className="text-forest-600">
            Contribute to the holistic community by sharing your space for gatherings or your time for workshops, healing sessions, and classes.
          </p>
        </div>
      </div>

      {/* Main Selection */}
      {spaceStatus === 'none' && timeStatus === 'none' ? (
        // New user - show selection
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h3 className="text-lg font-semibold text-center text-forest-800 mb-8">
            What would you like to share?
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Share Space */}
            <button
              onClick={() => handleApplyClick('space')}
              className="group relative p-8 border-2 border-forest-200 rounded-xl hover:border-forest-400 hover:bg-forest-50 transition-all text-left"
            >
              <div className="absolute top-4 right-4">
                <ChevronRight className="h-5 w-5 text-forest-400 group-hover:text-forest-600 transition-colors" />
              </div>
              
              <div className="space-y-4">
                <div className="h-16 w-16 bg-forest-100 rounded-xl flex items-center justify-center">
                  <Home className="h-8 w-8 text-forest-600" />
                </div>
                
                <div>
                  <h4 className="text-xl font-semibold text-forest-800 mb-2">Share Your Space</h4>
                  <p className="text-forest-600">
                    Open your home, garden, or studio for community gatherings, workshops, and healing sessions.
                  </p>
                </div>
                
                <div className="space-y-2 text-sm text-forest-600">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-forest-500" />
                    <span>Set your own availability</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-forest-500" />
                    <span>Choose who can book</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-forest-500" />
                    <span>Optional donations</span>
                  </div>
                </div>
              </div>
            </button>

            {/* Share Time */}
            <button
              onClick={() => handleApplyClick('time')}
              className="group relative p-8 border-2 border-forest-200 rounded-xl hover:border-forest-400 hover:bg-forest-50 transition-all text-left"
            >
              <div className="absolute top-4 right-4">
                <ChevronRight className="h-5 w-5 text-forest-400 group-hover:text-forest-600 transition-colors" />
              </div>
              
              <div className="space-y-4">
                <div className="h-16 w-16 bg-forest-100 rounded-xl flex items-center justify-center">
                  <Clock className="h-8 w-8 text-forest-600" />
                </div>
                
                <div>
                  <h4 className="text-xl font-semibold text-forest-800 mb-2">Share Your Time</h4>
                  <p className="text-forest-600">
                    Offer workshops, classes, healing sessions, or consultations to community members.
                  </p>
                </div>
                
                <div className="space-y-2 text-sm text-forest-600">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-forest-500" />
                    <span>List your offerings</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-forest-500" />
                    <span>Use any location</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-forest-500" />
                    <span>Flexible scheduling</span>
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Share Both Option */}
          <div className="mt-6 text-center">
            <button
              onClick={() => handleApplyClick('both')}
              className="inline-flex items-center space-x-2 text-forest-600 hover:text-forest-700 font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>I want to share both space and time</span>
            </button>
          </div>
        </div>
      ) : (
        // Existing user - show status and management
        <div className="space-y-6">
          {/* Status Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Space Status */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-forest-100 rounded-lg flex items-center justify-center">
                    <Home className="h-5 w-5 text-forest-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-forest-800">Space Holder</h3>
                    {spaceStatus !== 'none' && (
                      <p className="text-sm text-forest-600 flex items-center mt-1">
                        {getStatusIcon(spaceStatus)}
                        <span className="ml-2">{getStatusMessage('space', spaceStatus)}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {spaceStatus === 'approved' ? (
                <div className="space-y-4">
                  <button
                    onClick={() => setShowSpaceManagement(true)}
                    className="w-full py-3 px-4 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Home className="h-4 w-4" />
                    <span>Manage Your Spaces</span>
                  </button>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-forest-700">0</div>
                      <div className="text-xs text-forest-600">Active Spaces</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-forest-700">0</div>
                      <div className="text-xs text-forest-600">Bookings</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-forest-700">0</div>
                      <div className="text-xs text-forest-600">Reviews</div>
                    </div>
                  </div>
                </div>
              ) : spaceStatus === 'pending' ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    Your application is being reviewed. We'll notify you within 3-5 business days.
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => handleApplyClick('space')}
                  disabled={!canApply('space')}
                  className="w-full py-3 px-4 bg-forest-100 text-forest-700 rounded-lg hover:bg-forest-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply to Share Space
                </button>
              )}
            </div>

            {/* Time Status */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-forest-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-forest-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-forest-800">Time Holder</h3>
                    {timeStatus !== 'none' && (
                      <p className="text-sm text-forest-600 flex items-center mt-1">
                        {getStatusIcon(timeStatus)}
                        <span className="ml-2">{getStatusMessage('time', timeStatus)}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {timeStatus === 'approved' ? (
                <div className="space-y-4">
                  <button
                    onClick={() => setShowTimeManagement(true)}
                    className="w-full py-3 px-4 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Clock className="h-4 w-4" />
                    <span>Manage Your Offerings</span>
                  </button>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-forest-700">0</div>
                      <div className="text-xs text-forest-600">Active Offerings</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-forest-700">0</div>
                      <div className="text-xs text-forest-600">Sessions</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-forest-700">0</div>
                      <div className="text-xs text-forest-600">Participants</div>
                    </div>
                  </div>
                </div>
              ) : timeStatus === 'pending' ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    Your application is being reviewed. We'll notify you within 3-5 business days.
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => handleApplyClick('time')}
                  disabled={!canApply('time')}
                  className="w-full py-3 px-4 bg-forest-100 text-forest-700 rounded-lg hover:bg-forest-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply to Share Time
                </button>
              )}
            </div>
          </div>

          {/* All Contributions View */}
          {(spaceStatus === 'approved' || timeStatus === 'approved') && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-forest-800 mb-4">Your Contributions</h3>
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No active contributions yet</p>
                <p className="text-sm mt-2">Start by creating a space listing or time offering above</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals - TODO: Create these modal components */}
      {/* {showApplicationModal && applicationType && (
        <HolderApplicationModal
          isOpen={showApplicationModal}
          onClose={() => {
            setShowApplicationModal(false);
            setApplicationType(null);
          }}
          applicationType={applicationType}
          onSubmit={() => {
            setShowApplicationModal(false);
            setApplicationType(null);
            // Reload profile to get updated status
            window.location.reload();
          }}
        />
      )} */}

      {/* <SpaceManagementModal
        isOpen={showSpaceManagement}
        onClose={() => setShowSpaceManagement(false)}
      /> */}

      {/* Time Management Modal - to be implemented */}
      {/* {showTimeManagement && (
        <TimeManagementModal
          isOpen={showTimeManagement}
          onClose={() => setShowTimeManagement(false)}
        />
      )} */}
    </div>
  );
};