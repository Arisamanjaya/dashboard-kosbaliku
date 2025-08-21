import { supabase } from './supabase';
import { Kos, KosFormData, Fasilitas, KosImage } from '@/types/database';

// Define a specific type for the data structure from the join query
type KosFasilitasJoin = {
  fasilitas: {
    fasilitas_id: string;
    fasilitas_nama: string;
  } | null;
};

export class KosService {
  static async getKosByOwner(pemilikId: string): Promise<{ data: Kos[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('kos')
        .select(`*, pemilik:users!kos_pemilik_id_fkey(user_id, user_name, user_email), harga:harga_kos(*), images:kos_images(*), kos_fasilitas(fasilitas(fasilitas_id, fasilitas_nama))`)
        .eq('pemilik_id', pemilikId)
        .order('created_at', { ascending: false });

      if (error) return { data: null, error: error.message };

      const transformedData = data?.map(kos => ({
        ...kos,
        fasilitas: kos.kos_fasilitas?.map((kf: KosFasilitasJoin) => kf.fasilitas).filter(Boolean) || []
      })) || [];

      return { data: transformedData, error: null };
    } catch (error: unknown) {
      console.error('💥 Exception in getKosByOwner:', error);
      if (error instanceof Error) return { data: null, error: error.message };
      return { data: null, error: 'An unknown error occurred' };
    }
  }

