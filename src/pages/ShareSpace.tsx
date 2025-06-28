import React, { useState } from 'react';
import { Home, MapPin, Users, Camera, Plus, X, Sprout, Bot as Lotus, ChefHat, Palette, Stethoscope, Music, Shield, Clock, DollarSign, Accessibility, Globe } from 'lucide-react';

const ShareSpace = () => {
  const [formData, setFormData] = useState({
    name: '',
    spaceType: '',
    description: '',
    address: '',
    capacity: '',
    amenities: [],
    accessibility: [],
    availability: {
      monday: { available: false, times: [] },
      tuesday: { available: false, times: [] },
      wednesday: { available: false, times: [] },
      thursday: { available: false, times: [] },
      friday: { available: false, times: [] },
      saturday: { available: false, times: [] },
      sunday: { available: false, times: [] }
    },
    guidelines: '',
    donationSuggested: '',
    maxRadius: 2,
    holisticFriendly: [],
    listPublicly: false
  });

  const spaceTypes = [
    { id: 'backyard', name: 'Backyard/Garden', icon: Sprout },
    { id: 'garage', name: 'Garage/Workshop', icon: Home },
    { id: 'basement', name: 'Basement/Studio', icon: Home },
    { id: 'living_room', name: 'Living Room', icon: Home },
    { id: 'community_room', name: 'Community Room', icon: Users },
    { id: 'outdoor_space', name: 'Outdoor Space', icon: Sprout }
  ];

  const amenities = [
    'Kitchen access', 'Bathroom access', 'Parking available', 'Public transit nearby',
    'Sound system', 'Projector/screen', 'Tables and chairs', 'Yoga mats available',
    'Garden tools', 'Art supplies', 'Cooking equipment', 'Musical instruments'
  ];

  const accessibilityFeatures = [
    'Wheelchair accessible', 'Ground floor access', 'Accessible parking',
    'Accessible bathroom', 'Well-lit pathways', 'Minimal steps'
  ];

  const holisticCategories = [
    { id: 'gardening', name: 'Gardening & Sustainability', icon: Sprout },
    { id: 'yoga', name: 'Yoga & Meditation', icon: Lotus },
    { id: 'cooking', name: 'Cooking & Nutrition', icon: ChefHat },
    { id: 'art', name: 'Art & Creativity', icon: Palette },
    { id: 'healing', name: 'Healing & Wellness', icon: Stethoscope },
    { id: 'music', name: 'Music & Movement', icon: Music }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (array: string[], item: string) => {
    const current = formData[array as keyof typeof formData] as string[];
    const updated = current.includes(item)
      ? current.filter(i => i !== item)
      : [...current, item];
    handleInputChange(array, updated);
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-forest-800 mb-2">Share Your Space</h1>
          <p className="text-forest-600">Open your space to neighbors for holistic community events</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <form className="p-8 space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-forest-800 border-b border-forest-100 pb-3">
                <Home className="h-5 w-5 inline mr-2" />
                Space Details
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-2">Space Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Sarah's Garden Sanctuary, Community Art Studio"
                  className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-3">Space Type</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {spaceTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handleInputChange('spaceType', type.id)}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                          formData.spaceType === type.id
                            ? 'border-forest-300 bg-forest-50 transform scale-105'
                            : 'border-forest-100 hover:border-forest-200 hover:bg-forest-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className="h-5 w-5 text-forest-600" />
                          <span className="font-medium text-forest-800 text-sm">{type.name}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-2">Description</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your space, its atmosphere, and what makes it special for community gatherings..."
                  className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-forest-800 border-b border-forest-100 pb-3">
                <MapPin className="h-5 w-5 inline mr-2" />
                Location & Accessibility
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-2">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Street address (exact address shared only with confirmed hosts)"
                  className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                />
                <p className="text-xs text-forest-600 mt-2 flex items-center">
                  <Shield className="h-3 w-3 mr-1" />
                  Exact address will only be shared with confirmed bookings
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">
                    <Users className="h-4 w-4 inline mr-1" />
                    Capacity
                  </label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => handleInputChange('capacity', e.target.value)}
                    placeholder="Maximum number of people"
                    className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">
                    <Shield className="h-4 w-4 inline mr-1" />
                    Maximum Booking Radius
                  </label>
                  <select
                    value={formData.maxRadius}
                    onChange={(e) => handleInputChange('maxRadius', Number(e.target.value))}
                    disabled={formData.listPublicly}
                    className={`w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent ${
                      formData.listPublicly ? 'bg-gray-100 text-gray-500' : ''
                    }`}
                  >
                    <option value={1}>1 mile (close neighbors)</option>
                    <option value={2}>2 miles (neighborhood)</option>
                    <option value={3}>3 miles (extended community)</option>
                  </select>
                </div>
              </div>

              {/* Public Listing Option */}
              <div className="bg-gradient-to-r from-earth-50 to-forest-50 rounded-lg p-6 border border-earth-200">
                <label className="flex items-start space-x-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.listPublicly}
                    onChange={(e) => handleInputChange('listPublicly', e.target.checked)}
                    className="w-5 h-5 text-forest-600 bg-forest-100 border-forest-300 rounded focus:ring-forest-500 focus:ring-2 mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Globe className="h-5 w-5 text-earth-500" />
                      <span className="font-semibold text-forest-800">List publicly (no radius restriction)</span>
                    </div>
                    <p className="text-sm text-forest-600 leading-relaxed">
                      Make your space available to the global community. This will override the radius setting and 
                      allow anyone worldwide to book your space for events. Great for virtual events or when you 
                      want to welcome travelers and distant community members.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Amenities */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-forest-800 border-b border-forest-100 pb-3">
                Available Amenities
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {amenities.map((amenity) => (
                  <label key={amenity} className="flex items-center space-x-3 p-3 bg-forest-50 rounded-lg hover:bg-forest-100 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity)}
                      onChange={() => toggleArrayItem('amenities', amenity)}
                      className="w-4 h-4 text-forest-600 bg-forest-100 border-forest-300 rounded focus:ring-forest-500 focus:ring-2"
                    />
                    <span className="text-sm text-forest-700">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Accessibility */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-forest-800 border-b border-forest-100 pb-3">
                <Accessibility className="h-5 w-5 inline mr-2" />
                Accessibility Features
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {accessibilityFeatures.map((feature) => (
                  <label key={feature} className="flex items-center space-x-3 p-3 bg-forest-50 rounded-lg hover:bg-forest-100 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.accessibility.includes(feature)}
                      onChange={() => toggleArrayItem('accessibility', feature)}
                      className="w-4 h-4 text-forest-600 bg-forest-100 border-forest-300 rounded focus:ring-forest-500 focus:ring-2"
                    />
                    <span className="text-sm text-forest-700">{feature}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Holistic Categories */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-forest-800 border-b border-forest-100 pb-3">
                Ideal for These Activities
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {holisticCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <label key={category.id} className="flex items-center space-x-3 p-4 bg-forest-50 rounded-lg hover:bg-forest-100 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.holisticFriendly.includes(category.id)}
                        onChange={() => toggleArrayItem('holisticFriendly', category.id)}
                        className="w-4 h-4 text-forest-600 bg-forest-100 border-forest-300 rounded focus:ring-forest-500 focus:ring-2"
                      />
                      <Icon className="h-5 w-5 text-forest-600" />
                      <span className="text-sm text-forest-700">{category.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Community Guidelines */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-forest-800 border-b border-forest-100 pb-3">
                Community Guidelines
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-2">Space Guidelines</label>
                <textarea
                  rows={4}
                  value={formData.guidelines}
                  onChange={(e) => handleInputChange('guidelines', e.target.value)}
                  placeholder="Any specific guidelines for using your space (e.g., shoes off, quiet hours, cleanup expectations)..."
                  className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-2">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Suggested Contribution
                </label>
                <input
                  type="text"
                  value={formData.donationSuggested}
                  onChange={(e) => handleInputChange('donationSuggested', e.target.value)}
                  placeholder="e.g., $10 per event, Free, Utilities contribution"
                  className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                />
                <p className="text-xs text-forest-600 mt-1">
                  Optional contribution to help with utilities, maintenance, or community fund
                </p>
              </div>
            </div>

            {/* Photos */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-forest-800 border-b border-forest-100 pb-3">
                <Camera className="h-5 w-5 inline mr-2" />
                Photos
              </h2>
              
              <div className="border-2 border-dashed border-forest-200 rounded-lg p-8 text-center hover:border-forest-300 transition-colors">
                <Camera className="h-12 w-12 text-forest-400 mx-auto mb-4" />
                <p className="text-forest-600 mb-2">Add photos of your space</p>
                <p className="text-sm text-forest-500 mb-4">Help neighbors visualize your space for their events</p>
                <button
                  type="button"
                  className="bg-forest-600 hover:bg-forest-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Upload Photos
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="border-t border-forest-100 pt-6">
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  className="px-6 py-3 border border-forest-300 text-forest-700 rounded-lg hover:bg-forest-50 transition-colors"
                >
                  Save as Draft
                </button>
                <button
                  type="submit"
                  className="bg-forest-600 hover:bg-forest-700 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
                >
                  Share My Space
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ShareSpace;