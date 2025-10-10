import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import {
  CheckCircle,
  X,
  Star,
  AlertTriangle,
  Sparkles,
  ClipboardCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SpaceOwnerSignoffModalProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
  onSignoff: () => void;
}

const SpaceOwnerSignoffModal: React.FC<SpaceOwnerSignoffModalProps> = ({
  event,
  isOpen,
  onClose,
  onSignoff
}) => {
  const [rating, setRating] = useState(5);
  const [cleanlinessRating, setCleanlinessRating] = useState(5);
  const [preparationRating, setPreparationRating] = useState(5);
  const [notes, setNotes] = useState('');
  const [hasIssues, setHasIssues] = useState(false);
  const [issues, setIssues] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const issuesData = hasIssues ? {
        description: issues,
        reported_at: new Date().toISOString()
      } : null;

      const { data, error: rpcError } = await supabase.rpc('complete_event_with_signoff', {
        p_event_id: event.id,
        p_signoff_type: hasIssues ? 'issue_reported' : 'completion',
        p_rating: rating,
        p_cleanliness_rating: cleanlinessRating,
        p_preparation_rating: preparationRating,
        p_notes: notes || null,
        p_issues: issuesData
      });

      if (rpcError) throw rpcError;

      if (data?.success) {
        onSignoff();
        onClose();
      } else {
        setError(data?.message || 'Failed to sign off event');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`h-8 w-8 ${
                star <= value
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">{value}/5</span>
      </div>
    </div>
  );

  if (!isOpen || !event) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-500 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6" />
                <div>
                  <h2 className="text-xl font-semibold">Sign Off Event Completion</h2>
                  <p className="text-sm text-white/80 mt-1">{event.title}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            {/* Overall Rating */}
            <div className="bg-gray-50 rounded-lg p-4">
              <StarRating
                value={rating}
                onChange={setRating}
                label="Overall Event Rating"
              />
            </div>

            {/* Cleanliness Rating */}
            <div className="bg-gray-50 rounded-lg p-4">
              <StarRating
                value={cleanlinessRating}
                onChange={setCleanlinessRating}
                label="Cleanliness & Cleanup"
              />
              <p className="text-xs text-gray-500 mt-2">
                How well did the practitioners clean up after the event?
              </p>
            </div>

            {/* Preparation Rating */}
            <div className="bg-gray-50 rounded-lg p-4">
              <StarRating
                value={preparationRating}
                onChange={setPreparationRating}
                label="Preparation & Setup"
              />
              <p className="text-xs text-gray-500 mt-2">
                How well was the space prepared before the event?
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional comments about the event..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={3}
              />
            </div>

            {/* Issues Toggle */}
            <div className="border-t pt-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasIssues}
                  onChange={(e) => setHasIssues(e.target.checked)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Report Issues or Concerns
                </span>
              </label>

              {hasIssues && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-red-800 mb-2">
                    Describe the Issues
                  </label>
                  <textarea
                    value={issues}
                    onChange={(e) => setIssues(e.target.value)}
                    placeholder="Please describe any issues that occurred during or after the event..."
                    className="w-full p-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
                    rows={3}
                    required={hasIssues}
                  />
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">What happens after sign-off?</p>
                  <ul className="space-y-1 list-disc list-inside text-blue-700">
                    <li>Event will be marked as completed</li>
                    <li>Practitioners will receive confirmation</li>
                    <li>Your ratings will help improve future events</li>
                    <li>Event organizer will be notified of completion</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4 border-t">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-6 rounded-lg font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <ClipboardCheck className="h-5 w-5" />
                <span>{loading ? 'Signing Off...' : 'Complete & Sign Off'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SpaceOwnerSignoffModal;