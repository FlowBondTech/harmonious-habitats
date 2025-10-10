import React, { useState, useEffect } from 'react';
import { X, Star, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { supabase, createAdminRating, getAdminRatingsForUser, updateAdminRating, deleteAdminRating } from '../lib/supabase';
import type { AdminUserRating, Profile } from '../lib/supabase';
import { Form, FormField, FormSection, FormCheckbox, FormButton } from './forms';

interface UserRatingModalProps {
  userId: string;
  userName: string;
  onClose: () => void;
  adminId: string;
}

export const UserRatingModal: React.FC<UserRatingModalProps> = ({
  userId,
  userName,
  onClose,
  adminId
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingRatings, setExistingRatings] = useState<AdminUserRating[]>([]);
  const [editingRatingId, setEditingRatingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    rating: 0,
    feedback_category: '',
    feedback_text: '',
    is_public: false
  });

  useEffect(() => {
    fetchExistingRatings();
  }, [userId]);

  const fetchExistingRatings = async () => {
    const { data, error } = await getAdminRatingsForUser(userId);
    if (error) {
      console.error('Error fetching ratings:', error);
    } else {
      setExistingRatings(data || []);
    }
  };

  const handleStarClick = (value: number) => {
    setFormData(prev => ({ ...prev, rating: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingRatingId) {
        // Update existing rating
        const { error: updateError } = await updateAdminRating(editingRatingId, {
          rating: formData.rating,
          feedback_category: formData.feedback_category || undefined,
          feedback_text: formData.feedback_text || undefined,
          is_public: formData.is_public
        });

        if (updateError) throw updateError;
        setSuccess('Rating updated successfully!');
      } else {
        // Create new rating
        const { error: createError } = await createAdminRating({
          user_id: userId,
          admin_id: adminId,
          rating: formData.rating,
          feedback_category: formData.feedback_category || undefined,
          feedback_text: formData.feedback_text || undefined,
          is_public: formData.is_public
        });

        if (createError) throw createError;
        setSuccess('Rating created successfully!');
      }

      // Reset form
      setFormData({
        rating: 0,
        feedback_category: '',
        feedback_text: '',
        is_public: false
      });
      setEditingRatingId(null);

      // Refresh ratings list
      await fetchExistingRatings();

    } catch (err: any) {
      console.error('Error saving rating:', err);
      setError(err.message || 'Failed to save rating');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rating: AdminUserRating) => {
    setFormData({
      rating: rating.rating,
      feedback_category: rating.feedback_category || '',
      feedback_text: rating.feedback_text || '',
      is_public: rating.is_public
    });
    setEditingRatingId(rating.id);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (ratingId: string) => {
    if (!confirm('Are you sure you want to delete this rating?')) {
      return;
    }

    setLoading(true);
    try {
      const { error: deleteError } = await deleteAdminRating(ratingId);
      if (deleteError) throw deleteError;

      setSuccess('Rating deleted successfully!');
      await fetchExistingRatings();
    } catch (err: any) {
      console.error('Error deleting rating:', err);
      setError(err.message || 'Failed to delete rating');
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setFormData({
      rating: 0,
      feedback_category: '',
      feedback_text: '',
      is_public: false
    });
    setEditingRatingId(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-forest-800">Rate User: {userName}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Rating Form */}
          <Form onSubmit={handleSubmit} error={error} success={success}>
            <FormSection
              title={editingRatingId ? "Edit Rating" : "New Rating"}
              description="Provide feedback to help improve user experience"
            >
              {/* Star Rating */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-forest-800">
                  Rating <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleStarClick(star)}
                      className="focus:outline-none focus:ring-2 focus:ring-forest-500 rounded"
                    >
                      <Star
                        className={`h-8 w-8 transition-all cursor-pointer ${
                          star <= formData.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 hover:text-yellow-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {formData.rating > 0 ? `${formData.rating}/5` : 'Not rated'}
                  </span>
                </div>
              </div>

              {/* Feedback Category */}
              <FormField
                label="Feedback Category"
                name="feedback_category"
                type="select"
                value={formData.feedback_category}
                onChange={(e) => setFormData(prev => ({ ...prev, feedback_category: e.target.value }))}
                options={[
                  { value: '', label: 'Select category (optional)' },
                  { value: 'community_contribution', label: 'Community Contribution' },
                  { value: 'event_quality', label: 'Event Quality' },
                  { value: 'space_sharing', label: 'Space Sharing' },
                  { value: 'behavior', label: 'Behavior' },
                  { value: 'overall', label: 'Overall' }
                ]}
              />

              {/* Feedback Text */}
              <FormField
                label="Feedback"
                name="feedback_text"
                type="textarea"
                value={formData.feedback_text}
                onChange={(e) => setFormData(prev => ({ ...prev, feedback_text: e.target.value }))}
                placeholder="Optional: Provide detailed feedback..."
                rows={4}
              />

              {/* Public Toggle */}
              <FormCheckbox
                label="Make this rating visible to the user"
                checked={formData.is_public}
                onChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
                description="If enabled, the user will be able to see this rating and feedback"
              />
            </FormSection>

            {/* Form Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              {editingRatingId && (
                <FormButton
                  type="button"
                  variant="secondary"
                  onClick={cancelEdit}
                  disabled={loading}
                >
                  Cancel Edit
                </FormButton>
              )}
              <FormButton
                type="submit"
                variant="primary"
                loading={loading}
                disabled={formData.rating === 0}
              >
                {editingRatingId ? 'Update Rating' : 'Submit Rating'}
              </FormButton>
            </div>
          </Form>

          {/* Existing Ratings */}
          {existingRatings.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-forest-800 mb-4">
                Previous Ratings ({existingRatings.length})
              </h3>
              <div className="space-y-3">
                {existingRatings.map((rating) => (
                  <div
                    key={rating.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Rating Stars */}
                        <div className="flex items-center gap-2 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= rating.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="text-sm font-medium text-gray-700">
                            {rating.rating}/5
                          </span>
                        </div>

                        {/* Category */}
                        {rating.feedback_category && (
                          <div className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Category:</span>{' '}
                            {rating.feedback_category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                        )}

                        {/* Feedback Text */}
                        {rating.feedback_text && (
                          <p className="text-sm text-gray-700 mb-2">
                            {rating.feedback_text}
                          </p>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>
                            By: {rating.admin?.full_name || 'Unknown Admin'}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(rating.created_at).toLocaleDateString()}
                          </span>
                          {rating.is_public && (
                            <>
                              <span>•</span>
                              <span className="text-forest-600 font-medium">Public</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions (only show if this admin created the rating) */}
                      {rating.admin_id === adminId && (
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleEdit(rating)}
                            className="p-2 text-forest-600 hover:bg-forest-50 rounded-lg transition-colors"
                            aria-label="Edit rating"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(rating.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            aria-label="Delete rating"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
