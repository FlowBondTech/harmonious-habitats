import React from 'react';

type StatusType = 'open' | 'full' | 'ongoing' | 'completed';

interface StatusBadgeProps {
  type: StatusType;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ type }) => {
  const getStatusStyles = () => {
    switch (type) {
      case 'open':
        return 'bg-green-500 text-white';
      case 'full':
        return 'bg-amber-500 text-white';
      case 'ongoing':
        return 'bg-blue-500 text-white';
      case 'completed':
        return 'bg-neutral-500 text-white';
      default:
        return 'bg-neutral-500 text-white';
    }
  };

  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusStyles()}`}>
      {type.toUpperCase()}
    </span>
  );
};

export default StatusBadge;