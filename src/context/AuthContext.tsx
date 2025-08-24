'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthUser } from '@/types/database';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

interface RegisterData {
  user_name: string;
  user_email: string;
  user_password: string;
  user_phone: string;
  user_ig?: string;
  role?: 'user';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('user_email', session.user.email)
          .single();
        
        if (userData) {
          setUser(userData);
          console.log('✅ Session restored for:', userData.user_name);
        }
      }
    } catch (error) {
      console.log('No session found:', error);
    }
  };

  const checkAuth = async () => {
    console.log('🔄 Manual auth check...');
    await checkSession();
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoading(false);
        return { success: false, error: error.message };
      }

      if (authData.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('user_email', email)
          .single();

        if (userData) {
          setUser(userData);
          setLoading(false);
          return { success: true };
        }
      }

      setLoading(false);
      return { success: false, error: 'User not found' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setLoading(true);
      
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.user_email,
        password: userData.user_password,
      });

      if (authError) {
        setLoading(false);
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        setLoading(false);
        return { success: false, error: 'Failed to create auth user' };
      }

      // 2. Create user record in database
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .insert([
          {
            user_id: authData.user.id,
            user_name: userData.user_name,
            user_email: userData.user_email,
            user_password: userData.user_password, // In real app, this should be hashed
            user_phone: userData.user_phone,
            user_ig: userData.user_ig || '',
            role: userData.role || 'user',
            created_at: new Date().toISOString(),
          }
        ])
        .select()
        .single();

      if (dbError) {
        setLoading(false);
        return { success: false, error: dbError.message };
      }

      if (dbUser) {
        setUser(dbUser);
        setLoading(false);
        return { success: true };
      }

      setLoading(false);
      return { success: false, error: 'Failed to create user record' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};