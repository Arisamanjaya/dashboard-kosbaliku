'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      console.log('User role:', user.role); // Debug log
      
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (user.role === 'user' || user.role === 'pemilik') {
        router.push('/pemilik/dashboard');
      } else {
        // Fallback untuk role yang tidak dikenal
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [user, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <span className="ml-3">Loading...</span>
    </div>
  );
}