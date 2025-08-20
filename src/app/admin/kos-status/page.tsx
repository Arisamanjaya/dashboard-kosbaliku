'use client';
import KosStatusManager from '@/components/admin/KosStatusManager';

export default function KosStatusPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Kos Status Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Review and manage kos approval status
        </p>
      </div>
      
      <KosStatusManager />
    </div>
  );
}