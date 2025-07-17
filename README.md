# Harmony Spaces

A community platform for discovering and sharing holistic practices, events, and spaces within your neighborhood.

## 🌟 Overview

Harmony Spaces connects neighbors through mindful practices, wellness events, and shared spaces. Built with a focus on local community building, the platform enables users to discover events within walking distance, share their own spaces, and connect with like-minded individuals in their area.

## ✨ Features

### Core Features
- **🗺️ Location-Based Discovery**: Find events and spaces within your customizable radius
- **📅 Event Management**: Create, discover, and join holistic wellness events
- **🏠 Space Sharing**: Share and book spaces for practices and gatherings
- **💬 Community Messaging**: Connect with neighbors through built-in messaging system
- **👥 Community Building**: Join ongoing weekly practices and meet regulars

### User Experience
- **📱 Mobile-Optimized**: Fully responsive design with touch-friendly interfaces
- **🔍 Advanced Search**: Filter by category, distance, time, and more
- **🔔 Real-time Notifications**: Stay updated on community activities
- **⌨️ Keyboard Navigation**: Full accessibility support
- **🎨 Beautiful UI**: Holistic design with nature-inspired aesthetics

### Admin Features
- **📊 Analytics Dashboard**: Track community engagement and growth
- **🛡️ Content Moderation**: Manage events, spaces, and user interactions
- **📈 Community Insights**: View usage patterns and popular activities

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Deployment**: Ready for Vercel/Netlify

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hspacex
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🗄️ Database Setup

The project uses Supabase as the backend. Database migrations are located in `supabase/migrations/`:

1. **Initialize Supabase locally** (optional)
   ```bash
   npx supabase start
   ```

2. **Run migrations**
   ```bash
   npx supabase db push
   ```

## 🚀 Getting Started

### For Users
1. **Sign up** with email or social login
2. **Set your location** and preferred radius
3. **Discover events** in your area or create your own
4. **Share spaces** available for community use
5. **Connect** with neighbors through messaging

### For Administrators
1. **Access admin dashboard** at `/admin` (requires admin role)
2. **Monitor community activity** through analytics
3. **Moderate content** and manage user reports
4. **View insights** on community engagement

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AuthProvider.tsx # Authentication context
│   ├── EventCard.tsx    # Event display component
│   ├── SpaceCard.tsx    # Space display component
│   ├── MessagingSystem.tsx # Chat functionality
│   └── ...
├── pages/              # Main application pages
│   ├── Home.tsx        # Landing page
│   ├── Map.tsx         # Interactive map view
│   ├── Search.tsx      # Search functionality
│   ├── CreateEvent.tsx # Event creation
│   ├── ShareSpace.tsx  # Space sharing
│   ├── Messages.tsx    # Messaging interface
│   ├── Profile.tsx     # User profile
│   └── AdminDashboard.tsx # Admin panel
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and API
└── main.tsx           # Application entry point
```

## 🎯 Key Components

### Authentication
- Secure email/password authentication
- Social login support
- Protected routes for authenticated features
- User profile management

### Events & Spaces
- Create and manage holistic wellness events
- Share spaces for community use
- Advanced filtering and search
- Real-time availability updates

### Community Features
- Location-based discovery
- Direct messaging between users
- Weekly regular gatherings
- Community values and guidelines

## 🔧 Configuration

### Environment Variables
```
VITE_SUPABASE_URL=          # Your Supabase project URL
VITE_SUPABASE_ANON_KEY=     # Your Supabase anon key
```

### Customization
- **Radius Options**: Edit `RadiusSelector.tsx` to modify available distance options
- **Categories**: Update holistic practice categories in `HolisticCategorySelector.tsx`
- **Styling**: Customize colors and themes in `tailwind.config.js`

## 📱 Mobile Experience

The application is fully optimized for mobile devices with:
- Touch-friendly interface components
- Responsive grid layouts
- Mobile-specific navigation patterns
- Optimized loading states

## 🔐 Security

- Row-level security (RLS) enabled in Supabase
- User authentication required for sensitive actions
- Input validation and sanitization
- Protected admin routes

## 🚦 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Development Guidelines
- Use TypeScript for type safety
- Follow component-based architecture
- Implement proper error handling
- Write accessible UI components
- Test on multiple device sizes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌍 Community

Join our community of developers and wellness enthusiasts building the future of neighborhood connections!

---

*Built with 💚 for holistic community building*