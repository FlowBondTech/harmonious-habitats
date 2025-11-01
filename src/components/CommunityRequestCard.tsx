import React from 'react'
import { CommunityRequest } from '../lib/supabase'
import {
  MessageCircle,
  ArrowUp,
  Clock,
  User,
  HandHeart,
  Package,
  Lightbulb,
  Calendar,
  Lock,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react'

interface CommunityRequestCardProps {
  request: CommunityRequest
  onClick?: () => void
  onUpvote?: (requestId: string) => void
  isUpvoting?: boolean
}

const categoryConfig = {
  help_needed: {
    icon: HandHeart,
    label: 'Help Needed',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200'
  },
  resource_request: {
    icon: Package,
    label: 'Resource Request',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200'
  },
  skill_sharing: {
    icon: Lightbulb,
    label: 'Skill Sharing',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200'
  },
  event_idea: {
    icon: Calendar,
    label: 'Event Idea',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200'
  }
}

const statusConfig = {
  open: {
    label: 'Open',
    color: 'text-green-700',
    bg: 'bg-green-50',
    border: 'border-green-200'
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200'
  },
  fulfilled: {
    label: 'Fulfilled',
    color: 'text-gray-700',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    icon: CheckCircle2
  },
  declined: {
    label: 'Declined',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: XCircle
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-gray-700',
    bg: 'bg-gray-50',
    border: 'border-gray-200'
  }
}

const priorityConfig = {
  low: { color: 'text-gray-600' },
  medium: { color: 'text-blue-600' },
  high: { color: 'text-orange-600' },
  urgent: { color: 'text-red-600' }
}

const CommunityRequestCard: React.FC<CommunityRequestCardProps> = ({
  request,
  onClick,
  onUpvote,
  isUpvoting = false
}) => {
  const category = categoryConfig[request.category]
  const status = statusConfig[request.status]
  const CategoryIcon = category.icon
  const StatusIcon = status.icon

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onUpvote && !isUpvoting) {
      onUpvote(request.id)
    }
  }

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

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Category Icon */}
          <div className={`p-2 rounded-lg ${category.bg} ${category.border} border flex-shrink-0`}>
            <CategoryIcon className={`w-5 h-5 ${category.color}`} />
          </div>

          {/* Title & Metadata */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 group-hover:text-forest-600 transition-colors line-clamp-2 flex-1">
                {request.title}
              </h3>
              {request.is_private && (
                <Lock className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {request.requester?.full_name || request.requester?.username || 'Anonymous'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatTimeAgo(request.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`
          px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 flex-shrink-0
          ${status.bg} ${status.color} ${status.border} border
        `}>
          {StatusIcon && <StatusIcon className="w-3 h-3" />}
          {status.label}
        </div>
      </div>

      {/* Description Preview */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {request.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Category Label */}
          <span className={`text-xs font-medium ${category.color}`}>
            {category.label}
          </span>

          {/* Priority Indicator */}
          {request.priority !== 'medium' && (
            <span className={`text-xs font-medium ${priorityConfig[request.priority].color}`}>
              {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)} Priority
            </span>
          )}

          {/* Response Count */}
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <MessageCircle className="w-3.5 h-3.5" />
            {request.responses_count}
          </span>
        </div>

        {/* Upvote Button */}
        <button
          onClick={handleUpvote}
          disabled={isUpvoting}
          className={`
            flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium
            transition-all
            ${request.has_upvoted
              ? 'bg-forest-100 text-forest-700 border border-forest-300'
              : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {isUpvoting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowUp className="w-4 h-4" />
          )}
          <span>{request.upvotes_count}</span>
        </button>
      </div>
    </div>
  )
}

export default CommunityRequestCard
