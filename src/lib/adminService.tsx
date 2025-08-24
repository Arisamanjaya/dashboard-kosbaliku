import { supabase } from './supabase';

export interface UserWithStats {
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone?: string;
  role: 'admin' | 'user' | 'pemilik';
  created_at: string;
  updated_at: string;
  kos_count?: number;
  last_login?: string;
}

export interface CreateUserData {
  user_name: string;
  user_email: string;
  user_phone: string;
  user_ig?: string; // ✅ Make optional
  role: 'admin' | 'user' | 'pemilik';
  password: string;
}

export interface UpdateUserData {
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  user_ig?: string; // ✅ Optional and can be null
  role?: 'admin' | 'user' | 'pemilik';
}

type KosFasilitasJoin = {
  fasilitas: {
    fasilitas_id: string;
    fasilitas_nama: string;
  } | null;
};

export class AdminService {
  static async getAdminStats() {
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('role, created_at');

      if (usersError) return { data: null, error: usersError.message };

      const { data: kosData, error: kosError } = await supabase
        .from('kos')
        .select('status, created_at');

      if (kosError) return { data: null, error: kosError.message };

      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

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
          new_users_this_month: users.filter(u => new Date(u.created_at) >= currentMonth).length,
          new_kos_this_month: kosData.filter(k => new Date(k.created_at) >= currentMonth).length,
          pending_approvals: kosData.filter(k => k.status === 'pending').length,
        }
      };

      return { data: stats, error: null };
    } catch (error: unknown) {
      if (error instanceof Error) return { data: null, error: error.message };
      return { data: null, error: 'An unknown error occurred' };
    }
  }

  static async getAllKos(filters?: { status?: string; search?: string; page?: number; limit?: number; }) {
    try {
      let query = supabase.from('kos').select(`*, pemilik:users!kos_pemilik_id_fkey(user_id, user_name, user_email), harga:harga_kos(*), images:kos_images(*)`);
      if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status);
      if (filters?.search) query = query.or(`kos_nama.ilike.%${filters.search}%,kos_lokasi.ilike.%${filters.search}%`);
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const offset = (page - 1) * limit;
      query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
      const { data, error, count } = await query;
      if (error) return { data: null, error: error.message, count: 0 };
      return { data, error: null, count };
    } catch (error: unknown) {
      if (error instanceof Error) return { data: null, error: error.message, count: 0 };
      return { data: null, error: 'An unknown error occurred', count: 0 };
    }
  }

  static async updateKosStatus(kosId: string, status: 'active' | 'rejected' | 'pending') {
    try {
      const { data, error } = await supabase.from('kos').update({ status }).eq('kos_id', kosId).select().single();
      if (error) return { data: null, error: error.message };
      return { data, error: null };
    } catch (error: unknown) {
      if (error instanceof Error) return { data: null, error: error.message };
      return { data: null, error: 'An unknown error occurred' };
    }
  }

  static async getKosById(kosId: string) {
    try {
      const { data, error } = await supabase
        .from('kos')
        .select(`*, pemilik:users!kos_pemilik_id_fkey(user_id, user_name, user_email, user_phone), harga:harga_kos(*), images:kos_images(*), kos_fasilitas(fasilitas(fasilitas_id, fasilitas_nama))`)
        .eq('kos_id', kosId)
        .single();
      if (error) return { data: null, error: error.message };
      const transformedData = { ...data, fasilitas: data.kos_fasilitas?.map((kf: KosFasilitasJoin) => kf.fasilitas).filter(Boolean) || [] };
      return { data: transformedData, error: null };
    } catch (error: unknown) {
      if (error instanceof Error) return { data: null, error: error.message };
      return { data: null, error: 'An unknown error occurred' };
    }
  }

  static async getAllUsers(page = 1, limit = 10, search = '') {
    try {
      let query = supabase.from('users').select(`user_id, user_name, user_email, user_phone, role, created_at, updated_at`).order('created_at', { ascending: false });
      if (search.trim()) query = query.or(`user_name.ilike.%${search}%,user_email.ilike.%${search}%`);
      const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);
      const { data: users, error } = await query;
      if (error) return { data: null, error: error.message, total: 0 };
      if (users && users.length > 0) {
        const userIds = users.map(user => user.user_id);
        const { data: kosCounts } = await supabase.from('kos').select('pemilik_id').in('pemilik_id', userIds);
        const kosCountMap = kosCounts?.reduce((acc, kos) => { acc[kos.pemilik_id] = (acc[kos.pemilik_id] || 0) + 1; return acc; }, {} as Record<string, number>) || {};
        const usersWithStats = users.map(user => ({ ...user, kos_count: kosCountMap[user.user_id] || 0 }));
        return { data: usersWithStats, error: null, total: count || 0, totalPages: Math.ceil((count || 0) / limit), currentPage: page };
      }
      return { data: users, error: null, total: count || 0 };
    } catch (error: unknown) {
      if (error instanceof Error) return { data: null, error: error.message, total: 0 };
      return { data: null, error: 'An unknown error occurred', total: 0 };
    }
  }

  static async getUserById(userId: string) {
    try {
      const { data: user, error } = await supabase.from('users').select(`user_id, user_name, user_email, user_phone, role, created_at, updated_at`).eq('user_id', userId).single();
      if (error) return { data: null, error: error.message };
      const { count: kosCount } = await supabase.from('kos').select('*', { count: 'exact', head: true }).eq('pemilik_id', userId);
      const userWithStats = { ...user, kos_count: kosCount || 0 };
      return { data: userWithStats, error: null };
    } catch (error: unknown) {
      if (error instanceof Error) return { data: null, error: error.message };
      return { data: null, error: 'An unknown error occurred' };
    }
  }

  static async createUser(userData: CreateUserData) {
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({ email: userData.user_email, password: userData.password, email_confirm: true });
      if (authError) return { data: null, error: authError.message };
      if (!authData.user) return { data: null, error: 'Failed to create auth user' };
      const { data: user, error: userError } = await supabase.from('users').insert([{ user_id: authData.user.id, user_name: userData.user_name, user_email: userData.user_email, user_phone: userData.user_phone, role: userData.role, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]).select().single();
      if (userError) {
        await supabase.auth.admin.deleteUser(authData.user.id);
        return { data: null, error: userError.message };
      }
      return { data: user, error: null };
    } catch (error: unknown) {
      if (error instanceof Error) return { data: null, error: error.message };
      return { data: null, error: 'An unknown error occurred' };
    }
  }

  static async updateUser(userId: string, userData: UpdateUserData) {
    try {
      const { data: user, error } = await supabase.from('users').update({ ...userData, updated_at: new Date().toISOString() }).eq('user_id', userId).select().single();
      if (error) return { data: null, error: error.message };
      return { data: user, error: null };
    } catch (error: unknown) {
      if (error instanceof Error) return { data: null, error: error.message };
      return { data: null, error: 'An unknown error occurred' };
    }
  }

  static async deleteUser(userId: string) {
    try {
      const { count: kosCount } = await supabase.from('kos').select('*', { count: 'exact', head: true }).eq('pemilik_id', userId);
      if (kosCount && kosCount > 0) return { data: null, error: `Cannot delete user. User has ${kosCount} kos properties. Delete kos first.` };
      const { error: userError } = await supabase.from('users').delete().eq('user_id', userId);
      if (userError) return { data: null, error: userError.message };
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) console.warn('Warning: User record deleted but auth cleanup failed:', authError);
      return { data: true, error: null };
    } catch (error: unknown) {
      if (error instanceof Error) return { data: null, error: error.message };
      return { data: null, error: 'An unknown error occurred' };
    }
  }

  static async resetUserPassword(userId: string, newPassword: string) {
    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, { password: newPassword });
      if (error) return { data: null, error: error.message };
      return { data: true, error: null };
    } catch (error: unknown) {
      if (error instanceof Error) return { data: null, error: error.message };
      return { data: null, error: 'An unknown error occurred' };
    }
  }

  static async toggleUserStatus(userId: string, disable: boolean) {
    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, { ban_duration: disable ? '876000h' : 'none' });
      if (error) return { data: null, error: error.message };
      return { data: true, error: null };
    } catch (error: unknown) {
      if (error instanceof Error) return { data: null, error: error.message };
      return { data: null, error: 'An unknown error occurred' };
    }
  }
}