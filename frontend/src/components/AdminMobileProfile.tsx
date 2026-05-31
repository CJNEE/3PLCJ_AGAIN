import React, { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  LogOut,
  Grid,
  MapPin,
  Users,
  Edit3,
  Sun,
  Moon,
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';

const iconMap: Record<string, any> = {
  '/admin': Grid,
  '/admin/hubs': MapPin,
  '/admin/employees': Users,
  '/admin/edit-requests': Edit3,
};

const titleMap: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/hubs': 'Hubs',
  '/admin/employees': 'Employees',
  '/admin/edit-requests': 'Edit Requests',
};

const subtitleMap: Record<string, string> = {
  '/admin': 'Overview of your network',
  '/admin/hubs': 'Manage hub locations',
  '/admin/employees': 'Workforce management',
  '/admin/edit-requests': 'Pending modifications',
};

function AdminMobileProfile() {
  const { user, logout } = useAuth();
  const { isDarkMode } = useTheme();

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const path =
    typeof window !== 'undefined'
      ? window.location.pathname
      : '/admin';

  const IconComp = iconMap[path] || Grid;

  const pageTitle =
    titleMap[path] || 'Dashboard';

  const pageSubtitle =
    subtitleMap[path] ||
    'Overview of your network';

  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent
    ) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout?.();
    } catch (error) {
      console.error(
        'Logout failed:',
        error
      );
    }
  };

  return (
    <div className="block md:hidden">
      <div className="relative px-3 pt-3">

        {/* BACKGROUND GLOW */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-52 h-52 bg-red-600/20 blur-[120px]" />
        </div>

        {/* HEADER CARD */}
        <div className="relative overflow-visible rounded-[30px] border border-white/10 bg-gradient-to-r from-[#040B18] via-[#050505] to-[#180707] shadow-[0_20px_60px_rgba(0,0,0,0.75)] backdrop-blur-xl">

          {/* DECORATIVE RED LINES */}
          <div className="absolute inset-0 overflow-hidden rounded-[30px]">
            <div className="absolute top-0 right-16 h-full w-px bg-gradient-to-b from-red-500/30 to-transparent rotate-[30deg]" />
            <div className="absolute top-0 right-28 h-full w-px bg-gradient-to-b from-red-500/20 to-transparent rotate-[30deg]" />
          </div>

          <div className="relative z-10 p-4">

            <div className="flex items-center justify-between">

              {/* LEFT */}
              <div className="flex items-center gap-3">

                {/* LOGO */}
                <div className="flex items-center gap-3">

                  <div className="w-16 h-16 rounded-2xl border border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-center">
                    <img
                      src="/MOBILELOGOLOGIN.png"
                      alt="logo"
                      className="h-12 w-auto object-contain"
                    />
                  </div>

                  <div className="w-px h-12 bg-white/10" />
                </div>

                {/* PAGE INFO */}
                <div className="flex items-center gap-3">

                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center shadow-[0_0_35px_rgba(255,0,0,0.45)]">
                    <IconComp className="w-6 h-6 text-white" />
                  </div>

                  <div>
                    <h1 className="text-white text-lg font-bold leading-none">
                      {pageTitle}
                    </h1>

                    <p className="text-white/50 text-xs mt-1">
                      {pageSubtitle}
                    </p>
                  </div>

                </div>
              </div>

              {/* PROFILE */}
              <div
                ref={dropdownRef}
                className="relative"
              >
                <button
                  onClick={() =>
                    setOpen(!open)
                  }
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-xl px-2.5 py-2"
                >

                  {/* AVATAR */}
                  <div className="relative">

                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center text-white font-bold text-lg shadow-[0_0_30px_rgba(255,0,0,0.45)]">
                      {user?.username
                        ?.charAt(0)
                        ?.toUpperCase() || 'A'}
                    </div>

                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-[#050505]" />
                  </div>

                  <div className="text-left max-w-[70px]">

                    <p className="text-white text-sm font-semibold truncate">
                      {user?.username ||
                        'admin'}
                    </p>

                    <p className="text-white/50 text-[11px]">
                      {user?.role ||
                        'Admin'}
                    </p>
                  </div>

                  <ChevronDown
                    className={`w-4 h-4 text-white/50 transition-transform duration-300 ${
                      open
                        ? 'rotate-180'
                        : ''
                    }`}
                  />
                </button>

                {/* DROPDOWN */}
                {open && (
                  <div className="absolute right-0 top-[70px] w-56 rounded-3xl border border-white/10 bg-[#0B1220] backdrop-blur-2xl shadow-[0_25px_80px_rgba(0,0,0,0.8)] overflow-hidden z-50">

                    <div className="px-5 py-3 border-b border-white/5">
                      <p className="text-red-400 text-[10px] uppercase tracking-[0.25em] font-bold">
                        Account
                      </p>
                    </div>

                    <div className="px-5 py-4 flex items-center gap-3 border-b border-white/5">

                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center text-white font-bold">
                        {user?.username
                          ?.charAt(0)
                          ?.toUpperCase() ||
                          'A'}
                      </div>

                      <div>
                        <p className="text-white font-semibold text-sm">
                          {user?.username ||
                            'admin'}
                        </p>

                        <p className="text-white/50 text-xs">
                          {user?.role ||
                            'Admin'}
                        </p>
                      </div>
                    </div>

                    <div className="px-5 py-4 flex items-center justify-between border-b border-white/5">

                      <div className="flex items-center gap-2">

                        {isDarkMode ? (
                          <Moon className="w-4 h-4 text-white/70" />
                        ) : (
                          <Sun className="w-4 h-4 text-yellow-400" />
                        )}

                        <span className="text-sm text-white/80">
                          {isDarkMode
                            ? 'Dark Mode'
                            : 'Light Mode'}
                        </span>
                      </div>

                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          isDarkMode
                            ? 'bg-red-500'
                            : 'bg-yellow-400'
                        }`}
                      />
                    </div>

                    <button
                      onClick={
                        handleLogout
                      }
                      className="w-full px-5 py-4 flex items-center gap-3 text-white/80 hover:bg-red-500/10 transition-all duration-300"
                    >
                      <LogOut className="w-4 h-4 text-red-400" />

                      <span className="text-sm font-medium">
                        Logout
                      </span>
                    </button>

                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminMobileProfile;