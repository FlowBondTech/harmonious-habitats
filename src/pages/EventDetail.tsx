import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, Event } from '../lib/supabase';
import { LoadingSpinner } from '../components/LoadingStates';
import EventDetailsModal from '../components/EventDetailsModal';

const EventDetail: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEvent = async () => {
      if (!eventId) {
        setError('No event ID provided');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('events')
          .select(`
            *,
            organizer:profiles!organizer_id(id, full_name, avatar_url, verified),
            participant_count:event_participants(count)
          `)
          .eq('id', eventId)
          .single();

        if (error) throw error;

        if (data) {
          const eventWithCount = {
            ...data,
            participant_count: data.participant_count?.[0]?.count || 0
          };
          setEvent(eventWithCount);
        } else {
          setError('Event not found');
        }
      } catch (err: any) {
        console.error('Error loading event:', err);
        setError(err.message || 'Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading event..." />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container-responsive py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Event Not Found</h2>
        <p className="text-gray-600 mb-6">{error || 'The event you are looking for does not exist.'}</p>
        <button
          onClick={() => navigate('/calendar')}
          className="btn-primary"
        >
          Browse Events
        </button>
      </div>
    );
  }

  return (
    <EventDetailsModal
      event={event}
      isOpen={true}
      onClose={() => navigate('/calendar')}
      onUpdate={() => {}}
    />
  );
};

export default EventDetail;
