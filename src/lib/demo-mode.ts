// Demo Mode Configuration
export const DEMO_MODE = true; // Set to false to use real Supabase

// Demo user for auto-login
export const DEMO_USER = {
  id: 'demo-user-001',
  email: 'demo@harmonioushabitats.com',
  full_name: 'Alex Chen',
  username: 'alexchen',
  avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  bio: 'Community wellness advocate and meditation practitioner. Passionate about creating sacred spaces for healing and growth.',
  neighborhood: 'Willow Creek',
  holistic_interests: ['Meditation', 'Yoga', 'Sound Healing', 'Breathwork', 'Plant Medicine'],
  verified: true,
  rating: 4.8,
  total_reviews: 42,
  events_attended_count: 28,
  hours_contributed: 156,
  neighbors_met_count: 89
};

// Demo profiles representing diverse community members
export const DEMO_PROFILES = [
  {
    id: 'profile-001',
    email: 'sarah@demo.com',
    full_name: 'Sarah Martinez',
    username: 'sarahm',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    bio: 'Certified yoga instructor and Reiki master. Creating healing spaces for our community.',
    neighborhood: 'Willow Creek',
    holistic_interests: ['Yoga', 'Reiki', 'Crystal Healing', 'Meditation'],
    verified: true,
    rating: 4.9,
    total_reviews: 67
  },
  {
    id: 'profile-002',
    email: 'james@demo.com',
    full_name: 'James Thompson',
    username: 'jamest',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    bio: 'Permaculture enthusiast and community garden coordinator. Let\'s grow together!',
    neighborhood: 'Oak Valley',
    holistic_interests: ['Permaculture', 'Herbalism', 'Sustainable Living'],
    verified: true,
    rating: 4.7,
    total_reviews: 34
  },
  {
    id: 'profile-003',
    email: 'maya@demo.com',
    full_name: 'Maya Patel',
    username: 'mayap',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maya',
    bio: 'Sound healer and meditation guide. Facilitating transformational experiences through vibration.',
    neighborhood: 'Riverside',
    holistic_interests: ['Sound Healing', 'Meditation', 'Kundalini Yoga'],
    verified: true,
    rating: 5.0,
    total_reviews: 89
  },
  {
    id: 'profile-004',
    email: 'david@demo.com',
    full_name: 'David Kim',
    username: 'davidk',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    bio: 'Tai Chi instructor and Traditional Chinese Medicine practitioner.',
    neighborhood: 'Willow Creek',
    holistic_interests: ['Tai Chi', 'Qigong', 'TCM', 'Meditation'],
    verified: true,
    rating: 4.8,
    total_reviews: 56
  },
  {
    id: 'profile-005',
    email: 'luna@demo.com',
    full_name: 'Luna Rodriguez',
    username: 'lunar',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna',
    bio: 'Women\'s circle facilitator and moon ceremony guide. Honoring the sacred feminine.',
    neighborhood: 'Garden District',
    holistic_interests: ['Women\'s Circles', 'Moon Ceremonies', 'Sacred Dance'],
    verified: true,
    rating: 4.9,
    total_reviews: 78
  }
];

