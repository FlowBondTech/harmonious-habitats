import React, { useEffect } from 'react';

const KeyboardNavHelper: React.FC = () => {
  useEffect(() => {
    // Function to add js-focus-visible class to body on keyboard navigation
    const handleFirstTab = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        document.body.classList.add('js-focus-visible');
        window.removeEventListener('keydown', handleFirstTab);
        window.addEventListener('mousedown', handleMouseDownOnce);
      }
    };

    // Function to remove js-focus-visible class on mouse use
    const handleMouseDownOnce = () => {
      document.body.classList.remove('js-focus-visible');
      window.removeEventListener('mousedown', handleMouseDownOnce);
      window.addEventListener('keydown', handleFirstTab);
    };

    // Add SkipLink behavior
    const setupSkipLink = () => {
      const skipLink = document.getElementById('skip-to-content');
      if (skipLink) {
        skipLink.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const main = document.querySelector('main');
            if (main) {
              main.setAttribute('tabindex', '-1');
              main.focus();
              setTimeout(() => main.removeAttribute('tabindex'), 1000);
            }
          }
        });
      }
    };
    
    window.addEventListener('keydown', handleFirstTab);
    setupSkipLink();
    
    return () => {
      window.removeEventListener('keydown', handleFirstTab);
      window.removeEventListener('mousedown', handleMouseDownOnce);
    };
  }, []);

  return (
    <a 
      href="#main" 
      id="skip-to-content"
      className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:p-4 focus:bg-white focus:text-forest-600 focus:shadow-lg focus:rounded-lg"
    >
      Skip to content
    </a>
  );
};

export default KeyboardNavHelper;