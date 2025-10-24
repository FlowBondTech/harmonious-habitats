import React, { useState, useEffect } from 'react'
import { useAuthContext } from './AuthProvider'
import {
  getReferralStats,
  getUserReferrals,
  getReferralLeaderboard
} from '../lib/supabase'
import type { ReferralStats as ReferralStatsType, UserReferralDetails, ReferralLeaderboardEntry } from '../lib/supabase'
import { Users, TrendingUp, Clock, Award, ChevronRight, Trophy } from 'lucide-react'
import Avatar from './Avatar'

interface ReferralStatsProps {
  showLeaderboard?: boolean
  showReferralList?: boolean
}

const ReferralStats: React.FC<ReferralStatsProps> = ({
  showLeaderboard = false,
  showReferralList = true
}) => {
  const { user } = useAuthContext()
  const [stats, setStats] = useState<ReferralStatsType | null>(null)
  const [referrals, setReferrals] = useState<UserReferralDetails[]>([])
  const [leaderboard, setLeaderboard] = useState<ReferralLeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'stats' | 'referrals' | 'leaderboard'>('stats')

  useEffect(() => {
    if (user?.id) {
      loadData()
    }
  }, [user?.id])

  const loadData = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      // Load referral stats
      const { data: statsData } = await getReferralStats(user.id)
      setStats(statsData)

      // Load user's referrals if requested
      if (showReferralList) {
        const { data: referralsData } = await getUserReferrals(user.id)
        setReferrals(referralsData || [])
      }

      // Load leaderboard if requested
      if (showLeaderboard) {
        const { data: leaderboardData } = await getReferralLeaderboard(10)
        setLeaderboard(leaderboardData || [])
      }
    } catch (error) {
      console.error('Error loading referral data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest"></div>
        </div>
      </div>
    )
  }

  const hasStats = stats && stats.total_referrals > 0

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-forest to-sage p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-6 h-6" />
          <h3 className="text-xl font-bold">Your Referrals</h3>
        </div>
        <p className="text-white/90 text-sm">
          Grow the community and track your impact
        </p>
      </div>

      {/* Tabs */}
      {(showReferralList || showLeaderboard) && (
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex">
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'stats'
                  ? 'text-forest border-b-2 border-forest bg-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Stats
            </button>
            {showReferralList && (
              <button
                onClick={() => setActiveTab('referrals')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'referrals'
                    ? 'text-forest border-b-2 border-forest bg-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Referrals ({referrals.length})
              </button>
            )}
            {showLeaderboard && (
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'leaderboard'
                    ? 'text-forest border-b-2 border-forest bg-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Leaderboard
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <>
            {hasStats ? (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-blue-600 mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase">Total</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">
                      {stats.total_referrals}
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-600 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase">Completed</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900">
                      {stats.completed_referrals}
                    </p>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-amber-600 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase">Pending</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-900">
                      {stats.pending_referrals}
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-purple-600 mb-1">
                      <Award className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase">Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">
                      {stats.conversion_rate.toFixed(0)}%
                    </p>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-700">
                    <strong>Conversion Rate:</strong> The percentage of your referrals who have
                    completed their profile setup.
                  </p>
                  {stats.last_referral_at && (
                    <p className="text-xs text-gray-600 mt-2">
                      Last referral: {new Date(stats.last_referral_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium mb-2">No referrals yet</p>
                <p className="text-sm text-gray-500">
                  Check in attendees at your events to start building your referral network
                </p>
              </div>
            )}
          </>
        )}

        {/* Referrals Tab */}
        {activeTab === 'referrals' && (
          <div>
            {referrals.length > 0 ? (
              <div className="space-y-3">
                {referrals.map((referral) => (
                  <div
                    key={referral.referred_user_id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-forest transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar
                        name={referral.full_name || referral.email || 'User'}
                        imageUrl={referral.avatar_url}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {referral.full_name || 'New User'}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {referral.email}
                        </p>
                        {referral.event_title && (
                          <p className="text-xs text-gray-500 truncate">
                            via {referral.event_title}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {referral.onboarding_completed ? (
                        <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium mb-2">No referrals yet</p>
                <p className="text-sm text-gray-500">
                  Your referred users will appear here
                </p>
              </div>
            )}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div>
            {leaderboard.length > 0 ? (
              <div className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.user_id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      entry.user_id === user.id
                        ? 'bg-forest/10 border-forest'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {/* Rank Badge */}
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                          index === 0
                            ? 'bg-yellow-400 text-yellow-900'
                            : index === 1
                            ? 'bg-gray-300 text-gray-700'
                            : index === 2
                            ? 'bg-orange-400 text-orange-900'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {index < 3 ? <Trophy className="w-4 h-4" /> : entry.rank}
                      </div>

                      <Avatar
                        name={entry.full_name}
                        imageUrl={entry.avatar_url}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {entry.full_name}
                          {entry.user_id === user.id && (
                            <span className="text-forest ml-2">(You)</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-600">
                          {entry.completed_referrals} completed • {entry.conversion_rate.toFixed(0)}% rate
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {entry.total_referrals}
                      </p>
                      <p className="text-xs text-gray-500">referrals</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium mb-2">No leaderboard data</p>
                <p className="text-sm text-gray-500">
                  Be the first to refer new members!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ReferralStats
