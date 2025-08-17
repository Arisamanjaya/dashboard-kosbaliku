// 'use client';
// import React, { createContext, useContext, useEffect, useState } from 'react';
// import { User } from '@supabase/supabase-js';
// import { supabase } from '@/lib/supabase';
// import { User as DbUser } from '@/types/database';

// interface AuthContextType {
//   user: User | null;
//   userProfile: DbUser | null;
//   loading: boolean;
//   signIn: (email: string, password: string) => Promise<any>;
//   signOut: () => Promise<void>;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [user, setUser] = useState<User | null>(null);
//   const [userProfile, setUserProfile] = useState<DbUser | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // Get initial session
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       setUser(session?.user ?? null);
//       if (session?.user) {
//         fetchUserProfile(session.user.id);
//       }
//       setLoading(false);
//     });

//     // Listen for auth changes
//     const { data: { subscription } } = supabase.auth.onAuthStateChange(
//       async (event, session) => {
//         setUser(session?.user ?? null);
//         if (session?.user) {
//           fetchUserProfile(session.user.id);
//         } else {
//           setUserProfile(null);
//         }
//         setLoading(false);
//       }
//     );

//     return () => subscription.unsubscribe();
//   }, []);

//   const fetchUserProfile = async (userId: string) => {
//     const { data, error } = await supabase
//       .from('users')
//       .select('*')
//       .eq('user_id', userId)
//       .single();
    
//     if (data) setUserProfile(data);
//   };

//   const signIn = async (email: string, password: string) => {
//     const { data, error } = await supabase.auth.signInWithPassword({
//       email,
//       password,
//     });
//     return { data, error };
//   };

//   const signOut = async () => {
//     await supabase.auth.signOut();
//   };

//   return (
//     <AuthContext.Provider value={{
//       user,
//       userProfile,
//       loading,
//       signIn,
//       signOut,
//     }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as DbUser } from '@/types/database';
import { simpleLogin, simpleLogout, getCurrentUser } from '@/lib/simpleAuth';

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
    // Debug log
    console.log('AuthProvider mounting...');
    
    // Check if user is logged in
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
    simpleLogout();
    setUser(null);
  };

  // Debug current state
  console.log('AuthContext state:', { user, loading });

  return (
    <AuthContext.Provider value={{
      user,
      userProfile: user, // Same as user for simple auth
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