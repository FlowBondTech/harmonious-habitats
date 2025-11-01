import React, { useState } from 'react'
import { X, HandHeart, Package, Lightbulb, Calendar, Lock, Globe } from 'lucide-react'
import { CommunityRequestCategory, CommunityRequestPriority } from '../lib/supabase'
import AIAssistButton from './AIAssistButton'

interface CreateCommunityRequestModalProps {
  isOpen: boolean
  onClose: () => void
  spaceId: string
  spaceName: string
  onSubmit: (requestData: {
    title: string
    description: string
    category: CommunityRequestCategory
    priority: CommunityRequestPriority
    is_private: boolean
  }) => Promise<void>
}

const categories = [
  {
    value: 'help_needed' as CommunityRequestCategory,
    label: 'Help Needed',
    icon: HandHeart,
    description: 'Ask the community for assistance or support',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200'
  },
  {
    value: 'resource_request' as CommunityRequestCategory,
    label: 'Resource Request',
    icon: Package,
    description: 'Request physical items or space access',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200'
  },
  {
    value: 'skill_sharing' as CommunityRequestCategory,
    label: 'Skill Sharing',
    icon: Lightbulb,
    description: 'Offer to teach or request to learn skills',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200'
  },
  {
    value: 'event_idea' as CommunityRequestCategory,
    label: 'Event Idea',
    icon: Calendar,
    description: 'Suggest events or gatherings for the community',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200'
  }
]

const CreateCommunityRequestModal: React.FC<CreateCommunityRequestModalProps> = ({
  isOpen,
  onClose,
  spaceId,
  spaceName,
  onSubmit
}) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<CommunityRequestCategory>('help_needed')
  const [priority, setPriority] = useState<CommunityRequestPriority>('medium')
  const [isPrivate, setIsPrivate] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!title.trim()) {
      setError('Please enter a title')
      return
    }
    if (!description.trim()) {
      setError('Please enter a description')
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        is_private: isPrivate
      })

      // Reset form
      setTitle('')
      setDescription('')
      setCategory('help_needed')
      setPriority('medium')
      setIsPrivate(false)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAIComplete = (generatedContent: string) => {
    // For now, just append to description
    // In future, could parse structured content
    setDescription(prev => prev + (prev ? '\n\n' : '') + generatedContent)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Create Community Request</h2>
              <p className="text-sm text-gray-500 mt-1">Ask for help from the {spaceName} community</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Request Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map((cat) => {
                const Icon = cat.icon
                const isSelected = category === cat.value

                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`
                      p-4 rounded-lg border-2 text-left transition-all
                      ${isSelected
                        ? `${cat.border} ${cat.bg}`
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 ${isSelected ? cat.color : 'text-gray-400'} flex-shrink-0 mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium ${isSelected ? cat.color : 'text-gray-900'}`}>
                          {cat.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {cat.description}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of your request..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-forest-500 focus:border-transparent"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/100 characters</p>
          </div>

          {/* Description with AI Assist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>
              <AIAssistButton
                mode="community_request"
                label="AI Help"
                variant="secondary"
                size="sm"
                onComplete={handleAIComplete}
              />
            </div>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you need in detail..."
              rows={6}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-forest-500 focus:border-transparent resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">{description.length}/1000 characters</p>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high', 'urgent'] as CommunityRequestPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`
                    flex-1 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all
                    ${priority === p
                      ? 'border-forest-500 bg-forest-50 text-forest-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }
                  `}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`
                relative w-12 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5
                ${isPrivate ? 'bg-forest-600' : 'bg-gray-300'}
              `}
            >
              <span
                className={`
                  absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform
                  ${isPrivate ? 'translate-x-6' : 'translate-x-0'}
                `}
              />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2 font-medium text-gray-900">
                {isPrivate ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Private Request</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    <span>Public Request</span>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {isPrivate
                  ? 'Only visible to space owners and moderators'
                  : 'Visible to all approved community members'
                }
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !description.trim()}
              className="flex-1 px-6 py-3 bg-forest-600 text-white rounded-lg font-medium hover:bg-forest-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateCommunityRequestModal
