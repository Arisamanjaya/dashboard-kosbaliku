import { supabase } from './supabase';
import { User } from '@/types/database';

export class AdminService {
  // Get admin dashboard stats - NO CHANGE
  static async getAdminStats() {
    try {
      console.log('📊 Fetching admin stats...');

      // Get total users and users by role
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('role, created_at');

      if (usersError) {
        console.error('❌ Error fetching users:', usersError);
        return { data: null, error: usersError.message };
      }

      // Get kos data
      const { data: kosData, error: kosError } = await supabase
        .from('kos')
        .select('status, created_at');

      if (kosError) {
        console.error('❌ Error fetching kos:', kosError);
        return { data: null, error: kosError.message };
      }

      // Calculate current month start
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      // Process data
      const stats = {
        total_users: users.length,
        total_kos: kosData.length,
        pending_kos: kosData.filter(k => k.status === 'pending').length,
        active_kos: kosData.filter(k => k.status === 'active').length,
        rejected_kos: kosData.filter(k => k.status === 'rejected').length,
        users_by_role: {
          admin: users.filter(u => u.role === 'admin').length,
          pemilik: users.filter(u => u.role === 'pemilik').length,
          user: users.filter(u => u.role === 'user').length,
        },
        recent_activity: {
          new_users_this_month: users.filter(u => 
            new Date(u.created_at) >= currentMonth
          ).length,
          new_kos_this_month: kosData.filter(k => 
            new Date(k.created_at) >= currentMonth
          ).length,
          pending_approvals: kosData.filter(k => k.status === 'pending').length,
        }
      };

      console.log('✅ Admin stats calculated:', stats);
      return { data: stats, error: null };
    } catch (error: any) {
      console.error('💥 Exception in getAdminStats:', error);
      return { data: null, error: error.message };
    }
  }

  // Get all kos for admin (with filters) - NO CHANGE
  static async getAllKos(filters?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      console.log('🏠 Fetching all kos for admin...', filters);

      let query = supabase
        .from('kos')
        .select(`
          *,
          pemilik:users!kos_pemilik_id_fkey(
            user_id,
            user_name,
            user_email
          ),
          harga:harga_kos(*),
          images:kos_images(*)
        `);

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.or(`kos_nama.ilike.%${filters.search}%,kos_lokasi.ilike.%${filters.search}%`);
      }

      // Apply pagination
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const offset = (page - 1) * limit;

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Error fetching kos:', error);
        return { data: null, error: error.message, count: 0 };
      }

      console.log('✅ Fetched kos:', data?.length);
      return { data, error: null, count };
    } catch (error: any) {
      console.error('💥 Exception in getAllKos:', error);
      return { data: null, error: error.message, count: 0 };
    }
  }

  // SIMPLIFIED - Update kos status without reason
  static async updateKosStatus(kosId: string, status: 'active' | 'rejected' | 'pending') {
    try {
      console.log('🔄 Updating kos status:', { kosId, status });

      const { data, error } = await supabase
        .from('kos')
        .update({ status })
        .eq('kos_id', kosId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating kos status:', error);
        return { data: null, error: error.message };
      }

      console.log('✅ Kos status updated:', data);
      return { data, error: null };
    } catch (error: any) {
      console.error('💥 Exception in updateKosStatus:', error);
      return { data: null, error: error.message };
    }
  }

  // NEW - Get single kos for admin detail view
  static async getKosById(kosId: string) {
  try {
    console.log('🏠 Fetching kos by ID for admin...', kosId);

    const { data, error } = await supabase
      .from('kos')
      .select(`
        *,
        pemilik:users!kos_pemilik_id_fkey(
          user_id,
          user_name,
          user_email,
          user_phone
        ),
        harga:harga_kos(*),
        images:kos_images(*),
        kos_fasilitas(
          fasilitas(
            fasilitas_id,
            fasilitas_nama
          )
        )
      `)
      .eq('kos_id', kosId)
      .single();

    if (error) {
      console.error('❌ Error fetching kos by ID:', error);
      return { data: null, error: error.message };
    }

    // Transform fasilitas data if using junction table
    const transformedData = {
      ...data,
      fasilitas: data.kos_fasilitas?.map((kf: any) => kf.fasilitas) || []
    };

    console.log('✅ Fetched kos by ID:', transformedData);
    console.log('🔍 Fasilitas data:', transformedData.fasilitas);
    return { data: transformedData, error: null };
  } catch (error: any) {
    console.error('💥 Exception in getKosById:', error);
    return { data: null, error: error.message };
  }
}


  // Get all users for admin - NO CHANGE
  static async getAllUsers(filters?: {
    role?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      console.log('👥 Fetching all users for admin...', filters);

      let query = supabase
        .from('users')
        .select('*');

      // Apply filters
      if (filters?.role && filters.role !== 'all') {
        query = query.eq('role', filters.role);
      }

      if (filters?.search) {
        query = query.or(`user_name.ilike.%${filters.search}%,user_email.ilike.%${filters.search}%`);
      }

      // Apply pagination
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const offset = (page - 1) * limit;

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Error fetching users:', error);
        return { data: null, error: error.message, count: 0 };
      }

      console.log('✅ Fetched users:', data?.length);
      return { data, error: null, count };
    } catch (error: any) {
      console.error('💥 Exception in getAllUsers:', error);
      return { data: null, error: error.message, count: 0 };
    }
  }

  // Update user status/role - NO CHANGE
  static async updateUser(userId: string, updates: {
    role?: string;
    user_name?: string;
    user_email?: string;
    is_active?: boolean;
  }) {
    try {
      console.log('🔄 Updating user:', { userId, updates });

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating user:', error);
        return { data: null, error: error.message };
      }

      console.log('✅ User updated:', data);
      return { data, error: null };
    } catch (error: any) {
      console.error('💥 Exception in updateUser:', error);
      return { data: null, error: error.message };
    }
  }

  // Delete user - NO CHANGE
  static async deleteUser(userId: string) {
    try {
      console.log('🗑️ Deleting user:', userId);

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error deleting user:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ User deleted');
      return { success: true, error: null };
    } catch (error: any) {
      console.error('💥 Exception in deleteUser:', error);
      return { success: false, error: error.message };
    }
  }
}