// Demo events showcasing holistic practices and decentralized community activities
export const DEMO_EVENTS = [
  {
    id: 'event-001',
    title: 'Community Sound Bath & Meditation',
    description: 'Join us for a transformative evening of crystal bowl sound healing and guided meditation. We\'ll create a sacred space for deep relaxation and inner peace. All experience levels welcome.',
    created_by: 'profile-003',
    creator_name: 'Maya Patel',
    event_type: 'sound_healing',
    category: 'wellness',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    time: '19:00',
    duration: 90,
    location: 'Harmony Garden Pavilion',
    address: '123 Peace Lane, Willow Creek',
    latitude: 37.7749,
    longitude: -122.4194,
    max_participants: 30,
    current_participants: 18,
    is_free: false,
    price: 20,
    currency: 'Time Credits',
    image_url: 'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=800',
    tags: ['Sound Healing', 'Meditation', 'Crystal Bowls', 'Relaxation'],
    neighborhood: 'Willow Creek',
    is_virtual: false,
    accessibility_info: 'Wheelchair accessible, mats provided'
  },
  {
    id: 'event-002',
    title: 'Morning Yoga Flow in the Park',
    description: 'Start your day with energizing vinyasa flow yoga surrounded by nature. We\'ll move through sun salutations and standing sequences to awaken body and mind. Bring your own mat.',
    created_by: 'profile-001',
    creator_name: 'Sarah Martinez',
    event_type: 'yoga',
    category: 'wellness',
    date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    time: '07:00',
    duration: 60,
    location: 'Riverside Park Meadow',
    address: '456 River Road, Riverside',
    latitude: 37.7849,
    longitude: -122.4094,
    max_participants: 25,
    current_participants: 12,
    is_free: true,
    price: 0,
    currency: 'Free',
    image_url: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800',
    tags: ['Yoga', 'Outdoor', 'Morning Practice', 'Vinyasa'],
    neighborhood: 'Riverside',
    is_virtual: false,
    accessibility_info: 'Flat ground, suitable for all levels'
  },
  {
    id: 'event-003',
    title: 'Permaculture Workshop: Food Forest Design',
    description: 'Learn the principles of permaculture and how to design your own food forest. We\'ll cover companion planting, water harvesting, and creating resilient ecosystems in your backyard.',
    created_by: 'profile-002',
    creator_name: 'James Thompson',
    event_type: 'workshop',
    category: 'education',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    time: '14:00',
    duration: 180,
    location: 'Community Garden Center',
    address: '789 Green Way, Oak Valley',
    latitude: 37.7649,
    longitude: -122.4294,
    max_participants: 20,
    current_participants: 15,
    is_free: false,
    price: 35,
    currency: 'Time Credits',
    image_url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800',
    tags: ['Permaculture', 'Sustainability', 'Gardening', 'Food Security'],
    neighborhood: 'Oak Valley',
    is_virtual: false,
    accessibility_info: 'Garden paths are gravel, some uneven terrain'
  },
  {
    id: 'event-004',
    title: 'Women\'s New Moon Circle',
    description: 'Gather in sacred sisterhood to honor the new moon. We\'ll share intentions, practice ritual, and support each other\'s journey. A safe space for feminine wisdom and healing.',
    created_by: 'profile-005',
    creator_name: 'Luna Rodriguez',
    event_type: 'ceremony',
    category: 'spiritual',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
    time: '19:30',
    duration: 120,
    location: 'Sacred Space Studio',
    address: '321 Moon Street, Garden District',
    latitude: 37.7549,
    longitude: -122.4394,
    max_participants: 12,
    current_participants: 8,
    is_free: false,
    price: 15,
    currency: 'Time Credits',
    image_url: 'https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?w=800',
    tags: ['Women\'s Circle', 'Moon Ceremony', 'Ritual', 'Sacred Feminine'],
    neighborhood: 'Garden District',
    is_virtual: false,
    accessibility_info: 'Intimate setting, cushions provided'
  },
  {
    id: 'event-005',
    title: 'Tai Chi for Beginners',
    description: 'Discover the gentle power of Tai Chi. Learn basic movements and principles of this ancient practice for balance, flexibility, and inner calm. Perfect for all ages.',
    created_by: 'profile-004',
    creator_name: 'David Kim',
    event_type: 'movement',
    category: 'wellness',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    time: '09:00',
    duration: 60,
    location: 'Willow Creek Community Center',
    address: '555 Center Drive, Willow Creek',
    latitude: 37.7749,
    longitude: -122.4094,
    max_participants: 15,
    current_participants: 6,
    is_free: true,
    price: 0,
    currency: 'Free',
    image_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800',
    tags: ['Tai Chi', 'Movement', 'Balance', 'Mindfulness'],
    neighborhood: 'Willow Creek',
    is_virtual: false,
    accessibility_info: 'Indoor space, chair options available'
  },
  {
    id: 'event-006',
    title: 'Community Potluck & Skill Share',
    description: 'Bring a dish to share and a skill to teach! This monthly gathering celebrates our diverse talents. Past shares included knitting, fermentation, music, and healing techniques.',
    created_by: 'demo-user-001',
    creator_name: 'Alex Chen',
    event_type: 'gathering',
    category: 'community',
    date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
    time: '18:00',
    duration: 150,
    location: 'Neighborhood Commons',
    address: '999 Community Lane, Willow Creek',
    latitude: 37.7749,
    longitude: -122.4194,
    max_participants: 50,
    current_participants: 32,
    is_free: true,
    price: 0,
    currency: 'Free',
    image_url: 'https://images.unsplash.com/photo-1540914124281-342587941389?w=800',
    tags: ['Potluck', 'Skill Share', 'Community', 'Networking'],
    neighborhood: 'Willow Creek',
    is_virtual: false,
    accessibility_info: 'Fully accessible venue with ramps'
  },
  {
    id: 'event-007',
    title: 'Virtual Breathwork Journey',
    description: 'Join us online for a powerful breathwork session. Using conscious connected breathing, we\'ll release stored emotions and access expanded states of consciousness.',
    created_by: 'profile-001',
    creator_name: 'Sarah Martinez',
    event_type: 'breathwork',
    category: 'wellness',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    time: '20:00',
    duration: 75,
    location: 'Online via Zoom',
    address: 'Virtual Event',
    latitude: null,
    longitude: null,
    max_participants: 100,
    current_participants: 45,
    is_free: false,
    price: 10,
    currency: 'Time Credits',
    image_url: 'https://images.unsplash.com/photo-1593811167562-9cef47bfc4a7?w=800',
    tags: ['Breathwork', 'Virtual', 'Healing', 'Consciousness'],
    neighborhood: 'Global',
    is_virtual: true,
    accessibility_info: 'Closed captions available, recording provided'
  },
  {
    id: 'event-008',
    title: 'Herbal Medicine Making Workshop',
    description: 'Learn to make your own herbal tinctures, teas, and salves. We\'ll work with locally sourced plants and discuss their healing properties. Take home your creations!',
    created_by: 'profile-002',
    creator_name: 'James Thompson',
    event_type: 'workshop',
    category: 'education',
    date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days from now
    time: '13:00',
    duration: 120,
    location: 'The Herb Garden',
    address: '234 Plant Path, Oak Valley',
    latitude: 37.7649,
    longitude: -122.4294,
    max_participants: 12,
    current_participants: 10,
    is_free: false,
    price: 45,
    currency: 'Time Credits',
    image_url: 'https://images.unsplash.com/photo-1509909756405-be0199881695?w=800',
    tags: ['Herbalism', 'DIY', 'Natural Medicine', 'Workshop'],
    neighborhood: 'Oak Valley',
    is_virtual: false,
    accessibility_info: 'Standing workshop, stools available'
  }
];

