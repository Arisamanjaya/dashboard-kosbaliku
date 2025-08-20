'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthUser } from '@/types/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean; // ADD BACK
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>; // ADD BACK
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
  const [loading, setLoading] = useState(false); // ADD BACK minimal loading

  // Check session once on mount
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
      console.log('No session found');
    }
  };

  // ADD checkAuth function back
  const checkAuth = async () => {
    console.log('🔄 Manual auth check...');
    await checkSession();
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true); // Set loading during login
      
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
    } catch (error: any) {
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};