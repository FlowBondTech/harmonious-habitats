import React from 'react';
import { X, Home, Clock, Plus, LayoutDashboard } from 'lucide-react';

interface ShareChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewSpace?: () => void;
  onNewTime?: () => void;
  onDashboard: () => void;
  hasSpace: boolean;
  hasTime: boolean;
}

export const ShareChoiceModal: React.FC<ShareChoiceModalProps> = ({
  isOpen,
  onClose,
  onNewSpace,
  onNewTime,
  onDashboard,
  hasSpace,
  hasTime
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-forest-50 to-earth-50 px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-forest-800">What would you like to do?</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-forest-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Dashboard Option */}
          <button
            onClick={onDashboard}
            className="w-full p-4 border-2 border-forest-200 rounded-xl hover:border-forest-400 hover:bg-forest-50 transition-all text-left group"
          >
            <div className="flex items-start space-x-4">
              <div className="h-12 w-12 bg-forest-100 rounded-xl flex items-center justify-center group-hover:bg-forest-200 transition-colors">
                <LayoutDashboard className="h-6 w-6 text-forest-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-forest-800 mb-1">Go to Dashboard</h3>
                <p className="text-sm text-forest-600">
                  Manage your existing {hasSpace && hasTime ? 'spaces and offerings' : hasSpace ? 'spaces' : 'offerings'}
                </p>
              </div>
            </div>
          </button>

          {/* Add Another Space */}
          {hasSpace && onNewSpace && (
            <button
              onClick={onNewSpace}
              className="w-full p-4 border-2 border-forest-200 rounded-xl hover:border-forest-400 hover:bg-forest-50 transition-all text-left group"
            >
              <div className="flex items-start space-x-4">
                <div className="h-12 w-12 bg-forest-100 rounded-xl flex items-center justify-center group-hover:bg-forest-200 transition-colors">
                  <div className="relative">
                    <Home className="h-6 w-6 text-forest-600" />
                    <Plus className="h-3 w-3 text-forest-600 absolute -bottom-1 -right-1" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-forest-800 mb-1">Add Another Space</h3>
                  <p className="text-sm text-forest-600">
                    Share an additional space with the community
                  </p>
                </div>
              </div>
            </button>
          )}

          {/* Add Time Offerings */}
          {!hasTime && onNewTime && (
            <button
              onClick={onNewTime}
              className="w-full p-4 border-2 border-forest-200 rounded-xl hover:border-forest-400 hover:bg-forest-50 transition-all text-left group"
            >
              <div className="flex items-start space-x-4">
                <div className="h-12 w-12 bg-forest-100 rounded-xl flex items-center justify-center group-hover:bg-forest-200 transition-colors">
                  <Clock className="h-6 w-6 text-forest-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-forest-800 mb-1">Share Your Time</h3>
                  <p className="text-sm text-forest-600">
                    Offer workshops, classes, or healing sessions
                  </p>
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};