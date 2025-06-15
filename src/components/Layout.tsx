import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-neutral-900 text-neutral-100' 
        : 'bg-sage-50/50 text-neutral-900'
    }`}>
      <main className="container mx-auto px-4 py-6 pb-20">
        {children}
      </main>
    </div>
  );
};

export default Layout;