import React, { useState } from 'react';
import InviteCodeForm from './InviteCodeForm';
import SignUpForm from './SignUpForm';
import SignInForm from './SignInForm';
import { useTheme } from '../../context/ThemeContext';

type AuthStep = 'invite' | 'signup' | 'signin';

const AuthFlow: React.FC = () => {
  const { theme } = useTheme();
  const [step, setStep] = useState<AuthStep>('invite');
  const [validatedCode, setValidatedCode] = useState('');

  const handleValidCode = (code: string) => {
    setValidatedCode(code);
    setStep('signup');
  };

  const handleSignUpSuccess = () => {
    // User will be automatically redirected by the auth context
  };

  const handleBackToInvite = () => {
    setStep('invite');
    setValidatedCode('');
  };

  const handleSwitchToSignIn = () => {
    setStep('signin');
  };

  const handleSwitchToInvite = () => {
    setStep('invite');
  };

  if (step === 'signin') {
    return (
      <div className="relative">
        <SignInForm onSwitchToInvite={handleSwitchToInvite} />
      </div>
    );
  }

  if (step === 'signup') {
    return (
      <SignUpForm
        inviteCode={validatedCode}
        onBack={handleBackToInvite}
        onSuccess={handleSignUpSuccess}
      />
    );
  }

  return (
    <InviteCodeForm 
      onValidCode={handleValidCode} 
      onSwitchToSignIn={handleSwitchToSignIn}
    />
  );
};

export default AuthFlow;