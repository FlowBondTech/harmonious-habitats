import React, { useState, useRef, useEffect } from 'react';
import { X, Home, Users, Clock, MapPin, Calendar, ArrowRight, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ShareOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShareOptionsModal: React.FC<ShareOptionsModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap and modal handling
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
  };

  const handleContinue = () => {
    if (selectedOption === 'space') {
      navigate('/share-space');
      onClose();
    } else if (selectedOption === 'facilitator') {
      // Navigate to facilitator signup page (to be created)
      navigate('/become-facilitator');
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-end sm:items-center justify-center sm:p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
        
        {/* Modal */}
        <div 
          ref={modalRef}
          className="relative w-full sm:max-w-lg transform overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl transition-all animate-slide-up sm:animate-fade-in"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-forest-600 to-earth-500 px-6 py-6 text-white">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-white/20 p-2 rounded-xl">
                <Heart className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold">Share with your community</h2>
            </div>
            
            <p className="text-forest-100">
              Help strengthen your neighborhood by sharing what you have to offer
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-8">
            <div className="space-y-4">
              {/* Share a Space Option */}
              <button
                onClick={() => handleOptionSelect('space')}
                className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
                  selectedOption === 'space'
                    ? 'border-forest-300 bg-forest-50'
                    : 'border-gray-200 bg-white hover:border-forest-200 hover:bg-forest-25'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${
                    selectedOption === 'space' ? 'bg-forest-100' : 'bg-gray-100'
                  }`}>
                    <Home className={`h-6 w-6 ${
                      selectedOption === 'space' ? 'text-forest-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Share a Space</h3>
                    <p className="text-gray-600 text-sm mb-3">
                      Offer your home, yard, or other spaces for community events and gatherings
                    </p>
                    <div className="space-y-1 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>Host events at your location</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>Set your own availability</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        <span>Connect with neighbors</span>
                      </div>
                    </div>
                  </div>
                  {selectedOption === 'space' && (
                    <div className="p-1 bg-forest-600 rounded-full">
                      <ArrowRight className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              </button>

              {/* Share Time as Facilitator Option */}
              <button
                onClick={() => handleOptionSelect('facilitator')}
                className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
                  selectedOption === 'facilitator'
                    ? 'border-forest-300 bg-forest-50'
                    : 'border-gray-200 bg-white hover:border-forest-200 hover:bg-forest-25'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${
                    selectedOption === 'facilitator' ? 'bg-forest-100' : 'bg-gray-100'
                  }`}>
                    <Users className={`h-6 w-6 ${
                      selectedOption === 'facilitator' ? 'text-forest-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Share Your Time</h3>
                    <p className="text-gray-600 text-sm mb-3">
                      Volunteer as a facilitator, organizer, or help with community events
                    </p>
                    <div className="space-y-1 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>Flexible time commitment</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart className="h-3 w-3" />
                        <span>Support community events</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        <span>Build meaningful connections</span>
                      </div>
                    </div>
                  </div>
                  {selectedOption === 'facilitator' && (
                    <div className="p-1 bg-forest-600 rounded-full">
                      <ArrowRight className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                💡 <strong>Tip:</strong> You can always update these preferences later in your profile settings. 
                Both options help create stronger neighborhood connections!
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Maybe later
              </button>

              <div className="flex gap-3">
                {selectedOption ? (
                  <button
                    onClick={handleContinue}
                    className="flex items-center gap-2 px-6 py-2 bg-forest-600 hover:bg-forest-700 text-white rounded-lg transition-colors"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex items-center gap-2 px-6 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                  >
                    Select an option
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareOptionsModal;