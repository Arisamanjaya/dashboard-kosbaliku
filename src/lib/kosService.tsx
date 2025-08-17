import { supabase } from './supabase';
import { Kos, KosFormData, HargaKos, Fasilitas } from '@/types/database';

export class KosService {
  // Get all kos by owner - FIXED VERSION
  static async getKosByOwner(pemilikId: string): Promise<{ data: Kos[] | null; error: string | null }> {
    try {
      console.log('🔍 Fetching kos for pemilik:', pemilikId);

      const { data, error } = await supabase
        .from('kos')
        .select(`
          *,
          pemilik:users!kos_pemilik_id_fkey(
            user_id,
            user_name,
            user_email
          ),
          harga:harga_kos(*),
          images:kos_images(*),
          fasilitas:kos_fasilitas(
            fasilitas:fasilitas(*)
          )
        `)
        .eq('pemilik_id', pemilikId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching kos by owner:', error);
        return { data: null, error: error.message };
      }

      console.log('✅ Fetched kos data:', data);
      return { data, error: null };
    } catch (error: any) {
      console.error('💥 Exception in getKosByOwner:', error);
      return { data: null, error: error.message };
    }
  }

  // Get single kos by ID
  static async getKosById(kosId: string): Promise<{ data: Kos | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('kos')
        .select(`
          *,
          pemilik:users!kos_pemilik_id_fkey(
            user_id,
            user_name,
            user_email
          ),
          harga:harga_kos(*),
          images:kos_images(*),
          fasilitas:kos_fasilitas(
            fasilitas:fasilitas(*)
          )
        `)
        .eq('kos_id', kosId)
        .single();

      if (error) {
        console.error('Error fetching kos by ID:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Exception in getKosById:', error);
      return { data: null, error: error.message };
    }
  }