// Demo spaces for community sharing
export const DEMO_SPACES = [
  {
    id: 'space-001',
    name: 'Harmony Garden Pavilion',
    description: 'Beautiful outdoor pavilion surrounded by meditation gardens. Perfect for ceremonies, workshops, and healing sessions.',
    type: 'outdoor_pavilion',
    capacity: 30,
    address: '123 Peace Lane, Willow Creek',
    neighborhood: 'Willow Creek',
    amenities: ['Electricity', 'Restrooms', 'Garden Access', 'Sound System'],
    availability: 'Weekends and evenings',
    is_free: false,
    price_per_hour: 25,
    currency: 'Time Credits',
    created_by: 'profile-003',
    host_name: 'Maya Patel',
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    rating: 4.9,
    total_bookings: 156
  },
  {
    id: 'space-002',
    name: 'Sacred Space Studio',
    description: 'Intimate studio designed for healing work, small circles, and spiritual practices. Features altar space and mood lighting.',
    type: 'studio',
    capacity: 12,
    address: '321 Moon Street, Garden District',
    neighborhood: 'Garden District',
    amenities: ['Yoga Props', 'Sound Equipment', 'Altar Space', 'Tea Kitchen'],
    availability: 'Daily 8am-9pm',
    is_free: false,
    price_per_hour: 15,
    currency: 'Time Credits',
    created_by: 'profile-005',
    host_name: 'Luna Rodriguez',
    image_url: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800',
    rating: 5.0,
    total_bookings: 89
  },
  {
    id: 'space-003',
    name: 'Community Garden Greenhouse',
    description: 'Year-round growing space with workshop area. Great for educational programs and hands-on learning.',
    type: 'greenhouse',
    capacity: 20,
    address: '789 Green Way, Oak Valley',
    neighborhood: 'Oak Valley',
    amenities: ['Water Access', 'Tools', 'Seating', 'Whiteboard'],
    availability: 'Weekdays and Saturday mornings',
    is_free: true,
    price_per_hour: 0,
    currency: 'Free',
    created_by: 'profile-002',
    host_name: 'James Thompson',
    image_url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800',
    rating: 4.7,
    total_bookings: 234
  }
];

