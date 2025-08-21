'use client';
import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';

const pemilikMenuItems = [
  {
    name: 'Dashboard',
    href: '/pemilik/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
      </svg>
    ),
  },
  {
    name: 'Kelola Kos',
    href: '/pemilik/kos',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
];

const adminMenuItems = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
      </svg>
    ),
  },
  {
    name: 'Kelola Kos',
    href: '/admin/kos-status',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    name: 'Kelola User',
    href: '/admin/users',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
      </svg>
    ),
  },
];

export default function AppSidebar() {
  const { user } = useAuth();
  const { 
    isExpanded, 
    isMobileOpen, 
    toggleMobileSidebar, 
    setActiveItem,
  } = useSidebar();
  const pathname = usePathname();

  // Detect if mobile based on screen size
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobileOpen && isMobile) {
      toggleMobileSidebar();
    }
  }, [pathname, isMobileOpen, isMobile, toggleMobileSidebar]);

  // Set active item based on current path
  useEffect(() => {
    const currentItem = [...pemilikMenuItems, ...adminMenuItems].find(item => 
      pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin/dashboard' && item.href !== '/pemilik/dashboard')
    );
    if (currentItem) {
      setActiveItem(currentItem.name);
    }
  }, [pathname, setActiveItem]);

  // Select menu based on actual user role
  const menuItems = user?.role === 'admin' ? adminMenuItems : pemilikMenuItems;
  
  // Display role mapping (for UI display only)
  const displayRole = user?.role === 'user' ? 'pemilik' : user?.role;
  const displayPanel = user?.role === 'admin' ? 'Admin Panel' : 'Owner Panel';

  const isActiveLink = (href: string) => {
    if (href === '/admin/dashboard' || href === '/pemilik/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  // Determine sidebar visibility
  const sidebarVisible = isMobile ? isMobileOpen : true;
  const sidebarWidth = isMobile ? 'w-64' : (isExpanded ? 'w-64' : 'w-16');

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full ${sidebarWidth} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out
          ${sidebarVisible ? 'translate-x-0' : '-translate-x-full'}
          ${!isMobile ? 'lg:translate-x-0' : ''}
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className={`flex items-center ${isExpanded || isMobile ? 'space-x-3' : 'justify-center'}`}>
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-lg flex-shrink-0">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
            </div>
            
            {(isExpanded || isMobile) && (
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                  Kos Baliku
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400 capitalize truncate">
                  {displayPanel}
                </p>
              </div>
            )}
          </div>

          {/* Mobile Close Button */}
          {isMobile && (
            <button
              onClick={toggleMobileSidebar}
              className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* User Info */}
        {(isExpanded || isMobile) && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-sm font-medium flex-shrink-0">
                {user?.user_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.user_name || 'User'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate capitalize">
                  {displayRole || 'user'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Collapsed User Avatar */}
        {!isExpanded && !isMobile && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-center">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-sm font-medium">
              {user?.user_name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${isActiveLink(item.href)
                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }
                ${!isExpanded && !isMobile ? 'justify-center' : 'space-x-3'}
              `}
              title={!isExpanded && !isMobile ? item.name : undefined}
            >
              <span 
                className={`flex-shrink-0 ${
                  isActiveLink(item.href) ? 'text-blue-600 dark:text-blue-400' : ''
                }`}
              >
                {item.icon}
              </span>
              
              {(isExpanded || isMobile) && (
                <span className="truncate">{item.name}</span>
              )}

              {/* Active Indicator for Collapsed */}
              {!isExpanded && !isMobile && isActiveLink(item.href) && (
                <div className="absolute left-0 w-1 h-6 bg-blue-600 rounded-r-full"></div>
              )}
            </Link>
          ))}
        </nav>

        {/* Sidebar Footer */}
        {(isExpanded || isMobile) && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              <p>© 2024 Kos Baliku</p>
              <p>Dashboard v2.0</p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}