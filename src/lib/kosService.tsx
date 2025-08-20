import { supabase } from './supabase';
import { Kos, KosFormData, HargaKos, Fasilitas } from '@/types/database';

export class KosService {
  // Get all kos by owner - FIXED FASILITAS QUERY
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
          kos_fasilitas(
            fasilitas(
              fasilitas_id,
              fasilitas_nama
            )
          )
        `)
        .eq('pemilik_id', pemilikId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching kos by owner:', error);
        return { data: null, error: error.message };
      }

      // TRANSFORM DATA - Same as AdminService
      const transformedData = data?.map(kos => ({
        ...kos,
        fasilitas: kos.kos_fasilitas?.map((kf: any) => kf.fasilitas) || []
      })) || [];

      console.log('✅ Fetched kos data:', transformedData);
      console.log('🔍 Fasilitas sample:', transformedData[0]?.fasilitas);
      return { data: transformedData, error: null };
    } catch (error: any) {
      console.error('💥 Exception in getKosByOwner:', error);
      return { data: null, error: error.message };
    }
  }

  // Get single kos by ID - FIXED FASILITAS QUERY
  static async getKosById(kosId: string): Promise<{ data: Kos | null; error: string | null }> {
    try {
      console.log('🔍 Fetching kos by ID:', kosId);

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

      // TRANSFORM DATA - Same as AdminService
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

  // Create new kos - NO CHANGE
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

  // Update kos - NO CHANGE
  static async updateKos(kosId: string, formData: Partial<KosFormData>): Promise<{ data: Kos | null; error: string | null }> {
    try {
      // First, get current kos status
      const { data: currentKos, error: fetchError } = await supabase
        .from('kos')
        .select('status')
        .eq('kos_id', kosId)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching current kos:', fetchError);
        return { data: null, error: fetchError.message };
      }

      const updateData: { [key: string]: any } = {
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

      // AUTO STATUS CHANGE: If current status is rejected, change to pending when updating
      if (currentKos.status === 'rejected') {
        updateData.status = 'pending';
        console.log('📝 Status changed from rejected to pending due to edit');
      }

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

  // Delete kos - NO CHANGE
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

  // Update kos availability - NO CHANGE
  static async updateKosAvailability(kosId: string, isAvailable: boolean) {
    try {
      console.log('🔄 Updating kos availability:', { kosId, isAvailable });

      const { data, error } = await supabase
        .from('kos')
        .update({ kos_avail: isAvailable })
        .eq('kos_id', kosId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating kos availability:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Kos availability updated:', data);
      return { success: true, data, error: null };
    } catch (error: any) {
      console.error('💥 Exception in updateKosAvailability:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Get kos statistics - NO CHANGE
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

  // Get all fasilitas - NO CHANGE
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

  // Upload kos images - NO CHANGE
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

  // Delete kos image - NO CHANGE
  static async deleteKosImage(imageId: string, imageUrl: string): Promise<{ success: boolean; error: string | null }> {
    try {
      console.log('🗑️ Starting delete process...');
      console.log('📷 Image ID:', imageId);
      console.log('🔗 Image URL:', imageUrl);

      // Extract filename from URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1]; // Get last part (filename)
      
      console.log('📁 Extracted filename:', fileName);

      if (!fileName) {
        return { success: false, error: 'Invalid image URL - cannot extract filename' };
      }

      // Delete from database first
      console.log('💾 Deleting from database...');
      const { error: dbError } = await supabase
        .from('kos_images')
        .delete()
        .eq('id', imageId);

      if (dbError) {
        console.error('❌ Database delete error:', dbError);
        return { success: false, error: `Database error: ${dbError.message}` };
      }

      console.log('✅ Deleted from database successfully');

      // Delete from storage
      console.log('🗄️ Deleting from storage...');
      const { error: storageError } = await supabase.storage
        .from('kos-images')
        .remove([fileName]);

      if (storageError) {
        console.error('⚠️ Storage delete error (but DB delete succeeded):', storageError);
        // Don't return error here since DB delete succeeded
        // Storage error is not critical
      } else {
        console.log('✅ Deleted from storage successfully');
      }

      console.log('🎉 Image deleted completely!');
      return { success: true, error: null };
    } catch (error: any) {
      console.error('💥 Exception in deleteKosImage:', error);
      return { success: false, error: error.message };
    }
  }

  // Get images for a kos - NO CHANGE
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