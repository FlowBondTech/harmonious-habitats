import React from 'react';
import { useSpaceFilter } from '../context/SpaceFilterContext';
import SpaceCard from './SpaceCard';
import { useSpaces } from '../hooks/useSpaces';
import { Space } from '../types/space';

interface SpacesListProps {
  onEdit?: (space: Space) => void;
}

const SpacesList: React.FC<SpacesListProps> = ({ onEdit }) => {
  const { filter } = useSpaceFilter();
  const { spaces, loading } = useSpaces();
  
  const filteredSpaces = React.useMemo(() => {
    if (filter === 'all') return spaces;
    if (filter === 'holding') return spaces.filter(space => space.isHolder);
    if (filter === 'attending') return spaces.filter(space => !space.isHolder && space.isAttending);
    return spaces;
  }, [spaces, filter]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-sage-400 rounded-full mb-4"></div>
          <div className="h-4 w-48 bg-neutral-300 dark:bg-neutral-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (filteredSpaces.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h3 className="text-xl font-medium mb-2">No spaces found</h3>
        <p className="text-neutral-500 dark:text-neutral-400 max-w-md">
          {filter === 'all' 
            ? "There are no spaces available at the moment." 
            : filter === 'holding' 
              ? "You are not hosting any spaces currently." 
              : "You are not attending any spaces currently."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredSpaces.map(space => (
        <SpaceCard 
          key={space.id} 
          space={space}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
};

export default SpacesList