'use client';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useKosByOwner } from '@/hooks/useKos';
import { KosService } from '@/lib/kosService';
import { Kos } from '@/types/database';

export default function PemilikKosPage() {
  const { user } = useAuth();
  const { kos, loading, error, refetch } = useKosByOwner(user?.user_id || '');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState<string | null>(null);

  const handleDeleteKos = async (kosId: string, kosNama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kos "${kosNama}"?`)) {
      return;
    }

    setDeleteLoading(kosId);
    try {
      const { success, error } = await KosService.deleteKos(kosId);
      
      if (success) {
        alert('Kos berhasil dihapus!');
        refetch();
      } else {
        alert(`Error: ${error}`);
      }
    } catch (err) {
      alert('Terjadi kesalahan saat menghapus kos');
    } finally {
      setDeleteLoading(null);
    }
  };

  // NEW - Handle availability toggle (not status)
  const handleToggleAvailability = async (kosId: string, currentAvailability: boolean) => {
    setAvailabilityLoading(kosId);
    
    try {
      const { success, error } = await KosService.updateKosAvailability(kosId, !currentAvailability);
      
      if (success) {
        alert(`Ketersediaan kos berhasil ${!currentAvailability ? 'diaktifkan' : 'dinonaktifkan'}`);
        refetch();
      } else {
        alert(`Error: ${error}`);
      }
    } catch (err) {
      alert('Terjadi kesalahan saat mengubah ketersediaan');
    } finally {
      setAvailabilityLoading(null);
    }
  };

  // UPDATED STATUS BADGE - Show both status and availability
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
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getAvailabilityBadge = (isAvailable: boolean) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isAvailable 
          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
      }`}>
        {isAvailable ? 'Tersedia' : 'Penuh'}
      </span>
    );
  };

  // ...rest of the code remains the same...

  return (
    <div className="space-y-6">
      {/* Header - NO CHANGE */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Kelola Kos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Kelola semua properti kos Anda
          </p>
        </div>
        <a
          href="/pemilik/kos/add"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Tambah Kos Baru
        </a>
      </div>

      {/* Loading, Error, Empty states - NO CHANGE */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Memuat data kos...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      )}

      {!loading && !error && kos.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-24 h-24 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Belum ada kos yang terdaftar
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Mulai dengan menambahkan kos pertama Anda
          </p>
          <a
            href="/pemilik/kos/add"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Tambah Kos Pertama
          </a>
        </div>
      )}

      {/* UPDATED Kos Grid */}
      {!loading && !error && kos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kos.map((kosItem) => (
            <div key={kosItem.kos_id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              {/* Image */}
              <div className="h-48 bg-gray-200 dark:bg-gray-700 relative">
                {kosItem.images && kosItem.images.length > 0 ? (
                  <img
                    src={kosItem.images[0].url_foto}
                    alt={kosItem.kos_nama}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                
                {/* UPDATED - Show both status and availability badges */}
                <div className="absolute top-3 right-3 space-y-1">
                  {getStatusBadge(kosItem.status)}
                </div>
                
                <div className="absolute top-3 left-3 space-y-1">
                  {getAvailabilityBadge(kosItem.kos_avail)}
                  {kosItem.kos_premium && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                      Premium
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">
                    {kosItem.kos_nama}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {kosItem.kos_tipe}
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  📍 {kosItem.kos_lokasi}
                </p>

                <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-4">
                  {formatPrice(kosItem.harga || [])}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span>📅 {new Date(kosItem.created_at).toLocaleDateString('id-ID')}</span>
                  {/* Show warning if rejected */}
                  {kosItem.status === 'rejected' && (
                    <span className="text-red-600 dark:text-red-400 text-xs">
                      ⚠️ Edit untuk review ulang
                    </span>
                  )}
                </div>

                {/* UPDATED Actions */}
                <div className="flex items-center gap-2">
                  <a
                    href={`/pemilik/kos/${kosItem.kos_id}`}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors text-center"
                  >
                    Detail
                  </a>
                  <a
                    href={`/pemilik/kos/${kosItem.kos_id}/edit`}
                    className="flex-1 px-3 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors text-center"
                  >
                    Edit
                  </a>
                  
                  {/* UPDATED - Availability toggle instead of status toggle */}
                  {kosItem.status === 'active' && (
                    <button
                      onClick={() => handleToggleAvailability(kosItem.kos_id, kosItem.kos_avail)}
                      disabled={availabilityLoading === kosItem.kos_id}
                      className={`px-3 py-2 text-white text-sm rounded transition-colors disabled:opacity-50 ${
                        kosItem.kos_avail 
                          ? 'bg-orange-600 hover:bg-orange-700' 
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {availabilityLoading === kosItem.kos_id ? '...' : (kosItem.kos_avail ? 'Set Penuh' : 'Set Tersedia')}
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDeleteKos(kosItem.kos_id, kosItem.kos_nama)}
                    disabled={deleteLoading === kosItem.kos_id}
                    className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {deleteLoading === kosItem.kos_id ? '...' : 'Hapus'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  function formatPrice(harga: any[]) {
    if (!harga || harga.length === 0) return 'Harga belum diset';
    
    const bulanan = harga.find(h => h.tipe_durasi === 'bulanan');
    if (bulanan) {
      return `Rp ${bulanan.harga.toLocaleString('id-ID')}/bulan`;
    }
    
    return `Rp ${harga[0].harga.toLocaleString('id-ID')}/${harga[0].tipe_durasi}`;
  }
}