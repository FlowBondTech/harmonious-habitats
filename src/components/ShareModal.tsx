import React from 'react';
import { X, Share2 } from 'lucide-react';
import { ShareTab } from './ShareTab';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
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
  );
};