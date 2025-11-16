import React, { useState, useEffect } from 'react';
import { X, FileText, Check, Edit3, Eye, Save, Sunrise, Moon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { AgreementTemplate, Space } from '../lib/supabase';

interface SpaceAgreementOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  space: Space;
  onAgreementCreated?: () => void;
}

type Step = 'select-template' | 'customize' | 'preview' | 'save';

const SpaceAgreementOnboarding: React.FC<SpaceAgreementOnboardingProps> = ({
  isOpen,
  onClose,
  space,
  onAgreementCreated
}) => {
  const [currentStep, setCurrentStep] = useState<Step>('select-template');
  const [templates, setTemplates] = useState<AgreementTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<AgreementTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Customizable fields
  const [agreementTitle, setAgreementTitle] = useState('');
  const [agreementContent, setAgreementContent] = useState('');
  const [cancellationPolicy, setCancellationPolicy] = useState('');
  const [accommodationDetails, setAccommodationDetails] = useState('');
  const [checkInTime, setCheckInTime] = useState('3:00 PM');
  const [checkOutTime, setCheckOutTime] = useState('11:00 AM');
  const [packingList, setPackingList] = useState('');

  // Load templates
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('agreement_templates')
      .select('*')
      .eq('is_active', true)
      .order('type', { ascending: true });

    if (error) {
      setError('Failed to load templates');
      console.error(error);
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
  };

  const handleTemplateSelect = (template: AgreementTemplate) => {
    setSelectedTemplate(template);
    setAgreementTitle(`${template.name} - ${space.name}`);
    setAgreementContent(template.content);

    // Set some sensible defaults
    if (template.type === 'day') {
      setCancellationPolicy('Full refund if cancelled 48 hours before event. 50% refund if cancelled 24 hours before. No refund for same-day cancellations.');
    } else {
      setCancellationPolicy('Full refund if cancelled 14 days before retreat. 50% refund if cancelled 7 days before. No refund for cancellations within 7 days.');
      setAccommodationDetails('Shared accommodation with 2-4 people per room. Private rooms available for additional fee.');
      setPackingList('Comfortable clothing, yoga mat, water bottle, toiletries, personal medications, journal (optional)');
    }

    setCurrentStep('customize');
  };

  const handleCustomize = () => {
    // Replace template variables with actual values
    let customizedContent = agreementContent;

    // Replace common variables
    customizedContent = customizedContent
      .replace(/\{\{space_name\}\}/g, space.name)
      .replace(/\{\{space_address\}\}/g, space.address)
      .replace(/\{\{cancellation_policy\}\}/g, cancellationPolicy)
      .replace(/\{\{checkin_time\}\}/g, checkInTime)
      .replace(/\{\{checkout_time\}\}/g, checkOutTime)
      .replace(/\{\{packing_list\}\}/g, packingList);

    if (selectedTemplate?.type === 'overnight') {
      customizedContent = customizedContent
        .replace(/\{\{accommodation_details\}\}/g, accommodationDetails);
    }

    setAgreementContent(customizedContent);
    setCurrentStep('preview');
  };

  const handleSaveAgreement = async () => {
    if (!selectedTemplate) return;

    setLoading(true);
    setError(null);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('Not authenticated');
      }

      const { data, error: insertError } = await supabase
        .from('space_liability_agreements')
        .insert({
          space_id: space.id,
          creator_id: userData.user.id,
          agreement_type: selectedTemplate.type,
          template_id: selectedTemplate.id,
          title: agreementTitle,
          content: agreementContent,
          requires_signature: true,
          is_active: true
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setCurrentStep('save');

      // Call success callback after a brief moment
      setTimeout(() => {
        onAgreementCreated?.();
        onClose();
        resetForm();
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to save agreement');
      console.error('Error saving agreement:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep('select-template');
    setSelectedTemplate(null);
    setAgreementTitle('');
    setAgreementContent('');
    setCancellationPolicy('');
    setAccommodationDetails('');
    setCheckInTime('3:00 PM');
    setCheckOutTime('11:00 AM');
    setPackingList('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-forest-600 to-earth-500 px-6 py-4 text-white flex-shrink-0">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3 mb-2">
            <FileText className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Create Liability Agreement</h2>
          </div>
          <p className="text-forest-100">for {space.name}</p>

          {/* Progress Steps */}
          <div className="flex items-center justify-center space-x-2 mt-4">
            {['select-template', 'customize', 'preview', 'save'].map((step, index) => (
              <React.Fragment key={step}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    currentStep === step
                      ? 'bg-white text-forest-600 scale-110'
                      : ['select-template', 'customize', 'preview'].indexOf(currentStep) > index
                      ? 'bg-green-500 text-white'
                      : 'bg-white/20 text-white/60'
                  }`}
                >
                  {['select-template', 'customize', 'preview'].indexOf(currentStep) > index ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 3 && (
                  <div
                    className={`h-1 w-12 transition-all ${
                      ['select-template', 'customize', 'preview'].indexOf(currentStep) > index
                        ? 'bg-green-500'
                        : 'bg-white/20'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          )}

          {/* Step 1: Select Template */}
          {currentStep === 'select-template' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-forest-800 mb-2">
                  Choose an Agreement Template
                </h3>
                <p className="text-forest-600">
                  Select the type of agreement that matches your space usage
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className="p-6 border-2 border-forest-200 rounded-xl hover:border-forest-400 hover:shadow-lg transition-all text-left group"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg ${
                        template.type === 'day'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-indigo-100 text-indigo-600'
                      }`}>
                        {template.type === 'day' ? (
                          <Sunrise className="w-6 h-6" />
                        ) : (
                          <Moon className="w-6 h-6" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-forest-800 group-hover:text-forest-600 mb-1">
                          {template.name}
                        </h4>
                        <p className="text-sm text-forest-600">
                          {template.description}
                        </p>
                        <div className="mt-2 inline-block px-2 py-1 bg-forest-100 text-forest-700 text-xs rounded-full">
                          {template.type === 'day' ? 'Single Day' : 'Overnight/Multi-Day'}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {loading && (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-forest-600/30 border-t-forest-600 rounded-full animate-spin mx-auto" />
                  <p className="mt-2 text-forest-600">Loading templates...</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Customize */}
          {currentStep === 'customize' && selectedTemplate && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-forest-800 mb-2">
                  Customize Your Agreement
                </h3>
                <p className="text-forest-600">
                  Fill in the details specific to your space
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">
                    Agreement Title
                  </label>
                  <input
                    type="text"
                    value={agreementTitle}
                    onChange={(e) => setAgreementTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-forest-200 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">
                    Cancellation Policy
                  </label>
                  <textarea
                    value={cancellationPolicy}
                    onChange={(e) => setCancellationPolicy(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-forest-200 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                  />
                </div>

                {selectedTemplate.type === 'overnight' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-forest-700 mb-2">
                          Check-In Time
                        </label>
                        <input
                          type="text"
                          value={checkInTime}
                          onChange={(e) => setCheckInTime(e.target.value)}
                          className="w-full px-4 py-2 border border-forest-200 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-forest-700 mb-2">
                          Check-Out Time
                        </label>
                        <input
                          type="text"
                          value={checkOutTime}
                          onChange={(e) => setCheckOutTime(e.target.value)}
                          className="w-full px-4 py-2 border border-forest-200 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">
                        Accommodation Details
                      </label>
                      <textarea
                        value={accommodationDetails}
                        onChange={(e) => setAccommodationDetails(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 border border-forest-200 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">
                        Packing List
                      </label>
                      <textarea
                        value={packingList}
                        onChange={(e) => setPackingList(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 border border-forest-200 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                        placeholder="e.g., Comfortable clothing, yoga mat, water bottle..."
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setCurrentStep('select-template')}
                  className="px-6 py-2 text-forest-600 hover:text-forest-700 font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleCustomize}
                  className="px-6 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors flex items-center space-x-2"
                >
                  <span>Preview Agreement</span>
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {currentStep === 'preview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-forest-800 mb-2">
                    Preview Agreement
                  </h3>
                  <p className="text-forest-600">
                    Review your agreement before saving
                  </p>
                </div>
                <button
                  onClick={() => setCurrentStep('customize')}
                  className="flex items-center space-x-2 text-forest-600 hover:text-forest-700"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              </div>

              <div className="border-2 border-forest-200 rounded-lg p-6 bg-forest-50/50 max-h-96 overflow-y-auto">
                <h4 className="text-lg font-semibold text-forest-800 mb-4">
                  {agreementTitle}
                </h4>
                <div className="prose prose-sm max-w-none text-forest-700 whitespace-pre-wrap">
                  {agreementContent}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setCurrentStep('customize')}
                  className="px-6 py-2 text-forest-600 hover:text-forest-700 font-medium"
                >
                  Back to Edit
                </button>
                <button
                  onClick={handleSaveAgreement}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Agreement</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {currentStep === 'save' && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-forest-800 mb-2">
                Agreement Created Successfully!
              </h3>
              <p className="text-forest-600">
                Your liability agreement is now active and will be required for retreat events at {space.name}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpaceAgreementOnboarding;
