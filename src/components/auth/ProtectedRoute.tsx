'use client';
import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { User } from '@/types/database';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [],
  redirectTo = '/login'
}) => {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Not authenticated
      if (!user || !userProfile) {
        router.push(redirectTo);
        return;
      }

      // Check role permissions
      if (allowedRoles.length > 0 && !allowedRoles.includes(userProfile.role)) {
        // Redirect based on user role
        if (userProfile.role === 'admin') {
          router.push('/admin/dashboard');
        } else if (userProfile.role === 'pemilik' || userProfile.role === 'user') {
          router.push('/pemilik');
        } else {
          router.push('/unauthorized');
        }
        return;
      }
    }
  }, [user, userProfile, loading, router, allowedRoles, redirectTo]);

  // Show loading spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Not authenticated
  if (!user || !userProfile) {
    return null;
  }

  // Check role permissions
  if (allowedRoles.length > 0 && !allowedRoles.includes(userProfile.role)) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;