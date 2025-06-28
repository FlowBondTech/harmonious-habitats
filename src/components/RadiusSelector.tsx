import React, { useState } from 'react';
import { MapPin, Target } from 'lucide-react';

const RadiusSelector = () => {
  const [radius, setRadius] = useState(1);

  const radiusOptions = [
    { value: 0.5, label: '0.5 mi', description: '5-8 min walk' },
    { value: 1, label: '1 mi', description: '12-15 min walk' },
    { value: 2, label: '2 mi', description: '25-30 min walk' },
    { value: 3, label: '3 mi', description: '5-8 min bike' },
  ];

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 max-w-md mx-auto shadow-lg">
      <div className="flex items-center justify-center mb-6">
        <Target className="h-5 w-5 mr-2 text-earth-200" />
        <span className="text-lg font-semibold text-white">Discovery Radius</span>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {radiusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setRadius(option.value)}
            className={`p-3 sm:p-4 rounded-xl text-center transition-all duration-200 transform hover:scale-105 ${
              radius === option.value
                ? 'bg-earth-400 text-white shadow-lg scale-105'
                : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
            }`}
          >
            <div className="font-bold text-sm sm:text-base">{option.label}</div>
            <div className="text-xs opacity-90 mt-1 hidden sm:block">{option.description}</div>
          </button>
        ))}
      </div>
      
      <div className="flex items-center justify-center text-sm text-forest-100">
        <MapPin className="h-4 w-4 mr-2" />
        <span>Searching within {radius} mile{radius !== 1 ? 's' : ''} of your location</span>
      </div>
    </div>
  );
};

export default RadiusSelector;