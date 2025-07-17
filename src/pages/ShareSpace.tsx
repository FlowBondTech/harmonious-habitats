import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, MapPin, Users, Camera, X, Sprout, Bot as Lotus, ChefHat, Palette, Stethoscope, Music, Shield, DollarSign, Accessibility, Globe, Cat, Dog, Bird, Fish, Rabbit, Info, Calendar } from 'lucide-react';
import { useAuthContext } from '../components/AuthProvider';
import { supabase } from '../lib/supabase';

const ShareSpace = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
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
    animals: {
      allowed: false,
      types: []
    },
    ownerPets: {
      hasPets: false,
      types: []
    },
    holisticFriendly: [],
    listPublicly: false,
    images: [] as File[],
    // Facilitator application settings
    allowFacilitatorApplications: false,
    applicationRequirements: {
      min_experience_years: 0,
      required_certifications: [] as string[],
      insurance_required: true,
      portfolio_required: false,
      description: ''
    },
    bookingPreferences: {
      min_advance_notice: 24,
      max_booking_duration: 4,
      available_days: [] as string[],
      available_times: {
        start: '09:00',
        end: '18:00'
      },
      auto_approve_verified: false
    }
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

  const animalTypes = [
    { id: 'dogs', name: 'Dogs', icon: Dog },
    { id: 'cats', name: 'Cats', icon: Cat },
    { id: 'birds', name: 'Birds', icon: Bird },
    { id: 'fish', name: 'Fish', icon: Fish },
    { id: 'small_pets', name: 'Small Pets', icon: Rabbit }
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

  const toggleAnimalType = (animalId: string) => {
    const current = formData.animals.types;
    const updated = current.includes(animalId)
      ? current.filter(id => id !== animalId)
      : [...current, animalId];
    
    setFormData(prev => ({
      ...prev,
      animals: {
        ...prev.animals,
        types: updated
      }
    }));
  };

  const toggleOwnerPetType = (animalId: string) => {
    const current = formData.ownerPets.types;
    const updated = current.includes(animalId)
      ? current.filter(id => id !== animalId)
      : [...current, animalId];
    
    setFormData(prev => ({
      ...prev,
      ownerPets: {
        ...prev.ownerPets,
        types: updated
      }
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Space name is required');
      return false;
    }
    if (!formData.spaceType) {
      setError('Please select a space type');
      return false;
    }
    if (!formData.address.trim()) {
      setError('Address is required');
      return false;
    }
    if (!formData.capacity || parseInt(formData.capacity) < 1) {
      setError('Capacity must be at least 1');
      return false;
    }
    return true;
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files].slice(0, 5) // Max 5 images
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be signed in to share a space');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Upload images to Supabase Storage
      const imageUrls: string[] = [];
      
      if (formData.images.length > 0) {
        
        for (const image of formData.images) {
          const fileExt = image.name.split('.').pop();
          const fileName = `${user.id}_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
          
          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('space-images')
            .upload(fileName, image, {
              cacheControl: '3600',
              upsert: false
            });
          
          if (uploadError) {
            throw new Error(`Failed to upload image: ${uploadError.message}`);
          }
          
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('space-images')
            .getPublicUrl(fileName);
          
          imageUrls.push(publicUrl);
        }
      }

      // Create the space
      const spaceData = {
        owner_id: user.id,
        name: formData.name.trim(),
        type: formData.spaceType,
        description: formData.description.trim() || null,
        address: formData.address.trim(),
        capacity: parseInt(formData.capacity),
        max_radius: formData.listPublicly ? null : formData.maxRadius,
        list_publicly: formData.listPublicly,
        guidelines: formData.guidelines.trim() || null,
        animals_allowed: formData.animals.allowed,
        owner_has_pets: formData.ownerPets.hasPets,
        owner_pet_types: formData.ownerPets.hasPets ? formData.ownerPets.types : null,
        donation_suggested: formData.donationSuggested.trim() || null,
        image_urls: imageUrls,
        verified: false,
        status: 'pending_approval' as const,
        // Facilitator application settings
        allow_facilitator_applications: formData.allowFacilitatorApplications,
        application_requirements: formData.applicationRequirements,
        booking_preferences: formData.bookingPreferences
      };

      const { data: space, error: spaceError } = await supabase
        .from('spaces')
        .insert([spaceData])
        .select()
        .single();

      if (spaceError) throw spaceError;

      // Add amenities
      if (formData.amenities.length > 0) {
        const amenityData = formData.amenities.map(amenity => ({
          space_id: space.id,
          amenity
        }));
        
        const { error: amenityError } = await supabase
          .from('space_amenities')
          .insert(amenityData);
        
        if (amenityError) throw amenityError;
      }

      // Add accessibility features
      if (formData.accessibility.length > 0) {
        const accessibilityData = formData.accessibility.map(feature => ({
          space_id: space.id,
          feature
        }));
        
        const { error: accessibilityError } = await supabase
          .from('space_accessibility_features')
          .insert(accessibilityData);
        
        if (accessibilityError) throw accessibilityError;
      }

      // Add holistic categories
      if (formData.holisticFriendly.length > 0) {
        const categoryData = formData.holisticFriendly.map(category => ({
          space_id: space.id,
          category
        }));
        
        const { error: categoryError } = await supabase
          .from('space_holistic_categories')
          .insert(categoryData);
        
        if (categoryError) throw categoryError;
      }

      // Add animal types if animals are allowed
      if (formData.animals.allowed && formData.animals.types.length > 0) {
        const animalData = formData.animals.types.map(animal => ({
          space_id: space.id,
          animal_type: animal
        }));
        
        const { error: animalError } = await supabase
          .from('space_animal_types')
          .insert(animalData);
        
        if (animalError) throw animalError;
      }

      setSuccess('Space shared successfully! It will be reviewed before being published.');
      
      // Redirect after success
      setTimeout(() => {
        navigate('/activities');
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to share space');
    } finally {
      setLoading(false);
    }
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
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Error/Success Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}

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
                  required
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
                  required
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
                    min="1"
                    required
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

            {/* Animals */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-forest-800 border-b border-forest-100 pb-3">
                <Cat className="h-5 w-5 inline mr-2" />
                Animals & Pets
              </h2>
              
              <div className="bg-gradient-to-r from-earth-50 to-forest-50 rounded-lg p-6 border border-earth-200">
                <label className="flex items-start space-x-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.animals.allowed}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      animals: {
                        ...prev.animals,
                        allowed: e.target.checked
                      }
                    }))}
                    className="w-5 h-5 text-forest-600 bg-forest-100 border-forest-300 rounded focus:ring-forest-500 focus:ring-2 mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Dog className="h-5 w-5 text-earth-500" />
                      <span className="font-semibold text-forest-800">Pet-friendly space</span>
                    </div>
                    <p className="text-sm text-forest-600 leading-relaxed">
                      Indicate if your space is pet-friendly and what types of animals are welcome. This helps community members with pets find suitable spaces for events.
                    </p>
                  </div>
                </label>
              </div>
              
              {formData.animals.allowed && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-forest-700 mb-3">
                    What types of animals are welcome?
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {animalTypes.map((animal) => {
                      const Icon = animal.icon;
                      const isSelected = formData.animals.types.includes(animal.id);
                      return (
                        <button
                          key={animal.id}
                          type="button"
                          onClick={() => toggleAnimalType(animal.id)}
                          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                            isSelected
                              ? 'border-forest-300 bg-forest-50'
                              : 'border-forest-100 hover:border-forest-200 hover:bg-forest-50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className={`h-5 w-5 ${isSelected ? 'text-forest-600' : 'text-forest-400'}`} />
                            <span className="font-medium text-forest-800 text-sm">{animal.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Info className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-blue-700">
                          Please note that service animals are always welcome regardless of your pet policy, in accordance with accessibility guidelines.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Owner Pets Section */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-6 border border-amber-200">
                <label className="flex items-start space-x-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.ownerPets.hasPets}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      ownerPets: {
                        ...prev.ownerPets,
                        hasPets: e.target.checked
                      }
                    }))}
                    className="w-5 h-5 text-orange-600 bg-orange-100 border-orange-300 rounded focus:ring-orange-500 focus:ring-2 mt-1"
                  />
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Cat className="h-5 w-5 text-amber-600" />
                      <span className="font-semibold text-forest-800">I have pets at this space</span>
                    </div>
                    <p className="text-sm text-forest-600 leading-relaxed">
                      Let facilitators know if you have pets living at this space. This helps them prepare appropriately for their sessions.
                    </p>
                  </div>
                </label>
              </div>
              
              {formData.ownerPets.hasPets && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-forest-700 mb-3">
                    What pets do you have?
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {animalTypes.map((animal) => {
                      const Icon = animal.icon;
                      const isSelected = formData.ownerPets.types.includes(animal.id);
                      return (
                        <button
                          key={animal.id}
                          type="button"
                          onClick={() => toggleOwnerPetType(animal.id)}
                          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                            isSelected 
                              ? 'border-amber-500 bg-amber-100 text-amber-800' 
                              : 'border-gray-200 bg-white text-gray-600 hover:border-amber-300'
                          }`}
                        >
                          <div className="flex flex-col items-center space-y-2">
                            <Icon className={`h-6 w-6 ${isSelected ? 'text-amber-600' : 'text-gray-500'}`} />
                            <span className="font-medium text-forest-800 text-sm">{animal.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
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

            {/* Facilitator Applications */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-forest-800 border-b border-forest-100 pb-3">
                <Users className="h-5 w-5 inline mr-2" />
                Facilitator Applications
              </h2>
              
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                <label className="flex items-start space-x-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowFacilitatorApplications}
                    onChange={(e) => handleInputChange('allowFacilitatorApplications', e.target.checked)}
                    className="w-5 h-5 text-purple-600 bg-purple-100 border-purple-300 rounded focus:ring-purple-500 focus:ring-2 mt-1"
                  />
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Shield className="h-5 w-5 text-purple-600" />
                      <span className="font-medium text-forest-800">Accept Applications from Facilitators</span>
                    </div>
                    <p className="text-sm text-forest-600">
                      Allow verified community facilitators to apply to use your space for regular classes, workshops, or healing sessions. 
                      You'll review each application and can set specific requirements.
                    </p>
                  </div>
                </label>
              </div>

              {formData.allowFacilitatorApplications && (
                <div className="space-y-6 bg-gray-50 rounded-lg p-6">
                  <h3 className="font-medium text-forest-800 flex items-center">
                    <Info className="h-4 w-4 mr-2" />
                    Application Requirements
                  </h3>

                  {/* Minimum Experience */}
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      Minimum Years of Experience
                    </label>
                    <select
                      value={formData.applicationRequirements.min_experience_years}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        applicationRequirements: {
                          ...prev.applicationRequirements,
                          min_experience_years: parseInt(e.target.value)
                        }
                      }))}
                      className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                    >
                      <option value={0}>No minimum requirement</option>
                      <option value={1}>1+ years</option>
                      <option value={2}>2+ years</option>
                      <option value={3}>3+ years</option>
                      <option value={5}>5+ years</option>
                    </select>
                  </div>

                  {/* Requirements Checkboxes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-forest-200 cursor-pointer hover:bg-forest-50">
                      <input
                        type="checkbox"
                        checked={formData.applicationRequirements.insurance_required}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          applicationRequirements: {
                            ...prev.applicationRequirements,
                            insurance_required: e.target.checked
                          }
                        }))}
                        className="w-4 h-4 text-forest-600"
                      />
                      <span className="text-sm text-forest-700">Liability Insurance Required</span>
                    </label>

                    <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-forest-200 cursor-pointer hover:bg-forest-50">
                      <input
                        type="checkbox"
                        checked={formData.applicationRequirements.portfolio_required}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          applicationRequirements: {
                            ...prev.applicationRequirements,
                            portfolio_required: e.target.checked
                          }
                        }))}
                        className="w-4 h-4 text-forest-600"
                      />
                      <span className="text-sm text-forest-700">Portfolio/References Required</span>
                    </label>
                  </div>

                  {/* Application Description */}
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      Requirements Description
                    </label>
                    <textarea
                      rows={3}
                      value={formData.applicationRequirements.description}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        applicationRequirements: {
                          ...prev.applicationRequirements,
                          description: e.target.value
                        }
                      }))}
                      placeholder="Describe any specific requirements, preferred practices, or what you're looking for in facilitators..."
                      className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                    />
                  </div>

                  <h3 className="font-medium text-forest-800 flex items-center border-t border-forest-200 pt-4">
                    <Calendar className="h-4 w-4 mr-2" />
                    Booking Preferences
                  </h3>

                  {/* Advance Notice */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">
                        Minimum Advance Notice
                      </label>
                      <select
                        value={formData.bookingPreferences.min_advance_notice}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          bookingPreferences: {
                            ...prev.bookingPreferences,
                            min_advance_notice: parseInt(e.target.value)
                          }
                        }))}
                        className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                      >
                        <option value={2}>2 hours</option>
                        <option value={6}>6 hours</option>
                        <option value={12}>12 hours</option>
                        <option value={24}>24 hours</option>
                        <option value={48}>48 hours</option>
                        <option value={168}>1 week</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">
                        Maximum Session Duration
                      </label>
                      <select
                        value={formData.bookingPreferences.max_booking_duration}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          bookingPreferences: {
                            ...prev.bookingPreferences,
                            max_booking_duration: parseInt(e.target.value)
                          }
                        }))}
                        className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                      >
                        <option value={1}>1 hour</option>
                        <option value={2}>2 hours</option>
                        <option value={3}>3 hours</option>
                        <option value={4}>4 hours</option>
                        <option value={6}>6 hours</option>
                        <option value={8}>8 hours</option>
                      </select>
                    </div>
                  </div>

                  {/* Auto-approve Verified */}
                  <div>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.bookingPreferences.auto_approve_verified}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          bookingPreferences: {
                            ...prev.bookingPreferences,
                            auto_approve_verified: e.target.checked
                          }
                        }))}
                        className="w-4 h-4 text-forest-600"
                      />
                      <span className="text-sm text-forest-700">
                        Auto-approve applications from verified facilitators
                      </span>
                    </label>
                    <p className="text-xs text-forest-500 ml-7 mt-1">
                      Verified facilitators with good community standing will be automatically approved
                    </p>
                  </div>
                </div>
              )}
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
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="space-images"
                />
                <label
                  htmlFor="space-images"
                  className="bg-forest-600 hover:bg-forest-700 text-white px-6 py-2 rounded-lg font-medium transition-colors cursor-pointer inline-block"
                >
                  Upload Photos
                </label>
                <p className="text-xs text-forest-500 mt-2">Max 5 images, JPG/PNG only</p>
              </div>
              
              {/* Image Preview */}
              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Space preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="border-t border-forest-100 pt-6">
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  disabled={loading}
                  className="px-6 py-3 border border-forest-300 text-forest-700 rounded-lg hover:bg-forest-50 transition-colors"
                >
                  Save as Draft
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-forest-600 hover:bg-forest-700 disabled:bg-forest-300 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sharing...</span>
                    </>
                  ) : (
                    <span>Share My Space</span>
                  )}
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