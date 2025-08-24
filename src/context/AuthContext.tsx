'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface AuthUser {
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone?: string;
  user_ig?: string;
  role: 'user' | 'admin';
  created_at: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string; needsConfirmation?: boolean; message?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

interface RegisterData {
  user_name: string;
  user_email: string;
  user_password: string;
  user_phone: string;
  user_ig?: string;
  role?: 'user' | 'admin';
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

  const fetchUserData = useCallback(async (email: string) => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_email', email)
        .single();
      
      if (error) {
        console.error('❌ Error fetching user data:', error);
        return;
      }
      if (userData) {
        setUser(userData);
        console.log('✅ User data loaded:', userData.user_name, 'Role:', userData.role);
      }
    } catch (error) {
      console.error('❌ Error in fetchUserData:', error);
    }
  }, [setUser]); // Dependensi 'setUser' adalah fungsi yang stabil dari React

  // ✅ REFACTOR 2: Bungkus checkSession dengan useCallback
  const checkSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        await fetchUserData(session.user.email);
      }
    } catch (error) {
      console.log('No session found:', error);
    }
  }, [fetchUserData]); // checkSession bergantung pada fetchUserData

  useEffect(() => {
    checkSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user?.email) {
        await fetchUserData(session.user.email); // Gunakan fetchUserData yang di-memoize
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkSession, fetchUserData]);

  const checkAuth = async () => {
    console.log('🔄 Manual auth check...');
    await checkSession();
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('🔐 Attempting login for:', email);
      
      // ✅ STEP 1: Check if user exists in our database first
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('user_email', email)
        .single();

      if (dbError || !dbUser) {
        console.error('❌ User not found in database:', dbError);
        setLoading(false);
        return { success: false, error: 'User not found. Please register first.' };
      }

      console.log('✅ User found in database:', dbUser.user_name, 'Role:', dbUser.role);

      // ✅ STEP 2: Try Supabase Auth login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('❌ Supabase auth error:', authError);
        
        // ✅ STEP 3: If auth fails but user exists in DB, try to create auth user
        if (authError.message.includes('Invalid login credentials') || 
            authError.message.includes('User not found')) {
          
          console.log('🔧 Creating missing auth user...');
          
          try {
            // ✅ FIX: Handle empty user_ig properly
            const userIg = dbUser.user_ig && dbUser.user_ig.trim() ? dbUser.user_ig.trim() : null;
            
            // Create auth user with same password
            const { data: newAuthData, error: createError } = await supabase.auth.signUp({
              email: email,
              password: password, // Use the password they're trying to login with
              options: {
                emailRedirectTo: `${window.location.origin}/login`,
                data: {
                  user_name: dbUser.user_name,
                  role: dbUser.role,
                  user_ig: userIg
                }
              }
            });

            if (createError) {
              console.error('❌ Failed to create auth user:', createError);
              setLoading(false);
              return { success: false, error: 'Authentication setup failed. Please contact admin.' };
            }

            if (newAuthData.user) {
              // Update database with auth user ID
              await supabase
                .from('users')
                .update({ user_id: newAuthData.user.id })
                .eq('user_email', email);

              console.log('✅ Auth user created and linked');
              
              // If auto-confirmed, set user and return success
              if (newAuthData.session) {
                setUser(dbUser);
                setLoading(false);
                return { success: true };
              } else {
                setLoading(false);
                return { 
                  success: false, 
                  error: 'Account created but needs email confirmation. Please check your email.' 
                };
              }
            }
          } catch (createAuthError) {
            console.error('❌ Error creating auth user:', createAuthError);
            setLoading(false);
            return { success: false, error: 'Failed to setup authentication. Please try again.' };
          }
        }
        
        setLoading(false);
        return { success: false, error: authError.message };
      }

      if (authData.user) {
        setUser(dbUser);
        setLoading(false);
        return { success: true };
      }

      setLoading(false);
      return { success: false, error: 'Login failed' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      console.error('❌ Login error:', error);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setLoading(true);
      console.log('📝 Registering user:', userData.user_email);
      
      // ✅ STEP 1: Check if user already exists in database
      const { data: existingUser } = await supabase
        .from('users')
        .select('user_email')
        .eq('user_email', userData.user_email)
        .single();

      if (existingUser) {
        setLoading(false);
        return { success: false, error: 'User with this email already exists' };
      }

      // ✅ FIX: Sanitize user_ig - set to null if empty
      const sanitizedUserIg = userData.user_ig && userData.user_ig.trim() 
        ? userData.user_ig.trim() 
        : null;

      console.log('📝 Sanitized user_ig:', sanitizedUserIg);

      // ✅ STEP 2: Create auth user first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.user_email,
        password: userData.user_password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            user_name: userData.user_name,
            user_phone: userData.user_phone,
            user_ig: sanitizedUserIg,
            role: userData.role || 'user',
          }
        }
      });

      if (authError) {
        console.error('❌ Auth registration error:', authError);
        setLoading(false);
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        setLoading(false);
        return { success: false, error: 'Failed to create auth user' };
      }

      console.log('✅ Auth user created:', authData.user.id);

      // ✅ STEP 3: Create user record in database with sanitized data
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .insert([
          {
            user_id: authData.user.id,
            user_name: userData.user_name,
            user_email: userData.user_email,
            user_password: userData.user_password, // Store for reference
            user_phone: userData.user_phone,
            user_ig: sanitizedUserIg, // ✅ Use sanitized value (null if empty)
            role: userData.role || 'user',
            created_at: new Date().toISOString(),
          }
        ])
        .select()
        .single();

      if (dbError) {
        console.error('❌ Database user creation error:', dbError);
        
        // Cleanup auth user if DB insert fails
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
          console.log('🧹 Cleaned up auth user after DB failure');
        } catch (cleanupError) {
          console.error('Failed to cleanup auth user:', cleanupError);
        }
        
        setLoading(false);
        return { success: false, error: dbError.message };
      }

      console.log('✅ Database user created:', dbUser.user_name, 'IG:', dbUser.user_ig || 'null');

      // Check if user was auto-confirmed
      const isConfirmed = authData.user.email_confirmed_at !== null || authData.session !== null;

      if (isConfirmed && dbUser) {
        setUser(dbUser);
      }

      setLoading(false);
      return { 
        success: true, 
        needsConfirmation: !isConfirmed,
        message: isConfirmed ? 
          'Account created successfully!' : 
          'Please check your email to confirm your account.'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      console.error('❌ Registration error:', error);
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