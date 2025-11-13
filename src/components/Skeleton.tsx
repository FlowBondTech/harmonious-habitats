import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
}

/**
 * Reusable Skeleton component for loading states
 * Provides visual feedback while content is loading
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animate = true
}) => {
  const baseClasses = 'bg-gray-200';
  const animateClasses = animate ? 'animate-pulse' : '';

  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  };

  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1rem' : variant === 'circular' ? '40px' : '100px')
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animateClasses} ${className}`}
      style={style}
      aria-label="Loading..."
      role="status"
    />
  );
};

/**
 * Event Card Skeleton - matches EventCard layout
 */
export const EventCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      {/* Image */}
      <Skeleton variant="rectangular" height="160px" />

      {/* Category badge */}
      <Skeleton variant="rectangular" width="80px" height="24px" />

      {/* Title */}
      <Skeleton variant="text" />
      <Skeleton variant="text" width="60%" />

      {/* Date and location */}
      <div className="flex items-center space-x-4">
        <Skeleton variant="text" width="100px" />
        <Skeleton variant="text" width="120px" />
      </div>

      {/* Footer with avatar and button */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <Skeleton variant="circular" width="32px" height="32px" />
          <Skeleton variant="text" width="80px" />
        </div>
        <Skeleton variant="rectangular" width="80px" height="36px" />
      </div>
    </div>
  );
};

/**
 * Space Card Skeleton - matches SpaceCard layout
 */
export const SpaceCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Image */}
      <Skeleton variant="rectangular" height="200px" className="rounded-none" />

      <div className="p-4 space-y-3">
        {/* Title */}
        <Skeleton variant="text" />
        <Skeleton variant="text" width="70%" />

        {/* Amenities */}
        <div className="flex items-center space-x-2">
          <Skeleton variant="rectangular" width="60px" height="24px" />
          <Skeleton variant="rectangular" width="70px" height="24px" />
          <Skeleton variant="rectangular" width="50px" height="24px" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <Skeleton variant="text" width="100px" />
          <Skeleton variant="rectangular" width="90px" height="36px" />
        </div>
      </div>
    </div>
  );
};

/**
 * Profile Header Skeleton
 */
export const ProfileHeaderSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start space-x-4">
        {/* Avatar */}
        <Skeleton variant="circular" width="80px" height="80px" />

        <div className="flex-1 space-y-3">
          {/* Name */}
          <Skeleton variant="text" width="200px" height="24px" />

          {/* Bio */}
          <Skeleton variant="text" />
          <Skeleton variant="text" width="80%" />

          {/* Stats */}
          <div className="flex items-center space-x-6 pt-2">
            <Skeleton variant="text" width="80px" />
            <Skeleton variant="text" width="80px" />
            <Skeleton variant="text" width="80px" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * List Skeleton - for generic lists
 */
export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <Skeleton variant="circular" width="48px" height="48px" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" />
              <Skeleton variant="text" width="60%" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Grid Skeleton - for event/space grids
 */
export const GridSkeleton: React.FC<{
  count?: number;
  type?: 'event' | 'space'
}> = ({ count = 6, type = 'event' }) => {
  const SkeletonCard = type === 'event' ? EventCardSkeleton : SpaceCardSkeleton;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
};

/**
 * Page Skeleton - full page loading state
 */
export const PageSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton variant="text" width="300px" height="32px" />
        <Skeleton variant="text" width="200px" />
      </div>

      {/* Content grid */}
      <GridSkeleton count={6} />
    </div>
  );
};

export default Skeleton;
