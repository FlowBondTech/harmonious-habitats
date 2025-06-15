import React, { useState } from 'react';
import SpacesList from './SpacesList';
import SpaceFilterControls from './SpaceFilterControls';
import HoldSpaceForm from './HoldSpaceForm';
import EditSpaceForm from './EditSpaceForm';
import AdminPanel from './admin/AdminPanel';
import ProfileView from './profile/ProfileView';
import { ArrowLeft, User, X, AlertCircle } from 'lucide-react';
import BottomNavbar from './BottomNavbar';
import { useSpaces } from '../hooks/useSpaces';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Space } from '../types/space';

type ViewType = 'spaces' | 'admin' | 'profile';

const SpacesView: React.FC = () => {
  const [showHoldForm, setShowHoldForm] = useState(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('spaces');
  const [showIncompleteProfileBanner, setShowIncompleteProfileBanner] = useState(true);
  const { refetch } = useSpaces();
  const { profile } = useAuth();
  const { theme } = useTheme();

  const handleHoldSpaceSubmit = () => {
    setShowHoldForm(false);
    refetch(); // Refresh the spaces list
  };

  const handleHoldSpaceClick = () => {
    setShowHoldForm(!showHoldForm);
    setEditingSpace(null); // Clear any editing state
    setCurrentView('spaces');
  };

  const handleEditSpace = (space: Space) => {
    setEditingSpace(space);
    setShowHoldForm(false); // Clear hold form state
    setCurrentView('spaces');
  };

  const handleEditSubmit = () => {
    setEditingSpace(null);
    refetch(); // Refresh the spaces list
  };

  const handleEditCancel = () => {
    setEditingSpace(null);
  };

  const handleEditDelete = () => {
    setEditingSpace(null);
    refetch(); // Refresh the spaces list
  };

  const handleNavigationClick = (view: ViewType) => {
    setShowHoldForm(false);
    setEditingSpace(null); // Clear editing state when switching views
    setCurrentView(view);
  };

  const handleDismissBanner = () => {
    setShowIncompleteProfileBanner(false);
  };

  // Check if profile is truly incomplete (has meaningful content)
  const isProfileIncomplete = profile && (
    !profile.profile_setup_completed || 
    (!profile.bio && (!profile.expertise || profile.expertise.length === 0) && !profile.address)
  );

  const renderContent = () => {
    if (currentView === 'admin') {
      return <AdminPanel />;
    }

    if (currentView === 'profile') {
      return <ProfileView />;
    }

    return (
      <div className="max-w-5xl mx-auto">
        {/* Incomplete Profile Reminder Banner */}
        {isProfileIncomplete && 
         showIncompleteProfileBanner && 
         !showHoldForm && 
         !editingSpace && (
          <div className={`
            mb-6 p-4 rounded-xl border-l-4 border-terracotta-500
            ${theme === 'dark' 
              ? 'bg-terracotta-900/20 border-terracotta-400' 
              : 'bg-terracotta-50 border-terracotta-500'
            }
          `}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-terracotta-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-terracotta-800 dark:text-terracotta-200 mb-1">
                    Complete Your Profile
                  </h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-terracotta-300' : 'text-terracotta-700'}`}>
                    Add your bio, expertise, and location to help others connect with you and discover more relevant spaces.
                  </p>
                  <button
                    onClick={() => setCurrentView('profile')}
                    className={`
                      mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                      transition-colors duration-200
                      ${theme === 'dark'
                        ? 'bg-terracotta-600 text-white hover:bg-terracotta-500'
                        : 'bg-terracotta-600 text-white hover:bg-terracotta-700'
                      }
                    `}
                  >
                    <User className="w-4 h-4" />
                    Complete Profile
                  </button>
                </div>
              </div>
              <button
                onClick={handleDismissBanner}
                className={`
                  p-1 rounded-lg transition-colors
                  ${theme === 'dark' 
                    ? 'hover:bg-terracotta-800/50 text-terracotta-400' 
                    : 'hover:bg-terracotta-100 text-terracotta-600'
                  }
                `}
                aria-label="Dismiss reminder"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="mb-6 flex justify-between items-center">
          {showHoldForm ? (
            <>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowHoldForm(false)}
                  className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                  aria-label="Back to spaces"
                >
                  <ArrowLeft size={24} />
                  <span className="text-lg">Back</span>
                </button>
                <h1 className="text-2xl font-semibold">Create New Space</h1>
              </div>
            </>
          ) : editingSpace ? (
            <>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setEditingSpace(null)}
                  className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                  aria-label="Back to spaces"
                >
                  <ArrowLeft size={24} />
                  <span className="text-lg">Back</span>
                </button>
                <h1 className="text-2xl font-semibold">Edit Space</h1>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold">Holistic Spaces</h1>
            </>
          )}
        </div>

        {showHoldForm ? (
          <div className={`
            mb-8 p-6 rounded-xl shadow-md
            ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
          `}>
            <HoldSpaceForm onSubmit={handleHoldSpaceSubmit} />
          </div>
        ) : editingSpace ? (
          <div className={`
            mb-8 p-6 rounded-xl shadow-md
            ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
          `}>
            <EditSpaceForm 
              space={editingSpace}
              onSubmit={handleEditSubmit}
              onCancel={handleEditCancel}
              onDelete={handleEditDelete}
            />
          </div>
        ) : (
          <>
            <SpaceFilterControls />
            <SpacesList onEdit={handleEditSpace} />
          </>
        )}
      </div>
    );
  };

  return (
    <>
      {renderContent()}
      
      <BottomNavbar 
        onHoldSpace={handleHoldSpaceClick} 
        onNavigationClick={handleNavigationClick}
        isFormActive={showHoldForm || !!editingSpace}
        currentView={currentView}
      />
    </>
  );
};

export default SpacesView;