import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { Providers } from './app/providers';
import { initializeSessionListener } from './features/auth/auth.api';

function App() {
  useEffect(() => {
    const unsubscribe = initializeSessionListener();
    return () => unsubscribe?.();
  }, []);

  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}

export default App;
