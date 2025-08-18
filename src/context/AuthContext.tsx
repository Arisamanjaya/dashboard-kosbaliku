'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as DbUser } from '@/types/database';
import { simpleLogin, simpleLogout, getCurrentUser } from '@/lib/simpleAuth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: DbUser | null;
  userProfile: DbUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider mounting...');
    
    const currentUser = getCurrentUser();
    console.log('Current user from localStorage:', currentUser);
    
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('Attempting login with:', email);
    
    try {
      const { user: loggedInUser, error } = await simpleLogin(email, password);
      
      console.log('Login result:', { user: loggedInUser, error });
      
      if (error) {
        return { data: null, error: { message: error } };
      }

      setUser(loggedInUser);
      return { data: { user: loggedInUser }, error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { data: null, error: { message: error.message } };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Starting logout process...');
      
      // Clear localStorage
      simpleLogout();
      
      // Clear state
      setUser(null);
      
      console.log('✅ Logout successful');
      
      // Redirect will be handled by the component calling signOut
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  console.log('AuthContext state:', { user, loading });

  return (
    <AuthContext.Provider value={{
      user,
      userProfile: user,
      loading,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};