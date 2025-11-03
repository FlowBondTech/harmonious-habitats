import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  X,
  Info,
  ChevronDown,
  ChevronUp,
  Home,
  Building2,
  Gift,
  ListChecks
} from 'lucide-react';
import { getRegistryTemplate, hasTemplate, type RegistryTemplateItem } from '../lib/registryTemplates';
import type { EventMaterial } from '../lib/supabase';

interface EventRegistrySetupProps {
  category: string;
  venueType: 'home' | 'studio';
  onVenueTypeChange: (venueType: 'home' | 'studio') => void;
  registryEnabled: boolean;
  onRegistryEnabledChange: (enabled: boolean) => void;
  registryVisibility: 'public' | 'organizer_only';
  onRegistryVisibilityChange: (visibility: 'public' | 'organizer_only') => void;
  materials: Partial<EventMaterial>[];
  onMaterialsChange: (materials: Partial<EventMaterial>[]) => void;
}

const EventRegistrySetup: React.FC<EventRegistrySetupProps> = ({
  category,
  venueType,
  onVenueTypeChange,
  registryEnabled,
  onRegistryEnabledChange,
  registryVisibility,
  onRegistryVisibilityChange,
  materials,
  onMaterialsChange
}) => {
  const [expandedRequired, setExpandedRequired] = useState(true);
  const [expandedLending, setExpandedLending] = useState(true);
  const [hasLoadedTemplate, setHasLoadedTemplate] = useState(false);

  // Auto-load template when category or venue type changes
  useEffect(() => {
    if (!hasLoadedTemplate && category && hasTemplate(category)) {
      loadTemplate();
      setHasLoadedTemplate(true);
    }
  }, [category, venueType, hasLoadedTemplate]);

  const loadTemplate = () => {
    const template = getRegistryTemplate(category, venueType);
    if (template.length > 0) {
      const newMaterials: Partial<EventMaterial>[] = template.map((item: RegistryTemplateItem) => ({
        item: item.item,
        quantity: item.quantity,
        max_quantity: item.maxQuantity,
        is_required: item.isRequired,
        provider: item.provider,
        notes: item.notes,
        registry_type: item.registryType,
        visibility: 'public',
        is_template_item: true
      }));
      onMaterialsChange(newMaterials);
    }
  };

  const requiredMaterials = materials.filter(m => m.registry_type === 'required');
  const lendingMaterials = materials.filter(m => m.registry_type === 'lending');

  const addMaterial = (registryType: 'required' | 'lending') => {
    const newMaterial: Partial<EventMaterial> = {
      item: '',
      quantity: '',
      max_quantity: undefined,
      is_required: false,
      provider: 'participant',
      notes: '',
      registry_type: registryType,
      visibility: 'public',
      is_template_item: false
    };
    onMaterialsChange([...materials, newMaterial]);
  };

  const updateMaterial = (index: number, field: keyof EventMaterial, value: any) => {
    const updated = [...materials];
    updated[index] = { ...updated[index], [field]: value };
    onMaterialsChange(updated);
  };

  const removeMaterial = (index: number) => {
    onMaterialsChange(materials.filter((_, i) => i !== index));
  };

  const reloadTemplate = () => {
    loadTemplate();
  };

  return (
    <div className="space-y-6">
      {/* Registry Enable/Disable Toggle */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <Package className="h-6 w-6 text-forest-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-forest-800 mb-1">Event Registry</h3>
                <p className="text-sm text-gray-600">
                  Let participants know what to bring or reserve items provided by you
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRegistryEnabledChange(!registryEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  registryEnabled ? 'bg-forest-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    registryEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {registryEnabled && (
        <>
          {/* Venue Type Selection */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <label className="block text-sm font-medium text-forest-800 mb-3">
              Where will this event take place?
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => onVenueTypeChange('home')}
                className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors ${
                  venueType === 'home'
                    ? 'border-forest-600 bg-forest-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Home className="h-6 w-6 text-forest-600" />
                <div className="text-left">
                  <div className="font-semibold text-forest-800">Home / Informal</div>
                  <div className="text-xs text-gray-600">Participants bring their own</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onVenueTypeChange('studio')}
                className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors ${
                  venueType === 'studio'
                    ? 'border-forest-600 bg-forest-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Building2 className="h-6 w-6 text-forest-600" />
                <div className="text-left">
                  <div className="font-semibold text-forest-800">Studio / Venue</div>
                  <div className="text-xs text-gray-600">Equipment provided</div>
                </div>
              </button>
            </div>

            {hasTemplate(category) && (
              <button
                type="button"
                onClick={reloadTemplate}
                className="mt-4 text-sm text-forest-600 hover:text-forest-700 font-medium"
              >
                Reload template for {category}
              </button>
            )}
          </div>

          {/* Registry Visibility */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <label className="block text-sm font-medium text-forest-800 mb-3">
              Who can see what people are bringing?
            </label>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => onRegistryVisibilityChange('public')}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                  registryVisibility === 'public'
                    ? 'border-forest-600 bg-forest-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-forest-800">All Registered Participants</div>
                <div className="text-sm text-gray-600 mt-1">
                  Everyone can see who's bringing what (recommended for potlucks & collaborative events)
                </div>
              </button>

              <button
                type="button"
                onClick={() => onRegistryVisibilityChange('organizer_only')}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                  registryVisibility === 'organizer_only'
                    ? 'border-forest-600 bg-forest-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-forest-800">Organizer Only</div>
                <div className="text-sm text-gray-600 mt-1">
                  Only you can see who claimed what (recommended for equipment reservations)
                </div>
              </button>
            </div>
          </div>

          {/* Required Items Section */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedRequired(!expandedRequired)}
              className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <ListChecks className="h-5 w-5 text-forest-600" />
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-forest-800">Required/Provided Items</h3>
                  <p className="text-sm text-gray-600">
                    {venueType === 'home'
                      ? 'What participants need to bring'
                      : 'Equipment provided by venue or required from participants'}
                  </p>
                </div>
              </div>
              {expandedRequired ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {expandedRequired && (
              <div className="p-6 pt-0 space-y-4">
                {requiredMaterials.map((material, index) => {
                  const globalIndex = materials.indexOf(material);
                  return (
                    <MaterialItemForm
                      key={globalIndex}
                      material={material}
                      onUpdate={(field, value) => updateMaterial(globalIndex, field, value)}
                      onRemove={() => removeMaterial(globalIndex)}
                    />
                  );
                })}

                <button
                  type="button"
                  onClick={() => addMaterial('required')}
                  className="w-full flex items-center justify-center space-x-2 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-forest-500 hover:bg-forest-50 transition-colors text-gray-600 hover:text-forest-700"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add Item</span>
                </button>
              </div>
            )}
          </div>

          {/* Lending Pool Section */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedLending(!expandedLending)}
              className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Gift className="h-5 w-5 text-forest-600" />
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-forest-800">Lending Pool (Extras to Share)</h3>
                  <p className="text-sm text-gray-600">
                    Items participants can bring to lend to others
                  </p>
                </div>
              </div>
              {expandedLending ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {expandedLending && (
              <div className="p-6 pt-0 space-y-4">
                {lendingMaterials.map((material, index) => {
                  const globalIndex = materials.indexOf(material);
                  return (
                    <MaterialItemForm
                      key={globalIndex}
                      material={material}
                      onUpdate={(field, value) => updateMaterial(globalIndex, field, value)}
                      onRemove={() => removeMaterial(globalIndex)}
                      isLending
                    />
                  );
                })}

                <button
                  type="button"
                  onClick={() => addMaterial('lending')}
                  className="w-full flex items-center justify-center space-x-2 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-forest-500 hover:bg-forest-50 transition-colors text-gray-600 hover:text-forest-700"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add Lending Item</span>
                </button>

                <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    Lending pool items are optional extras that participants can offer to bring for others to borrow
                    (e.g., extra yoga mats, musical instruments, art supplies)
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Material Item Form Component
interface MaterialItemFormProps {
  material: Partial<EventMaterial>;
  onUpdate: (field: keyof EventMaterial, value: any) => void;
  onRemove: () => void;
  isLending?: boolean;
}

const MaterialItemForm: React.FC<MaterialItemFormProps> = ({
  material,
  onUpdate,
  onRemove,
  isLending = false
}) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      {/* Item Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Item Name *
        </label>
        <input
          type="text"
          value={material.item || ''}
          onChange={(e) => onUpdate('item', e.target.value)}
          placeholder={isLending ? 'e.g., Extra yoga mats' : 'e.g., Yoga mat'}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
        />
      </div>

      {/* Quantity and Max Quantity */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity Description
          </label>
          <input
            type="text"
            value={material.quantity || ''}
            onChange={(e) => onUpdate('quantity', e.target.value)}
            placeholder="e.g., 1 per person"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Available
          </label>
          <input
            type="number"
            value={material.max_quantity || ''}
            onChange={(e) => onUpdate('max_quantity', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="Unlimited"
            min={0}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
          />
        </div>
      </div>

      {/* Provider */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Who Provides This?
        </label>
        <select
          value={material.provider || 'participant'}
          onChange={(e) => onUpdate('provider', e.target.value as any)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
        >
          <option value="participant">Participants bring</option>
          <option value="organizer">Organizer provides</option>
          <option value="either">Either works</option>
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes (Optional)
        </label>
        <textarea
          value={material.notes || ''}
          onChange={(e) => onUpdate('notes', e.target.value)}
          placeholder={isLending ? 'e.g., Bring extras if you have them' : 'e.g., Please label with your name'}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
        />
      </div>

      {/* Required Checkbox (only for non-lending items) */}
      {!isLending && (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={`required-${material.item}`}
            checked={material.is_required || false}
            onChange={(e) => onUpdate('is_required', e.target.checked)}
            className="h-4 w-4 text-forest-600 focus:ring-forest-500 border-gray-300 rounded"
          />
          <label htmlFor={`required-${material.item}`} className="text-sm text-gray-700">
            Required item
          </label>
        </div>
      )}

      {/* Remove Button */}
      <button
        type="button"
        onClick={onRemove}
        className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-700"
      >
        <X className="h-4 w-4" />
        <span>Remove</span>
      </button>
    </div>
  );
};

export default EventRegistrySetup;
