import * as React from 'react';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabaseApi } from '@/services/supabase-api';
import { UserInsert } from '@/types/user-validation';
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
  register: (userData: Partial<User> & { password: string }) => Promise<{ user: SupabaseUser; profile: any; requiresConfirmation?: boolean }>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
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
        // Add a wrapper timeout for the entire authentication process
        const authTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Authentication initialization timeout')), 45000);
        });

        const userCheck = supabaseApi.getCurrentUser();
        const result = await Promise.race([userCheck, authTimeout]) as any;
        
        if (result && result.profile) {
          setUser(result.profile);
        }
      } catch (error: any) {
        console.error('Failed to check current user:', error);
        // Handle timeout gracefully - don't show error to user
        if (error.message && (error.message.includes('timeout') || error.message.includes('aborted'))) {
          console.log('Authentication timeout - user may need to login again');
        } else {
          // Only show non-timeout errors
          console.error('Authentication error:', error);
        }
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

  const register = async (userData: Partial<User> & { password: string }, invitationCode?: string) => {
    try {
      setIsLoading(true);
      
      if (!userData.email || !userData.password) {
        throw new Error('Email and password are required');
      }
      
      // Convert Partial<User> to UserInsert for API
      const userInsertData: UserInsert = {
        email: userData.email,
        first_name: userData.first_name || null,
        last_name: userData.last_name || null,
        phone: userData.phone || null,
        status: userData.status || 'Pending',
        kyc_status: userData.kyc_status || 'Pending',
        account_type: userData.account_type || 'Traditional IRA',
        account_number: userData.account_number || null,
        balance: userData.balance || 0,
        two_factor_enabled: userData.two_factor_enabled || false,
        risk_tolerance: userData.risk_tolerance || 'Moderate',
        investment_goal: userData.investment_goal || 'Retirement',
        is_admin: userData.is_admin || false,
        admin_role: userData.admin_role || null,
        credit_score: userData.credit_score || null
      };
      
      const result = await supabaseApi.signUp(
        userData.email,
        userData.password,
        userInsertData,
        invitationCode
      );
      
      // Handle email confirmation requirement (now always false due to auto-login)
      if (result.requiresConfirmation) {
        // This should not happen with our new auto-login flow, but handle just in case
        throw new Error('Email confirmation required but auto-login failed. Please try logging in manually.');
      }
      
      if (result.profile) {
        setUser(result.profile);
      }
      
      return result;
    } catch (error) {
      console.error('Registration failed:', error);
      
      // Re-throw error with same message for UI handling
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Registration failed. Please try again.');
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

  const refreshUser = async () => {
    try {
      const result = await supabaseApi.getCurrentUser();
      if (result && result.profile) {
        setUser(result.profile);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
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
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 