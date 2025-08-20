'use client';
import React, { useState, useEffect } from 'react';
import { AdminService }  from '@/lib/adminService';
import { useParams, useRouter } from 'next/navigation';
import MapDisplay from '@/components/maps/MapDisplay';

interface KosDetailWithAdmin {
  kos_id: string;
  kos_nama: string;
  kos_alamat: string;
  kos_lokasi: string;
  kos_lng?: number;
  kos_lat?: number;
  kos_tipe: string;
  kos_premium: boolean;
  kos_rule: string;
  kos_note: string;
  kos_avail: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  pemilik_id: string;
  pemilik: {
    user_id: string;
    user_name: string;
    user_email: string;
    user_phone?: string;
  };
  harga: any[];
  images: any[];
  fasilitas: any[];
}

export default function AdminKosDetailPage() {
  const params = useParams();
  const router = useRouter();
  const kosId = params.id as string;
  
  const [kos, setKos] = useState<KosDetailWithAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (kosId) {
      fetchKosDetail();
    }
  }, [kosId]);

  const fetchKosDetail = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error } = await AdminService.getKosById(kosId);
      
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

  const handleStatusUpdate = async (newStatus: 'active' | 'rejected') => {
    const action = newStatus === 'active' ? 'approve' : 'reject';
    
    if (!confirm(`Are you sure you want to ${action} this kos?`)) {
      return;
    }

    setActionLoading(true);
    
    try {
      const { error } = await AdminService.updateKosStatus(kosId, newStatus);
      
      if (error) {
        alert('Error: ' + error);
      } else {
        alert(`Kos berhasil ${newStatus === 'active' ? 'disetujui' : 'ditolak'}!`);
        fetchKosDetail(); // Refresh data
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Active
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const nextImage = () => {
    if (kos && kos.images && kos.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % kos.images.length);
    }
  };

  const prevImage = () => {
    if (kos && kos.images && kos.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + kos.images.length) % kos.images.length);
    }
  };

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
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {kos.kos_nama}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            📍 {kos.kos_lokasi} | 👤 {kos.pemilik.user_name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(kos.status)}
          {kos.kos_premium && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
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

      {/* Action Buttons for Pending Kos */}
      {kos.status === 'pending' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200">
                Kos Pending Approval
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300">
                This kos is waiting for your review and approval.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => handleStatusUpdate('active')}
                disabled={actionLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : '✓ Approve'}
              </button>
              <button
                onClick={() => handleStatusUpdate('rejected')}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : '✗ Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout - 2 Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Carousel */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Foto Kos ({kos.images?.length || 0})
              </h2>
            </div>
            
            {kos.images && kos.images.length > 0 ? (
              <div className="relative">
                {/* Main Image */}
                <div className="aspect-[16/10] relative">
                  <img
                    src={kos.images[currentImageIndex]?.url_foto}
                    alt={`${kos.kos_nama} - ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Image Navigation */}
                  {kos.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}
                  
                  {/* Image Counter */}
                  <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {kos.images.length}
                  </div>
                </div>

                {/* Thumbnail Strip */}
                {kos.images.length > 1 && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-700">
                    <div className="flex space-x-2 overflow-x-auto">
                      {kos.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                            index === currentImageIndex 
                              ? 'border-blue-500' 
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          <img
                            src={image.url_foto}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-[16/10] bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400">No images available</p>
                </div>
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
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
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</h3>
                <p className="mt-1">{getStatusBadge(kos.status)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Ketersediaan</h3>
                <p className="mt-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    kos.kos_avail 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {kos.kos_avail ? 'Tersedia' : 'Penuh'}
                  </span>
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Tanggal Dibuat</h3>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {new Date(kos.created_at).toLocaleDateString('id-ID')}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Terakhir Diupdate</h3>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {new Date(kos.updated_at).toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Deskripsi
            </h2>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {kos.kos_note || 'Tidak ada deskripsi'}
              </p>
            </div>
          </div>

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

          {/* Rules */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Peraturan Kos
            </h2>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {kos.kos_rule || 'Tidak ada peraturan khusus'}
              </p>
            </div>
          </div>

          {/* Address & Location - WITH MAP */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
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
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  <p className="text-gray-900 dark:text-white text-sm">
                    <span className="font-medium">Latitude:</span> {kos.kos_lat}
                  </p>
                  <p className="text-gray-900 dark:text-white text-sm">
                    <span className="font-medium">Longitude:</span> {kos.kos_lng}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                  ⚠️ Koordinat belum diset oleh pemilik kos
                </p>
              </div>
            )}

            {/* Map Display */}
            {(kos.kos_lat && kos.kos_lng) && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Lokasi di Peta</h3>
                <MapDisplay
                  lat={kos.kos_lat}
                  lng={kos.kos_lng}
                  title={`${kos.kos_nama} - ${kos.pemilik.user_name}`}
                  height="350px"
                  className="rounded-lg overflow-hidden"
                />
                
                {/* Admin Map Actions */}
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
                    Verifikasi di Google Maps
                  </a>
                  
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${kos.kos_lat}, ${kos.kos_lng}`);
                      alert('Koordinat berhasil disalin!');
                    }}
                    className="inline-flex items-center px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Salin Koordinat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-6">
            {/* Pricing Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Harga Sewa
              </h3>
              {kos.harga && kos.harga.length > 0 ? (
                <div className="space-y-3">
                  {kos.harga.map((price, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                      <span className="text-gray-600 dark:text-gray-400 capitalize">
                        {price.tipe_durasi}
                      </span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {formatCurrency(price.harga)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">
                  Harga belum ditetapkan
                </p>
              )}
            </div>

            {/* Owner Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Informasi Pemilik
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Nama:</span>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {kos.pemilik.user_name}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                  <p className="font-medium text-gray-900 dark:text-white break-all">
                    {kos.pemilik.user_email}
                  </p>
                </div>
                {kos.pemilik.user_phone && (
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Telepon:</span>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {kos.pemilik.user_phone}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Actions for Non-Pending Status */}
            {kos.status !== 'pending' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Admin Actions
                </h3>
                <div className="space-y-3">
                  {kos.status === 'active' && (
                    <button
                      onClick={() => handleStatusUpdate('rejected')}
                      disabled={actionLoading}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? 'Processing...' : '❌ Reject Kos'}
                    </button>
                  )}
                  
                  {kos.status === 'rejected' && (
                    <button
                      onClick={() => handleStatusUpdate('active')}
                      disabled={actionLoading}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? 'Processing...' : '✅ Reactivate Kos'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}