// Demo neighborhoods representing decentralized communities
export const DEMO_NEIGHBORHOODS = [
  {
    id: 'hood-001',
    name: 'Willow Creek',
    description: 'A vibrant eco-conscious community focused on sustainable living and wellness practices.',
    member_count: 342,
    event_count: 28,
    coordinator: 'Alex Chen',
    values: ['Sustainability', 'Wellness', 'Community', 'Mindfulness']
  },
  {
    id: 'hood-002',
    name: 'Oak Valley',
    description: 'Agricultural neighborhood specializing in permaculture and food sovereignty.',
    member_count: 256,
    event_count: 19,
    coordinator: 'James Thompson',
    values: ['Permaculture', 'Self-Sufficiency', 'Education', 'Earth Care']
  },
  {
    id: 'hood-003',
    name: 'Riverside',
    description: 'Artistic community with focus on creative expression and healing arts.',
    member_count: 189,
    event_count: 22,
    coordinator: 'Sarah Martinez',
    values: ['Creativity', 'Healing', 'Expression', 'Connection']
  },
  {
    id: 'hood-004',
    name: 'Garden District',
    description: 'Sacred space for spiritual practices and ceremonial gatherings.',
    member_count: 167,
    event_count: 15,
    coordinator: 'Luna Rodriguez',
    values: ['Spirituality', 'Ceremony', 'Sacred Space', 'Unity']
  }
];

// Demo messages for community interaction
export const DEMO_MESSAGES = [
  {
    id: 'msg-001',
    from: 'profile-001',
    from_name: 'Sarah Martinez',
    to: 'demo-user-001',
    subject: 'Welcome to the community!',
    content: 'Hi Alex! So glad to have you join our wellness community. Looking forward to seeing you at the yoga session!',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    read: true
  },
  {
    id: 'msg-002',
    from: 'profile-003',
    from_name: 'Maya Patel',
    to: 'demo-user-001',
    subject: 'Sound Bath Registration Confirmed',
    content: 'Your spot is reserved for the upcoming sound bath ceremony. Please bring a yoga mat and water bottle. See you there!',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    read: false
  }
];

// Demo notifications
export const DEMO_NOTIFICATIONS = [
  {
    id: 'notif-001',
    type: 'event_reminder',
    title: 'Event Tomorrow: Morning Yoga Flow',
    message: 'Don\'t forget about tomorrow\'s yoga session at 7am in Riverside Park!',
    timestamp: new Date().toISOString(),
    read: false
  },
  {
    id: 'notif-002',
    type: 'new_neighbor',
    title: 'New neighbor joined Willow Creek',
    message: 'Welcome David Kim to the community! They\'re interested in Tai Chi and meditation.',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    read: true
  }
];