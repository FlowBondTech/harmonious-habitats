import React from 'react';

interface SkeletonProps {
  className?: string;
}

// Base Skeleton component with shimmer animation
export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] rounded ${className}`}
      style={{
        animation: 'shimmer 2s infinite linear'
      }}
    />
  );
};

// Event Card Loading Skeleton
export const EventCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
      {/* Image Skeleton */}
      <Skeleton className="w-full h-48" />

      <div className="p-6">
        {/* Category Badge */}
        <Skeleton className="h-6 w-24 rounded-full mb-3" />

        {/* Title */}
        <Skeleton className="h-7 w-full mb-2" />
        <Skeleton className="h-7 w-3/4 mb-4" />

        {/* Date and Time */}
        <div className="flex items-center space-x-4 mb-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-24" />
        </div>

        {/* Location */}
        <Skeleton className="h-5 w-48 mb-4" />

        {/* Organizer */}
        <div className="flex items-center space-x-3 mb-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-5 w-32" />
        </div>

        {/* Button */}
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
};

// Space Card Loading Skeleton
export const SpaceCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
      {/* Image Skeleton */}
      <Skeleton className="w-full h-56" />

      <div className="p-6">
        {/* Title */}
        <Skeleton className="h-7 w-full mb-2" />
        <Skeleton className="h-7 w-2/3 mb-3" />

        {/* Description */}
        <Skeleton className="h-5 w-full mb-2" />
        <Skeleton className="h-5 w-5/6 mb-4" />

        {/* Location */}
        <Skeleton className="h-5 w-40 mb-4" />

        {/* Features */}
        <div className="flex space-x-2 mb-4">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>

        {/* Button */}
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
};

// Profile Header Loading Skeleton
export const ProfileHeaderSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <div className="flex items-start space-x-6">
        {/* Avatar */}
        <Skeleton className="h-24 w-24 rounded-full flex-shrink-0" />

        <div className="flex-1">
          {/* Name */}
          <Skeleton className="h-8 w-48 mb-2" />

          {/* Username */}
          <Skeleton className="h-5 w-32 mb-3" />

          {/* Bio */}
          <Skeleton className="h-5 w-full mb-2" />
          <Skeleton className="h-5 w-4/5 mb-4" />

          {/* Stats */}
          <div className="flex space-x-6">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
};

// List Item Loading Skeleton
export const ListItemSkeleton: React.FC = () => {
  return (
    <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-100">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Skeleton className="h-9 w-24 rounded-lg" />
    </div>
  );
};

// Message Loading Skeleton
export const MessageSkeleton: React.FC = () => {
  return (
    <div className="flex items-start space-x-3 p-4">
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="flex-1">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    </div>
  );
};

// Table Row Loading Skeleton
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 4 }) => {
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton className="h-5 w-full" />
        </td>
      ))}
    </tr>
  );
};

// Grid Loading Skeleton (for event/space grids)
export const GridSkeleton: React.FC<{
  count?: number;
  type?: 'event' | 'space' | 'profile'
}> = ({ count = 6, type = 'event' }) => {
  const SkeletonComponent = type === 'event' ? EventCardSkeleton :
                            type === 'space' ? SpaceCardSkeleton :
                            ListItemSkeleton;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
};

// Page Loading Skeleton
export const PageLoadingSkeleton: React.FC<{
  title?: boolean;
  description?: boolean;
}> = ({ title = true, description = true }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {title && <Skeleton className="h-10 w-64 mb-4" />}
      {description && (
        <>
          <Skeleton className="h-6 w-full max-w-2xl mb-2" />
          <Skeleton className="h-6 w-3/4 max-w-xl mb-8" />
        </>
      )}
      <GridSkeleton count={6} />
    </div>
  );
};

// Form Loading Skeleton
export const FormSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 space-y-6">
      <Skeleton className="h-8 w-48 mb-6" />

      {/* Form fields */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}>
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      ))}

      {/* Submit button */}
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  );
};

// Add shimmer animation to global styles
// This should be added to your tailwind.config.js or global CSS
export const shimmerAnimation = `
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
`;
