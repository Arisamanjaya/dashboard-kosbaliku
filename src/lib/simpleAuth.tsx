// filepath: src/lib/simpleAuth.ts
import { supabase } from './supabase';

export const simpleLogin = async (email: string, password: string) => {
  console.log('🔍 Attempting login for:', email);
  
  try {
    // Test koneksi dulu
    console.log('🔗 Testing Supabase connection...');
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_email', email)
      .eq('user_password', password)
      .single();

    console.log('📡 Supabase response:', { data, error });

    if (error) {
      console.error('❌ Supabase error:', error);
      return { user: null, error: `Database error: ${error.message}` };
    }

    if (!data) {
      console.error('❌ No user found');
      return { user: null, error: 'Email atau password salah' };
    }

    // Store in localStorage untuk simple session
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_user', JSON.stringify(data));
      console.log('💾 User saved to localStorage');
    }
    
    console.log('✅ Login successful');
    return { user: data, error: null };
  } catch (error) {
    console.error('🔥 Login failed with exception:', error);
    return { user: null, error: 'Login gagal - cek koneksi database' };
  }
};

export const simpleLogout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_user');
    console.log('🚪 User logged out');
  }
};

export const getCurrentUser = () => {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('auth_user');
    const parsedUser = user ? JSON.parse(user) : null;
    console.log('👤 Getting current user:', parsedUser);
    return parsedUser;
  }
  return null;
};