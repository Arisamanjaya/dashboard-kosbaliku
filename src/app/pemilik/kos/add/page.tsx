'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useFasilitas } from '@/hooks/useKos';
import { KosService } from '@/lib/kosService';
import { KosFormData, HargaKos, LocationData } from '@/types/database';
import LocationPicker from '@/components/maps/LocationPicker';

export default function AddKosPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { fasilitas, loading: fasilitasLoading } = useFasilitas();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]); // Store selected images

  // NEW - Location state
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const [formData, setFormData] = useState<KosFormData>({
    kos_nama: '',
    kos_alamat: '',
    kos_lokasi: '',
    kos_lng: undefined,
    kos_lat: undefined,
    kos_tipe: 'Campur',
    kos_premium: false,
    kos_rule: '',
    kos_note: '',
    kos_avail: true,
    fasilitas_ids: [],
    harga: [
      { harga_id: '', kos_id: '', tipe_durasi: 'Bulanan', harga: 0 }
    ],
  });

  // Format number to Indonesian currency display
  const formatCurrency = (value: number): string => {
    if (!value) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Parse currency display back to number
  const parseCurrency = (value: string): number => {
    return parseInt(value.replace(/\./g, '')) || 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // NEW - Handle location selection
  const handleLocationSelect = (location: LocationData) => {
    setSelectedLocation(location);
    setFormData(prev => ({
      ...prev,
      kos_lng: location.lng,
      kos_lat: location.lat,
    }));
    
    // Optional: Update address if user wants
    if (location.address && !formData.kos_alamat.trim()) {
      setFormData(prev => ({
        ...prev,
        kos_alamat: location.address || '',
      }));
    }
  };

  // NEW - Clear location
  const handleClearLocation = () => {
    setSelectedLocation(null);
    setFormData(prev => ({
      ...prev,
      kos_lng: undefined,
      kos_lat: undefined,
    }));
    setShowLocationPicker(false);
  };

  // Fasilitas handlers
  const handleFasilitasChange = (fasilitasId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      fasilitas_ids: checked
        ? [...prev.fasilitas_ids, fasilitasId]
        : prev.fasilitas_ids.filter(id => id !== fasilitasId)
    }));
  };

  // Harga handlers
  const handleHargaChange = (index: number, field: keyof HargaKos, value: any) => {
    setFormData(prev => ({
      ...prev,
      harga: prev.harga.map((h, i) => 
        i === index ? { ...h, [field]: value } : h
      )
    }));
  };

  // Handle currency input for price
  const handleHargaCurrencyChange = (index: number, displayValue: string) => {
    const numericValue = parseCurrency(displayValue);
    handleHargaChange(index, 'harga', numericValue);
  };

  const addHargaRow = () => {
    setFormData(prev => ({
      ...prev,
      harga: [...prev.harga, { harga_id: '', kos_id: '', tipe_durasi: 'Bulanan', harga: 0 }]
    }));
  };

  const removeHargaRow = (index: number) => {
    setFormData(prev => ({
      ...prev,
      harga: prev.harga.filter((_, i) => i !== index)
    }));
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Validate file types
      const validFiles = files.filter(file => file.type.startsWith('image/'));
      
      if (validFiles.length !== files.length) {
        alert('Hanya file gambar yang diperbolehkan');
        return;
      }

      // Limit to 10 images
      if (selectedImages.length + validFiles.length > 10) {
        alert(`Maksimal 10 gambar. Anda sudah memilih ${selectedImages.length} gambar.`);
        return;
      }

      setSelectedImages(prev => [...prev, ...validFiles]);
    }
  };

  // Remove selected image
  const removeSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Handle drop for drag & drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files);
      const validFiles = files.filter(file => file.type.startsWith('image/'));
      
      if (validFiles.length !== files.length) {
        alert('Hanya file gambar yang diperbolehkan');
        return;
      }

      if (selectedImages.length + validFiles.length > 10) {
        alert(`Maksimal 10 gambar. Anda sudah memilih ${selectedImages.length} gambar.`);
        return;
      }

      setSelectedImages(prev => [...prev, ...validFiles]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('User not authenticated');
      return;
    }

    // Validation
    if (!formData.kos_nama.trim()) {
      setError('Nama kos harus diisi');
      return;
    }

    if (!formData.kos_alamat.trim()) {
      setError('Alamat kos harus diisi');
      return;
    }

    if (!formData.kos_lokasi.trim()) {
      setError('Lokasi kos harus diisi');
      return;
    }

    // Validate harga
    const validHarga = formData.harga.filter(h => h.harga > 0);
    if (validHarga.length === 0) {
      setError('Minimal satu harga harus diisi');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🚀 Submitting kos data:', formData);
      console.log('📸 With images:', selectedImages.length, 'files');
      
      // Step 1: Create kos
      const { data, error } = await KosService.createKos(formData, user.user_id);
      
      if (error) {
        console.error('❌ Create error:', error);
        setError(error);
        return;
      }

      console.log('✅ Kos created:', data);
      
      // Step 2: Upload images if any selected
      if (selectedImages.length > 0 && data) {
        console.log('📸 Uploading images...');
        const { data: imageData, error: imageError } = await KosService.uploadKosImages(
          data.kos_id, 
          selectedImages, 
          user.user_id
        );
        
        if (imageError) {
          console.error('⚠️ Image upload error:', imageError);
          alert(`Kos berhasil dibuat, tapi ada error saat upload gambar: ${imageError}`);
        } else {
          console.log('✅ Images uploaded successfully');
          alert('Kos dan gambar berhasil dibuat!');
        }
      } else {
        alert('Kos berhasil dibuat!');
      }
      
      // Redirect to kos list
      router.push('/pemilik/kos');
      
    } catch (err: any) {
      console.error('💥 Submit exception:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Tambah Kos Baru
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Daftarkan properti kos baru Anda
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Informasi Dasar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nama Kos *
              </label>
              <input
                type="text"
                name="kos_nama"
                value={formData.kos_nama}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Masukkan nama kos"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipe Kos *
              </label>
              <select
                name="kos_tipe"
                value={formData.kos_tipe}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="Putra">Putra</option>
                <option value="Putri">Putri</option>
                <option value="Campur">Campur</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Alamat Lengkap *
              </label>
              <textarea
                name="kos_alamat"
                value={formData.kos_alamat}
                onChange={handleInputChange}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Masukkan alamat lengkap kos"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Lokasi *
              </label>
              <input
                type="text"
                name="kos_lokasi"
                value={formData.kos_lokasi}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Contoh: Denpasar, Jimbaran, Kuta, Canggu"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="kos_premium"
                id="kos_premium"
                checked={formData.kos_premium}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="kos_premium" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Kos Premium
              </label>
            </div>
          </div>
        </div>

        {/* Location Picker Section */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Lokasi di Peta
          </h2>
          
          {selectedLocation ? (
            <div className="space-y-4">
              {/* Current Location Display */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">
                      📍 Lokasi Terpilih
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300 mb-1">
                      <strong>Koordinat:</strong> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                    </p>
                    {selectedLocation.address && (
                      <p className="text-sm text-green-700 dark:text-green-300">
                        <strong>Alamat:</strong> {selectedLocation.address}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowLocationPicker(!showLocationPicker)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      {showLocationPicker ? 'Tutup Peta' : 'Edit Lokasi'}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearLocation}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>

              {/* Location Picker */}
              {showLocationPicker && (
                <LocationPicker
                  onLocationSelect={handleLocationSelect}
                  initialLocation={selectedLocation}
                  height="500px"
                />
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* No Location State */}
              <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6 text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Pilih Lokasi di Peta
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Tentukan lokasi kos di peta untuk memudahkan calon penyewa menemukan kos Anda
                </p>
                <button
                  type="button"
                  onClick={() => setShowLocationPicker(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  Pilih Lokasi
                </button>
              </div>

              {/* Show Location Picker */}
              {showLocationPicker && (
                <LocationPicker
                  onLocationSelect={handleLocationSelect}
                  height="500px"
                />
              )}
            </div>
          )}

          {/* Manual Coordinate Input */}
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Atau Masukkan Koordinat Manual (Opsional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  name="kos_lat"
                  value={formData.kos_lat || ''}
                  onChange={handleInputChange}
                  step="any"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="Contoh: -6.200000"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  name="kos_lng"
                  value={formData.kos_lng || ''}
                  onChange={handleInputChange}
                  step="any"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                  placeholder="Contoh: 106.816666"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ✅ PRICING SECTION */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Harga Kos
          </h2>
          <div className="space-y-4">
            {formData.harga.map((harga, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tipe Durasi
                    </label>
                    <select
                      value={harga.tipe_durasi}
                      onChange={(e) => handleHargaChange(index, 'tipe_durasi', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                    >
                      <option value="Harian">Harian</option>
                      <option value="Mingguan">Mingguan</option>
                      <option value="Bulanan">Bulanan</option>
                      <option value="Tahunan">Tahunan</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Harga (Rp)
                    </label>
                    <input
                      type="text"
                      value={formatCurrency(harga.harga)}
                      onChange={(e) => handleHargaCurrencyChange(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    {formData.harga.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeHargaRow(index)}
                        className="w-full px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addHargaRow}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Tambah Harga
            </button>
          </div>
        </div>

        {/* ✅ IMAGES SECTION */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Foto Kos
          </h2>
          
          {/* Image Upload Area */}
          <div 
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={(e) => e.preventDefault()}
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Upload Foto Kos
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Drag & drop atau klik untuk memilih foto (Maksimal 10 foto)
              </p>
            </label>
          </div>

          {/* Selected Images Preview */}
          {selectedImages.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Foto Terpilih ({selectedImages.length}/10)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {selectedImages.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                    />
                    <button
                      type="button"
                      onClick={() => removeSelectedImage(index)}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                      {file.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ✅ FASILITAS SECTION */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Fasilitas Kos
          </h2>
          
          {fasilitasLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Memuat fasilitas...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {fasilitas.map((fas) => (
                <div key={fas.fasilitas_id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`fasilitas-${fas.fasilitas_id}`}
                    checked={formData.fasilitas_ids.includes(fas.fasilitas_id)}
                    onChange={(e) => handleFasilitasChange(fas.fasilitas_id, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label 
                    htmlFor={`fasilitas-${fas.fasilitas_id}`} 
                    className="ml-2 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    {fas.fasilitas_nama}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rules & Notes */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Aturan & Catatan
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Aturan Kos
              </label>
              <textarea
                name="kos_rule"
                value={formData.kos_rule}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Contoh: Jam malam 22:00, Tidak boleh membawa tamu menginap, dll."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Catatan Tambahan
              </label>
              <textarea
                name="kos_note"
                value={formData.kos_note}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Catatan atau informasi tambahan tentang kos"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="kos_avail"
                id="kos_avail"
                checked={formData.kos_avail}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="kos_avail" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Kos tersedia untuk dihuni
              </label>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : 'Simpan Kos'}
          </button>
        </div>
      </form>
    </div>
  );
}