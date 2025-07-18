import React, { useState, useEffect } from 'react';
import { X, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ShareTab } from './ShareTab';
import { ShareChoiceModal } from './ShareChoiceModal';
import { useAuthContext } from './AuthProvider';
import { supabase } from '../lib/supabase';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, profile } = useAuthContext();
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [hasExistingSpaces, setHasExistingSpaces] = useState(false);
  const [hasExistingOfferings, setHasExistingOfferings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [forceNewSpace, setForceNewSpace] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      // Reset states when modal opens
      setShowChoiceModal(false);
      setForceNewSpace(false);
      setHasExistingSpaces(false);
      setHasExistingOfferings(false);
      checkExistingContributions();
    }
  }, [isOpen, user]);

  const checkExistingContributions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Check for existing spaces
      const { data: spaces, error: spacesError } = await supabase
        .from('spaces')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1);

      if (!spacesError && spaces && spaces.length > 0) {
        setHasExistingSpaces(true);
      }

      // Check for existing time offerings
      const { data: offerings, error: offeringsError } = await supabase
        .from('time_offerings')
        .select('id')
        .eq('holder_id', user.id)
        .limit(1);

      if (!offeringsError && offerings && offerings.length > 0) {
        setHasExistingOfferings(true);
      }

      // Show choice modal if user has any existing contributions
      if ((spaces && spaces.length > 0) || (offerings && offerings.length > 0)) {
        setShowChoiceModal(true);
      }
    } catch (error) {
      console.error('Error checking existing contributions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    onClose();
    // Small delay to ensure modal closes before navigation
    setTimeout(() => {
      navigate('/account', { state: { activeTab: 'share' } });
    }, 100);
  };

  const handleNewSpace = () => {
    onClose();
    // Navigate to share space page for adding new space
    setTimeout(() => {
      navigate('/share-space');
    }, 100);
  };

  const handleNewContribution = () => {
    setShowChoiceModal(false);
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      {showChoiceModal ? (
        <ShareChoiceModal
          isOpen={showChoiceModal}
          onClose={onClose}
          onNewSpace={hasExistingSpaces ? handleNewSpace : undefined}
          onNewTime={!hasExistingOfferings ? handleNewContribution : undefined}
          onDashboard={handleGoToDashboard}
          hasSpace={hasExistingSpaces}
          hasTime={hasExistingOfferings}
        />
      ) : (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-forest-100 rounded-lg flex items-center justify-center">
                    <Share2 className="h-5 w-5 text-forest-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-forest-800">Share with Your Community</h2>
                    <p className="text-sm text-forest-600">Contribute your space or time to the holistic community</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              <ShareTab />
            </div>
          </div>
        </div>
      )}
    </>
  );
};