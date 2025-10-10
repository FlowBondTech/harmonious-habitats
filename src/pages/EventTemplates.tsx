import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Heart, Trash2, Edit2, Plus, Star, Clock } from 'lucide-react';
import { useAuthContext } from '../components/AuthProvider';
import { supabase } from '../lib/supabase';

const EventTemplates = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    loadTemplates();
  }, [user, navigate]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('event_templates')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_favorite', { ascending: false })
        .order('use_count', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('Error loading templates:', err);
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (template: any) => {
    try {
      const { error } = await supabase
        .from('event_templates')
        .update({ is_favorite: !template.is_favorite })
        .eq('id', template.id);

      if (error) throw error;

      setTemplates(prev =>
        prev.map(t =>
          t.id === template.id
            ? { ...t, is_favorite: !t.is_favorite }
            : t
        )
      );

      setSuccess(template.is_favorite ? 'Removed from favorites' : 'Added to favorites');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setError('Failed to update favorite status');
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('event_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => t.id !== id));
      setSuccess('Template deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting template:', err);
      setError('Failed to delete template');
    }
  };

  const useTemplate = (templateId: string) => {
    navigate('/create-event', { state: { templateId } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-forest-600 mx-auto"></div>
          <p className="mt-4 text-forest-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-forest-800 mb-2">Event Templates</h1>
            <p className="text-forest-600">Manage your saved event templates</p>
          </div>
          <button
            onClick={() => navigate('/create-event')}
            className="flex items-center gap-2 px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create New Event
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No templates yet</h3>
            <p className="text-gray-600 mb-6">
              Save event configurations as templates to quickly create similar events
            </p>
            <button
              onClick={() => navigate('/create-event')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Your First Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-forest-800 text-lg mb-1">
                      {template.name}
                    </h3>
                    {template.description && (
                      <p className="text-sm text-gray-600">{template.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleFavorite(template)}
                    className={`p-2 rounded-lg transition-colors ${
                      template.is_favorite
                        ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100'
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                    title={template.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star className={`h-5 w-5 ${template.is_favorite ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  {template.category && (
                    <span className="px-2 py-1 bg-forest-100 text-forest-700 rounded-md">
                      {template.category}
                    </span>
                  )}
                  {template.use_count > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Used {template.use_count}x
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => useTemplate(template.id)}
                    className="flex-1 px-3 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors text-sm"
                  >
                    Use Template
                  </button>
                  <button
                    onClick={() => deleteTemplate(template.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete template"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventTemplates;