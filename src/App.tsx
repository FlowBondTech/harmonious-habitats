import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SpaceFilterProvider } from './context/SpaceFilterContext';
import Layout from './components/Layout';
import SpacesView from './components/SpacesView';
import AuthFlow from './components/auth/AuthFlow';
import GlobalNotifications from './components/GlobalNotifications';
import NotificationSettings from './components/NotificationSettings';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sage-50/50 dark:bg-neutral-900">
        <div className="text-center p-8">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 bg-sage-400 rounded-full mb-4"></div>
            <div className="h-4 w-48 bg-neutral-300 dark:bg-neutral-700 rounded mb-2"></div>
            <div className="h-3 w-32 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
          </div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">
            Loading your holistic space...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated - show auth flow
  if (!user) {
    return <AuthFlow />;
  }

  // Authenticated - show main app with notifications
  return (
    <SpaceFilterProvider>
      <Layout>
        <SpacesView />
      </Layout>
      <GlobalNotifications />
      <NotificationSettings />
    </SpaceFilterProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;