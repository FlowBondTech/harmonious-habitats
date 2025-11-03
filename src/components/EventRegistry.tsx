import React, { useState, useEffect } from 'react';
import {
  Package,
  Check,
  X,
  Gift,
  ListChecks,
  Info,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  User
} from 'lucide-react';
import type { EventMaterial, EventMaterialClaim, Profile } from '../lib/supabase';
import Avatar from './Avatar';

interface EventRegistryProps {
  eventId: string;
  currentUserId: string;
  materials: (EventMaterial & {
    claims?: (EventMaterialClaim & { user?: Profile })[];
  })[];
  userClaims: EventMaterialClaim[];
  registryVisibility: 'public' | 'organizer_only';
  isOrganizer: boolean;
  onClaimItem: (materialId: string, claimType: 'personal' | 'lending', quantity: number, notes?: string) => Promise<void>;
  onUnclaimItem: (claimId: string) => Promise<void>;
  onUpdateClaim: (claimId: string, quantity: number, notes?: string) => Promise<void>;
}

const EventRegistry: React.FC<EventRegistryProps> = ({
  eventId,
  currentUserId,
  materials,
  userClaims,
  registryVisibility,
  isOrganizer,
  onClaimItem,
  onUnclaimItem,
  onUpdateClaim
}) => {
  const [expandedRequired, setExpandedRequired] = useState(true);
  const [expandedLending, setExpandedLending] = useState(true);
  const [editingClaim, setEditingClaim] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(1);
  const [editNotes, setEditNotes] = useState<string>('');

  const requiredMaterials = materials.filter(m => m.registry_type === 'required');
  const lendingMaterials = materials.filter(m => m.registry_type === 'lending');

  const canSeeClaims = registryVisibility === 'public' || isOrganizer;

  const getUserClaim = (materialId: string): EventMaterialClaim | undefined => {
    return userClaims.find(c => c.material_id === materialId && c.status === 'claimed');
  };

  const getAvailableQuantity = (material: EventMaterial): number => {
    if (!material.max_quantity) return 999999; // Unlimited
    return Math.max(0, material.max_quantity - (material.current_claims || 0));
  };

  const handleStartEdit = (claim: EventMaterialClaim) => {
    setEditingClaim(claim.id);
    setEditQuantity(claim.quantity);
    setEditNotes(claim.notes || '');
  };

  const handleSaveEdit = async (claimId: string) => {
    try {
      await onUpdateClaim(claimId, editQuantity, editNotes);
      setEditingClaim(null);
    } catch (error) {
      console.error('Failed to update claim:', error);
      alert('Failed to update your claim. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingClaim(null);
    setEditQuantity(1);
    setEditNotes('');
  };

  if (materials.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Registry Set Up</h3>
        <p className="text-gray-500">
          The organizer hasn't set up a registry for this event yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className={`flex items-start space-x-3 p-4 rounded-lg ${
        registryVisibility === 'public' ? 'bg-green-50' : 'bg-blue-50'
      }`}>
        {registryVisibility === 'public' ? (
          <Eye className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
        ) : (
          <EyeOff className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        )}
        <div className="text-sm">
          {registryVisibility === 'public' ? (
            <>
              <p className="font-medium text-green-900 mb-1">Public Registry</p>
              <p className="text-green-800">
                All registered participants can see who's bringing what
              </p>
            </>
          ) : (
            <>
              <p className="font-medium text-blue-900 mb-1">Private Registry</p>
              <p className="text-blue-800">
                Only the organizer can see who's bringing what
              </p>
            </>
          )}
        </div>
      </div>

      {/* Required Items Section */}
      {requiredMaterials.length > 0 && (
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
                  Items needed for the event
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
              {requiredMaterials.map(material => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  userClaim={getUserClaim(material.id)}
                  availableQuantity={getAvailableQuantity(material)}
                  canSeeClaims={canSeeClaims}
                  isEditing={editingClaim === getUserClaim(material.id)?.id}
                  editQuantity={editQuantity}
                  editNotes={editNotes}
                  onEditQuantityChange={setEditQuantity}
                  onEditNotesChange={setEditNotes}
                  onStartEdit={handleStartEdit}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onClaim={onClaimItem}
                  onUnclaim={onUnclaimItem}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lending Pool Section */}
      {lendingMaterials.length > 0 && (
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
                  Optional items you can bring to lend to others
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
              <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  Have extras? Let others know you can bring items to share!
                </p>
              </div>

              {lendingMaterials.map(material => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  userClaim={getUserClaim(material.id)}
                  availableQuantity={getAvailableQuantity(material)}
                  canSeeClaims={canSeeClaims}
                  isEditing={editingClaim === getUserClaim(material.id)?.id}
                  editQuantity={editQuantity}
                  editNotes={editNotes}
                  onEditQuantityChange={setEditQuantity}
                  onEditNotesChange={setEditNotes}
                  onStartEdit={handleStartEdit}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onClaim={onClaimItem}
                  onUnclaim={onUnclaimItem}
                  isLending
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Material Card Component
interface MaterialCardProps {
  material: EventMaterial & {
    claims?: (EventMaterialClaim & { user?: Profile })[];
  };
  userClaim?: EventMaterialClaim;
  availableQuantity: number;
  canSeeClaims: boolean;
  isEditing: boolean;
  editQuantity: number;
  editNotes: string;
  onEditQuantityChange: (quantity: number) => void;
  onEditNotesChange: (notes: string) => void;
  onStartEdit: (claim: EventMaterialClaim) => void;
  onSaveEdit: (claimId: string) => void;
  onCancelEdit: () => void;
  onClaim: (materialId: string, claimType: 'personal' | 'lending', quantity: number, notes?: string) => Promise<void>;
  onUnclaim: (claimId: string) => Promise<void>;
  isLending?: boolean;
}

const MaterialCard: React.FC<MaterialCardProps> = ({
  material,
  userClaim,
  availableQuantity,
  canSeeClaims,
  isEditing,
  editQuantity,
  editNotes,
  onEditQuantityChange,
  onEditNotesChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onClaim,
  onUnclaim,
  isLending = false
}) => {
  const [claimNotes, setClaimNotes] = useState('');
  const [claimQuantity, setClaimQuantity] = useState(1);
  const [showClaimForm, setShowClaimForm] = useState(false);

  const hasClaim = !!userClaim;
  const isAvailable = availableQuantity > 0 || !material.max_quantity;
  const claimType = isLending ? 'lending' : 'personal';

  const handleClaim = async () => {
    try {
      await onClaim(material.id, claimType, claimQuantity, claimNotes);
      setShowClaimForm(false);
      setClaimNotes('');
      setClaimQuantity(1);
    } catch (error) {
      console.error('Failed to claim item:', error);
      alert('Failed to claim item. Please try again.');
    }
  };

  const handleUnclaim = async () => {
    if (!userClaim) return;
    if (confirm('Are you sure you want to cancel this claim?')) {
      try {
        await onUnclaim(userClaim.id);
      } catch (error) {
        console.error('Failed to unclaim item:', error);
        alert('Failed to cancel claim. Please try again.');
      }
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      {/* Item Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-forest-800">{material.item}</h4>
          {material.quantity && (
            <p className="text-sm text-gray-600">{material.quantity}</p>
          )}
          {material.notes && (
            <p className="text-sm text-gray-500 mt-1">{material.notes}</p>
          )}
        </div>

        {/* Availability Badge */}
        {material.max_quantity && (
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            availableQuantity > 0
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {availableQuantity} / {material.max_quantity} available
          </div>
        )}
      </div>

      {/* User's Claim */}
      {hasClaim && !isEditing && (
        <div className="bg-forest-50 border border-forest-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-forest-800">
              ✓ You're {isLending ? 'lending' : 'bringing'} this
            </span>
            <button
              onClick={() => onStartEdit(userClaim)}
              className="text-sm text-forest-600 hover:text-forest-700"
            >
              Edit
            </button>
          </div>
          <p className="text-sm text-forest-700">
            Quantity: {userClaim.quantity}
          </p>
          {userClaim.notes && (
            <p className="text-sm text-forest-600 mt-1">{userClaim.notes}</p>
          )}
          <button
            onClick={handleUnclaim}
            className="mt-2 text-sm text-red-600 hover:text-red-700"
          >
            Cancel claim
          </button>
        </div>
      )}

      {/* Edit Claim Form */}
      {hasClaim && isEditing && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              value={editQuantity}
              onChange={(e) => onEditQuantityChange(parseInt(e.target.value) || 1)}
              min={1}
              max={availableQuantity + (userClaim?.quantity || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={editNotes}
              onChange={(e) => onEditNotesChange(e.target.value)}
              placeholder="Add details about what you're bringing..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500"
            />
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => onSaveEdit(userClaim!.id)}
              className="flex-1 px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors"
            >
              Save
            </button>
            <button
              onClick={onCancelEdit}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Claim Button */}
      {!hasClaim && isAvailable && !showClaimForm && (
        <button
          onClick={() => setShowClaimForm(true)}
          className="w-full px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors font-medium"
        >
          {isLending ? 'I can lend this' : 'I\'ll bring this'}
        </button>
      )}

      {/* Claim Form */}
      {!hasClaim && showClaimForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              value={claimQuantity}
              onChange={(e) => setClaimQuantity(parseInt(e.target.value) || 1)}
              min={1}
              max={availableQuantity || 999}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={claimNotes}
              onChange={(e) => setClaimNotes(e.target.value)}
              placeholder={
                isLending
                  ? 'What are you bringing to lend?'
                  : 'Add details (e.g., "gluten-free pie" or "acoustic guitar")'
              }
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500"
            />
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleClaim}
              className="flex-1 px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => {
                setShowClaimForm(false);
                setClaimNotes('');
                setClaimQuantity(1);
              }}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Not Available */}
      {!hasClaim && !isAvailable && (
        <div className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-center text-sm">
          Fully claimed
        </div>
      )}

      {/* Who's Bringing (Public View) */}
      {canSeeClaims && material.claims && material.claims.length > 0 && (
        <div className="pt-3 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">
            {isLending ? 'Lending:' : 'Bringing:'}
          </p>
          <div className="space-y-2">
            {material.claims
              .filter(claim => claim.status === 'claimed')
              .map(claim => (
                <div key={claim.id} className="flex items-start space-x-2">
                  <Avatar
                    name={claim.user?.full_name || 'User'}
                    imageUrl={claim.user?.avatar_url}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">
                      {claim.user?.full_name || 'User'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Quantity: {claim.quantity}
                    </p>
                    {claim.notes && (
                      <p className="text-sm text-gray-500 mt-1">{claim.notes}</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventRegistry;
