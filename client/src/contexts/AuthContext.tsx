import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string, isAdminLogin?: boolean) => Promise<boolean>;
  register: (username: string, email: string, password: string, confirmPassword: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async (_username, _password, _isAdminLogin) => false,
  register: async () => false,
  logout: () => {},
  isAuthenticated: false,
  isAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load user from localStorage on initial render
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string, isAdminLogin?: boolean): Promise<boolean> => {
    setLoading(true);
    try {
      const endpoint = isAdminLogin ? '/api/auth/admin/login' : '/api/login';
      
      let csrfToken = '';
      try {
        const csrfRes = await fetch('/api/csrf-token');
        if (csrfRes.ok) {
          const tokenData = await csrfRes.json();
          csrfToken = tokenData.csrfToken;
        } else {
          console.error('Failed to fetch CSRF token for login', await csrfRes.text());
          toast({
            title: 'Login Error',
            description: 'Could not prepare secure session. Please try again.',
            variant: 'destructive',
          });
          return false;
        }
      } catch (e) {
        console.error('Error fetching CSRF token for login', e);
        toast({
          title: 'Login Error',
          description: 'Network error preparing session. Please check connection.',
          variant: 'destructive',
        });
        return false;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Invalid server response' }));
        toast({
          title: 'Login Failed',
          description: errorData.message || 'Invalid username or password',
          variant: 'destructive',
        });
        return false;
      }
      
      const responseData = await response.json();
      const userDataToSet = isAdminLogin && responseData.user ? responseData.user : responseData;

      if (!userDataToSet || typeof userDataToSet.username === 'undefined') {
          console.error('Login response did not contain expected user data:', responseData);
          toast({
              title: 'Login Failed',
              description: 'Received an unexpected response from the server.',
              variant: 'destructive',
          });
          return false;
      }

      setUser(userDataToSet);
      localStorage.setItem('user', JSON.stringify(userDataToSet));
      
      toast({
        title: 'Login Successful',
        description: `Welcome back, ${userDataToSet.username}!`,
      });
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login Failed',
        description: 'An unexpected error occurred during login. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    confirmPassword: string
  ): Promise<boolean> => {
    setLoading(true);
    try {
      let csrfToken = '';
      try {
        const csrfRes = await fetch('/api/csrf-token');
        if (csrfRes.ok) {
          const tokenData = await csrfRes.json();
          csrfToken = tokenData.csrfToken;
        } else {
          console.error('Failed to fetch CSRF token for registration', await csrfRes.text());
          toast({ title: 'Registration Error', description: 'Could not prepare secure session.', variant: 'destructive' });
          return false;
        }
      } catch (e) {
        console.error('Error fetching CSRF token for registration', e);
        toast({ title: 'Registration Error', description: 'Network error preparing session.', variant: 'destructive' });
        return false;
      }

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ username, email, password, confirmPassword }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Invalid server response' }));
        toast({
          title: 'Registration Failed',
          description: errorData.message || 'Could not create account',
          variant: 'destructive',
        });
        return false;
      }
      
      const userData = await response.json();
      if (!userData || typeof userData.username === 'undefined') {
          console.error('Registration response did not contain expected user data:', userData);
          toast({
              title: 'Registration Failed',
              description: 'Received an unexpected response from the server after registration.',
              variant: 'destructive',
          });
          return false;
      }

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      toast({
        title: 'Registration Successful',
        description: 'Your account has been created',
      });
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration Failed',
        description: 'An unexpected error occurred during registration',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      let csrfToken = '';
      try {
        const csrfRes = await fetch('/api/csrf-token');
        if (csrfRes.ok) {
          const tokenData = await csrfRes.json();
          csrfToken = tokenData.csrfToken;
        } else {
          console.error('Failed to fetch CSRF token for logout', await csrfRes.text());
          // Non-critical for logout, can proceed with local logout
        }
      } catch (e) {
        console.error('Error fetching CSRF token for logout', e);
         // Non-critical for logout
      }

      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken, // Send if available
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn('Server logout failed:', errorData.message || 'Unknown server error');
        toast({
          title: 'Logout Notice',
          description: errorData.message || 'Server logout indication failed. Logged out locally.',
          variant: 'default', // Changed from 'warning'
        });
      } else {
        toast({
          title: 'Logged Out',
          description: 'You have been logged out successfully',
          // variant: 'default', // Default variant is usually implied
        });
      }
    } catch (error) {
      console.error('Error during server logout call:', error);
      toast({
        title: 'Logout Information',
        description: 'Could not reach server for logout. Logged out locally.',
        variant: 'default', // Changed from 'info'
      });
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.isAdmin || false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
