import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, MapPin, Users, DollarSign, Plus, X, Star, Globe, Video, Clock, Book, AlertCircle, Save, FileText, Heart, CheckCircle } from 'lucide-react';
import { useAuthContext } from '../components/AuthProvider';
import { supabase, saveEventMaterials } from '../lib/supabase';
import HolisticCategorySelector from '../components/HolisticCategorySelector';
import { DatePicker, TimePicker } from '../components/DateTimePicker';
import { SlidingFormWizard, WizardStep } from '../components/SlidingFormWizard';
import EventRegistrySetup from '../components/EventRegistrySetup';

const CreateEvent = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Refs for required fields
  const categoryRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    address: '',
    capacity: '0',
    skillLevel: 'all',
    donationAmount: '',
    materials: [] as string[],
    recurring: false,
    recurrencePattern: 'weekly',
    eventType: 'local' as 'local' | 'virtual' | 'global_physical',
    virtualMeetingUrl: '',
    virtualPlatform: '',
    registrationRequired: true,
    registrationDeadline: '',
    waitlistEnabled: true,
    prerequisites: '',
    whatToBring: '',
    isFree: true,
    exchangeType: 'free' as 'donation' | 'fixed' | 'sliding_scale' | 'barter' | 'free',
    minimumDonation: '',
    maximumDonation: '',
    tags: [] as string[],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    space_id: '',
    time_offering_id: '',
    durationMinutes: 60,
    // Registry fields
    registryEnabled: false,
    venueType: 'home' as 'home' | 'studio',
    registryVisibility: 'public' as 'public' | 'organizer_only',
    registryMaterials: [] as any[]
  });

  const [newMaterial, setNewMaterial] = useState('');
  const [newTag, setNewTag] = useState('');
  const [userSpaces, setUserSpaces] = useState<any[]>([]);
  const [userTimeOfferings, setUserTimeOfferings] = useState<any[]>([]);

  // Template state
  const [templates, setTemplates] = useState<any[]>([]);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [hasSelectedStart, setHasSelectedStart] = useState(false);

  // Check authentication and load user's spaces and time offerings
  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const loadUserResources = async () => {
      try {
        const { data: spaces, error: spacesError } = await supabase
          .from('spaces')
          .select('id, name')
          .eq('owner_id', user.id)
          .eq('status', 'active');

        if (!spacesError && spaces) {
          setUserSpaces(spaces);
        }

        const { data: offerings, error: offeringsError } = await supabase
          .from('time_offerings')
          .select('id, title, category')
          .eq('holder_id', user.id)
          .eq('status', 'active');

        if (!offeringsError && offerings) {
          setUserTimeOfferings(offerings);
        }
      } catch (err) {
        console.error('Error in loadUserResources:', err);
      }
    };

    loadUserResources();
  }, [user]);

  // Load user's templates
  useEffect(() => {
    if (!user) return;

    const loadTemplates = async () => {
      const { data, error } = await supabase
        .from('event_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('is_favorite', { ascending: false })
        .order('use_count', { ascending: false })
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTemplates(data);
      }
    };

    loadTemplates();
  }, [user]);

  // Load template from navigation state if provided
  useEffect(() => {
    const state = location.state as { templateId?: string } | null;
    if (state?.templateId && templates.length > 0) {
      loadTemplate(state.templateId);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, templates]);

  // Auto-advance when user makes a selection on Start step
  useEffect(() => {
    if (hasSelectedStart) {
      // Small delay to ensure state updates, then click Next button
      const timer = setTimeout(() => {
        const nextButton = document.querySelector('[data-wizard-next]') as HTMLButtonElement;
        if (nextButton) {
          nextButton.click();
          setHasSelectedStart(false);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [hasSelectedStart]);

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Calculate duration when start or end time changes
      if (field === 'startTime' || field === 'endTime') {
        const startTime = field === 'startTime' ? value as string : prev.startTime;
        const endTime = field === 'endTime' ? value as string : prev.endTime;

        if (startTime && endTime) {
          const [startHour, startMin] = startTime.split(':').map(Number);
          const [endHour, endMin] = endTime.split(':').map(Number);
          const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
          updated.durationMinutes = Math.max(0, durationMinutes);
        }
      }

      // Update end time when duration changes
      if (field === 'durationMinutes' && typeof value === 'number') {
        const [startHour, startMin] = updated.startTime.split(':').map(Number);
        const totalMinutes = startHour * 60 + startMin + value;
        const endHour = Math.floor(totalMinutes / 60) % 24;
        const endMin = totalMinutes % 60;
        updated.endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
      }

      return updated;
    });

    if (field === 'exchangeType') {
      setFormData(prev => ({
        ...prev,
        isFree: value === 'free',
        donationAmount: value === 'free' ? '' : prev.donationAmount
      }));
    }

    if (field === 'capacity' && value === '0') {
      setFormData(prev => ({
        ...prev,
        waitlistEnabled: false
      }));
    }
  };

  const addMaterial = () => {
    if (newMaterial.trim()) {
      setFormData(prev => ({
        ...prev,
        materials: [...prev.materials, newMaterial.trim()]
      }));
      setNewMaterial('');
    }
  };

  const removeMaterial = (index: number) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim().toLowerCase()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const saveAsTemplate = async () => {
    if (!user || !templateName.trim()) {
      setError('Please enter a template name');
      return;
    }

    try {
      const { date, startTime, endTime, registrationDeadline, ...templateData } = formData;

      const { error } = await supabase
        .from('event_templates')
        .insert({
          user_id: user.id,
          name: templateName.trim(),
          description: templateDescription.trim(),
          category: formData.category,
          template_data: templateData
        });

      if (error) throw error;

      setSuccess('Template saved successfully!');
      setShowSaveTemplateModal(false);
      setTemplateName('');
      setTemplateDescription('');

      const { data } = await supabase
        .from('event_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setTemplates(data);
    } catch (err) {
      console.error('Error saving template:', err);
      setError('Failed to save template');
    }
  };

  const loadTemplate = async (templateId: string) => {
    if (!templateId) return;

    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    try {
      setFormData(prev => ({
        ...prev,
        ...template.template_data,
        date: prev.date,
        startTime: prev.startTime,
        endTime: prev.endTime,
        registrationDeadline: prev.registrationDeadline
      }));

      await supabase
        .from('event_templates')
        .update({ use_count: template.use_count + 1 })
        .eq('id', templateId);

      setSuccess(`Loaded template: ${template.name}`);
    } catch (err) {
      console.error('Error loading template:', err);
      setError('Failed to load template');
    }
  };

  // Helper function to scroll to and highlight invalid field
  const scrollToAndHighlight = (ref: React.RefObject<HTMLElement>) => {
    if (ref.current) {
      // Scroll element into view
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Add radiate animation class
      ref.current.classList.add('field-error-radiate');

      // Focus if it's an input element
      if (ref.current instanceof HTMLInputElement || ref.current instanceof HTMLTextAreaElement) {
        setTimeout(() => ref.current?.focus(), 300);
      }

      // Remove animation class after animation completes
      setTimeout(() => {
        ref.current?.classList.remove('field-error-radiate');
      }, 2000);
    }
  };

  // Validation functions for each step
  const validateCategoryStep = () => {
    if (!formData.category) {
      setError('Please select a category');
      scrollToAndHighlight(categoryRef);
      return false;
    }
    setError(null);
    return true;
  };

  const validateBasicInfoStep = () => {
    if (!formData.title.trim()) {
      setError('Event title is required');
      scrollToAndHighlight(titleRef);
      return false;
    }
    setError(null);
    return true;
  };

  const validateScheduleStep = () => {
    if (!formData.date) {
      setError('Event date is required');
      scrollToAndHighlight(dateRef);
      return false;
    }
    if (!formData.startTime || !formData.endTime) {
      setError('Start and end times are required');
      scrollToAndHighlight(dateRef);
      return false;
    }
    if (formData.registrationRequired && formData.registrationDeadline) {
      const deadline = new Date(formData.registrationDeadline);
      const eventDate = new Date(formData.date + 'T' + formData.startTime);
      if (deadline > eventDate) {
        setError('Registration deadline must be before the event starts');
        scrollToAndHighlight(dateRef);
        return false;
      }
    }
    setError(null);
    return true;
  };

  const validateLocationStep = () => {
    if (!formData.location.trim()) {
      setError('Event location is required');
      scrollToAndHighlight(locationRef);
      return false;
    }
    if (formData.eventType === 'virtual' && !formData.virtualMeetingUrl.trim()) {
      setError('Virtual meeting URL is required for virtual events');
      scrollToAndHighlight(locationRef);
      return false;
    }
    setError(null);
    return true;
  };

  const validateCommunityDetailsStep = () => {
    if (!formData.isFree && formData.exchangeType === 'sliding_scale') {
      if (!formData.minimumDonation || !formData.maximumDonation) {
        setError('Please specify minimum and maximum amounts for sliding scale');
        return false;
      }
      if (parseFloat(formData.minimumDonation) > parseFloat(formData.maximumDonation)) {
        setError('Minimum donation cannot be greater than maximum');
        return false;
      }
    }
    setError(null);
    return true;
  };

  const handleComplete = async () => {
    try {
      if (!user) {
        setError('You must be signed in to create an event');
        return;
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (!session) {
        setError('Your session has expired. Please sign in again.');
        return;
      }

      setLoading(true);
      setError(null);
      setSuccess(null);

      const eventData: any = {
        organizer_id: user.id,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category: formData.category,
        date: formData.date,
        start_time: formData.startTime,
        end_time: formData.endTime,
        duration_minutes: formData.durationMinutes,
        event_type: formData.eventType || 'local',
        location_name: formData.location.trim() || null,
        address: formData.address?.trim() || null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        skill_level: formData.skillLevel || null,
        is_free: formData.isFree,
        exchange_type: formData.exchangeType || null,
        prerequisites: formData.prerequisites?.trim() || null,
        registration_required: formData.registrationRequired || false
      };

      if (formData.registrationRequired && formData.registrationDeadline) {
        eventData.registration_deadline = formData.registrationDeadline;
      }

      if (formData.eventType === 'virtual') {
        eventData.virtual_meeting_url = formData.virtualMeetingUrl?.trim() || null;
        eventData.virtual_platform = formData.virtualPlatform || null;
      }

      if (formData.space_id) {
        eventData.space_id = formData.space_id;
      }
      if (formData.time_offering_id) {
        eventData.time_offering_id = formData.time_offering_id;
      }

      // Add registry settings
      eventData.venue_provides_equipment = formData.venueType === 'studio';
      eventData.registry_visibility = formData.registryVisibility;
      eventData.registry_enabled = formData.registryEnabled;

      const { data, error: insertError } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        throw insertError;
      }

      // Save registry materials if registry is enabled
      if (formData.registryEnabled && formData.registryMaterials.length > 0) {
        const { error: materialsError } = await saveEventMaterials(
          data.id,
          formData.registryMaterials
        );

        if (materialsError) {
          console.error('Error saving registry materials:', materialsError);
          // Don't throw - event was created successfully, materials are optional
        }
      }

      setSuccess('Event created successfully!');

      setTimeout(() => {
        navigate('/activities');
      }, 2000);

    } catch (err: unknown) {
      console.error('Error in handleComplete:', err);

      let errorMessage = 'Unable to create event. Please try again or contact support if the problem persists.';

      if (err instanceof Error) {
        errorMessage = err.message;

        if ('code' in err) {
          console.error('Error code:', (err as any).code);
          console.error('Error details:', (err as any).details);
          console.error('Error hint:', (err as any).hint);

          if ((err as any).code === '23505') {
            errorMessage = 'An event with these details already exists. Please check your event title and date, or try editing the existing event instead.';
          } else if ((err as any).code === '23503') {
            errorMessage = 'Invalid data reference. Please check that your space or template selections are valid and try again.';
          } else if ((err as any).code === '42501') {
            errorMessage = 'You don\'t have permission to create events. Please ensure your account is fully set up in your profile settings.';
          } else if ((err as any).code === 'PGRST301') {
            errorMessage = 'Your session has expired. Please sign in again to continue creating your event.';
          }
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Wizard steps
  const wizardSteps: WizardStep[] = [
    {
      id: 'start',
      title: 'Start',
      description: 'Begin from scratch or use a template',
      icon: FileText,
      component: (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-forest-800 mb-2">Create Your Event</h2>
            <p className="text-forest-600">Start from scratch or use a saved template</p>
          </div>

          {/* Start from Scratch Option */}
          <button
            type="button"
            onClick={() => {
              setSelectedTemplate('');
              setError(null);
              setHasSelectedStart(true);
            }}
            className="w-full p-6 rounded-xl border-2 border-forest-200 hover:border-forest-400 hover:bg-forest-50 transition-all group"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-forest-100 p-4 rounded-xl group-hover:bg-forest-200 transition-colors">
                <Plus className="h-8 w-8 text-forest-600" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold text-forest-800 mb-1">Start from Scratch</h3>
                <p className="text-sm text-forest-600">Create a new event with a blank canvas</p>
              </div>
            </div>
          </button>

          {/* Templates Section */}
          {templates.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-forest-700 mb-3 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Your Templates
              </h3>
              <div className="space-y-3">
                {templates.slice(0, 5).map(template => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => {
                      loadTemplate(template.id);
                      setSelectedTemplate(template.id);
                      setHasSelectedStart(true);
                    }}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left group ${
                      selectedTemplate === template.id
                        ? 'border-forest-500 bg-forest-50'
                        : 'border-forest-100 hover:border-forest-300 hover:bg-forest-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          {template.is_favorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                          <h4 className="font-semibold text-forest-800">{template.name}</h4>
                        </div>
                        {template.description && (
                          <p className="text-sm text-forest-600 mb-2">{template.description}</p>
                        )}
                        <div className="flex items-center space-x-3 text-xs text-forest-500">
                          <span className="capitalize">{template.category}</span>
                          {template.use_count > 0 && (
                            <>
                              <span>•</span>
                              <span>Used {template.use_count}x</span>
                            </>
                          )}
                        </div>
                      </div>
                      <CheckCircle className={`h-5 w-5 ${
                        selectedTemplate === template.id ? 'text-forest-600' : 'text-gray-300'
                      }`} />
                    </div>
                  </button>
                ))}
              </div>

              {templates.length > 5 && (
                <button
                  type="button"
                  onClick={() => navigate('/event-templates')}
                  className="w-full mt-3 p-3 text-sm text-forest-600 hover:text-forest-700 hover:bg-forest-50 rounded-lg transition-colors"
                >
                  View all {templates.length} templates →
                </button>
              )}
            </div>
          )}

          {templates.length === 0 && (
            <div className="text-center py-8 bg-forest-50 rounded-xl border-2 border-dashed border-forest-200">
              <FileText className="h-12 w-12 text-forest-300 mx-auto mb-3" />
              <p className="text-sm text-forest-600 mb-2">No templates yet</p>
              <p className="text-xs text-forest-500">Save your first event as a template to reuse it later</p>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'category',
      title: 'Category',
      description: 'Choose your event category',
      icon: Heart,
      validation: validateCategoryStep,
      component: (
        <div ref={categoryRef}>
          <HolisticCategorySelector
            selectedCategory={formData.category}
            onCategorySelect={(categoryId) => handleInputChange('category', categoryId)}
          />
        </div>
      )
    },
    {
      id: 'basic-info',
      title: 'Basic Info',
      description: 'Tell us about your event',
      icon: FileText,
      validation: validateBasicInfoStep,
      component: (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-forest-700 mb-2">Event Title</label>
            <input
              ref={titleRef}
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., Morning Yoga Flow, Community Garden Workday"
              className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-forest-700 mb-2">Description</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your event, what participants can expect, and any special focuses..."
              className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-forest-700 mb-3">Event Type</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleInputChange('eventType', 'local')}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  formData.eventType === 'local'
                    ? 'border-forest-500 bg-forest-50'
                    : 'border-forest-100 hover:border-forest-200 hover:bg-forest-50'
                }`}
              >
                <MapPin className="h-5 w-5 text-forest-600 mb-2" />
                <h4 className="font-semibold text-forest-800 mb-1">Local Event</h4>
                <p className="text-sm text-forest-600">In-person event in your neighborhood</p>
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('eventType', 'virtual')}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  formData.eventType === 'virtual'
                    ? 'border-forest-500 bg-forest-50'
                    : 'border-forest-100 hover:border-forest-200 hover:bg-forest-50'
                }`}
              >
                <Video className="h-5 w-5 text-forest-600 mb-2" />
                <h4 className="font-semibold text-forest-800 mb-1">Virtual Event</h4>
                <p className="text-sm text-forest-600">Online event accessible globally</p>
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('eventType', 'global_physical')}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  formData.eventType === 'global_physical'
                    ? 'border-forest-500 bg-forest-50'
                    : 'border-forest-100 hover:border-forest-200 hover:bg-forest-50'
                }`}
              >
                <Globe className="h-5 w-5 text-forest-600 mb-2" />
                <h4 className="font-semibold text-forest-800 mb-1">Global Physical</h4>
                <p className="text-sm text-forest-600">Multiple locations worldwide</p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-forest-700 mb-2">Tags</label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="e.g., meditation, outdoor, beginners"
                className="flex-1 px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button
                type="button"
                onClick={addTag}
                className="bg-forest-600 hover:bg-forest-700 text-white px-4 py-3 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {formData.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-forest-100 text-forest-700 px-3 py-1 rounded-full text-sm flex items-center space-x-2"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="text-forest-500 hover:text-forest-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'schedule',
      title: 'Schedule',
      description: 'Set your date and time',
      icon: Calendar,
      validation: validateScheduleStep,
      component: (
        <div className="space-y-6">
          {/* Main Date & Time Section */}
          <div className="bg-gradient-to-br from-forest-50 to-earth-50 rounded-xl p-4 sm:p-6 border-2 border-forest-200">
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="h-5 w-5 text-forest-600" />
              <h3 className="text-lg font-semibold text-forest-800">Event Date & Time</h3>
            </div>

            <div ref={dateRef} className="space-y-4">
              {/* Date */}
              <div>
                <DatePicker
                  value={formData.date}
                  onChange={(date) => handleInputChange('date', date)}
                  minDate={new Date().toISOString().split('T')[0]}
                  label="Event Date"
                  required
                />
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <TimePicker
                  value={formData.startTime}
                  onChange={(time) => handleInputChange('startTime', time)}
                  label="Start Time"
                  required
                />
                <TimePicker
                  value={formData.endTime}
                  onChange={(time) => handleInputChange('endTime', time)}
                  label="End Time"
                  required
                />
              </div>

              {/* Duration Display */}
              {formData.startTime && formData.endTime && (() => {
                const [startHour, startMin] = formData.startTime.split(':').map(Number);
                const [endHour, endMin] = formData.endTime.split(':').map(Number);
                const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
                const hours = Math.floor(durationMinutes / 60);
                const minutes = durationMinutes % 60;

                if (durationMinutes > 0) {
                  return (
                    <div className="flex items-center justify-center space-x-2 p-3 bg-white rounded-lg border border-forest-200">
                      <Clock className="h-4 w-4 text-forest-600" />
                      <span className="text-sm font-medium text-forest-700">
                        Duration: {hours > 0 && `${hours}h `}{minutes > 0 && `${minutes}m`}
                      </span>
                    </div>
                  );
                }
              })()}
            </div>
          </div>

          {/* Registration Options */}
          <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
            <div
              className="p-4 sm:p-5 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => handleInputChange('registrationRequired', !formData.registrationRequired)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    formData.registrationRequired
                      ? 'bg-forest-600 border-forest-600'
                      : 'border-gray-300 bg-white'
                  }`}>
                    {formData.registrationRequired && (
                      <CheckCircle className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-forest-800">Registration Required</p>
                    <p className="text-sm text-gray-600">Attendees must register to join</p>
                  </div>
                </div>
              </div>
            </div>

            {formData.registrationRequired && (
              <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4 border-t border-gray-200 pt-4 bg-gray-50">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">Registration Deadline</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <DatePicker
                      value={formData.registrationDeadline ? formData.registrationDeadline.split('T')[0] : ''}
                      onChange={(date) => {
                        const time = formData.registrationDeadline ? formData.registrationDeadline.split('T')[1] || '23:59' : '23:59';
                        handleInputChange('registrationDeadline', `${date}T${time}`);
                      }}
                      label="Deadline Date"
                      minDate={new Date().toISOString().split('T')[0]}
                    />
                    <TimePicker
                      value={formData.registrationDeadline ? formData.registrationDeadline.split('T')[1] || '23:59' : '23:59'}
                      onChange={(time) => {
                        const date = formData.registrationDeadline ? formData.registrationDeadline.split('T')[0] : new Date().toISOString().split('T')[0];
                        handleInputChange('registrationDeadline', `${date}T${time}`);
                      }}
                      label="Deadline Time"
                    />
                  </div>
                </div>

                <div
                  className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleInputChange('waitlistEnabled', !formData.waitlistEnabled)}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    formData.waitlistEnabled
                      ? 'bg-forest-600 border-forest-600'
                      : 'border-gray-300 bg-white'
                  }`}>
                    {formData.waitlistEnabled && (
                      <CheckCircle className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700">Enable waitlist when event is full</span>
                </div>
              </div>
            )}
          </div>

          {/* Recurring Event Options */}
          <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
            <div
              className="p-4 sm:p-5 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => handleInputChange('recurring', !formData.recurring)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                    formData.recurring
                      ? 'bg-forest-600 border-forest-600'
                      : 'border-gray-300 bg-white'
                  }`}>
                    {formData.recurring && (
                      <CheckCircle className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-forest-800">Recurring Event</p>
                    <p className="text-sm text-gray-600">Repeat this event on a schedule</p>
                  </div>
                </div>
              </div>
            </div>

            {formData.recurring && (
              <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-200 pt-4 bg-gray-50">
                <label className="block text-sm font-medium text-gray-700 mb-2">Repeat Pattern</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'biweekly', label: 'Bi-weekly' },
                    { value: 'monthly', label: 'Monthly' }
                  ].map((pattern) => (
                    <button
                      key={pattern.value}
                      type="button"
                      onClick={() => handleInputChange('recurrencePattern', pattern.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        formData.recurrencePattern === pattern.value
                          ? 'bg-forest-600 text-white shadow-md'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pattern.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'location',
      title: 'Location',
      description: 'Where will it happen?',
      icon: MapPin,
      validation: validateLocationStep,
      component: (
        <div className="space-y-6">
          {formData.eventType === 'virtual' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-2">
                  <Video className="h-4 w-4 inline mr-1" />
                  Virtual Platform
                </label>
                <select
                  value={formData.virtualPlatform}
                  onChange={(e) => handleInputChange('virtualPlatform', e.target.value)}
                  className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                >
                  <option value="">Select platform</option>
                  <option value="zoom">Zoom</option>
                  <option value="meet">Google Meet</option>
                  <option value="teams">Microsoft Teams</option>
                  <option value="discord">Discord</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-2">Meeting URL</label>
                <input
                  type="url"
                  value={formData.virtualMeetingUrl}
                  onChange={(e) => handleInputChange('virtualMeetingUrl', e.target.value)}
                  placeholder="https://zoom.us/j/..."
                  className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-forest-600 mt-1">
                  Link will only be shared with registered participants
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-2">Platform Details</label>
                <input
                  ref={locationRef}
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g., Zoom Meeting Room, Discord Server Name"
                  className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-2">Venue Name</label>
                <input
                  ref={locationRef}
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g., My backyard garden, Community center, Local park pavilion"
                  className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-2">Address (Optional)</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Street address - will only be shared with confirmed participants"
                  className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                />
                <p className="text-xs text-forest-600 mt-1">
                  Exact address will only be shared with confirmed participants
                </p>
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'community-details',
      title: 'Details',
      description: 'Community & exchange settings',
      icon: Users,
      validation: validateCommunityDetailsStep,
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-2">
                <Users className="h-4 w-4 inline mr-1" />
                Maximum Participants
              </label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => handleInputChange('capacity', e.target.value)}
                placeholder="e.g., 10 (0 for unlimited)"
                min="0"
                className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
              />
              <p className="text-xs text-forest-600 mt-1">
                Set to 0 for unlimited capacity
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-forest-700 mb-2">
                <Star className="h-4 w-4 inline mr-1" />
                Skill Level
              </label>
              <select
                value={formData.skillLevel}
                onChange={(e) => handleInputChange('skillLevel', e.target.value)}
                className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
              >
                <option value="beginner">Beginner Friendly</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="all">All Levels</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-forest-700 mb-2">
              <DollarSign className="h-4 w-4 inline mr-1" />
              Exchange Type
            </label>
            <select
              value={formData.exchangeType}
              onChange={(e) => handleInputChange('exchangeType', e.target.value)}
              className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent mb-4"
            >
              <option value="free">Free</option>
              <option value="donation">Suggested Donation</option>
              <option value="fixed">Fixed Price</option>
              <option value="sliding_scale">Sliding Scale</option>
              <option value="barter">Barter/Exchange</option>
            </select>

            {formData.exchangeType === 'donation' && (
              <div>
                <input
                  type="text"
                  value={formData.donationAmount}
                  onChange={(e) => handleInputChange('donationAmount', e.target.value)}
                  placeholder="e.g., $5-10, Pay what you can"
                  className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                />
                <p className="text-xs text-forest-600 mt-1">
                  Suggested amount to support community growth
                </p>
              </div>
            )}

            {formData.exchangeType === 'fixed' && (
              <div>
                <input
                  type="text"
                  value={formData.donationAmount}
                  onChange={(e) => handleInputChange('donationAmount', e.target.value)}
                  placeholder="e.g., $20"
                  className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                />
              </div>
            )}

            {formData.exchangeType === 'sliding_scale' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-forest-700 mb-1">Minimum</label>
                    <input
                      type="number"
                      value={formData.minimumDonation}
                      onChange={(e) => handleInputChange('minimumDonation', e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-forest-700 mb-1">Maximum</label>
                    <input
                      type="number"
                      value={formData.maximumDonation}
                      onChange={(e) => handleInputChange('maximumDonation', e.target.value)}
                      placeholder="50"
                      min="0"
                      className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <p className="text-xs text-forest-600">
                  Participants can choose amount based on their means
                </p>
              </div>
            )}

            {formData.exchangeType === 'barter' && (
              <div>
                <input
                  type="text"
                  value={formData.donationAmount}
                  onChange={(e) => handleInputChange('donationAmount', e.target.value)}
                  placeholder="e.g., Bring a dish to share, Energy exchange"
                  className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                />
                <p className="text-xs text-forest-600 mt-1">
                  Describe what participants can offer in exchange
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-forest-700 mb-2">
              <Book className="h-4 w-4 inline mr-1" />
              Prerequisites
            </label>
            <textarea
              rows={2}
              value={formData.prerequisites}
              onChange={(e) => handleInputChange('prerequisites', e.target.value)}
              placeholder="Any requirements or prior experience needed..."
              className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent"
            />
          </div>
        </div>
      )
    },
    {
      id: 'materials',
      title: 'Registry',
      description: 'What to bring',
      icon: Book,
      component: (
        <EventRegistrySetup
          category={formData.category}
          venueType={formData.venueType}
          onVenueTypeChange={(venueType) => handleInputChange('venueType', venueType)}
          registryEnabled={formData.registryEnabled}
          onRegistryEnabledChange={(enabled) => handleInputChange('registryEnabled', enabled)}
          registryVisibility={formData.registryVisibility}
          onRegistryVisibilityChange={(visibility) => handleInputChange('registryVisibility', visibility)}
          materials={formData.registryMaterials}
          onMaterialsChange={(materials) => handleInputChange('registryMaterials', materials)}
        />
      )
    },
    {
      id: 'review',
      title: 'Review',
      description: 'Review and submit',
      icon: CheckCircle,
      component: (
        <div className="space-y-6">
          <div className="bg-forest-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-forest-800 mb-4">Event Summary</h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-forest-600">Title</p>
                <p className="text-forest-800">{formData.title || 'Not set'}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-forest-600">Category</p>
                <p className="text-forest-800 capitalize">{formData.category || 'Not selected'}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-forest-600">Type</p>
                <p className="text-forest-800 capitalize">{formData.eventType.replace('_', ' ')}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-forest-600">Date & Time</p>
                <p className="text-forest-800">
                  {formData.date ? new Date(formData.date).toLocaleDateString() : 'Not set'} at {formData.startTime} - {formData.endTime}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-forest-600">Location</p>
                <p className="text-forest-800">{formData.location || 'Not set'}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-forest-600">Capacity</p>
                <p className="text-forest-800">{formData.capacity === '0' ? 'Unlimited' : `${formData.capacity} participants`}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-forest-600">Exchange</p>
                <p className="text-forest-800 capitalize">{formData.exchangeType.replace('_', ' ')}</p>
              </div>

              {formData.tags.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-forest-600">Tags</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {formData.tags.map((tag, index) => (
                      <span key={index} className="bg-forest-100 text-forest-700 px-2 py-1 rounded-full text-xs">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              Review all details before submitting. You'll be able to edit your event after creation.
            </p>
          </div>

          {/* Save as Template Option */}
          <button
            type="button"
            onClick={() => {
              if (!formData.title && !formData.description) {
                setError('Please fill in some event details before saving as template');
                return;
              }
              setShowSaveTemplateModal(true);
            }}
            className="w-full p-4 rounded-xl border-2 border-forest-200 hover:border-forest-400 hover:bg-forest-50 transition-all group flex items-center justify-center space-x-3"
          >
            <Save className="h-5 w-5 text-forest-600" />
            <div className="text-left">
              <p className="font-semibold text-forest-800">Save as Template</p>
              <p className="text-xs text-forest-600">Reuse these settings for future events</p>
            </div>
          </button>
        </div>
      )
    }
  ];

  return (
    <div>
      {/* Error/Success Messages */}
      {error && (
        <div className="max-w-4xl mx-auto px-2 sm:px-4 mt-2 sm:mt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}
      {success && (
        <div className="max-w-4xl mx-auto px-2 sm:px-4 mt-2 sm:mt-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-green-600">{success}</p>
          </div>
        </div>
      )}

      {/* Wizard */}
      <SlidingFormWizard
        steps={wizardSteps}
        onComplete={handleComplete}
        onCancel={() => navigate('/activities')}
        showStepIndicator={true}
        showProgressBar={true}
        allowSkip={false}
        saveProgress={false}
      />

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-forest-800 mb-4">Save Event Template</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Weekly Yoga Class"
                  className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-forest-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Notes about this template..."
                  className="w-full px-3 py-2 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowSaveTemplateModal(false);
                  setTemplateName('');
                  setTemplateDescription('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveAsTemplate}
                className="px-4 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateEvent;
