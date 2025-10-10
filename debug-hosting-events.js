// Run this in browser console to debug hosting events
// Make sure you're logged in first

const { createClient } = window.supabaseLib;
const supabase = createClient(
  'https://vcbhqzwrmahdmfeamgtl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjYmhxendybWFoZG1mZWFtZ3RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcyMzk5OTUsImV4cCI6MjA1MjgxNTk5NX0.0lSbx0qPJZQvZbQHxh1fRlv_2QykqvDKmZN-7t0J-5c'
);

async function debugHostingEvents() {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Current user:', user?.id, user?.email);

  // Query all events by this organizer (no status filter)
  const { data: allEvents, error: allError } = await supabase
    .from('events')
    .select('id, title, status, organizer_id, date')
    .eq('organizer_id', user.id);

  console.log('All events by organizer:', allEvents);
  console.log('Error:', allError);

  // Query with status filter (what MyActivities uses)
  const { data: filteredEvents, error: filteredError } = await supabase
    .from('events')
    .select('id, title, status, organizer_id, date')
    .eq('organizer_id', user.id)
    .in('status', ['published', 'draft']);

  console.log('Filtered events (published/draft):', filteredEvents);
  console.log('Error:', filteredError);
}

debugHostingEvents();
