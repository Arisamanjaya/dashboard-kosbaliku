'use client';
import React, { useState, useRef } from 'react';
import { KosService } from '@/lib/kosService';
import { useAuth } from '@/context/AuthContext';

interface KosImageUploadProps {
  kosId: string;
  existingImages?: any[];
  onImagesUpdated?: () => void;
  maxImages?: number;
}

export default function KosImageUpload({ 
  kosId, 
  existingImages = [], 
  onImagesUpdated,
  maxImages = 10 
}: KosImageUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    if (!user) {
      alert('User not authenticated');
      return;
    }

    const fileArray = Array.from(files);
    
    // Validate file types
    const validFiles = fileArray.filter(file => 
      file.type.startsWith('image/')
    );

    if (validFiles.length === 0) {
      alert('Harap pilih file gambar yang valid');
      return;
    }

    // Check max images limit
    if (existingImages.length + validFiles.length > maxImages) {
      alert(`Maksimal ${maxImages} gambar. Anda sudah memiliki ${existingImages.length} gambar.`);
      return;
    }

    setUploading(true);
    
    try {
      console.log('🚀 Starting upload for user:', user.user_id);
      const { data, error } = await KosService.uploadKosImages(kosId, validFiles, user.user_id);
      
      if (error) {
        alert(`Error uploading images: ${error}`);
      } else {
        alert('Gambar berhasil diupload!');
        onImagesUpdated?.();
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus gambar ini?')) {
      return;
    }

    setDeleting(imageId);

    try {
      console.log('🗑️ Deleting image:', imageId, imageUrl);
      const { success, error } = await KosService.deleteKosImage(imageId, imageUrl);
      
      if (error) {
        console.error('❌ Delete error:', error);
        alert(`Error deleting image: ${error}`);
      } else if (success) {
        console.log('✅ Image deleted successfully');
        alert('Gambar berhasil dihapus!');
        onImagesUpdated?.();
      }
    } catch (err: any) {
      console.error('💥 Delete exception:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600'
        }`}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />
        
        <div className="space-y-2">
          <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
          </svg>
          
          <div>
            <p className="text-gray-600 dark:text-gray-400">
              Drag & drop gambar di sini, atau{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-700 font-medium"
                disabled={uploading}
              >
                browse files
              </button>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              PNG, JPG, JPEG up to 10MB each. Max {maxImages} images.
            </p>
          </div>
        </div>
      </div>

      {/* Upload Status */}
      {uploading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Uploading images...</span>
        </div>
      )}

      {/* Existing Images */}
      {existingImages.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
            Gambar Kos ({existingImages.length}/{maxImages})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {existingImages.map((image, index) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.url_foto}
                  alt={`Kos image ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                
                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteImage(image.id, image.url_foto)}
                  disabled={deleting === image.id}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 disabled:opacity-50"
                  title="Hapus gambar"
                >
                  {deleting === image.id ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
                
                {/* Image Index */}
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>

                {/* Deleting Overlay */}
                {deleting === image.id && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                    <div className="text-white text-sm">Menghapus...</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {existingImages.length === 0 && !uploading && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
          </svg>
          <p>Belum ada gambar. Upload gambar pertama!</p>
        </div>
      )}
    </div>
  );
}