'use client';
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import LogoutButton from '@/components/auth/LogoutButton';
import { ThemeToggleButton } from '@/components/common/ThemeToggleButton';

export default function AppHeader() {
  const { user } = useAuth();
  const { toggleSidebar, toggleMobileSidebar, isExpanded } = useSidebar();

  // Detect if mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const handleMenuClick = () => {
    if (isMobile) {
      toggleMobileSidebar();
    } else {
      toggleSidebar();
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Menu Button + Brand */}
          <div className="flex items-center space-x-4">
            {/* Menu Toggle Button */}
            <button
              onClick={handleMenuClick}
              className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={isMobile ? "Toggle mobile menu" : "Toggle sidebar"}
            >
              {isMobile ? (
                // Mobile hamburger icon
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                // Desktop sidebar toggle icon
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d={isExpanded ? "M11 19l-7-7 7-7M5 12h14" : "M13 5l7 7-7 7M6 12h12"} 
                  />
                </svg>
              )}
            </button>

            {/* Brand (Mobile Only) */}
            {isMobile && (
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Kos Baliku
                </h1>
              </div>
            )}
          </div>

          {/* Center: Page Title (Optional) */}
          <div className="hidden md:block">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {/* You can add dynamic page title here */}
            </h2>
          </div>

          {/* Right: User Info + Actions */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <ThemeToggleButton />

            {/* Notifications (Optional) */}
            <button className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM13 3h5l-5 5V3zM9 21H4l5-5v5z" />
              </svg>
              {/* Notification badge */}
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Dropdown */}
            <div className="flex items-center space-x-3">
              {/* User Avatar & Info (Desktop) */}
              <div className="hidden sm:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.user_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                    {user?.role || 'user'}
                  </p>
                </div>
                <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-medium">
                  {user?.user_name?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>

              {/* Mobile Avatar Only */}
              <div className="sm:hidden flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-medium">
                {user?.user_name?.charAt(0).toUpperCase() || 'U'}
              </div>

              {/* Logout Button */}
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}