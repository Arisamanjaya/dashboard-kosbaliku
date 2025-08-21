'use client';
import React, { useState, useEffect, useCallback } from 'react'; // 1. Import useCallback
import { AdminService } from '@/lib/adminService';

// 2. Define specific types to replace 'any'
interface Harga {
  harga: number;
  tipe_durasi: string;
}

interface KosImage {
  // Assuming a basic structure, adjust if needed
  url_foto: string;
}

interface KosWithAdminDetails {
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
  };
  harga: Harga[];
  images: KosImage[];
}

export default function KosStatusManager() {
  const [kos, setKos] = useState<KosWithAdminDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    page: 1,
    limit: 10
  });
  const [totalCount, setTotalCount] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // 3. Wrap the data fetching function in useCallback
  const fetchKos = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchError, count } = await AdminService.getAllKos(filters);
      
      if (fetchError) {
        setError(fetchError);
      } else {
        setKos(data || []);
        setTotalCount(count || 0);
      }
    } catch (err: unknown) { // 4. Use 'unknown' for safer error handling
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while fetching data.');
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // 5. Use the memoized function in useEffect's dependency array
  useEffect(() => {
    fetchKos();
  }, [fetchKos]);

  const handleStatusUpdate = async (kosId: string, newStatus: 'active' | 'rejected') => {
    const action = newStatus === 'active' ? 'approve' : 'reject';
    
    if (!confirm(`Are you sure you want to ${action} this kos?`)) {
      return;
    }

    setActionLoading(kosId);
    
    try {
      const { error: updateError } = await AdminService.updateKosStatus(kosId, newStatus);
      
      if (updateError) {
        alert('Error: ' + updateError);
      } else {
        alert(`Kos berhasil ${newStatus === 'active' ? 'disetujui' : 'ditolak'}!`);
        fetchKos(); // Refresh data
      }
    } catch (err: unknown) { // 4. Use 'unknown' for safer error handling
      if (err instanceof Error) {
        alert('Error: ' + err.message);
      } else {
        alert('An unknown error occurred during the update.');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Active
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
            Unknown
          </span>
        );
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const totalPages = Math.ceil(totalCount / filters.limit);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
              placeholder="Cari nama kos atau lokasi..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Items per page
            </label>
            <select
              value={filters.limit}
              onChange={(e) => setFilters(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {kos.length} of {totalCount} results
        </p>
        <button
          onClick={fetchKos}
          className="inline-flex items-center px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Kos List */
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {kos.length === 0 ? (
            <div className="p-6 text-center text-gray-600 dark:text-gray-400">
              No kos found
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {kos.map((item) => (
                <div key={item.kos_id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {item.kos_nama}
                        </h3>
                        {getStatusBadge(item.status)}
                        {item.kos_premium && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                            Premium
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Pemilik:</span> {item.pemilik?.user_name} ({item.pemilik?.user_email})
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Lokasi:</span> {item.kos_lokasi}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Tipe:</span> {item.kos_tipe}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Harga:</span>{' '}
                            {item.harga && item.harga.length > 0 
                              ? `${formatCurrency(item.harga[0].harga)} / ${item.harga[0].tipe_durasi}`
                              : 'Belum ada harga'
                            }
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Gambar:</span> {item.images?.length || 0} foto
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Dibuat:</span> {new Date(item.created_at).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* SIMPLIFIED Action Buttons */}
                    <div className="flex flex-col space-y-2 ml-4">
                      {item.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(item.kos_id, 'active')}
                            disabled={actionLoading === item.kos_id}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === item.kos_id ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(item.kos_id, 'rejected')}
                            disabled={actionLoading === item.kos_id}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === item.kos_id ? '...' : 'Reject'}
                          </button>
                        </>
                      )}
                      
                      {item.status === 'active' && (
                        <button
                          onClick={() => handleStatusUpdate(item.kos_id, 'rejected')}
                          disabled={actionLoading === item.kos_id}
                          className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === item.kos_id ? '...' : 'Reject'}
                        </button>
                      )}
                      
                      {item.status === 'rejected' && (
                        <button
                          onClick={() => handleStatusUpdate(item.kos_id, 'active')}
                          disabled={actionLoading === item.kos_id}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === item.kos_id ? '...' : 'Reactivate'}
                        </button>
                      )}

                      {/* View Detail Button - NEW */}
                      <a
                        href={`/admin/kos/${item.kos_id}`}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors text-center"
                      >
                        View Detail
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Page {filters.page} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={filters.page <= 1}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={filters.page >= totalPages}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}