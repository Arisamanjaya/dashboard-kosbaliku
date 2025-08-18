// filepath: /Users/arisamanjaya/Documents/Code/dashboard-kosbaliku/src/components/auth/LogoutButton.tsx
'use client';
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface LogoutButtonProps {
  variant?: 'button' | 'dropdown-item';
  className?: string;
  showConfirm?: boolean;
}

export default function LogoutButton({ 
  variant = 'button', 
  className = '',
  showConfirm = true 
}: LogoutButtonProps) {
  const { signOut } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (showConfirm) {
      const confirmed = window.confirm('Apakah Anda yakin ingin logout?');
      if (!confirmed) return;
    }

    setIsLoggingOut(true);
    
    try {
      await signOut();
      
      // Redirect to login page
      router.push('/login');
      
      // Optional: Show success message
      // You can replace this with toast notification
      console.log('✅ Logout berhasil');
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      alert('Terjadi kesalahan saat logout');
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (variant === 'dropdown-item') {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={`w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 ${className}`}
      >
        <div className="flex items-center">
          {isLoggingOut ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-3"></div>
              Logging out...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </>
          )}
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
    >
      {isLoggingOut ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Logging out...
        </>
      ) : (
        <>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </>
      )}
    </button>
  );
}