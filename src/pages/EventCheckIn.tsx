import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, createQuickRegistration, getPendingRegistrations } from '../lib/supabase'
import type { Event, Profile } from '../lib/supabase'
import { ArrowLeft, Calendar, MapPin, Users, CheckCircle, Clock } from 'lucide-react'

interface QuickRegistrationFormProps {
  eventId: string
  organizerId: string
  onSuccess: () => void
}

const QuickRegistrationForm: React.FC<QuickRegistrationFormProps> = ({
  eventId,
  organizerId,
  onSuccess
}) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !email.trim()) {
      setMessage({ type: 'error', text: 'Please enter both name and email' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const { data, error } = await createQuickRegistration(
        eventId,
        name.trim(),
        email.trim().toLowerCase(),
        organizerId
      )

      if (error) throw error

      if (data?.success) {
        setMessage({ type: 'success', text: data.message })
        setName('')
        setEmail('')
        onSuccess()
      } else {
        setMessage({ type: 'error', text: data?.message || 'Registration failed' })
      }
    } catch (error: any) {
      console.error('Quick registration error:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to register attendee' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Register Attendee</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
            placeholder="Enter attendee's name"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest focus:border-transparent"
            placeholder="Enter attendee's email"
            disabled={loading}
          />
        </div>

        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-forest text-white py-3 rounded-lg font-medium hover:bg-forest/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Registering...' : 'Register Attendee'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          A verification link will be sent to their email if they're a new user
        </p>
      </form>
    </div>
  )
}

interface PendingAttendeesListProps {
  eventId: string
}

const PendingAttendeesList: React.FC<PendingAttendeesListProps> = ({ eventId }) => {
  const [pendingAttendees, setPendingAttendees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPendingAttendees = async () => {
    try {
      const { data, error } = await getPendingRegistrations(eventId)
      if (error) throw error
      setPendingAttendees(data || [])
    } catch (error) {
      console.error('Error fetching pending attendees:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingAttendees()

    // Set up real-time subscription for updates
    const subscription = supabase
      .channel(`event_participants:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_participants',
          filter: `event_id=eq.${eventId}`
        },
        () => {
          fetchPendingAttendees()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [eventId])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest"></div>
        </div>
      </div>
    )
  }

  if (pendingAttendees.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Attendees</h3>
        <p className="text-gray-500 text-center py-8">No pending registrations</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Pending Attendees ({pendingAttendees.length})
      </h3>

      <div className="space-y-3">
        {pendingAttendees.map((attendee) => (
          <div
            key={attendee.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex-1">
              <p className="font-medium text-gray-900">{attendee.pending_name}</p>
              <p className="text-sm text-gray-600">{attendee.pending_email}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(attendee.verification_sent_at).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-amber-700 font-medium">Pending</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const EventCheckIn: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      if (!eventId) {
        setError('Event ID not provided')
        setLoading(false)
        return
      }

      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          navigate('/auth')
          return
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) throw profileError
        setCurrentUser(profile)

        // Get event details
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select(`
            *,
            organizer:profiles!events_organizer_id_fkey(id, full_name, avatar_url)
          `)
          .eq('id', eventId)
          .single()

        if (eventError) throw eventError

        // Check if user is the event organizer
        if (eventData.organizer_id !== user.id) {
          setError('You must be the event organizer to access check-in')
          setLoading(false)
          return
        }

        setEvent(eventData)
      } catch (error: any) {
        console.error('Error fetching event:', error)
        setError(error.message || 'Failed to load event')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [eventId, navigate])

  const handleRegistrationSuccess = () => {
    // Increment refresh key to trigger re-fetch of pending attendees
    setRefreshKey(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-sand p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest"></div>
      </div>
    )
  }

  if (error || !event || !currentUser) {
    return (
      <div className="min-h-screen bg-sand p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
            <h2 className="text-xl font-semibold text-red-900 mb-2">Access Denied</h2>
            <p className="text-red-700 mb-4">{error || 'Unable to load event'}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-forest text-white rounded-lg hover:bg-forest/90 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sand pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Event</span>
          </button>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Check-In</h1>
          <p className="text-gray-600">Register attendees for your event</p>
        </div>
      </div>

      {/* Event Info Card */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{event.title}</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-forest flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-600">Date & Time</p>
                <p className="font-medium text-gray-900">
                  {new Date(event.date).toLocaleDateString()}
                </p>
                <p className="text-gray-700">
                  {event.start_time} - {event.end_time}
                </p>
              </div>
            </div>

            {event.location_name && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-forest flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-gray-600">Location</p>
                  <p className="font-medium text-gray-900">{event.location_name}</p>
                  {event.address && <p className="text-gray-700">{event.address}</p>}
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-forest flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-600">Capacity</p>
                <p className="font-medium text-gray-900">
                  {event.participant_count || 0} / {event.capacity} registered
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Registration Form */}
          <QuickRegistrationForm
            eventId={eventId!}
            organizerId={currentUser.id}
            onSuccess={handleRegistrationSuccess}
          />

          {/* Pending Attendees List */}
          <div key={refreshKey}>
            <PendingAttendeesList eventId={eventId!} />
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">How Check-In Works</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Enter attendee's name and email to register them</li>
                <li>Existing users are automatically registered</li>
                <li>New users receive a verification link via email</li>
                <li>They complete their profile setup on their own device</li>
                <li>No login sessions remain on your device</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventCheckIn
