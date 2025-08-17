'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { KosService } from '@/lib/kosService';
import { Kos } from '@/types/database';

export default function KosDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [kos, setKos] = useState<Kos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  const kosId = params.id as string;

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
      } else {
        setKos(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: 'active' | 'inactive' | 'pending') => {
    if (!kos) return;

    setStatusLoading(true);
    try {
      const { success, error } = await KosService.updateKosStatus(kos.kos_id, newStatus);
      
      if (success) {
        setKos(prev => prev ? { ...prev, status: newStatus } : null);
        alert(`Status berhasil diubah menjadi ${newStatus}`);
      } else {
        alert(`Error: ${error}`);
      }
    } catch (err) {
      alert('Terjadi kesalahan saat mengubah status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!kos) return;

    if (!confirm(`Apakah Anda yakin ingin menghapus kos "${kos.kos_nama}"?`)) {
      return;
    }

    try {
      const { success, error } = await KosService.deleteKos(kos.kos_id);
      
      if (success) {
        alert('Kos berhasil dihapus!');
        router.push('/pemilik/kos');
      } else {
        alert(`Error: ${error}`);
      }
    } catch (err) {
      alert('Terjadi kesalahan saat menghapus kos');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      inactive: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    };

    const labels = {
      active: 'Aktif',
      inactive: 'Tidak Aktif',
      pending: 'Menunggu Review',
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatPrice = (harga: any[]) => {
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Foto Kos
            </h2>
            {kos.images && kos.images.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {kos.images.map((image, index) => (
                  <div key={image.id} className="relative">
                    <img
                      src={image.url_foto}
                      alt={`${kos.kos_nama} - ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
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
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Ketersediaan</h3>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {kos.kos_avail ? 'Tersedia' : 'Penuh'}
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

          {/* Address */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Alamat
            </h2>
            <p className="text-gray-900 dark:text-white">{kos.kos_alamat}</p>
            {(kos.kos_lat && kos.kos_lng) && (
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                <p>Koordinat: {kos.kos_lat}, {kos.kos_lng}</p>
              </div>
            )}
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

          {/* Fasilitas */}
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
          </div>

          {/* Actions */}
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

              {/* Status Actions */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Ubah Status:</p>
                
                {kos.status !== 'active' && (
                  <button
                    onClick={() => handleStatusChange('active')}
                    disabled={statusLoading}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    Aktifkan
                  </button>
                )}
                
                {kos.status !== 'inactive' && (
                  <button
                    onClick={() => handleStatusChange('inactive')}
                    disabled={statusLoading}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    Nonaktifkan
                  </button>
                )}
                
                {kos.status !== 'pending' && (
                  <button
                    onClick={() => handleStatusChange('pending')}
                    disabled={statusLoading}
                    className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors disabled:opacity-50"
                  >
                    Set Pending
                  </button>
                )}
              </div>

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