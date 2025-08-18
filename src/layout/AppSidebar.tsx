"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
} from "../icons/index";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  badge?: string;
  subItems?: { name: string; path: string; badge?: string; badgeColor?: string }[];
  roles?: string[];
};

// Pemilik Navigation Items - SESUAI PERMINTAAN (SIMPLE)
const pemilikNavItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/pemilik/dashboard",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    name: "Manajemen Kos",
    subItems: [
      { name: "Daftar Kos", path: "/pemilik/kos" },
    ],
  },
];

// Admin Navigation Items
const adminNavItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Admin Dashboard",
    path: "/admin/dashboard",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    name: "Status Kos",
    path: "/admin/kos-status",
    badge: "Active"
  },
  {
    icon: <UserCircleIcon />,
    name: "Manajemen User",
    path: "/admin/users",
    badge: "Active"
  },
];

// Settings items (empty for now)
const settingsItems: NavItem[] = [];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { user } = useAuth();
  const pathname = usePathname();

  // Get navigation items based on user role - FIXED: pakai 'role'
  const getNavItems = () => {
    if (user?.role === 'admin') {
      return adminNavItems;
    }
    return pemilikNavItems;
  };

  const mainNavItems = getNavItems();

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "settings"
  ) => (
    <ul className="flex flex-col gap-2">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group w-full text-left ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={` ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <>
                  <span className={`menu-item-text flex-1`}>{nav.name}</span>
                  {nav.badge && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full mr-2 ${getBadgeColor(nav.badge)}`}
                    >
                      {nav.badge}
                    </span>
                  )}
                </>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200  ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-blue-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                } ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "lg:justify-start"
                }`}
              >
                <span
                  className={`${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <>
                    <span className={`menu-item-text flex-1`}>{nav.name}</span>
                    {nav.badge && (
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${getBadgeColor(nav.badge)}`}
                      >
                        {nav.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      <span className="flex-1">{subItem.name}</span>
                      {subItem.badge && (
                        <span
                          className={`ml-auto text-xs px-2 py-1 rounded-full ${getBadgeColor(subItem.badge)}`}
                        >
                          {subItem.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  // Helper function for badge colors
  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Active':
        return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
      case 'Admin':
        return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
      case 'New':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Soon':
        return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "settings";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => {
    if (path === pathname) return true;
    // Check if current path starts with the nav path (for parent highlighting)
    if (pathname.startsWith(path) && path !== '/') return true;
    return false;
  }, [pathname]);

  useEffect(() => {
    // Check if the current path matches any submenu item
    let submenuMatched = false;
    ["main", "settings"].forEach((menuType) => {
      const items = menuType === "main" ? mainNavItems : settingsItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "settings",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    // If no submenu item matches, close the open submenu
    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive, mainNavItems]);

  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "settings") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  return (
    <aside
      className={`fixed flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-40 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo Section */}
      <div
        className={`py-6 flex items-center ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href={user?.role === 'admin' ? '/admin/dashboard' : '/pemilik/dashboard'}>
          {isExpanded || isHovered || isMobileOpen ? (
            <div className="flex items-center space-x-3">
              <Image
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Kosbaliku"
                width={120}
                height={32}
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Kosbaliku"
                width={120}
                height={32}
              />
            </div>
          ) : (
            <Image
              src="/images/logo/logo-icon.svg"
              alt="Kosbaliku"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>

      {/* User Role Badge */}
      {(isExpanded || isHovered || isMobileOpen) && (
        <div className="mb-4 px-3">
          <div className={`text-xs px-3 py-1 rounded-full text-center ${
            user?.role === 'admin' 
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
          }`}>
            {user?.role === 'admin' ? 'Administrator' : 'Pemilik Kos'}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex flex-col flex-1 overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="flex-1">
          <div className="flex flex-col gap-6">
            {/* Main Menu */}
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 font-semibold ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  user?.role === 'admin' ? "Admin Menu" : "Menu Utama"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(mainNavItems, "main")}
            </div>

            {/* Settings & Others - REMOVED FOR NOW */}
            {settingsItems.length > 0 && (
              <div className="">
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 font-semibold ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Pengaturan"
                  ) : (
                    <HorizontaLDots />
                  )}
                </h2>
                {renderMenuItems(settingsItems, "settings")}
              </div>
            )}
          </div>
        </nav>

        {/* Footer - User Info */}
        {(isExpanded || isHovered || isMobileOpen) && user && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <div className="flex items-center space-x-3 px-3 py-2">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user.user_name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.user_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.user_email}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default AppSidebar;