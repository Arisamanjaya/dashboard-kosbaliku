import { supabase } from './supabase';

export const testSupabaseConnection = async () => {
  console.log('🔍 Testing Supabase connection...');
  console.log('📍 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('🔑 Anon Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  try {
    // Test simple query
    const { data, error, count } = await supabase
      .from('users')
      .select('user_id, user_name, user_email, role', { count: 'exact' })
      .limit(1);

    if (error) {
      console.error('❌ Connection failed:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Connection successful');
    console.log('📊 Sample data:', data);
    console.log('📈 Total users:', count);
    
    return { success: true, data, count };
  } catch (error) {
    console.error('🔥 Connection test failed:', error);
    return { success: false, error: error };
  }
};