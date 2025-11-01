import React, { useState } from 'react'
import { CommunityRequest, CommunityRequestResponse } from '../lib/supabase'
import {
  X,
  User,
  Clock,
  MessageCircle,
  ArrowUp,
  Send,
  CheckCircle2,
  XCircle,
  HandHeart,
  Package,
  Lightbulb,
  Calendar,
  Lock,
  Globe
} from 'lucide-react'

interface CommunityRequestDetailModalProps {
  isOpen: boolean
  onClose: () => void
  request: CommunityRequest | null
  onRespond: (requestId: string, message: string, isOfferToHelp: boolean) => Promise<void>
  onUpvote: (requestId: string) => Promise<void>
  onUpdateStatus: (requestId: string, status: string, notes?: string) => Promise<void>
  isOwnerOrModerator?: boolean
}

const categoryConfig = {
  help_needed: {
    icon: HandHeart,
    label: 'Help Needed',
    color: 'text-rose-600'
  },
  resource_request: {
    icon: Package,
    label: 'Resource Request',
    color: 'text-blue-600'
  },
  skill_sharing: {
    icon: Lightbulb,
    label: 'Skill Sharing',
    color: 'text-amber-600'
  },
  event_idea: {
    icon: Calendar,
    label: 'Event Idea',
    color: 'text-purple-600'
  }
}

const CommunityRequestDetailModal: React.FC<CommunityRequestDetailModalProps> = ({
  isOpen,
  onClose,
  request,
  onRespond,
  onUpvote,
  onUpdateStatus,
  isOwnerOrModerator = false
}) => {
  const [responseMessage, setResponseMessage] = useState('')
  const [isOfferToHelp, setIsOfferToHelp] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUpvoting, setIsUpvoting] = useState(false)

  if (!isOpen || !request) return null

  const category = categoryConfig[request.category]
  const CategoryIcon = category.icon

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const handleSubmitResponse = async () => {
    if (!responseMessage.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onRespond(request.id, responseMessage.trim(), isOfferToHelp)
      setResponseMessage('')
      setIsOfferToHelp(false)
    } catch (error) {
      console.error('Failed to submit response:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpvote = async () => {
    if (isUpvoting) return
    setIsUpvoting(true)
    try {
      await onUpvote(request.id)
    } catch (error) {
      console.error('Failed to upvote:', error)
    } finally {
      setIsUpvoting(false)
    }
  }

  const handleMarkFulfilled = async () => {
    if (confirm('Mark this request as fulfilled?')) {
      await onUpdateStatus(request.id, 'fulfilled')
    }
  }

  const handleMarkDeclined = async () => {
    if (confirm('Decline this request?')) {
      await onUpdateStatus(request.id, 'declined')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className={`p-2 rounded-lg bg-${category.color.split('-')[1]}-50 border border-${category.color.split('-')[1]}-200`}>
                <CategoryIcon className={`w-6 h-6 ${category.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{request.title}</h2>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {request.requester?.full_name || request.requester?.username}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatTimeAgo(request.created_at)}
                  </span>
                  <span>•</span>
                  <span className={category.color}>{category.label}</span>
                  {request.is_private && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Lock className="w-4 h-4" />
                        Private
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{request.description}</p>
          </div>

          {/* Stats & Actions */}
          <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
            <button
              onClick={handleUpvote}
              disabled={isUpvoting}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                ${request.has_upvoted
                  ? 'bg-forest-100 text-forest-700 border border-forest-300'
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <ArrowUp className="w-5 h-5" />
              <span>{request.upvotes_count} {request.upvotes_count === 1 ? 'Upvote' : 'Upvotes'}</span>
            </button>

            <div className="flex items-center gap-2 text-gray-600">
              <MessageCircle className="w-5 h-5" />
              <span>{request.responses_count} {request.responses_count === 1 ? 'Response' : 'Responses'}</span>
            </div>

            {isOwnerOrModerator && request.status === 'open' && (
              <div className="ml-auto flex gap-2">
                <button
                  onClick={handleMarkFulfilled}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark Fulfilled
                </button>
                <button
                  onClick={handleMarkDeclined}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Decline
                </button>
              </div>
            )}
          </div>

          {/* Responses */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">
              Responses ({request.responses?.length || 0})
            </h3>

            {request.responses && request.responses.length > 0 ? (
              <div className="space-y-4">
                {request.responses.map((response) => (
                  <div
                    key={response.id}
                    className={`
                      p-4 rounded-lg border
                      ${response.is_offer_to_help
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-forest-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-forest-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {response.user?.full_name || response.user?.username || 'Anonymous'}
                          </span>
                          {response.is_offer_to_help && (
                            <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-medium rounded-full">
                              Offering to Help
                            </span>
                          )}
                          {response.ai_assisted && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                              AI Assisted
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatTimeAgo(response.created_at)}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap ml-11">{response.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No responses yet. Be the first to respond!</p>
            )}
          </div>

          {/* Add Response */}
          {request.status === 'open' && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Add a Response</h3>
              <div className="space-y-3">
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Share your thoughts or offer to help..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-forest-500 focus:border-transparent resize-none"
                  maxLength={500}
                />

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isOfferToHelp}
                      onChange={(e) => setIsOfferToHelp(e.target.checked)}
                      className="w-4 h-4 text-forest-600 border-gray-300 rounded focus:ring-forest-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      I'm offering to help with this request
                    </span>
                  </label>

                  <button
                    onClick={handleSubmitResponse}
                    disabled={!responseMessage.trim() || isSubmitting}
                    className="px-6 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
                  >
                    <Send className="w-4 h-4" />
                    {isSubmitting ? 'Sending...' : 'Send Response'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {request.status === 'fulfilled' && request.fulfillment_notes && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Request Fulfilled</span>
              </div>
              <p className="text-sm text-green-600">{request.fulfillment_notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CommunityRequestDetailModal
