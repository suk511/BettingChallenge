import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { User, AuthContextType } from '@/lib/types';

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => { throw new Error('AuthContext not initialized'); },
  logout: async () => { throw new Error('AuthContext not initialized'); },
  checkAuth: async () => { throw new Error('AuthContext not initialized'); },
});

// Hook to use the auth context
export function useAuthContext() {
  return useContext(AuthContext);
}

// Create the provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check if user is already authenticated
  const checkAuth = useCallback(async (): Promise<User | null> => {
    try {
      setLoading(true);
      const response = await apiRequest('GET', '/api/me');

      if (!response.ok) {
        if (response.status === 401) {
          setUser(null);
          return null;
        }
        throw new Error('Network response was not ok');
      }

      const userData = await response.json();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Error checking authentication:', error);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Login function
  const login = useCallback(async (username: string, password: string): Promise<User> => {
    try {
      setLoading(true);
      const response = await apiRequest('POST', '/api/login', { username, password });
      const userData = await response.json();
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      await apiRequest('POST', '/api/logout', {});
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const authContext: AuthContextType = {
    user,
    loading,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
}

// Convenience hook that uses AuthContext
export function useAuth(): AuthContextType {
  return useAuthContext();
}