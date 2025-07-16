import React, { useState } from 'react';
import { Plus, X, Package, Wrench, Home, BookOpen, DollarSign, Clock, MapPin, Gift } from 'lucide-react';
import { ProfileOffering } from '../lib/supabase';

interface ProfileOfferingsSectionProps {
  offerings: ProfileOffering[];
  onOfferingsUpdate: (offerings: ProfileOffering[]) => void;
  isEditing: boolean;
}

const ProfileOfferingsSection: React.FC<ProfileOfferingsSectionProps> = ({
  offerings,
  onOfferingsUpdate,
  isEditing
}) => {
  const [showAddOffering, setShowAddOffering] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [newOffering, setNewOffering] = useState<Partial<ProfileOffering>>({
    title: '',
    category: 'service',
    description: '',
    type: 'service',
    availability: 'on_request',
    cost_type: 'free',
    cost_amount: '',
    location_required: false
  });

  const offeringTypes = [
    { 
      id: 'service', 
      name: 'Service', 
      icon: BookOpen, 
      description: 'Teaching, consulting, or hands-on help',
      color: 'bg-blue-100 text-blue-800'
    },
    { 
      id: 'resource', 
      name: 'Resource', 
      icon: Package, 
      description: 'Materials, supplies, or consumables',
      color: 'bg-green-100 text-green-800'
    },
    { 
      id: 'equipment', 
      name: 'Equipment', 
      icon: Wrench, 
      description: 'Tools, devices, or reusable items',
      color: 'bg-purple-100 text-purple-800'
    },
    { 
      id: 'space', 
      name: 'Space', 
      icon: Home, 
      description: 'Physical locations for events or activities',
      color: 'bg-orange-100 text-orange-800'
    },
    { 
      id: 'knowledge', 
      name: 'Knowledge', 
      icon: BookOpen, 
      description: 'Information, guidance, or mentorship',
      color: 'bg-indigo-100 text-indigo-800'
    }
  ];

  const availabilityOptions = [
    { value: 'always', label: 'Always Available', description: 'Available anytime' },
    { value: 'scheduled', label: 'Scheduled Times', description: 'Available at specific times' },
    { value: 'on_request', label: 'On Request', description: 'Available when requested' },
  ];

  const costTypes = [
    { value: 'free', label: 'Free', icon: Gift, color: 'text-green-600' },
    { value: 'donation', label: 'Donation', icon: Gift, color: 'text-blue-600' },
    { value: 'barter', label: 'Barter/Trade', icon: Package, color: 'text-purple-600' },
    { value: 'paid', label: 'Paid', icon: DollarSign, color: 'text-orange-600' },
  ];

  const addOffering = () => {
    if (!newOffering.title || !newOffering.description) return;
    
    const offering: ProfileOffering = {
      id: Date.now().toString(),
      title: newOffering.title!,
      category: newOffering.category!,
      description: newOffering.description!,
      type: newOffering.type!,
      availability: newOffering.availability!,
      cost_type: newOffering.cost_type!,
      cost_amount: newOffering.cost_amount,
      location_required: newOffering.location_required!
    };
    
    onOfferingsUpdate([...offerings, offering]);
    setNewOffering({
      title: '',
      category: 'service',
      description: '',
      type: 'service',
      availability: 'on_request',
      cost_type: 'free',
      cost_amount: '',
      location_required: false
    });
    setShowAddOffering(false);
  };

  const removeOffering = (id: string) => {
    const updatedOfferings = offerings.filter(offering => offering.id !== id);
    onOfferingsUpdate(updatedOfferings);
  };

  const getFilteredOfferings = () => {
    if (activeTab === 'all') return offerings;
    return offerings.filter(offering => offering.type === activeTab);
  };

  const getOfferingIcon = (type: string) => {
    const offeringType = offeringTypes.find(t => t.id === type);
    return offeringType?.icon || Package;
  };

  const getCostTypeIcon = (costType: string) => {
    const cost = costTypes.find(c => c.value === costType);
    return cost?.icon || Gift;
  };

  const filteredOfferings = getFilteredOfferings();

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Package className="h-5 w-5 text-forest-600" />
          <h3 className="text-xl font-semibold text-forest-800">What I Offer</h3>
        </div>
        {isEditing && (
          <button
            onClick={() => setShowAddOffering(true)}
            className="flex items-center space-x-2 text-sm bg-forest-600 hover:bg-forest-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Offering</span>
          </button>
        )}
      </div>

      {/* Offerings Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {offeringTypes.map(type => {
          const count = offerings.filter(o => o.type === type.id).length;
          return (
            <div key={type.id} className="bg-forest-50 rounded-lg p-4 text-center">
              <type.icon className="h-6 w-6 text-forest-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-forest-800">{count}</div>
              <div className="text-xs text-forest-600">{type.name}</div>
            </div>
          );
        })}
      </div>

      {/* Offering Type Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-white text-forest-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          All ({offerings.length})
        </button>
        {offeringTypes.map(type => {
          const count = offerings.filter(o => o.type === type.id).length;
          return (
            <button
              key={type.id}
              onClick={() => setActiveTab(type.id)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === type.id
                  ? 'bg-white text-forest-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {type.name} ({count})
            </button>
          );
        })}
      </div>

      {filteredOfferings.length === 0 ? (
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {activeTab === 'all' ? 'No offerings added yet' : `No ${activeTab} offerings yet`}
          </p>
          {isEditing && (
            <button
              onClick={() => setShowAddOffering(true)}
              className="mt-3 text-forest-600 hover:text-forest-700"
            >
              Add your first offering
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOfferings.map((offering) => {
            const Icon = getOfferingIcon(offering.type);
            const CostIcon = getCostTypeIcon(offering.cost_type);
            const offeringType = offeringTypes.find(t => t.id === offering.type);
            
            return (
              <div key={offering.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${offeringType?.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-forest-800">{offering.title}</h4>
                      <span className="text-xs text-gray-500 capitalize">{offering.type}</span>
                    </div>
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => removeOffering(offering.id)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-4">{offering.description}</p>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-600 capitalize">
                        {offering.availability.replace('_', ' ')}
                      </span>
                    </div>
                    
                    {offering.location_required && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-600">Location required</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    <CostIcon className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-600 capitalize">
                      {offering.cost_type === 'paid' && offering.cost_amount
                        ? `$${offering.cost_amount}`
                        : offering.cost_type}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Offering Modal */}
      {showAddOffering && isEditing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-forest-800">Add New Offering</h3>
                <button
                  onClick={() => setShowAddOffering(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newOffering.title}
                    onChange={(e) => setNewOffering(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Yoga instruction, Garden tools, Workshop space"
                    className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                  />
                </div>

                {/* Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-3">
                    Offering Type *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {offeringTypes.map(type => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setNewOffering(prev => ({ ...prev, type: type.id as any }))}
                          className={`p-4 rounded-lg border-2 text-left transition-colors ${
                            newOffering.type === type.id
                              ? 'border-forest-300 bg-forest-50'
                              : 'border-gray-200 hover:border-forest-200'
                          }`}
                        >
                          <div className="flex items-center space-x-3 mb-2">
                            <Icon className="h-5 w-5 text-forest-600" />
                            <span className="font-medium">{type.name}</span>
                          </div>
                          <div className="text-sm text-gray-600">{type.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    rows={4}
                    value={newOffering.description}
                    onChange={(e) => setNewOffering(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what you're offering, any requirements, and what makes it special..."
                    className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                  />
                </div>

                {/* Availability */}
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-3">
                    Availability
                  </label>
                  <div className="space-y-2">
                    {availabilityOptions.map(option => (
                      <label key={option.value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name="availability"
                          value={option.value}
                          checked={newOffering.availability === option.value}
                          onChange={(e) => setNewOffering(prev => ({ ...prev, availability: e.target.value as any }))}
                          className="w-4 h-4 text-forest-600"
                        />
                        <div>
                          <div className="font-medium text-forest-800">{option.label}</div>
                          <div className="text-sm text-gray-600">{option.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Cost Type */}
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-3">
                    Cost Type
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {costTypes.map(cost => {
                      const Icon = cost.icon;
                      return (
                        <button
                          key={cost.value}
                          type="button"
                          onClick={() => setNewOffering(prev => ({ ...prev, cost_type: cost.value as any }))}
                          className={`p-3 rounded-lg border-2 text-center transition-colors ${
                            newOffering.cost_type === cost.value
                              ? 'border-forest-300 bg-forest-50'
                              : 'border-gray-200 hover:border-forest-200'
                          }`}
                        >
                          <Icon className={`h-5 w-5 mx-auto mb-1 ${cost.color}`} />
                          <div className="text-sm font-medium">{cost.label}</div>
                        </button>
                      );
                    })}
                  </div>
                  
                  {newOffering.cost_type === 'paid' && (
                    <div className="mt-3">
                      <input
                        type="text"
                        value={newOffering.cost_amount}
                        onChange={(e) => setNewOffering(prev => ({ ...prev, cost_amount: e.target.value }))}
                        placeholder="Amount (e.g., 25, 50/hour)"
                        className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                      />
                    </div>
                  )}
                </div>

                {/* Location Required */}
                <div>
                  <label className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newOffering.location_required}
                      onChange={(e) => setNewOffering(prev => ({ ...prev, location_required: e.target.checked }))}
                      className="w-4 h-4 text-forest-600 rounded focus:ring-forest-500"
                    />
                    <div>
                      <div className="font-medium text-forest-800">Location Required</div>
                      <div className="text-sm text-gray-600">This offering requires a specific physical location</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 mt-8">
                <button
                  onClick={addOffering}
                  disabled={!newOffering.title || !newOffering.description}
                  className="flex-1 bg-forest-600 hover:bg-forest-700 disabled:bg-gray-300 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  Add Offering
                </button>
                <button
                  onClick={() => setShowAddOffering(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileOfferingsSection; 