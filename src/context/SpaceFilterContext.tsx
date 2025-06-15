import React, { createContext, useState, useContext } from 'react';

type FilterType = 'all' | 'holding' | 'attending';

interface SpaceFilterContextType {
  filter: FilterType;
  setFilter: (filter: FilterType) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  pricingTypeFilter: string[];
  setPricingTypeFilter: (types: string[]) => void;
  showPublicHostsOnly: boolean;
  setShowPublicHostsOnly: (show: boolean) => void;
  showCompletedProfilesOnly: boolean;
  setShowCompletedProfilesOnly: (show: boolean) => void;
  radiusFilter: number | null;
  setRadiusFilter: (radius: number | null) => void;
  useCurrentLocation: boolean;
  setUseCurrentLocation: (use: boolean) => void;
  customLocation: { latitude: number; longitude: number; address: string } | null;
  setCustomLocation: (location: { latitude: number; longitude: number; address: string } | null) => void;
}

const SpaceFilterContext = createContext<SpaceFilterContextType | undefined>(undefined);

export const useSpaceFilter = (): SpaceFilterContextType => {
  const context = useContext(SpaceFilterContext);
  if (!context) {
    throw new Error('useSpaceFilter must be used within a SpaceFilterProvider');
  }
  return context;
};

export const SpaceFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pricingTypeFilter, setPricingTypeFilter] = useState<string[]>(['all']);
  const [showPublicHostsOnly, setShowPublicHostsOnly] = useState(false);
  const [showCompletedProfilesOnly, setShowCompletedProfilesOnly] = useState(false);
  const [radiusFilter, setRadiusFilter] = useState<number | null>(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [customLocation, setCustomLocation] = useState<{ latitude: number; longitude: number; address: string } | null>(null);

  return (
    <SpaceFilterContext.Provider value={{ 
      filter, 
      setFilter,
      searchTerm,
      setSearchTerm,
      startDate,
      setStartDate,
      endDate,
      setEndDate,
      pricingTypeFilter,
      setPricingTypeFilter,
      showPublicHostsOnly,
      setShowPublicHostsOnly,
      showCompletedProfilesOnly,
      setShowCompletedProfilesOnly,
      radiusFilter,
      setRadiusFilter,
      useCurrentLocation,
      setUseCurrentLocation,
      customLocation,
      setCustomLocation
    }}>
      {children}
    </SpaceFilterContext.Provider>
  );
};