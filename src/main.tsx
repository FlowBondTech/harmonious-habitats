import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import 'focus-visible';
import './index.css';

console.log('🚀 Starting Harmonious Habitats...');

const root = document.getElementById('root');
if (!root) {
  console.error('❌ Root element not found!');
  document.body.innerHTML = '<h1>Error: Root element not found</h1>';
} else {
  console.log('✅ Mounting app...');
  try {
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log('✅ App mounted successfully');
  } catch (error) {
    console.error('❌ Error mounting app:', error);
    // Show error on page
    root.innerHTML = `
      <div style="padding: 2rem; font-family: system-ui;">
        <h1 style="color: red;">Error Loading App</h1>
        <pre>${error}</pre>
        <p>Check browser console for details.</p>
      </div>
    `;
  }
}
