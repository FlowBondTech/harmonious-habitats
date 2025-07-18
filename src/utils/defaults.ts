// Default placeholder images for the application
// Using Pexels images as placeholders is acceptable

export const DEFAULT_AVATAR = 'https://images.pexels.com/photos/3772622/pexels-photo-3772622.jpeg?auto=compress&cs=tinysrgb&w=200';
export const DEFAULT_EVENT_IMAGE = 'https://images.pexels.com/photos/7636116/pexels-photo-7636116.jpeg?auto=compress&cs=tinysrgb&w=400';
export const DEFAULT_SPACE_IMAGE = 'https://images.pexels.com/photos/7218024/pexels-photo-7218024.jpeg?auto=compress&cs=tinysrgb&w=400';

// Helper function to get avatar with fallback
export const getAvatarUrl = (url?: string | null): string => {
  return url || DEFAULT_AVATAR;
};

// Helper function to get event image with fallback
export const getEventImageUrl = (url?: string | null): string => {
  return url || DEFAULT_EVENT_IMAGE;
};

// Helper function to get space image with fallback
export const getSpaceImageUrl = (url?: string | null): string => {
  return url || DEFAULT_SPACE_IMAGE;
};

// Generate initials from name
export const getInitials = (name?: string | null): string => {
  if (!name) return '?';
  const parts = name.split(' ').filter(part => part.length > 0);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Generate a color based on a string (for avatar backgrounds)
export const getColorFromString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    'bg-forest-500',
    'bg-earth-500',
    'bg-blue-500',
    'bg-purple-500',
    'bg-green-500',
    'bg-indigo-500',
    'bg-pink-500',
    'bg-orange-500'
  ];
  
  return colors[Math.abs(hash) % colors.length];
};