import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { dataAccessLayer } from './lib/storage/dal';

export const App: React.FC = () => {
  useEffect(() => {
    // Prime IndexedDB with initial seed if empty
    dataAccessLayer.initializeSeedDataIfNeeded();

    // Prime theme from settings to prevent flash
    const settings = dataAccessLayer.settings.get();
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (settings.theme === 'dark' || (settings.theme === 'system' && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return <RouterProvider router={router} />;
};

export default App;
