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

  // Responsive sizing - smaller on mobile to fit viewport
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const centerX = isMobile ? 150 : 200;
  const centerY = isMobile ? 150 : 200;
  const radius = isMobile ? 90 : 120;

  const getPositionForIndex = (index: number, total: number) => {
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    return { x, y, angle };
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center hidden sm:block">
        <h3 className="text-lg font-semibold text-forest-800 mb-2">Choose Your Holistic Path</h3>
        <p className="text-sm text-forest-600">Select the practice that calls to your soul</p>
      </div>

      {/* Mandala Selector */}
      <div className="relative flex justify-center overflow-hidden">
        <div className="relative w-[300px] h-[300px] sm:w-96 sm:h-96">
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
                className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out cursor-pointer"
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
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-3 transition-all duration-300 shadow-lg hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-forest-300 cursor-pointer ${
                    isSelected
                      ? 'border-white shadow-2xl'
                      : 'border-white/50 hover:border-white'
                  }`}
                >
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${category.gradient} ${
                    isSelected ? 'opacity-100' : 'opacity-80 hover:opacity-90'
                  } transition-opacity duration-300 pointer-events-none`}></div>

                  {/* Icon */}
                  <div className="relative z-10 flex items-center justify-center h-full pointer-events-none">
                    <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-white drop-shadow-sm" />
                  </div>

                  {/* Pulse Animation for Selected */}
                  {isSelected && (
                    <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${category.gradient} animate-ping opacity-75 pointer-events-none`}></div>
                  )}

                  {/* Ripple Effect */}
                  {isHovered && (
                    <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-pulse pointer-events-none"></div>
                  )}
                </button>

                {/* Category Name - Hidden on mobile, shown on desktop */}
                <div className={`hidden sm:block absolute top-24 left-1/2 transform -translate-x-1/2 transition-all duration-300 pointer-events-none ${
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

    </div>
  );
};

export default HolisticCategorySelector; 