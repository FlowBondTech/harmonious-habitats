import React, { useState } from 'react'
import { Sparkles } from 'lucide-react'
import AIWritingAssistant, { AIAssistantMode } from './AIWritingAssistant'

interface AIAssistButtonProps {
  mode: AIAssistantMode
  label?: string
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  onComplete?: (generatedContent: string) => void
  initialContext?: Record<string, any>
  className?: string
}

const AIAssistButton: React.FC<AIAssistButtonProps> = ({
  mode,
  label,
  variant = 'secondary',
  size = 'md',
  onComplete,
  initialContext,
  className = ''
}) => {
  const [showAssistant, setShowAssistant] = useState(false)

  const defaultLabels = {
    event_creation: 'AI Assist',
    space_description: 'Write with AI',
    community_request: 'Get AI Help',
    profile_bio: 'Generate Bio',
    recommendations: 'Get Recommendations'
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  const variantClasses = {
    primary: 'bg-forest-600 text-white hover:bg-forest-700 shadow-sm',
    secondary: 'bg-white text-forest-600 border border-forest-300 hover:bg-forest-50',
    ghost: 'text-forest-600 hover:bg-forest-50'
  }

  return (
    <>
      <button
        onClick={() => setShowAssistant(true)}
        className={`
          inline-flex items-center gap-2 rounded-lg font-medium transition-all
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${className}
          group
        `}
      >
        <Sparkles className={`
          ${size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'}
          group-hover:animate-pulse
        `} />
        <span>{label || defaultLabels[mode]}</span>
      </button>

      <AIWritingAssistant
        isOpen={showAssistant}
        onClose={() => setShowAssistant(false)}
        mode={mode}
        onComplete={(content) => {
          onComplete?.(content)
          setShowAssistant(false)
        }}
        initialContext={initialContext}
      />
    </>
  )
}

export default AIAssistButton
