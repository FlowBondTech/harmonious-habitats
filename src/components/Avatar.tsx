import React from 'react';
import { User } from 'lucide-react';
import { getInitials, getColorFromString } from '../utils/defaults';

interface AvatarProps {
  name?: string | null;
  imageUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl'
};

const iconSizes = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8'
};

const Avatar: React.FC<AvatarProps> = ({ name, imageUrl, size = 'md', className = '' }) => {
  const sizeClass = sizeClasses[size];
  const iconSize = iconSizes[size];
  const colorClass = name ? getColorFromString(name) : 'bg-gray-400';
  
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name || 'User'}
        className={`${sizeClass} rounded-full object-cover ${className}`}
      />
    );
  }
  
  const initials = getInitials(name);
  
  return (
    <div className={`${sizeClass} ${colorClass} rounded-full flex items-center justify-center text-white font-semibold ${className}`}>
      {name ? initials : <User className={iconSize} />}
    </div>
  );
};

export default Avatar;