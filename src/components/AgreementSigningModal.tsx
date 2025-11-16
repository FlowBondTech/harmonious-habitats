import React, { useState, useRef } from 'react';
import { X, FileText, Check, AlertCircle, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { SpaceLiabilityAgreement, Event } from '../lib/supabase';

interface AgreementSigningModalProps {
  isOpen: boolean;
  onClose: () => void;
  agreement: SpaceLiabilityAgreement;
  event: Event;
  onSigned?: () => void;
}

const AgreementSigningModal: React.FC<AgreementSigningModalProps> = ({
  isOpen,
  onClose,
  agreement,
  event,
  onSigned
}) => {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [signature, setSignature] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Replace template variables with actual event data
  const getProcessedContent = () => {
    let content = agreement.content;

    // Get current user data
    const participantName = signature || '[Your Name]';

    content = content
      .replace(/\{\{event_name\}\}/g, event.title)
      .replace(/\{\{event_date\}\}/g, new Date(event.date).toLocaleDateString())
      .replace(/\{\{retreat_start_date\}\}/g, event.retreat_start_date ? new Date(event.retreat_start_date).toLocaleDateString() : '')
      .replace(/\{\{retreat_end_date\}\}/g, event.retreat_end_date ? new Date(event.retreat_end_date).toLocaleDateString() : '')
      .replace(/\{\{participant_name\}\}/g, participantName)
      .replace(/\{\{emergency_contact_name\}\}/g, emergencyContactName || '[Emergency Contact Name]')
      .replace(/\{\{emergency_contact_phone\}\}/g, emergencyContactPhone || '[Emergency Contact Phone]')
      .replace(/\{\{dietary_restrictions\}\}/g, dietaryRestrictions || 'None specified')
      .replace(/\{\{allergies\}\}/g, allergies || 'None specified')
      .replace(/\{\{meals_included\}\}/g, event.meals_included?.join(', ') || 'Not specified');

    return content;
  };

  const handleSign = async () => {
    if (!agreedToTerms) {
      setError('You must agree to the terms before signing');
      return;
    }

    if (!signature.trim()) {
      setError('Please enter your full name as your signature');
      return;
    }

    if (!emergencyContactName.trim() || !emergencyContactPhone.trim()) {
      setError('Emergency contact information is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('Not authenticated');
      }

      // Collect signature metadata
      const signatureData = {
        participant_name: signature,
        emergency_contact: {
          name: emergencyContactName,
          phone: emergencyContactPhone
        },
        dietary_info: {
          restrictions: dietaryRestrictions,
          allergies: allergies
        },
        ip_address: await fetch('https://api.ipify.org?format=json')
          .then(r => r.json())
          .then(d => d.ip)
          .catch(() => 'unknown'),
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };

      const { error: signError } = await supabase
        .from('participant_agreement_signatures')
        .insert({
          event_id: event.id,
          agreement_id: agreement.id,
          participant_id: userData.user.id,
          signature_data: signatureData,
          agreed_to_terms: true
        });

      if (signError) throw signError;

      setSuccess(true);

      setTimeout(() => {
        onSigned?.();
        handleClose();
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to sign agreement');
      console.error('Error signing agreement:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!success && !confirm('Are you sure you want to close without signing? You must sign this agreement to register for the event.')) {
      return;
    }
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setAgreedToTerms(false);
    setSignature('');
    setEmergencyContactName('');
    setEmergencyContactPhone('');
    setDietaryRestrictions('');
    setAllergies('');
    setError(null);
    setSuccess(false);
  };

  const handleDownload = () => {
    const content = getProcessedContent();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title}-liability-agreement.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <FileText className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Liability Agreement Required</h2>
              </div>
              <p className="text-forest-100">{event.title}</p>
            </div>

            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {success ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-forest-800 mb-2">
                Agreement Signed Successfully!
              </h3>
              <p className="text-forest-600">
                You can now complete your registration for this event.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Important Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-semibold mb-1">Please Read Carefully</p>
                    <p>
                      This is a legally binding agreement. Please read it thoroughly before signing.
                      You may download a copy for your records.
                    </p>
                  </div>
                </div>
              </div>

              {/* Agreement Content */}
              <div className="border-2 border-forest-200 rounded-lg p-6 bg-forest-50/50 max-h-96 overflow-y-auto">
                <h3 className="text-lg font-semibold text-forest-800 mb-4">
                  {agreement.title}
                </h3>
                <div
                  ref={contentRef}
                  className="prose prose-sm max-w-none text-forest-700 whitespace-pre-wrap"
                >
                  {getProcessedContent()}
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                  {error}
                </div>
              )}

              {/* Participant Information */}
              <div className="space-y-4 border-t-2 border-forest-200 pt-6">
                <h4 className="text-lg font-semibold text-forest-800">
                  Participant Information
                </h4>

                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">
                    Full Name (Digital Signature) *
                  </label>
                  <input
                    type="text"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    className="w-full px-4 py-2 border border-forest-200 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                    placeholder="Enter your full legal name"
                    required
                  />
                  <p className="mt-1 text-xs text-forest-500">
                    By typing your name, you are providing a legally binding electronic signature
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      Emergency Contact Name *
                    </label>
                    <input
                      type="text"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      className="w-full px-4 py-2 border border-forest-200 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-forest-700 mb-2">
                      Emergency Contact Phone *
                    </label>
                    <input
                      type="tel"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      className="w-full px-4 py-2 border border-forest-200 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {event.is_retreat && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">
                        Dietary Restrictions
                      </label>
                      <input
                        type="text"
                        value={dietaryRestrictions}
                        onChange={(e) => setDietaryRestrictions(e.target.value)}
                        className="w-full px-4 py-2 border border-forest-200 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                        placeholder="e.g., Vegetarian, Vegan, Gluten-free"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-forest-700 mb-2">
                        Allergies
                      </label>
                      <input
                        type="text"
                        value={allergies}
                        onChange={(e) => setAllergies(e.target.value)}
                        className="w-full px-4 py-2 border border-forest-200 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
                        placeholder="e.g., Nuts, Dairy, Shellfish"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Agreement Checkbox */}
              <div className="flex items-start space-x-3 bg-forest-50 border-2 border-forest-300 rounded-lg p-4">
                <input
                  type="checkbox"
                  id="agree-terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-5 h-5 text-forest-600 border-forest-300 rounded focus:ring-forest-500"
                />
                <label htmlFor="agree-terms" className="text-sm text-forest-700 cursor-pointer">
                  <span className="font-semibold">I have read and agree to the terms above.</span> I understand that
                  this is a legally binding electronic signature and that I am waiving certain legal rights by signing
                  this agreement. I certify that all information provided is accurate.
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 text-forest-600 hover:text-forest-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSign}
                  disabled={!agreedToTerms || !signature.trim() || loading}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      <span>Sign Agreement</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgreementSigningModal;