  // Create new kos
  static async createKos(formData: KosFormData, pemilikId: string): Promise<{ data: Kos | null; error: string | null }> {
    try {
      console.log('🔍 Creating kos with data:', formData);
      console.log('👤 Pemilik ID:', pemilikId);

      // Insert kos data - CLEANED DATA
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
        // REMOVE created_at - let database handle it
      };

      console.log('📤 Sending kos data:', kosData);

      const { data: kosResult, error: kosError } = await supabase
        .from('kos')
        .insert([kosData])
        .select()
        .single();

      if (kosError) {
        console.error('❌ Error creating kos:', kosError);
        return { data: null, error: kosError.message };
      }

      console.log('✅ Kos created successfully:', kosResult);
      const kosId = kosResult.kos_id;

      // Insert fasilitas relationships
      if (formData.fasilitas_ids && formData.fasilitas_ids.length > 0) {
        console.log('📋 Adding fasilitas:', formData.fasilitas_ids);
        
        const fasilitasData = formData.fasilitas_ids.map(fasilitasId => ({
          kos_id: kosId,
          fasilitas_id: fasilitasId,
        }));

        const { error: fasilitasError } = await supabase
          .from('kos_fasilitas')
          .insert(fasilitasData);

        if (fasilitasError) {
          console.error('⚠️ Error inserting fasilitas:', fasilitasError);
          // Continue anyway
        } else {
          console.log('✅ Fasilitas added successfully');
        }
      }

      // Insert harga data
      if (formData.harga && formData.harga.length > 0) {
        console.log('💰 Adding harga:', formData.harga);
        
        const hargaData = formData.harga
          .filter(h => h.harga > 0) // Only add valid prices
          .map(h => ({
            kos_id: kosId,
            tipe_durasi: h.tipe_durasi,
            harga: h.harga,
          }));

        if (hargaData.length > 0) {
          const { error: hargaError } = await supabase
            .from('harga_kos')
            .insert(hargaData);

          if (hargaError) {
            console.error('⚠️ Error inserting harga:', hargaError);
            // Continue anyway
          } else {
            console.log('✅ Harga added successfully');
          }
        }
      }

      return { data: kosResult, error: null };
    } catch (error: any) {
      console.error('💥 Exception in createKos:', error);
      return { data: null, error: error.message };
    }
  }

  // Update kos
  static async updateKos(kosId: string, formData: Partial<KosFormData>): Promise<{ data: Kos | null; error: string | null }> {
    try {
      const updateData = {
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

      const { data, error } = await supabase
        .from('kos')
        .update(updateData)
        .eq('kos_id', kosId)
        .select()
        .single();

      if (error) {
        console.error('Error updating kos:', error);
        return { data: null, error: error.message };
      }

      // Update fasilitas if provided
      if (formData.fasilitas_ids) {
        // Delete existing fasilitas
        await supabase
          .from('kos_fasilitas')
          .delete()
          .eq('kos_id', kosId);

        // Insert new fasilitas
        if (formData.fasilitas_ids.length > 0) {
          const fasilitasData = formData.fasilitas_ids.map(fasilitasId => ({
            kos_id: kosId,
            fasilitas_id: fasilitasId,
          }));

          await supabase
            .from('kos_fasilitas')
            .insert(fasilitasData);
        }
      }

      // Update harga if provided
      if (formData.harga) {
        // Delete existing harga
        await supabase
          .from('harga_kos')
          .delete()
          .eq('kos_id', kosId);

        // Insert new harga
        if (formData.harga.length > 0) {
          const hargaData = formData.harga.map(h => ({
            kos_id: kosId,
            tipe_durasi: h.tipe_durasi,
            harga: h.harga,
          }));

          await supabase
            .from('harga_kos')
            .insert(hargaData);
        }
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Exception in updateKos:', error);
      return { data: null, error: error.message };
    }
  }

  // Delete kos
  static async deleteKos(kosId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      // Delete related data first
      await supabase.from('kos_fasilitas').delete().eq('kos_id', kosId);
      await supabase.from('harga_kos').delete().eq('kos_id', kosId);
      await supabase.from('kos_images').delete().eq('kos_id', kosId);

      // Delete kos
      const { error } = await supabase
        .from('kos')
        .delete()
        .eq('kos_id', kosId);

      if (error) {
        console.error('Error deleting kos:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error: any) {
      console.error('Exception in deleteKos:', error);
      return { success: false, error: error.message };
    }
  }

  // Update kos status
  static async updateKosStatus(kosId: string, status: 'active' | 'inactive' | 'pending'): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('kos')
        .update({ status })
        .eq('kos_id', kosId);

      if (error) {
        console.error('Error updating kos status:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (error: any) {
      console.error('Exception in updateKosStatus:', error);
      return { success: false, error: error.message };
    }
  }

  // Get kos statistics for owner
  static async getKosStats(pemilikId: string) {
    try {
      const { data, error } = await supabase
        .from('kos')
        .select('status')
        .eq('pemilik_id', pemilikId);

      if (error) {
        console.error('Error fetching kos stats:', error);
        return { stats: null, error: error.message };
      }

      const stats = {
        total: data.length,
        active: data.filter(k => k.status === 'active').length,
        pending: data.filter(k => k.status === 'pending').length,
        inactive: data.filter(k => k.status === 'inactive').length,
      };

      return { stats, error: null };
    } catch (error: any) {
      console.error('Exception in getKosStats:', error);
      return { stats: null, error: error.message };
    }
  }

  // Get all fasilitas
  static async getAllFasilitas(): Promise<{ data: Fasilitas[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('fasilitas')
        .select('*')
        .order('fasilitas_nama');

      if (error) {
        console.error('Error fetching fasilitas:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Exception in getAllFasilitas:', error);
      return { data: null, error: error.message };
    }
  }

  // Upload kos image
  static async uploadKosImages(kosId: string, files: File[], userId: string): Promise<{ data: string[] | null; error: string | null }> {
    try {
      console.log('📸 Uploading images for kos:', kosId);
      console.log('👤 User ID:', userId);
      
      const uploadPromises = files.map(async (file, index) => {
        const fileExt = file.name.split('.').pop();
        // Simplified naming without user folder
        const fileName = `${kosId}_${Date.now()}_${index}.${fileExt}`;
        
        console.log('📁 Uploading file:', fileName);
        
        const { data, error } = await supabase.storage
          .from('kos-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('❌ Error uploading file:', error);
          throw error;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('kos-images')
          .getPublicUrl(fileName);

        console.log('✅ File uploaded:', urlData.publicUrl);
        return urlData.publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      
      // Save URLs to database
      const imageData = uploadedUrls.map(url => ({
        kos_id: kosId,
        url_foto: url,
      }));

      console.log('💾 Saving to database:', imageData);

      const { data: dbData, error: dbError } = await supabase
        .from('kos_images')
        .insert(imageData)
        .select();

      if (dbError) {
        console.error('❌ Error saving image URLs to database:', dbError);
        // Try to cleanup uploaded files
        for (const url of uploadedUrls) {
          const fileName = url.split('/').pop();
          if (fileName) {
            supabase.storage.from('kos-images').remove([fileName]);
          }
        }
        return { data: null, error: dbError.message };
      }

      console.log('✅ Images saved to database:', dbData);
      return { data: uploadedUrls, error: null };
    } catch (error: any) {
      console.error('💥 Exception in uploadKosImages:', error);
      return { data: null, error: error.message };
    }
  }

  // Delete kos image
  static async deleteKosImage(imageId: string, imageUrl: string): Promise<{ success: boolean; error: string | null }> {
    try {
      // Extract filename from URL
      const fileName = imageUrl.split('/').pop();
      
      if (!fileName) {
        return { success: false, error: 'Invalid image URL' };
      }

      console.log('🗑️ Deleting file:', fileName);

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('kos-images')
        .remove([fileName]);

      if (storageError) {
        console.error('⚠️ Error deleting from storage:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('kos_images')
        .delete()
        .eq('id', imageId);

      if (dbError) {
        console.error('❌ Error deleting from database:', dbError);
        return { success: false, error: dbError.message };
      }

      console.log('✅ Image deleted successfully');
      return { success: true, error: null };
    } catch (error: any) {
      console.error('💥 Exception in deleteKosImage:', error);
      return { success: false, error: error.message };
    }
  }

  // Get images for a kos
  static async getKosImages(kosId: string): Promise<{ data: any[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('kos_images')
        .select('*')
        .eq('kos_id', kosId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching kos images:', error);
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (error: any) {
      console.error('💥 Exception in getKosImages:', error);
      return { data: null, error: error.message };
    }
  }
}