import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Grid,
  List,
  Clock,
  MapPin,
  Users,
  Filter,
  Plus
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import EventDetailsModal from './EventDetailsModal';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday, isPast } from 'date-fns';

interface Event {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  category: string;
  capacity: number;
  organizer_id: string;
  location?: string;
  participant_count?: number;
  user_registration_status?: 'registered' | 'waitlisted' | null;
}

type ViewType = 'month' | 'week' | 'day' | 'list';

const EventCalendar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('month');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [filter, setFilter] = useState<'all' | 'registered' | 'hosting'>('all');

  useEffect(() => {
    loadEvents();
  }, [currentDate, viewType, filter, user]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      let startDate: Date;
      let endDate: Date;

      if (viewType === 'month') {
        startDate = startOfWeek(startOfMonth(currentDate));
        endDate = endOfWeek(endOfMonth(currentDate));
      } else if (viewType === 'week') {
        startDate = startOfWeek(currentDate);
        endDate = endOfWeek(currentDate);
      } else if (viewType === 'day') {
        startDate = new Date(currentDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(currentDate);
        endDate.setHours(23, 59, 59, 999);
      } else {
        // List view - show next 30 days
        startDate = new Date();
        endDate = addDays(new Date(), 30);
      }

      const query = supabase
        .from('events')
        .select(`
          *,
          event_participants!left(
            user_id,
            status
          )
        `)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .eq('status', 'published')
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error('Error loading events:', error);
        return;
      }

      // Process events to add participant count and user registration status
      const processedEvents = (data || []).map(event => {
        const participants = event.event_participants || [];
        const participantCount = participants.filter((p: any) => 
          p.status === 'registered' || p.status === 'attended'
        ).length;

        let userRegistrationStatus = null;
        if (user) {
          const userParticipation = participants.find((p: any) => p.user_id === user.id);
          if (userParticipation) {
            userRegistrationStatus = userParticipation.status;
          }
        }

        return {
          ...event,
          participant_count: participantCount,
          user_registration_status: userRegistrationStatus
        };
      });

      // Apply filters
      let filteredEvents = processedEvents;
      if (filter === 'registered' && user) {
        filteredEvents = processedEvents.filter(event => 
          event.user_registration_status === 'registered'
        );
      } else if (filter === 'hosting' && user) {
        filteredEvents = processedEvents.filter(event => 
          event.organizer_id === user.id
        );
      }

      setEvents(filteredEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    if (viewType === 'month') {
      setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    } else if (viewType === 'week') {
      setCurrentDate(direction === 'next' ? addDays(currentDate, 7) : addDays(currentDate, -7));
    } else if (viewType === 'day') {
      setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : addDays(currentDate, -1));
    }
  };

  const getMonthDays = () => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    const days = [];
    let day = start;

    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  };

  const getWeekDays = () => {
    const start = startOfWeek(currentDate);
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      days.push(addDays(start, i));
    }
    
    return days;
  };

  const getEventsForDay = (date: Date) => {
    return events.filter(event => 
      isSameDay(new Date(event.date), date)
    );
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      meditation: 'bg-purple-100 text-purple-700 border-purple-200',
      yoga: 'bg-blue-100 text-blue-700 border-blue-200',
      workshop: 'bg-green-100 text-green-700 border-green-200',
      movement: 'bg-orange-100 text-orange-700 border-orange-200',
      nutrition: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      spiritual: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      healing: 'bg-pink-100 text-pink-700 border-pink-200',
      nature: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      creative: 'bg-red-100 text-red-700 border-red-200',
      social: 'bg-cyan-100 text-cyan-700 border-cyan-200'
    };
    return colors[category] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const renderMonthView = () => {
    const days = getMonthDays();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="bg-white rounded-xl shadow-sm border border-forest-100 overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {weekDays.map(day => (
            <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {days.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);
            const isPastDay = isPast(day) && !isCurrentDay;

            return (
              <div
                key={index}
                className={`bg-white p-2 min-h-[120px] ${
                  !isCurrentMonth ? 'bg-gray-50' : ''
                } ${isPastDay ? 'opacity-60' : ''}`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isCurrentDay 
                    ? 'bg-forest-600 text-white w-7 h-7 rounded-full flex items-center justify-center' 
                    : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`w-full text-left px-2 py-1 rounded text-xs truncate border ${getCategoryColor(event.category)} hover:opacity-80 transition-opacity`}
                    >
                      <span className="font-medium">{event.start_time.slice(0, 5)}</span> {event.title}
                    </button>
                  ))}
                  {dayEvents.length > 3 && (
                    <button 
                      onClick={() => {
                        setCurrentDate(day);
                        setViewType('day');
                      }}
                      className="w-full text-center text-xs text-forest-600 hover:text-forest-700 font-medium"
                    >
                      +{dayEvents.length - 3} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const days = getWeekDays();
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-forest-100 overflow-hidden">
        <div className="grid grid-cols-8 border-b border-gray-200">
          <div className="p-2 text-sm font-medium text-gray-700"></div>
          {days.map((day, index) => (
            <div key={index} className="p-2 text-center border-l border-gray-200">
              <div className="text-sm font-medium text-gray-700">
                {format(day, 'EEE')}
              </div>
              <div className={`text-lg font-semibold ${
                isToday(day) ? 'text-forest-600' : 'text-gray-900'
              }`}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
        <div className="overflow-y-auto max-h-[600px]">
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-8 border-b border-gray-100">
              <div className="p-2 text-xs text-gray-500 text-right">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {days.map((day, dayIndex) => {
                const dayEvents = getEventsForDay(day).filter(event => {
                  const eventHour = parseInt(event.start_time.split(':')[0]);
                  return eventHour === hour;
                });

                return (
                  <div key={dayIndex} className="p-1 border-l border-gray-100 relative">
                    {dayEvents.map(event => (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className={`absolute inset-x-1 px-2 py-1 rounded text-xs border ${getCategoryColor(event.category)} hover:opacity-80 transition-opacity z-10`}
                        style={{
                          top: '4px',
                          minHeight: '60px'
                        }}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        <div className="text-xs opacity-75">
                          {event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDay(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-forest-100 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {format(currentDate, 'EEEE, MMMM d, yyyy')}
          </h3>
          <p className="text-sm text-gray-600">
            {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''} scheduled
          </p>
        </div>
        <div className="overflow-y-auto max-h-[600px]">
          {hours.map(hour => {
            const hourEvents = dayEvents.filter(event => {
              const eventHour = parseInt(event.start_time.split(':')[0]);
              return eventHour === hour;
            });

            return (
              <div key={hour} className="flex border-b border-gray-100">
                <div className="w-20 p-3 text-sm text-gray-500 text-right flex-shrink-0">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="flex-1 p-3">
                  {hourEvents.map(event => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`w-full text-left p-3 rounded-lg border ${getCategoryColor(event.category)} hover:opacity-80 transition-opacity mb-2`}
                    >
                      <div className="font-semibold text-sm mb-1">{event.title}</div>
                      <div className="flex items-center space-x-4 text-xs">
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}</span>
                        </span>
                        {event.location && (
                          <span className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{event.location}</span>
                          </span>
                        )}
                        <span className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{event.participant_count || 0}/{event.capacity}</span>
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderListView = () => {
    const groupedEvents: Record<string, Event[]> = {};
    
    events.forEach(event => {
      const dateKey = event.date;
      if (!groupedEvents[dateKey]) {
        groupedEvents[dateKey] = [];
      }
      groupedEvents[dateKey].push(event);
    });

    const sortedDates = Object.keys(groupedEvents).sort();

    return (
      <div className="space-y-6">
        {sortedDates.map(date => {
          const dayEvents = groupedEvents[date];
          const dateObj = new Date(date);
          const isCurrentDay = isToday(dateObj);
          const isPastDay = isPast(dateObj) && !isCurrentDay;

          return (
            <div key={date} className={`${isPastDay ? 'opacity-60' : ''}`}>
              <div className="flex items-center space-x-3 mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {format(dateObj, 'EEEE, MMMM d')}
                </h3>
                {isCurrentDay && (
                  <span className="px-2 py-1 bg-forest-100 text-forest-700 text-xs font-medium rounded-full">
                    Today
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {dayEvents.map(event => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="w-full bg-white rounded-lg border border-gray-200 p-4 hover:border-forest-300 transition-colors text-left"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{event.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(event.category)}`}>
                        {event.category}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{event.start_time.slice(0, 5)} - {event.end_time.slice(0, 5)}</span>
                      </span>
                      {event.location && (
                        <span className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </span>
                      )}
                      <span className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{event.participant_count || 0}/{event.capacity}</span>
                      </span>
                    </div>
                    {event.user_registration_status && (
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          event.user_registration_status === 'registered' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {event.user_registration_status === 'registered' ? 'Registered' : 'Waitlisted'}
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {sortedDates.length === 0 && (
          <div className="text-center py-12">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No events found</p>
            <p className="text-sm text-gray-500">Try adjusting your filters or date range</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-forest-800">Event Calendar</h1>
            <p className="text-forest-600">Discover and manage upcoming events</p>
          </div>
          <button
            onClick={() => navigate('/create-event')}
            className="flex items-center space-x-2 bg-forest-600 text-white px-4 py-2 rounded-lg hover:bg-forest-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Create Event</span>
          </button>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-forest-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* View Type Selector */}
            <div className="flex space-x-2">
              {[
                { type: 'month' as ViewType, icon: Grid, label: 'Month' },
                { type: 'week' as ViewType, icon: Grid, label: 'Week' },
                { type: 'day' as ViewType, icon: CalendarIcon, label: 'Day' },
                { type: 'list' as ViewType, icon: List, label: 'List' }
              ].map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => setViewType(type)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    viewType === type
                      ? 'bg-forest-600 text-white'
                      : 'bg-forest-100 text-forest-700 hover:bg-forest-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Date Navigation */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 text-forest-600 hover:bg-forest-50 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="text-center min-w-[200px]">
                <h2 className="text-lg font-semibold text-gray-900">
                  {viewType === 'month' && format(currentDate, 'MMMM yyyy')}
                  {viewType === 'week' && `Week of ${format(startOfWeek(currentDate), 'MMM d')}`}
                  {viewType === 'day' && format(currentDate, 'MMMM d, yyyy')}
                  {viewType === 'list' && 'Upcoming Events'}
                </h2>
              </div>
              <button
                onClick={() => navigateDate('next')}
                className="p-2 text-forest-600 hover:bg-forest-50 rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-sm font-medium text-forest-600 hover:bg-forest-50 rounded-lg transition-colors"
              >
                Today
              </button>
            </div>

            {/* Filters */}
            {user && (
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Events</option>
                  <option value="registered">My Registrations</option>
                  <option value="hosting">Events I'm Hosting</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Calendar View */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-600"></div>
          </div>
        ) : (
          <>
            {viewType === 'month' && renderMonthView()}
            {viewType === 'week' && renderWeekView()}
            {viewType === 'day' && renderDayView()}
            {viewType === 'list' && renderListView()}
          </>
        )}

        {/* Event Details Modal */}
        {selectedEvent && (
          <EventDetailsModal
            event={selectedEvent as any}
            isOpen={!!selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onUpdate={loadEvents}
          />
        )}
      </div>
    </div>
  );
};

export default EventCalendar;