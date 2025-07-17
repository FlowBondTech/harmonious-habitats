import React from 'react';
import { Loader2, Sparkles, Heart, Calendar, MapPin, Users, Home } from 'lucide-react';

// Enhanced Loading Spinner with multiple variants
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'success' | 'pulse';
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  variant = 'default', 
  text 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const variantClasses = {
    default: 'text-forest-600',
    primary: 'text-forest-700',
    success: 'text-green-600',
    pulse: 'text-forest-600 animate-pulse'
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      <Loader2 className={`${sizeClasses[size]} ${variantClasses[variant]} animate-spin`} />
      {text && (
        <span className="text-sm font-medium text-forest-600 animate-pulse">
          {text}
        </span>
      )}
    </div>
  );
};

// Enhanced Button Loading State
interface LoadingButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'outline';
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  children,
  loading = false,
  disabled = false,
  onClick,
  className = '',
  variant = 'primary'
}) => {
  const variantClasses = {
    primary: 'bg-forest-600 hover:bg-forest-700 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    outline: 'border-2 border-forest-600 text-forest-600 hover:bg-forest-50'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        relative px-4 py-2 rounded-lg font-medium
        transform transition-all duration-200
        ${variantClasses[variant]}
        ${loading || disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
        ${className}
      `}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" variant="default" />
        </div>
      )}
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
    </button>
  );
};

// EventCard Skeleton Loader
export const EventCardSkeleton: React.FC = () => {
  return (
    <div className="card-interactive overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="h-48 sm:h-52 lg:h-56 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-[shimmer_2s_infinite]" />
      
      {/* Content Skeleton */}
      <div className="p-5 sm:p-6 space-y-4">
        {/* Title & Organizer */}
        <div className="space-y-2">
          <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-[shimmer_2s_infinite] rounded-md w-3/4" />
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-[shimmer_2s_infinite] rounded-md w-1/2" />
        </div>
        
        {/* Details */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 bg-gray-300 rounded" />
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-[shimmer_2s_infinite] rounded w-2/3" />
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 bg-gray-300 rounded" />
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-[shimmer_2s_infinite] rounded w-1/2" />
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 bg-gray-300 rounded" />
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-[shimmer_2s_infinite] rounded w-1/3" />
          </div>
        </div>
        
        {/* Button */}
        <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-[shimmer_2s_infinite] rounded-lg w-full" />
      </div>
    </div>
  );
};

// SpaceCard Skeleton Loader
export const SpaceCardSkeleton: React.FC = () => {
  return (
    <div className="card-interactive overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="h-40 sm:h-48 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-[shimmer_2s_infinite]" />
      
      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-[shimmer_2s_infinite] rounded w-3/4" />
        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-[shimmer_2s_infinite] rounded w-1/2" />
        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-[shimmer_2s_infinite] rounded w-2/3" />
      </div>
    </div>
  );
};

// Dashboard Stats Skeleton
export const DashboardStatsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="card-interactive p-6 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-[shimmer_2s_infinite] rounded w-20" />
              <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-[shimmer_2s_infinite] rounded w-16" />
              <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-[shimmer_2s_infinite] rounded w-12" />
            </div>
            <div className="h-12 w-12 bg-gray-300 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Search Results Skeleton
export const SearchResultsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Events Section */}
      <div className="space-y-4">
        <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-[shimmer_2s_infinite] rounded w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      </div>
      
      {/* Spaces Section */}
      <div className="space-y-4">
        <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-[shimmer_2s_infinite] rounded w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <SpaceCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
};

// Page Loading with Branded Animation
export const PageLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      {/* Animated Logo/Icon */}
      <div className="relative">
        <div className="h-16 w-16 bg-gradient-to-r from-forest-400 to-forest-600 rounded-full flex items-center justify-center animate-pulse">
          <Sparkles className="h-8 w-8 text-white animate-spin" />
        </div>
        <div className="absolute inset-0 h-16 w-16 bg-gradient-to-r from-forest-400 to-forest-600 rounded-full animate-ping opacity-20" />
      </div>
      
      {/* Loading Text */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-forest-800 mb-2">{message}</h3>
        <p className="text-sm text-forest-600">Building your community experience...</p>
      </div>
      
      {/* Progress Dots */}
      <div className="flex space-x-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-2 w-2 bg-forest-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    </div>
  );
};

// Modal Loading State
export const ModalLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <LoadingSpinner size="lg" variant="primary" />
      <p className="text-forest-600 font-medium">{message}</p>
    </div>
  );
};

// Floating Action Button with Loading
interface FloatingActionButtonProps {
  onClick: () => void;
  loading?: boolean;
  icon: React.ReactNode;
  className?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  loading = false,
  icon,
  className = ''
}) => {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`
        fixed bottom-20 right-6 z-40
        h-14 w-14 bg-gradient-to-r from-forest-600 to-forest-700 
        text-white rounded-full shadow-lg
        flex items-center justify-center
        transform transition-all duration-300
        ${loading ? 'scale-110 animate-pulse' : 'hover:scale-110 active:scale-95'}
        ${className}
      `}
    >
      {loading ? (
        <LoadingSpinner size="sm" variant="default" />
      ) : (
        icon
      )}
    </button>
  );
};

export default {
  LoadingSpinner,
  LoadingButton,
  EventCardSkeleton,
  SpaceCardSkeleton,
  DashboardStatsSkeleton,
  SearchResultsSkeleton,
  PageLoader,
  ModalLoader,
  FloatingActionButton
};