  static async getKosById(kosId: string): Promise<{ data: Kos | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('kos')
        .select(`*, pemilik:users!kos_pemilik_id_fkey(user_id, user_name, user_email), harga:harga_kos(*), images:kos_images(*), kos_fasilitas(fasilitas(fasilitas_id, fasilitas_nama))`)
        .eq('kos_id', kosId)
        .single();

      if (error) return { data: null, error: error.message };

      const transformedData = {
        ...data,
        fasilitas: data.kos_fasilitas?.map((kf: KosFasilitasJoin) => kf.fasilitas).filter(Boolean) || []
      };

      return { data: transformedData, error: null };
    } catch (error: unknown) {
      console.error('💥 Exception in getKosById:', error);
      if (error instanceof Error) return { data: null, error: error.message };
      return { data: null, error: 'An unknown error occurred' };
    }
  }

  static async createKos(formData: KosFormData, pemilikId: string): Promise<{ data: Kos | null; error: string | null }> {
    try {
      const kosData = {
        kos_nama: formData.kos_nama.trim(),
        kos_alamat: formData.kos_alamat.trim(),
        kos_lokasi: formData.kos_lokasi.trim(),
        kos_lng: formData.kos_lng || null,
        kos_lat: formData.kos_lat || null,
        pemilik_id: pemilikId,
        kos_tipe: formData.kos_tipe,
        kos_premium: formData.kos_premium,
        kos_rule: formData.kos_rule.trim(),
        kos_note: formData.kos_note.trim(),
        kos_avail: formData.kos_avail,
        status: 'pending' as const,
      };

      const { data: kosResult, error: kosError } = await supabase.from('kos').insert([kosData]).select().single();
      if (kosError) return { data: null, error: kosError.message };
      
      const kosId = kosResult.kos_id;

      if (formData.fasilitas_ids?.length > 0) {
        const fasilitasData = formData.fasilitas_ids.map(fasilitasId => ({ kos_id: kosId, fasilitas_id: fasilitasId }));
        const { error: fasilitasError } = await supabase.from('kos_fasilitas').insert(fasilitasData);
        if (fasilitasError) console.error('⚠️ Error inserting fasilitas:', fasilitasError);
      }

      if (formData.harga?.length > 0) {
        const hargaData = formData.harga.filter(h => h.harga > 0).map(h => ({ kos_id: kosId, tipe_durasi: h.tipe_durasi, harga: h.harga }));
        if (hargaData.length > 0) {
          const { error: hargaError } = await supabase.from('harga_kos').insert(hargaData);
          if (hargaError) console.error('⚠️ Error inserting harga:', hargaError);
        }
      }

      return { data: kosResult, error: null };
    } catch (error: unknown) {
      console.error('💥 Exception in createKos:', error);
      if (error instanceof Error) return { data: null, error: error.message };
      return { data: null, error: 'An unknown error occurred' };
    }
  }

  static async updateKos(kosId: string, formData: Partial<KosFormData>): Promise<{ data: Kos | null; error: string | null }> {
    try {
      const { data: currentKos, error: fetchError } = await supabase.from('kos').select('status').eq('kos_id', kosId).single();
      if (fetchError) return { data: null, error: fetchError.message };

      const updateData: Partial<Kos> = {
        kos_nama: formData.kos_nama,
        kos_alamat: formData.kos_alamat,
        kos_lokasi: formData.kos_lokasi,
        kos_lng: formData.kos_lng,
        kos_lat: formData.kos_lat,
        kos_tipe: formData.kos_tipe,
        kos_premium: formData.kos_premium,
        kos_rule: formData.kos_rule,
        kos_note: formData.kos_note,
        kos_avail: formData.kos_avail,
      };

      if (currentKos.status === 'rejected') {
        updateData.status = 'pending';
      }

      const { data, error } = await supabase.from('kos').update(updateData).eq('kos_id', kosId).select().single();
      if (error) return { data: null, error: error.message };

      if (formData.fasilitas_ids) {
        await supabase.from('kos_fasilitas').delete().eq('kos_id', kosId);
        if (formData.fasilitas_ids.length > 0) {
          const fasilitasData = formData.fasilitas_ids.map(fasilitasId => ({ kos_id: kosId, fasilitas_id: fasilitasId }));
          await supabase.from('kos_fasilitas').insert(fasilitasData);
        }
      }

      if (formData.harga) {
        await supabase.from('harga_kos').delete().eq('kos_id', kosId);
        if (formData.harga.length > 0) {
          const hargaData = formData.harga.map(h => ({ kos_id: kosId, tipe_durasi: h.tipe_durasi, harga: h.harga }));
          await supabase.from('harga_kos').insert(hargaData);
        }
      }

      return { data, error: null };
    } catch (error: unknown) {
      console.error('Exception in updateKos:', error);
      if (error instanceof Error) return { data: null, error: error.message };
      return { data: null, error: 'An unknown error occurred' };
    }
  }

  static async deleteKos(kosId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      await supabase.from('kos_fasilitas').delete().eq('kos_id', kosId);
      await supabase.from('harga_kos').delete().eq('kos_id', kosId);
      await supabase.from('kos_images').delete().eq('kos_id', kosId);
      const { error } = await supabase.from('kos').delete().eq('kos_id', kosId);
      if (error) return { success: false, error: error.message };
      return { success: true, error: null };
    } catch (error: unknown) {
      console.error('Exception in deleteKos:', error);
      if (error instanceof Error) return { success: false, error: error.message };
      return { success: false, error: 'An unknown error occurred' };
    }
  }

  static async updateKosAvailability(kosId: string, isAvailable: boolean): Promise<{ success: boolean; data?: Kos; error: string | null }> {
    try {
      const { data, error } = await supabase.from('kos').update({ kos_avail: isAvailable }).eq('kos_id', kosId).select().single();
      if (error) return { success: false, error: error.message };
      return { success: true, data, error: null };
    } catch (error: unknown) {
      console.error('💥 Exception in updateKosAvailability:', error);
      if (error instanceof Error) return { success: false, error: error.message };
      return { success: false, error: 'An unknown error occurred' };
    }
  }
  
  static async getKosStats(pemilikId: string): Promise<{ stats: { total: number; active: number; pending: number; rejected: number; } | null; error: string | null }> {
    try {
      const { data, error } = await supabase.from('kos').select('status').eq('pemilik_id', pemilikId);
      if (error) return { stats: null, error: error.message };
      const stats = {
        total: data.length,
        active: data.filter(k => k.status === 'active').length,
        pending: data.filter(k => k.status === 'pending').length,
        rejected: data.filter(k => k.status === 'rejected').length,
      };
      return { stats, error: null };
    } catch (error: unknown) {
      console.error('Exception in getKosStats:', error);
      if (error instanceof Error) return { stats: null, error: error.message };
      return { stats: null, error: 'An unknown error occurred' };
    }
  }

  static async getAllFasilitas(): Promise<{ data: Fasilitas[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase.from('fasilitas').select('*').order('fasilitas_nama');
      if (error) return { data: null, error: error.message };
      return { data, error: null };
    } catch (error: unknown) {
      console.error('Exception in getAllFasilitas:', error);
      if (error instanceof Error) return { data: null, error: error.message };
      return { data: null, error: 'An unknown error occurred' };
    }
  }
  // eslint-disable-next-line
  static async uploadKosImages(kosId: string, files: File[], _userId: string): Promise<{ data: string[] | null; error: string | null }> {
    try {
      const uploadPromises = files.map(async (file, index) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${kosId}_${Date.now()}_${index}.${fileExt}`;
        const { error } = await supabase.storage.from('kos-images').upload(fileName, file, { cacheControl: '3600', upsert: false });
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('kos-images').getPublicUrl(fileName);
        return urlData.publicUrl;
      });
      const uploadedUrls = await Promise.all(uploadPromises);
      const imageData = uploadedUrls.map(url => ({ kos_id: kosId, url_foto: url }));
      const { error: dbError } = await supabase.from('kos_images').insert(imageData);
      if (dbError) {
        for (const url of uploadedUrls) {
          const fileName = url.split('/').pop();
          if (fileName) supabase.storage.from('kos-images').remove([fileName]);
        }
        return { data: null, error: dbError.message };
      }
      return { data: uploadedUrls, error: null };
    } catch (error: unknown) {
      console.error('💥 Exception in uploadKosImages:', error);
      if (error instanceof Error) return { data: null, error: error.message };
      return { data: null, error: 'An unknown error occurred' };
    }
  }

  static async deleteKosImage(imageId: string, imageUrl: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      if (!fileName) return { success: false, error: 'Invalid image URL' };
      const { error: dbError } = await supabase.from('kos_images').delete().eq('id', imageId);
      if (dbError) return { success: false, error: `Database error: ${dbError.message}` };
      const { error: storageError } = await supabase.storage.from('kos-images').remove([fileName]);
      if (storageError) console.error('⚠️ Storage delete error:', storageError);
      return { success: true, error: null };
    } catch (error: unknown) {
      console.error('💥 Exception in deleteKosImage:', error);
      if (error instanceof Error) return { success: false, error: error.message };
      return { success: false, error: 'An unknown error occurred' };
    }
  }

  static async getKosImages(kosId: string): Promise<{ data: KosImage[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase.from('kos_images').select('*').eq('kos_id', kosId).order('created_at', { ascending: true });
      if (error) return { data: null, error: error.message };
      return { data: data || [], error: null };
    } catch (error: unknown) {
      console.error('💥 Exception in getKosImages:', error);
      if (error instanceof Error) return { data: null, error: error.message };
      return { data: null, error: 'An unknown error occurred' };
    }
  }
}