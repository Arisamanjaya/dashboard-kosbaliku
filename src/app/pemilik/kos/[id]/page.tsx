'use client';
import React, { useState, useEffect, useCallback } from 'react'; // 1. Import useCallback
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image'; // 2. Import Next.js Image component
import { useAuth } from '@/context/AuthContext';
import { KosService } from '@/lib/kosService';
import { Kos, HargaKos } from '@/types/database'; // 3. Import HargaKos type
import MapDisplay from '@/components/maps/MapDisplay';

export default function KosDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [kos, setKos] = useState<Kos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const kosId = params.id as string;

  // 4. Wrap fetch function in useCallback for stable reference
  const fetchKosDetail = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchError } = await KosService.getKosById(kosId);
      
      if (fetchError) {
        setError(fetchError);
      } else {
        setKos(data);
      }
    } catch (err: unknown) { // 5. Use 'unknown' for type-safe error handling
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, [kosId]);

  // 6. Add fetchKosDetail to the dependency array
  useEffect(() => {
    if (kosId) {
      fetchKosDetail();
    }
  }, [kosId, fetchKosDetail]);

  const handleAvailabilityChange = async () => {
    if (!kos) return;

    setAvailabilityLoading(true);
    try {
      const { success, error: updateError } = await KosService.updateKosAvailability(
        kos.kos_id, 
        !kos.kos_avail
      );
      
      if (success) {
        setKos(prev => prev ? { ...prev, kos_avail: !prev.kos_avail } : null);
        alert(`Ketersediaan berhasil diubah menjadi ${!kos.kos_avail ? 'tersedia' : 'penuh'}`);
      } else {
        alert(`Error: ${updateError}`);
      }
    } catch { // 7. Remove unused 'err' variable
      alert('Terjadi kesalahan saat mengubah ketersediaan');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  // UPDATED - Better status display
  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    };

    const labels = {
      active: 'Aktif',
      rejected: 'Ditolak',
      pending: 'Menunggu Review',
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  // NEW - Availability badge
  const getAvailabilityBadge = (isAvailable: boolean) => {
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
        isAvailable 
          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
      }`}>
        {isAvailable ? 'Tersedia' : 'Penuh'}
      </span>
    );
  };

  // 9. Provide a specific type for the 'harga' parameter
  const formatPrice = (harga: HargaKos[]) => {
    if (!harga || harga.length === 0) return [];
    
    return harga.map(h => ({
      ...h,
      formatted: `Rp ${h.harga.toLocaleString('id-ID')}/${h.tipe_durasi}`
    }));
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Memuat detail kos...</span>
      </div>
    );
  }

  if (error) {
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

  if (!kos) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Kos tidak ditemukan</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Kembali
        </button>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!kos) return;

    const isConfirmed = window.confirm(
      'Apakah Anda yakin ingin menghapus kos ini? Tindakan ini tidak dapat dibatalkan.'
    );

    if (!isConfirmed) return;

    try {
      const { success, error } = await KosService.deleteKos(kos.kos_id);
      
      if (success) {
        alert('Kos berhasil dihapus');
        router.push('/pemilik/kos'); // Redirect to kos list
      } else {
        alert(`Gagal menghapus kos: ${error}`);
      }
    } catch (err) {
      alert('Terjadi kesalahan saat menghapus kos');
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {kos.kos_nama}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            📍 {kos.kos_lokasi}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(kos.status)}
          {getAvailabilityBadge(kos.kos_avail)}
          {kos.kos_premium && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
              Premium
            </span>
          )}
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
      </div>

      {/* Warning for rejected kos */}
      {kos.status === 'rejected' && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Kos Ditolak
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Kos ini ditolak oleh admin. Edit kos untuk mengajukan review ulang dan status akan otomatis berubah menjadi &ldquo;Menunggu Review&rdquo;.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Warning for pending kos */}
      {kos.status === 'pending' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Menunggu Review
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Kos ini sedang menunggu review dari admin. Harap tunggu proses persetujuan.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Foto Kos
            </h2>
            {kos.images && kos.images.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {kos.images.map((image, index) => (
                  // 10. Add 'relative' for Next.js Image fill property
                  <div key={image.id} className="relative w-full h-48 rounded-lg overflow-hidden">
                    {/* 11. Replace <img> with optimized <Image> component */}
                    <Image
                      src={image.url_foto}
                      alt={`${kos.kos_nama} - ${index + 1}`}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400">Belum ada foto</p>
                </div>
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Informasi Dasar
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tipe Kos</h3>
                <p className="mt-1 text-gray-900 dark:text-white capitalize">{kos.kos_tipe}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Premium</h3>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {kos.kos_premium ? 'Ya' : 'Tidak'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status Approval</h3>
                <p className="mt-1">
                  {getStatusBadge(kos.status)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Ketersediaan</h3>
                <p className="mt-1">
                  {getAvailabilityBadge(kos.kos_avail)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tanggal Dibuat</h3>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {new Date(kos.created_at).toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>
          </div>

          {/* Rules */}
          {kos.kos_rule && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Aturan Kos
              </h2>
              <p className="text-gray-900 dark:text-white whitespace-pre-line">{kos.kos_rule}</p>
            </div>
          )}

          {/* Notes */}
          {kos.kos_note && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Catatan
              </h2>
              <p className="text-gray-900 dark:text-white whitespace-pre-line">{kos.kos_note}</p>
            </div>
          )}

          {/* Facilities */}
          {kos.fasilitas && kos.fasilitas.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Fasilitas ({kos.fasilitas.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {kos.fasilitas.map((fasilitas, index) => (
                  <div key={index} className="flex items-center space-x-2 py-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                    <span className="text-gray-700 dark:text-gray-300 text-sm">
                      {fasilitas.fasilitas_nama}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Address - UPDATED WITH MAP */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Alamat & Lokasi
            </h2>
            
            {/* Address Text */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Alamat Lengkap</h3>
              <p className="text-gray-900 dark:text-white">{kos.kos_alamat}</p>
            </div>

            {/* Location Info */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Lokasi</h3>
              <p className="text-gray-900 dark:text-white">{kos.kos_lokasi}</p>
            </div>

            {/* Coordinates */}
            {(kos.kos_lat && kos.kos_lng) ? (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Koordinat</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Latitude: {kos.kos_lat} | Longitude: {kos.kos_lng}
                </p>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                  ⚠️ Koordinat belum diset. Untuk pengalaman terbaik, silakan edit kos dan tambahkan lokasi di peta.
                </p>
              </div>
            )}

            {/* NEW - Map Display */}
            {(kos.kos_lat && kos.kos_lng) && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Lokasi di Peta</h3>
                <MapDisplay
                  lat={kos.kos_lat}
                  lng={kos.kos_lng}
                  title={kos.kos_nama}
                  height="300px"
                  className="rounded-lg overflow-hidden"
                />
                
                {/* Map Actions */}
                <div className="mt-3 flex justify-center space-x-3">
                  <a
                    href={`https://www.google.com/maps?q=${kos.kos_lat},${kos.kos_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Buka di Google Maps
                  </a>
                  
                  <a
                    href={`https://maps.google.com/maps?q=${kos.kos_lat},${kos.kos_lng}&navigate=yes`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    Arah ke Lokasi
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Harga Sewa
            </h2>
            {kos.harga && kos.harga.length > 0 ? (
              <div className="space-y-3">
                {formatPrice(kos.harga).map((price, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400 capitalize">
                      {price.tipe_durasi}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {price.formatted}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">Harga belum diset</p>
            )}
          </div>

          {/* Fasilitas
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Fasilitas
            </h2>
            {kos.fasilitas && kos.fasilitas.length > 0 ? (
              <div className="space-y-2">
                {kos.fasilitas.map((item: any) => (
                  <div key={item.fasilitas.fasilitas_id} className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-900 dark:text-white">
                      {item.fasilitas.fasilitas_nama}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">Belum ada fasilitas</p>
            )}
          </div> */}

          {/* UPDATED Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Aksi
            </h2>
            <div className="space-y-3">
              <a
                href={`/pemilik/kos/${kos.kos_id}/edit`}
                className="w-full inline-flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Kos
              </a>

              {/* REPLACED Status Actions with Availability Toggle */}
              {kos.status === 'active' && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Ubah Ketersediaan:</p>
                  <button
                    onClick={handleAvailabilityChange}
                    disabled={availabilityLoading}
                    className={`w-full px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                      kos.kos_avail 
                        ? 'bg-orange-600 hover:bg-orange-700' 
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {availabilityLoading ? 'Mengubah...' : (kos.kos_avail ? 'Set Penuh' : 'Set Tersedia')}
                  </button>
                </div>
              )}

              {/* Info for non-active kos */}
              {kos.status !== 'active' && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {kos.status === 'pending' 
                      ? 'Ketersediaan dapat diubah setelah kos disetujui admin'
                      : 'Edit kos untuk mengajukan review ulang'
                    }
                  </p>
                </div>
              )}

              <button
                onClick={handleDelete}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Hapus Kos
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}