import * as React from 'react';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import supabaseApi from '@/services/supabase-api';
import { Database } from '@/lib/supabase';

type User = Database['public']['Tables']['users']['Row'];

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  userRole: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in on app start
    const checkUser = async () => {
      try {
        const { profile } = await supabaseApi.getCurrentUser();
        if (profile) {
          setUser(profile);
        }
      } catch (error) {
        console.error('Failed to check current user:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { profile } = await supabaseApi.signIn(email, password);
      if (profile) {
        setUser(profile);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: Partial<User>) => {
    try {
      setIsLoading(true);
      const { profile } = await supabaseApi.signUp(
        userData.email || '',
        'temp-password', // This should come from a form field
        userData
      );
      if (profile) {
        setUser(profile);
      }
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabaseApi.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user) return;
    
    try {
      const updatedUser = await supabaseApi.updateUser(user.id, data);
      setUser(updatedUser);
    } catch (error) {
      console.error('User update failed:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isAdmin: !!user && (!!user.is_admin || !!user.admin_role),
    isSuperAdmin: !!user && user.admin_role === 'superadmin',
    userRole: user?.admin_role || (user?.is_admin ? 'admin' : null),
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 