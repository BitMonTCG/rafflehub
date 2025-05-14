import { useAuth as useAuthContext } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';

export function useAuth() {
  const auth = useAuthContext();
  const [, navigate] = useLocation();

  const requireAuth = (callback: () => void) => {
    if (!auth.loading && !auth.isAuthenticated) {
      navigate('/login');
      return;
    }
    callback();
  };

  const requireAdmin = (callback: () => void) => {
    if (!auth.loading && (!auth.isAuthenticated || !auth.isAdmin)) {
      navigate('/');
      return;
    }
    callback();
  };

  return {
    ...auth,
    requireAuth,
    requireAdmin,
  };
}
