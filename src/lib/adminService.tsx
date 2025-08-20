import { supabase } from './supabase';
import { User } from '@/types/database';

export interface UserWithStats {
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone?: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
  kos_count?: number;
  last_login?: string;
}

export interface CreateUserData {
  user_name: string;
  user_email: string;
  user_phone?: string;
  role: 'admin' | 'user';
  password: string;
}

export interface UpdateUserData {
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  role?: 'admin' | 'user';
}

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


  // ✅ USER MANAGEMENT METHODS
  static async getAllUsers(page = 1, limit = 10, search = '') {
    try {
      console.log('📊 Fetching users:', { page, limit, search });

      let query = supabase
        .from('users')
        .select(`
          user_id,
          user_name,
          user_email,
          user_phone,
          role,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      // Add search filter
      if (search.trim()) {
        query = query.or(`user_name.ilike.%${search}%,user_email.ilike.%${search}%`);
      }

      // Get total count for pagination
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data: users, error } = await query;

      if (error) {
        console.error('❌ Error fetching users:', error);
        return { data: null, error: error.message, total: 0 };
      }

      // Get kos count for each user
      if (users && users.length > 0) {
        const userIds = users.map(user => user.user_id);
        
        const { data: kosCounts } = await supabase
          .from('kos')
          .select('pemilik_id')
          .in('pemilik_id', userIds);

        // Count kos per user
        const kosCountMap = kosCounts?.reduce((acc, kos) => {
          acc[kos.pemilik_id] = (acc[kos.pemilik_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        // Add kos count to users
        const usersWithStats = users.map(user => ({
          ...user,
          kos_count: kosCountMap[user.user_id] || 0
        }));

        console.log('✅ Users fetched successfully:', usersWithStats.length);
        return { 
          data: usersWithStats, 
          error: null, 
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
          currentPage: page
        };
      }

      return { data: users, error: null, total: count || 0 };
    } catch (error: any) {
      console.error('💥 Exception fetching users:', error);
      return { data: null, error: error.message, total: 0 };
    }
  }

  static async getUserById(userId: string) {
    try {
      console.log('👤 Fetching user by ID:', userId);

      const { data: user, error } = await supabase
        .from('users')
        .select(`
          user_id,
          user_name,
          user_email,
          user_phone,
          role,
          created_at,
          updated_at
        `)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching user:', error);
        return { data: null, error: error.message };
      }

      // Get user's kos count
      const { count: kosCount } = await supabase
        .from('kos')
        .select('*', { count: 'exact', head: true })
        .eq('pemilik_id', userId);

      const userWithStats = {
        ...user,
        kos_count: kosCount || 0
      };

      console.log('✅ User fetched successfully:', user.user_name);
      return { data: userWithStats, error: null };
    } catch (error: any) {
      console.error('💥 Exception fetching user:', error);
      return { data: null, error: error.message };
    }
  }

  static async createUser(userData: CreateUserData) {
    try {
      console.log('➕ Creating new user:', userData.user_email);

      // First create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.user_email,
        password: userData.password,
        email_confirm: true
      });

      if (authError) {
        console.error('❌ Auth user creation error:', authError);
        return { data: null, error: authError.message };
      }

      if (!authData.user) {
        return { data: null, error: 'Failed to create auth user' };
      }

      // Then create user record
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert([{
          user_id: authData.user.id,
          user_name: userData.user_name,
          user_email: userData.user_email,
          user_phone: userData.user_phone,
          role: userData.role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (userError) {
        console.error('❌ User record creation error:', userError);
        
        // Cleanup auth user if database insert fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        
        return { data: null, error: userError.message };
      }

      console.log('✅ User created successfully:', user.user_name);
      return { data: user, error: null };
    } catch (error: any) {
      console.error('💥 Exception creating user:', error);
      return { data: null, error: error.message };
    }
  }

  static async updateUser(userId: string, userData: UpdateUserData) {
    try {
      console.log('✏️ Updating user:', userId);

      const { data: user, error } = await supabase
        .from('users')
        .update({
          ...userData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating user:', error);
        return { data: null, error: error.message };
      }

      console.log('✅ User updated successfully:', user.user_name);
      return { data: user, error: null };
    } catch (error: any) {
      console.error('💥 Exception updating user:', error);
      return { data: null, error: error.message };
    }
  }

  static async deleteUser(userId: string) {
    try {
      console.log('🗑️ Deleting user:', userId);

      // First check if user has kos
      const { count: kosCount } = await supabase
        .from('kos')
        .select('*', { count: 'exact', head: true })
        .eq('pemilik_id', userId);

      if (kosCount && kosCount > 0) {
        return { 
          data: null, 
          error: `Cannot delete user. User has ${kosCount} kos properties. Delete kos first.` 
        };
      }

      // Delete user record
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('user_id', userId);

      if (userError) {
        console.error('❌ Error deleting user record:', userError);
        return { data: null, error: userError.message };
      }

      // Delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) {
        console.error('⚠️ Warning: User record deleted but auth cleanup failed:', authError);
        // Don't return error here as main operation succeeded
      }

      console.log('✅ User deleted successfully');
      return { data: true, error: null };
    } catch (error: any) {
      console.error('💥 Exception deleting user:', error);
      return { data: null, error: error.message };
    }
  }

  static async resetUserPassword(userId: string, newPassword: string) {
    try {
      console.log('🔐 Resetting password for user:', userId);

      const { data, error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword
      });

      if (error) {
        console.error('❌ Error resetting password:', error);
        return { data: null, error: error.message };
      }

      console.log('✅ Password reset successfully');
      return { data: true, error: null };
    } catch (error: any) {
      console.error('💥 Exception resetting password:', error);
      return { data: null, error: error.message };
    }
  }

  static async toggleUserStatus(userId: string, disable: boolean) {
    try {
      console.log(`${disable ? '🚫' : '✅'} ${disable ? 'Disabling' : 'Enabling'} user:`, userId);

      const { data, error } = await supabase.auth.admin.updateUserById(userId, {
        ban_duration: disable ? '876000h' : 'none' // ~100 years or none
      });

      if (error) {
        console.error('❌ Error toggling user status:', error);
        return { data: null, error: error.message };
      }

      console.log(`✅ User ${disable ? 'disabled' : 'enabled'} successfully`);
      return { data: true, error: null };
    } catch (error: any) {
      console.error('💥 Exception toggling user status:', error);
      return { data: null, error: error.message };
    }
  }
}