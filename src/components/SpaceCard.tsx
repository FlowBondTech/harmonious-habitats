import React, { useState } from 'react';
import { Calendar, Clock, Users, MapPin, X, Loader2, CheckCircle, UserMinus, Settings } from 'lucide-react';
import { Space } from '../types/space';
import StatusBadge from './StatusBadge';
import { useTheme } from '../context/ThemeContext';
import { useSpaces } from '../hooks/useSpaces';

interface SpaceCardProps {
  space: Space;
  onEdit?: (space: Space) => void;
}

const SpaceCard: React.FC<SpaceCardProps> = ({ space, onEdit }) => {
  const { theme } = useTheme();
  const { joinSpace, leaveSpace } = useSpaces();
  const [isHovered, setIsHovered] = React.useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);
  
  const handleActionClick = async () => {
    if (space.isHolder) {
      onEdit?.(space);
      return;
    }

    setActionLoading(true);
    setActionSuccess(false);
    
    try {
      let success = false;
      if (space.isAttending) {
        success = await leaveSpace(space.id);
      } else {
        success = await joinSpace(space.id);
      }

      if (success) {
        setActionSuccess(true);
        // Clear success state after animation
        setTimeout(() => setActionSuccess(false), 1500);
      }
    } catch (error) {
      console.error('Error handling space action:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const canJoin = space.status === 'open' && space.attendees < space.capacity;
  const isFull = space.attendees >= space.capacity;

  const getActionButtonContent = () => {
    if (actionLoading) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {space.isAttending ? 'Leaving...' : 'Joining...'}
        </>
      );
    }

    if (actionSuccess) {
      return (
        <>
          <CheckCircle className="w-4 h-4" />
          {space.isAttending ? 'Joined!' : 'Left'}
        </>
      );
    }

    if (space.isHolder) {
      return (
        <>
          <Settings className="w-4 h-4" />
          Manage
        </>
      );
    }

    if (space.isAttending) {
      return (
        <>
          <UserMinus className="w-4 h-4" />
          Leave
        </>
      );
    }

    if (!canJoin) {
      return 'Full';
    }

    return 'Join';
  };

  const getActionButtonStyle = () => {
    if (actionSuccess) {
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    }

    if (space.isHolder) {
      return 'bg-terracotta-100 text-terracotta-700 hover:bg-terracotta-200 dark:bg-terracotta-900/30 dark:text-terracotta-300 dark:hover:bg-terracotta-800/50';
    }

    if (space.isAttending) {
      return 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-800/50';
    }

    if (canJoin) {
      return 'bg-sage-100 text-sage-700 hover:bg-sage-200 dark:bg-sage-900/30 dark:text-sage-300 dark:hover:bg-sage-800/50';
    }

    return 'bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400';
  };

  return (
    <>
      <div 
        className={`
          relative rounded-xl overflow-hidden transition-all duration-300 transform
          ${isHovered ? 'scale-[1.02] shadow-lg' : 'shadow-md'}
          ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative">
          <img 
            src={space.image} 
            alt={space.title} 
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-3 right-3 flex gap-2">
            <StatusBadge type={space.status} />
            {space.isHolder && (
              <span className="bg-terracotta-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                HOSTING
              </span>
            )}
            {!space.isHolder && space.isAttending && (
              <span className="bg-sage-500 text-white text-xs px-2 py-1 rounded-full font-medium animate-pulse">
                ATTENDING
              </span>
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
        
        <div className="p-5">
          <h3 className="text-lg font-semibold mb-2 line-clamp-1">{space.title}</h3>
          <p className={`mb-4 text-sm line-clamp-2 ${
            theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'
          }`}>
            {space.description}
          </p>
          
          <div className="space-y-2 mb-4">
            <div className="flex items-center">
              <Calendar size={16} className="mr-2 text-sage-500" />
              <span className="text-sm">{space.date}</span>
            </div>
            <div className="flex items-center">
              <Clock size={16} className="mr-2 text-sage-500" />
              <span className="text-sm">{space.time}</span>
            </div>
            <div className="flex items-center">
              <MapPin size={16} className="mr-2 text-sage-500" />
              <span className="text-sm line-clamp-1">{space.location}</span>
            </div>
            <div className="flex items-center">
              <Users size={16} className="mr-2 text-sage-500" />
              <span className="text-sm">
                {space.attendees} / {space.capacity} attendees
              </span>
            </div>
          </div>

          {space.pricing && space.pricing.type !== 'free' && (
            <div className={`
              mb-4 p-2 rounded-lg text-sm
              ${theme === 'dark' ? 'bg-neutral-700/50' : 'bg-sage-50'}
            `}>
              {space.pricing.type === 'fixed' && space.pricing.amount && (
                <span className="font-medium">${space.pricing.amount}</span>
              )}
              {space.pricing.type === 'donation' && space.pricing.suggestedDonation && (
                <span className="font-medium">Suggested: ${space.pricing.suggestedDonation}</span>
              )}
            </div>
          )}
          
          <div className="flex justify-between gap-3">
            <button 
              onClick={handleActionClick}
              disabled={actionLoading || (!space.isHolder && !space.isAttending && !canJoin)}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium 
                transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                transform hover:scale-105 active:scale-95
                ${getActionButtonStyle()}
              `}
            >
              {getActionButtonContent()}
            </button>
            
            <button 
              onClick={() => setShowDetails(true)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                transform hover:scale-105 active:scale-95
                ${theme === 'dark' 
                  ? 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600' 
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }
              `}
            >
              Details
            </button>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`
            relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-xl
            ${theme === 'dark' ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-sage-100'}
          `}>
            <button
              onClick={() => setShowDetails(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors z-10"
              aria-label="Close details"
            >
              <X size={20} />
            </button>

            <div className="p-6">
              <div className="relative mb-6">
                <img 
                  src={space.image} 
                  alt={space.title} 
                  className="w-full h-64 object-cover rounded-lg"
                />
                <div className="absolute top-4 left-4">
                  <StatusBadge type={space.status} />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">{space.title}</h2>
                  <p className={`text-lg ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-600'}`}>
                    {space.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">When & Where</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Calendar size={18} className="mr-3 text-sage-500" />
                        <span>{space.date}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock size={18} className="mr-3 text-sage-500" />
                        <span>{space.time}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin size={18} className="mr-3 text-sage-500" />
                        <span>{space.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Attendance</h3>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Users size={18} className="mr-3 text-sage-500" />
                        <span>{space.attendees} / {space.capacity} people</span>
                      </div>
                      
                      {space.pricing && space.pricing.type !== 'free' && (
                        <div className={`
                          p-3 rounded-lg
                          ${theme === 'dark' ? 'bg-neutral-700/50' : 'bg-sage-50'}
                        `}>
                          <div className="font-medium">
                            {space.pricing.type === 'fixed' && space.pricing.amount && (
                              <>Price: ${space.pricing.amount}</>
                            )}
                            {space.pricing.type === 'donation' && space.pricing.suggestedDonation && (
                              <>Suggested Donation: ${space.pricing.suggestedDonation}</>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  <button
                    onClick={() => setShowDetails(false)}
                    className={`
                      px-6 py-2 rounded-lg font-medium transition-colors duration-200
                      ${theme === 'dark' 
                        ? 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600' 
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }
                    `}
                  >
                    Close
                  </button>
                  
                  {space.isHolder ? (
                    <button
                      onClick={() => {
                        setShowDetails(false);
                        onEdit?.(space);
                      }}
                      className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors duration-200 bg-terracotta-500 text-white hover:bg-terracotta-600"
                    >
                      <Settings className="w-4 h-4" />
                      Manage Space
                    </button>
                  ) : (
                    <button
                      onClick={handleActionClick}
                      disabled={actionLoading || (!space.isAttending && !canJoin)}
                      className={`
                        flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all duration-200
                        disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95
                        ${actionSuccess
                          ? 'bg-green-500 text-white'
                          : space.isAttending 
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : canJoin
                              ? 'bg-sage-500 text-white hover:bg-sage-600'
                              : 'bg-neutral-400 text-white cursor-not-allowed'
                        }
                      `}
                    >
                      {getActionButtonContent()}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SpaceCard;