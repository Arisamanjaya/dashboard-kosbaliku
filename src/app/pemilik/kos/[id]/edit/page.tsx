'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useFasilitas } from '@/hooks/useKos';
import { KosService } from '@/lib/kosService';
import { Kos, KosFormData, HargaKos, LocationData } from '@/types/database';
import KosImageUpload from '@/components/kos/KosImageUpload';
import LocationPicker from '@/components/maps/LocationPicker';

export default function EditKosPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { fasilitas, loading: fasilitasLoading } = useFasilitas();
  
  const [kos, setKos] = useState<Kos | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [images, setImages] = useState<any[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);

  // NEW - Location state
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const kosId = params.id as string;

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
    harga: [],
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

  useEffect(() => {
    if (kosId) {
      fetchKosDetail();
    }
  }, [kosId]);

  const fetchKosDetail = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error } = await KosService.getKosById(kosId);
      
      if (error) {
        setError(error);
      } else if (data) {
        setKos(data);
        
        // Populate form data
        setFormData({
          kos_nama: data.kos_nama,
          kos_alamat: data.kos_alamat,
          kos_lokasi: data.kos_lokasi,
          kos_lng: data.kos_lng ?? undefined,
          kos_lat: data.kos_lat ?? undefined,
          kos_tipe: data.kos_tipe,
          kos_premium: data.kos_premium,
          kos_rule: data.kos_rule,
          kos_note: data.kos_note,
          kos_avail: data.kos_avail,
          fasilitas_ids: data.fasilitas?.map((f: any) => f.fasilitas.fasilitas_id) || [],
          harga: data.harga || [],
        });

        // NEW - Set initial location if exists
        if (data.kos_lat && data.kos_lng) {
          setSelectedLocation({
            lat: data.kos_lat,
            lng: data.kos_lng,
            address: data.kos_alamat,
          });
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || undefined }));
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

  const handleFasilitasChange = (fasilitasId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      fasilitas_ids: checked
        ? [...prev.fasilitas_ids, fasilitasId]
        : prev.fasilitas_ids.filter(id => id !== fasilitasId)
    }));
  };

  const handleHargaChange = (index: number, field: keyof HargaKos, value: any) => {
    setFormData(prev => ({
      ...prev,
      harga: prev.harga.map((h, i) => 
        i === index ? { ...h, [field]: value } : h
      )
    }));
  };

  // Handle currency input for price - SAME AS ADD PAGE
  const handleHargaCurrencyChange = (index: number, displayValue: string) => {
    const numericValue = parseCurrency(displayValue);
    handleHargaChange(index, 'harga', numericValue);
  };

  const addHargaRow = () => {
    setFormData(prev => ({
      ...prev,
      harga: [...prev.harga, { harga_id: '', kos_id: kosId, tipe_durasi: 'Bulanan', harga: 0 }]
    }));
  };

  const removeHargaRow = (index: number) => {
    setFormData(prev => ({
      ...prev,
      harga: prev.harga.filter((_, i) => i !== index)
    }));
  };

  // Add function to fetch images
  const fetchImages = async () => {
    setImagesLoading(true);
    try {
      const { data, error } = await KosService.getKosImages(kosId);
      if (data) {
        setImages(data);
      }
    } catch (err) {
      console.error('Error fetching images:', err);
    } finally {
      setImagesLoading(false);
    }
  };

  // Add useEffect to fetch images
  useEffect(() => {
    if (kosId) {
      fetchImages();
    }
  }, [kosId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !kos) {
      setError('Data tidak valid');
      return;
    }

    // Validation - SAME AS ADD PAGE
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

    setSaving(true);
    setError('');

    try {
      const { data, error } = await KosService.updateKos(kosId, formData);
      
      if (error) {
        setError(error);
      } else {
        alert('Kos berhasil diperbarui!');
        router.push('/pemilik/kos');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Memuat data kos...</span>
      </div>
    );
  }

  if (error && !kos) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Edit Kos: {kos?.kos_nama}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Perbarui informasi kos Anda
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

        {/* NEW - Location Picker Section */}
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

          {/* Manual Coordinate Input - Updated */}
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

        {/* Pricing - WITH CURRENCY FORMAT LIKE ADD PAGE */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Harga Sewa
          </h2>
          <div className="space-y-3">
            {formData.harga.map((harga, index) => (
              <div key={index} className="flex items-center gap-3">
                <select
                  value={harga.tipe_durasi}
                  onChange={(e) => handleHargaChange(index, 'tipe_durasi', e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="Mingguan">Mingguan</option>
                  <option value="Bulanan">Bulanan</option>
                  <option value="Tahunan">Tahunan</option>
                </select>
                
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">Rp</span>
                  </div>
                  <input
                    type="text"
                    value={formatCurrency(harga.harga)}
                    onChange={(e) => {
                      // Only allow numbers and dots
                      const value = e.target.value.replace(/[^\d.]/g, '');
                      handleHargaCurrencyChange(index, value);
                    }}
                    placeholder="0"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                {formData.harga.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeHargaRow(index)}
                    className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Hapus
                  </button>
                )}
              </div>
            ))}
            
            <button
              type="button"
              onClick={addHargaRow}
              className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Tambah Harga
            </button>
          </div>
        </div>

        {/* Fasilitas */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Fasilitas
          </h2>
          {fasilitasLoading ? (
            <p className="text-gray-600 dark:text-gray-400">Memuat fasilitas...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {fasilitas.map((item) => (
                <div key={item.fasilitas_id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`fasilitas-${item.fasilitas_id}`}
                    checked={formData.fasilitas_ids.includes(item.fasilitas_id)}
                    onChange={(e) => handleFasilitasChange(item.fasilitas_id, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor={`fasilitas-${item.fasilitas_id}`}
                    className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                  >
                    {item.fasilitas_nama}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Gambar */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Gambar Kos
          </h2>
          {imagesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Memuat gambar...</span>
            </div>
          ) : (
            <KosImageUpload
              kosId={kosId}
              existingImages={images}
              onImagesUpdated={fetchImages}
              maxImages={10}
            />
          )}
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
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  );
}