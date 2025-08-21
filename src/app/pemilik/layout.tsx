'use client';
// import { useAuth } from '@/context/AuthContext';
// import { useRouter } from 'next/navigation';
import { useSidebar } from '@/context/SidebarContext';
import { useState, useEffect } from 'react';
import AppHeader from '@/layout/AppHeader';
import AppSidebar from '@/layout/AppSidebar';

export default function PemilikLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // const { user } = useAuth();
  // const router = useRouter();
  const { isExpanded } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getMainMargin = () => {
    if (isMobile) return 'ml-0';
    return isExpanded ? 'ml-64' : 'ml-16';
  };

  // RENDER IMMEDIATELY - No loading gates
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <AppSidebar />
      <div className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${getMainMargin()}`}>
        <AppHeader />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}