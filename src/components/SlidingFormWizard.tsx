import React, { useState, ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  component: ReactNode;
  validation?: () => boolean | Promise<boolean>;
  onEnter?: () => void;
  onExit?: () => void;
}

export interface SlidingFormWizardProps {
  steps: WizardStep[];
  onComplete: () => void | Promise<void>;
  onCancel: () => void;
  showStepIndicator?: boolean;
  showProgressBar?: boolean;
  allowSkip?: boolean;
  saveProgress?: boolean;
  className?: string;
}

export const SlidingFormWizard: React.FC<SlidingFormWizardProps> = ({
  steps,
  onComplete,
  onCancel,
  showStepIndicator = true,
  showProgressBar = true,
  allowSkip = false,
  saveProgress = false,
  className = ''
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isValidating, setIsValidating] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  // Scroll to top of page when step changes
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNext = async () => {
    // Validate current step if validation function exists
    if (currentStep.validation) {
      setIsValidating(true);
      try {
        const isValid = await currentStep.validation();
        if (!isValid) {
          setIsValidating(false);
          return;
        }
      } catch (error) {
        console.error('Validation error:', error);
        setIsValidating(false);
        return;
      }
      setIsValidating(false);
    }

    // Mark step as completed
    setCompletedSteps(prev => new Set(prev).add(currentStepIndex));

    // Call onExit for current step
    if (currentStep.onExit) {
      currentStep.onExit();
    }

    if (isLastStep) {
      // Final step - complete wizard
      setIsCompleting(true);
      try {
        await onComplete();
      } catch (error) {
        console.error('Completion error:', error);
      }
      setIsCompleting(false);
    } else {
      // Move to next step
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);

      // Scroll to top of form
      scrollToTop();

      // Call onEnter for next step
      if (steps[nextIndex].onEnter) {
        steps[nextIndex].onEnter();
      }
    }
  };

  const handleBack = () => {
    // Call onExit for current step
    if (currentStep.onExit) {
      currentStep.onExit();
    }

    if (isFirstStep) {
      onCancel();
    } else {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);

      // Scroll to top of form
      scrollToTop();

      // Call onEnter for previous step
      if (steps[prevIndex].onEnter) {
        steps[prevIndex].onEnter();
      }
    }
  };

  const goToStep = (index: number) => {
    if (index < 0 || index >= steps.length) return;
    if (!allowSkip && index > currentStepIndex && !completedSteps.has(currentStepIndex)) {
      // Can't skip ahead without completing current step
      return;
    }

    // Call onExit for current step
    if (currentStep.onExit) {
      currentStep.onExit();
    }

    setCurrentStepIndex(index);

    // Scroll to top of form
    scrollToTop();

    // Call onEnter for new step
    if (steps[index].onEnter) {
      steps[index].onEnter();
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-forest-50 to-earth-50 py-4 sm:py-12 px-2 sm:px-4 ${className}`}>
      <div className="max-w-4xl mx-auto">
        {/* Progress Indicator */}
        {showStepIndicator && (
          <div className="mb-4 sm:mb-8">
            {showProgressBar && (
              <div className="mb-3 sm:mb-4">
                <div className="h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-forest-500 to-forest-600 transition-all duration-300"
                    style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between overflow-x-auto pb-2 sm:pb-0">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStepIndex;
                const isCompleted = completedSteps.has(index);
                const isAccessible = allowSkip || index <= currentStepIndex || isCompleted;

                return (
                  <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center flex-shrink-0">
                      <button
                        onClick={() => isAccessible && goToStep(index)}
                        disabled={!isAccessible}
                        className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-forest-600 text-white cursor-pointer hover:bg-forest-700'
                            : isActive
                            ? 'bg-forest-500 text-white ring-2 sm:ring-4 ring-forest-200'
                            : isAccessible
                            ? 'bg-gray-200 text-gray-400 cursor-pointer hover:bg-gray-300'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="h-4 w-4 sm:h-6 sm:w-6" />
                        ) : (
                          <Icon className="h-4 w-4 sm:h-6 sm:w-6" />
                        )}
                      </button>
                      <p
                        className={`text-[10px] sm:text-xs mt-1 sm:mt-2 text-center max-w-[60px] sm:max-w-[80px] hidden sm:block ${
                          isActive ? 'font-semibold text-forest-800' : 'text-gray-500'
                        }`}
                      >
                        {step.title}
                      </p>
                    </div>

                    {index < steps.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 sm:h-1 mx-1 sm:mx-2 transition-colors flex-shrink-0 min-w-[8px] sm:min-w-[16px] ${
                          isCompleted ? 'bg-forest-600' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
          {/* Step Header */}
          <div className="bg-gradient-to-r from-forest-50 to-earth-50 px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-xl sm:text-2xl font-bold text-forest-800 mb-1 sm:mb-2">{currentStep.title}</h2>
            {currentStep.description && (
              <p className="text-sm sm:text-base text-gray-600 hidden sm:block">{currentStep.description}</p>
            )}
          </div>

          {/* Step Content with Sliding Animation - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8">
            <div className="overflow-x-hidden">
              <div
                className="transition-transform duration-300 ease-in-out"
                style={{ transform: `translateX(-${currentStepIndex * 100}%)` }}
              >
                <div className="flex" style={{ width: `${steps.length * 100}%` }}>
                  {steps.map((step, index) => (
                    <div
                      key={step.id}
                      className="flex-shrink-0 px-2 sm:px-4"
                      style={{ width: `${100 / steps.length}%` }}
                    >
                      {index === currentStepIndex && (
                        <div className="max-w-2xl mx-auto">{step.component}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <button
              onClick={handleBack}
              disabled={isValidating || isCompleting}
              className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>{isFirstStep ? 'Cancel' : 'Back'}</span>
            </button>

            <div className="text-xs sm:text-sm text-gray-500">
              {currentStepIndex + 1}/{steps.length}
            </div>

            <button
              onClick={handleNext}
              disabled={isValidating || isCompleting}
              data-wizard-next
              className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-2 bg-forest-600 hover:bg-forest-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base ${
                !isValidating && !isCompleting ? 'animate-next-pulse' : ''
              }`}
            >
              {isValidating || isCompleting ? (
                <>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="hidden sm:inline">{isCompleting ? 'Completing...' : 'Validating...'}</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <span>{isLastStep ? 'Complete' : 'Next'}</span>
                  {!isLastStep && <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Optional: Save & Exit */}
        {saveProgress && !isLastStep && (
          <div className="text-center mt-4">
            <button
              onClick={onCancel}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Save progress and exit
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SlidingFormWizard;
