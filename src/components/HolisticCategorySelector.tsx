import React, { useState } from 'react';
import { Sprout, Flower2, ChefHat, Palette, Stethoscope, Music } from 'lucide-react';

interface HolisticCategory {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  gradient: string;
  mantra: string;
  description: string;
  element: string;
  chakra: string;
}

interface HolisticCategorySelectorProps {
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
}

const HolisticCategorySelector: React.FC<HolisticCategorySelectorProps> = ({
  selectedCategory,
  onCategorySelect
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const categories: HolisticCategory[] = [
    {
      id: 'gardening',
      name: 'Gardening & Sustainability',
      icon: Sprout,
      color: 'text-emerald-600',
      gradient: 'from-emerald-400 to-green-600',
      mantra: 'I am rooted in nature\'s wisdom',
      description: 'Connect with Earth\'s healing energy',
      element: 'Earth',
      chakra: 'Root'
    },
    {
      id: 'yoga',
      name: 'Yoga & Meditation',
      icon: Flower2,
      color: 'text-purple-600',
      gradient: 'from-purple-400 to-violet-600',
      mantra: 'I flow with divine presence',
      description: 'Unite body, mind, and spirit',
      element: 'Ether',
      chakra: 'Crown'
    },
    {
      id: 'cooking',
      name: 'Cooking & Nutrition',
      icon: ChefHat,
      color: 'text-orange-600',
      gradient: 'from-orange-400 to-red-500',
      mantra: 'I nourish with love and intention',
      description: 'Transform ingredients into wellness',
      element: 'Fire',
      chakra: 'Sacral'
    },
    {
      id: 'art',
      name: 'Art & Creativity',
      icon: Palette,
      color: 'text-pink-600',
      gradient: 'from-pink-400 to-rose-600',
      mantra: 'I express my authentic truth',
      description: 'Channel creativity from the heart',
      element: 'Water',
      chakra: 'Heart'
    },
    {
      id: 'healing',
      name: 'Healing & Wellness',
      icon: Stethoscope,
      color: 'text-blue-600',
      gradient: 'from-blue-400 to-cyan-600',
      mantra: 'I am whole and vibrant',
      description: 'Restore balance and vitality',
      element: 'Water',
      chakra: 'Throat'
    },
    {
      id: 'music',
      name: 'Music & Movement',
      icon: Music,
      color: 'text-indigo-600',
      gradient: 'from-indigo-400 to-blue-600',
      mantra: 'I move in harmony with life',
      description: 'Express through rhythm and sound',
      element: 'Air',
      chakra: 'Third Eye'
    }
  ];

  const centerX = 200;
  const centerY = 200;
  const radius = 120;

  const getPositionForIndex = (index: number, total: number) => {
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    return { x, y, angle };
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-forest-800 mb-2">Choose Your Holistic Path</h3>
        <p className="text-sm text-forest-600">Select the practice that calls to your soul</p>
      </div>

      {/* Mandala Selector */}
      <div className="relative flex justify-center">
        <div className="relative w-96 h-96">
          {/* Central Sacred Geometry */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 relative">
              {/* Flower of Life inspired center */}
              <div className="absolute inset-0 border-2 border-forest-200 rounded-full animate-pulse"></div>
              <div className="absolute inset-2 border border-forest-300 rounded-full opacity-60"></div>
              <div className="absolute inset-4 border border-forest-400 rounded-full opacity-40"></div>
              <div className="absolute inset-6 bg-gradient-to-br from-forest-100 to-earth-100 rounded-full"></div>
            </div>
          </div>

          {/* Category Circles */}
          {categories.map((category, index) => {
            const { x, y } = getPositionForIndex(index, categories.length);
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            const isHovered = hoveredCategory === category.id;

            return (
              <div
                key={category.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out"
                style={{
                  left: x,
                  top: y,
                  transform: `translate(-50%, -50%) scale(${isSelected ? 1.2 : isHovered ? 1.1 : 1})`
                }}
              >
                <button
                  type="button"
                  onClick={() => onCategorySelect(category.id)}
                  onMouseEnter={() => setHoveredCategory(category.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className={`relative w-20 h-20 rounded-full border-3 transition-all duration-300 shadow-lg hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-forest-300 ${
                    isSelected
                      ? 'border-white shadow-2xl'
                      : 'border-white/50 hover:border-white'
                  }`}
                >
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${category.gradient} ${
                    isSelected ? 'opacity-100' : 'opacity-80 hover:opacity-90'
                  } transition-opacity duration-300`}></div>
                  
                  {/* Icon */}
                  <div className="relative z-10 flex items-center justify-center h-full">
                    <Icon className="h-8 w-8 text-white drop-shadow-sm" />
                  </div>

                  {/* Pulse Animation for Selected */}
                  {isSelected && (
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${category.gradient} animate-ping opacity-75`}></div>
                  )}

                  {/* Ripple Effect */}
                  {isHovered && (
                    <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-pulse"></div>
                  )}
                </button>

                {/* Category Name */}
                <div className={`absolute top-24 left-1/2 transform -translate-x-1/2 transition-all duration-300 ${
                  isSelected || isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                }`}>
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 shadow-lg border border-white/20">
                    <p className="text-xs font-medium text-forest-800 text-center whitespace-nowrap">
                      {category.name}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Connection Lines (Sacred Geometry) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
            {categories.map((_, index) => {
              const { x: x1, y: y1 } = getPositionForIndex(index, categories.length);
              const { x: x2, y: y2 } = getPositionForIndex((index + 1) % categories.length, categories.length);
              return (
                <line
                  key={index}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-forest-300"
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Selected Category Details */}
      {selectedCategory && (
        <div className="mt-8 p-6 bg-gradient-to-br from-white to-forest-50 rounded-xl border border-forest-200 shadow-sm">
          {(() => {
            const category = categories.find(c => c.id === selectedCategory);
            if (!category) return null;
            const Icon = category.icon;

            return (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-3">
                  <div className={`p-3 rounded-full bg-gradient-to-br ${category.gradient}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-xl font-semibold text-forest-800">{category.name}</h4>
                </div>
                
                <p className="text-forest-600 italic">"{category.mantra}"</p>
                <p className="text-forest-700">{category.description}</p>
                
                <div className="flex items-center justify-center space-x-6 text-sm text-forest-600">
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">Element:</span>
                    <span>{category.element}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">Chakra:</span>
                    <span>{category.chakra}</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default HolisticCategorySelector; 