import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ReauthBannerProps {
  onReauth: () => void;
}

const ReauthBanner: React.FC<ReauthBannerProps> = ({ onReauth }) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Session Expired</p>
            <p className="text-sm text-red-100">
              Your login session has expired. Please sign in again to continue.
            </p>
          </div>
        </div>
        <button
          onClick={onReauth}
          className="flex items-center space-x-2 px-4 py-2 bg-white text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Sign In Again</span>
        </button>
      </div>
    </div>
  );
};

export default ReauthBanner;
