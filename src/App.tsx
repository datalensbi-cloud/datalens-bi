import { RouterProvider } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { router } from '@/app/router';

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster richColors position="bottom-right" />
    </AuthProvider>
  );
}

export default App;
