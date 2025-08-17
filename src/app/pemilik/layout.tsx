'use client';
import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AppSidebar from '@/layout/AppSidebar';
import AppHeader from '@/layout/AppHeader';
import { SidebarProvider } from '@/context/SidebarContext';

export default function PemilikLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['pemilik', 'user']}>
      <SidebarProvider>
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
          <AppSidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <AppHeader />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
              <div className="container mx-auto px-6 py-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}