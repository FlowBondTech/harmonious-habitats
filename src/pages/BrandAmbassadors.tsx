import React, { useState, useEffect } from 'react'
import { useAuthContext } from '../components/AuthProvider'
import { useNavigate } from 'react-router-dom'
import {
  getBrandAmbassadors,
  adminPromoteToAmbassador,
  adminRemoveAmbassador,
  type BrandAmbassador,
  type AmbassadorTier
} from '../lib/supabase'
import Avatar from '../components/Avatar'
import {
  Award,
  TrendingUp,
  Users,
  Shield,
  Search,
  ChevronDown,
  Crown,
  Star,
  Medal,
  Trophy,
  X,
  Check
} from 'lucide-react'

const BrandAmbassadors: React.FC = () => {
  const { user, profile } = useAuthContext()
  const navigate = useNavigate()
  const [ambassadors, setAmbassadors] = useState<BrandAmbassador[]>([])
  const [loading, setLoading] = useState(true)
  const [filterTier, setFilterTier] = useState<AmbassadorTier | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showPromoteModal, setShowPromoteModal] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [selectedAmbassador, setSelectedAmbassador] = useState<BrandAmbassador | null>(null)
  const [promotionTier, setPromotionTier] = useState<AmbassadorTier>('bronze')
  const [promotionNotes, setPromotionNotes] = useState('')
  const [removalReason, setRemovalReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Check admin access
  useEffect(() => {
    if (!profile?.is_admin) {
      navigate('/activities')
    }
  }, [profile, navigate])

  // Load ambassadors
  useEffect(() => {
    loadAmbassadors()
  }, [filterTier])

  const loadAmbassadors = async () => {
    setLoading(true)
    try {
      const { data, error } = await getBrandAmbassadors(
        filterTier === 'all' ? undefined : filterTier
      )
      if (error) throw error
      setAmbassadors(data || [])
    } catch (error) {
      console.error('Error loading ambassadors:', error)
      setMessage({ type: 'error', text: 'Failed to load ambassadors' })
    } finally {
      setLoading(false)
    }
  }

  const handlePromote = async () => {
    if (!selectedAmbassador) return

    setActionLoading(true)
    try {
      const { error } = await adminPromoteToAmbassador(
        selectedAmbassador.user_id,
        promotionTier,
        promotionNotes.trim() || undefined
      )

      if (error) throw error

      setMessage({
        type: 'success',
        text: `Successfully promoted ${selectedAmbassador.full_name} to ${promotionTier} tier`
      })
      setShowPromoteModal(false)
      setSelectedAmbassador(null)
      setPromotionNotes('')
      await loadAmbassadors()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to promote ambassador' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemove = async () => {
    if (!selectedAmbassador) return

    setActionLoading(true)
    try {
      const { error } = await adminRemoveAmbassador(
        selectedAmbassador.user_id,
        removalReason.trim() || undefined
      )

      if (error) throw error

      setMessage({
        type: 'success',
        text: `Successfully removed ${selectedAmbassador.full_name} from ambassador program`
      })
      setShowRemoveModal(false)
      setSelectedAmbassador(null)
      setRemovalReason('')
      await loadAmbassadors()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to remove ambassador' })
    } finally {
      setActionLoading(false)
    }
  }

  const getTierIcon = (tier?: AmbassadorTier) => {
    switch (tier) {
      case 'platinum':
        return <Crown className="w-5 h-5 text-purple-600" />
      case 'gold':
        return <Trophy className="w-5 h-5 text-yellow-600" />
      case 'silver':
        return <Medal className="w-5 h-5 text-gray-500" />
      case 'bronze':
        return <Star className="w-5 h-5 text-orange-600" />
      default:
        return <Award className="w-5 h-5 text-gray-400" />
    }
  }

  const getTierColor = (tier?: AmbassadorTier) => {
    switch (tier) {
      case 'platinum':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'gold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'silver':
        return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'bronze':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  // Filter ambassadors by search query
  const filteredAmbassadors = ambassadors.filter(ambassador => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      ambassador.full_name?.toLowerCase().includes(query) ||
      ambassador.email?.toLowerCase().includes(query)
    )
  })

  // Calculate summary stats
  const stats = {
    total: ambassadors.length,
    platinum: ambassadors.filter(a => a.ambassador_tier === 'platinum').length,
    gold: ambassadors.filter(a => a.ambassador_tier === 'gold').length,
    silver: ambassadors.filter(a => a.ambassador_tier === 'silver').length,
    bronze: ambassadors.filter(a => a.ambassador_tier === 'bronze').length,
    totalReferrals: ambassadors.reduce((sum, a) => sum + a.completed_referrals, 0)
  }

  if (!profile?.is_admin) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-forest" />
          <h1 className="text-3xl font-bold text-gray-900">Brand Ambassadors</h1>
        </div>
        <p className="text-gray-600">
          Manage your community ambassadors and their performance
        </p>
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span>{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>

        <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <Crown className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Platinum</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">{stats.platinum}</p>
        </div>

        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
          <div className="flex items-center gap-2 text-yellow-600 mb-1">
            <Trophy className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Gold</span>
          </div>
          <p className="text-2xl font-bold text-yellow-900">{stats.gold}</p>
        </div>

        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <Medal className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Silver</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.silver}</p>
        </div>

        <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
          <div className="flex items-center gap-2 text-orange-600 mb-1">
            <Star className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Bronze</span>
          </div>
          <p className="text-2xl font-bold text-orange-900">{stats.bronze}</p>
        </div>

        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Referrals</span>
          </div>
          <p className="text-2xl font-bold text-green-900">{stats.totalReferrals}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Tier Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Tier
            </label>
            <div className="relative">
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value as AmbassadorTier | 'all')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent appearance-none pr-10"
              >
                <option value="all">All Tiers</option>
                <option value="platinum">Platinum (100+ referrals)</option>
                <option value="gold">Gold (50+ referrals)</option>
                <option value="silver">Silver (25+ referrals)</option>
                <option value="bronze">Bronze (10+ referrals)</option>
              </select>
              <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Search */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ambassadors List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest"></div>
          </div>
        ) : filteredAmbassadors.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium mb-2">
              {searchQuery || filterTier !== 'all' ? 'No ambassadors found' : 'No ambassadors yet'}
            </p>
            <p className="text-sm text-gray-500">
              {searchQuery || filterTier !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Ambassadors will appear here once they reach 10+ completed referrals'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ambassador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referrals
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversion
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Since
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAmbassadors.map((ambassador) => (
                  <tr key={ambassador.user_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={ambassador.full_name || ambassador.email || 'User'}
                          imageUrl={ambassador.avatar_url}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {ambassador.full_name || 'Unnamed User'}
                          </p>
                          <p className="text-sm text-gray-500">{ambassador.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getTierColor(
                          ambassador.ambassador_tier
                        )}`}
                      >
                        {getTierIcon(ambassador.ambassador_tier)}
                        {ambassador.ambassador_tier?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {ambassador.completed_referrals} completed
                        </p>
                        <p className="text-xs text-gray-500">
                          {ambassador.total_referrals} total
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {ambassador.conversion_rate.toFixed(1)}%
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">
                        {ambassador.ambassador_since
                          ? new Date(ambassador.ambassador_since).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedAmbassador(ambassador)
                            setPromotionTier(ambassador.ambassador_tier || 'bronze')
                            setShowPromoteModal(true)
                          }}
                          className="text-sm text-forest hover:text-forest-dark font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAmbassador(ambassador)
                            setShowRemoveModal(true)
                          }}
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Promote Modal */}
      {showPromoteModal && selectedAmbassador && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Update Ambassador Tier
            </h3>
            <p className="text-gray-600 mb-4">
              Update the tier for <strong>{selectedAmbassador.full_name}</strong>
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tier
                </label>
                <select
                  value={promotionTier}
                  onChange={(e) => setPromotionTier(e.target.value as AmbassadorTier)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
                >
                  <option value="bronze">Bronze (10+ referrals)</option>
                  <option value="silver">Silver (25+ referrals)</option>
                  <option value="gold">Gold (50+ referrals)</option>
                  <option value="platinum">Platinum (100+ referrals)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={promotionNotes}
                  onChange={(e) => setPromotionNotes(e.target.value)}
                  placeholder="Add notes about this promotion..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPromoteModal(false)
                  setSelectedAmbassador(null)
                  setPromotionNotes('')
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePromote}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-forest text-white rounded-lg hover:bg-forest-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Update Tier</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Modal */}
      {showRemoveModal && selectedAmbassador && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Remove Ambassador Status
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to remove ambassador status from{' '}
              <strong>{selectedAmbassador.full_name}</strong>? This action can be reversed.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (optional)
              </label>
              <textarea
                value={removalReason}
                onChange={(e) => setRemovalReason(e.target.value)}
                placeholder="Add a reason for removing ambassador status..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRemoveModal(false)
                  setSelectedAmbassador(null)
                  setRemovalReason('')
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    <span>Remove Status</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BrandAmbassadors
