import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, MessageSquare, Eye } from 'lucide-react';
import { updateEventStatus, updateSpaceStatus, updateReportStatus } from '../lib/supabase';
import { useAuthContext } from './AuthProvider';

interface AdminActionsProps {
  type: 'event' | 'space' | 'report';
  item: {
    id: string;
    status: string;
    admin_notes?: string;
  };
  onUpdate?: () => void;
}

const AdminActions: React.FC<AdminActionsProps> = ({ type, item, onUpdate }) => {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [adminNotes, setAdminNotes] = useState(item.admin_notes || '');

  const handleStatusUpdate = async (newStatus: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      let result;
      
      switch (type) {
        case 'event':
          result = await updateEventStatus(item.id, newStatus, adminNotes, user.id);
          break;
        case 'space':
          result = await updateSpaceStatus(item.id, newStatus, adminNotes, user.id);
          break;
        case 'report':
          result = await updateReportStatus(item.id, newStatus, adminNotes, user.id);
          break;
      }
      
      if (result?.error) {
        throw result.error;
      }
      
      onUpdate?.();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusActions = () => {
    switch (type) {
      case 'event':
        return [
          { status: 'active', label: 'Approve', icon: CheckCircle, color: 'text-green-600 hover:bg-green-100' },
          { status: 'pending_approval', label: 'Pending', icon: AlertTriangle, color: 'text-yellow-600 hover:bg-yellow-100' },
          { status: 'cancelled', label: 'Reject', icon: XCircle, color: 'text-red-600 hover:bg-red-100' }
        ];
      case 'space':
        return [
          { status: 'available', label: 'Approve', icon: CheckCircle, color: 'text-green-600 hover:bg-green-100' },
          { status: 'pending_approval', label: 'Pending', icon: AlertTriangle, color: 'text-yellow-600 hover:bg-yellow-100' },
          { status: 'suspended', label: 'Suspend', icon: XCircle, color: 'text-red-600 hover:bg-red-100' }
        ];
      case 'report':
        return [
          { status: 'investigating', label: 'Investigate', icon: Eye, color: 'text-blue-600 hover:bg-blue-100' },
          { status: 'resolved', label: 'Resolve', icon: CheckCircle, color: 'text-green-600 hover:bg-green-100' },
          { status: 'dismissed', label: 'Dismiss', icon: XCircle, color: 'text-red-600 hover:bg-red-100' }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-3">
      {/* Status Actions */}
      <div className="flex items-center space-x-2">
        {getStatusActions().map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.status}
              onClick={() => handleStatusUpdate(action.status)}
              disabled={loading || item.status === action.status}
              className={`p-2 rounded-lg transition-colors ${action.color} ${
                item.status === action.status ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={action.label}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
        
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="p-2 text-forest-600 hover:bg-forest-100 rounded-lg transition-colors"
          title="Admin Notes"
        >
          <MessageSquare className="h-4 w-4" />
        </button>
      </div>

      {/* Admin Notes */}
      {showNotes && (
        <div className="bg-forest-50 rounded-lg p-4 border border-forest-200">
          <label className="block text-sm font-medium text-forest-700 mb-2">
            Admin Notes
          </label>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Add internal notes about this item..."
            className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 text-sm"
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={() => handleStatusUpdate(item.status)}
              disabled={loading}
              className="bg-forest-600 hover:bg-forest-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
            >
              {loading ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminActions;