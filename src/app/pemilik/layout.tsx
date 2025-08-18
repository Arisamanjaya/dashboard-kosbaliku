'use client';
import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import AppSidebar from '@/layout/AppSidebar';
import AppHeader from '@/layout/AppHeader';

// Inner layout component that uses sidebar context
function PemilikLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered } = useSidebar();

  // Calculate margin based on sidebar state
  const getSidebarWidth = () => {
    if (isExpanded || isHovered) {
      return 'ml-[290px]'; // Expanded sidebar width
    }
    return 'ml-[90px]'; // Collapsed sidebar width
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <AppSidebar />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${getSidebarWidth()}`}>
        <AppHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function PemilikLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['pemilik', 'user']}>
      <SidebarProvider>
        <PemilikLayoutInner>
          {children}
        </PemilikLayoutInner>
      </SidebarProvider>
    </ProtectedRoute>
  );
}