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

function AdminMobileProfile() {
  const { user, logout } = useAuth();

  // ONLY FETCH EXISTING VALUES
  const { isDarkMode } = useTheme();

  const [open, setOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const path =
    typeof window !== 'undefined'
      ? window.location.pathname
      : '/admin';

  const IconComp = iconMap[path] || Grid;

  // CLOSE DROPDOWN ON OUTSIDE CLICK
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
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

  // LOGOUT
  const handleLogout = async () => {
    try {
      await logout?.();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="block md:hidden">

      {/* HEADER */}
      <div className="relative overflow-visible rounded-b-[28px] bg-[#050505] shadow-[0_12px_40px_rgba(0,0,0,0.65)]">

        {/* RED LIGHT */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,0,0,0.22),transparent_38%)]" />

        {/* RED LINES */}
        <div className="absolute top-0 right-0 w-[220px] h-full opacity-25">
          <div className="absolute top-0 right-14 w-[1px] h-full bg-gradient-to-b from-red-500/60 to-transparent rotate-[35deg]" />
          <div className="absolute top-0 right-24 w-[1px] h-full bg-gradient-to-b from-red-500/40 to-transparent rotate-[35deg]" />
        </div>

        {/* CONTENT */}
        <div className="relative z-10 px-5 pt-5 pb-6">

          <div className="flex items-center justify-between gap-3">

            {/* LEFT SIDE */}
            <div className="flex items-center gap-4">

              {/* LOGO */}
              <div className="flex items-center gap-4">

                <div className="w-[58px] h-[58px] rounded-2xl bg-black/30 flex items-center justify-center">

                  <img
                    src="/MOBILELOGOLOGIN.png"
                    alt="logo"
                    className="h-12 w-auto object-contain"
                  />
                </div>

                {/* DIVIDER */}
                <div className="w-[1px] h-16 bg-white/10" />
              </div>

              {/* PAGE ICON */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-700 to-red-500 flex items-center justify-center shadow-[0_0_25px_rgba(255,0,0,0.35)]">

                <IconComp className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div
              ref={dropdownRef}
              className="relative"
            >

              {/* PROFILE BUTTON */}
              <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 rounded-full bg-black/30 backdrop-blur-sm px-3 py-2.5"
              >

                {/* AVATAR */}
                <div className="relative">

                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center text-white text-lg font-bold shadow-[0_0_20px_rgba(255,0,0,0.35)]">
                    {user?.username?.charAt(0)?.toUpperCase() || 'A'}
                  </div>

                  {/* ONLINE */}
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-[#050505]" />
                </div>

                {/* USER INFO */}
                <div className="text-left leading-tight">

                  {/* USERNAME FROM BACKEND */}
                  <p className="text-white text-[15px] font-semibold max-w-[70px] truncate">
                    {user?.username || 'admin'}
                  </p>

                  {/* ROLE FROM BACKEND */}
                  <p className="text-white/50 text-[11px]">
                    {user?.role || 'Admin'}
                  </p>
                </div>

                {/* CHEVRON */}
                <ChevronDown className="w-4 h-4 text-white/50" />
              </button>

              {/* DROPDOWN */}
              {open && (
                <div className="absolute right-0 top-[65px] w-48 rounded-2xl bg-[#0b0b0b] shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden z-50">

                  {/* ACCOUNT */}
                  <div className="px-4 py-2.5 border-b border-white/5">

                    <p className="text-red-400 text-[10px] uppercase tracking-[0.25em] font-bold">
                      Account
                    </p>
                  </div>

                  {/* USER */}
                  <div className="px-4 py-3 flex items-center gap-3 border-b border-white/5">

                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center text-white text-sm font-bold">
                      {user?.username?.charAt(0)?.toUpperCase() || 'A'}
                    </div>

                    <div>
                      <p className="text-white text-sm font-semibold">
                        {user?.username || 'admin'}
                      </p>

                      <p className="text-white/50 text-[11px]">
                        {user?.role || 'Admin'}
                      </p>
                    </div>
                  </div>

                  {/* THEME STATUS */}
                  <div className="w-full px-4 py-3 flex items-center justify-between border-b border-white/5">

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

                    {/* STATUS DOT */}
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        isDarkMode
                          ? 'bg-red-500'
                          : 'bg-yellow-400'
                      }`}
                    />
                  </div>

                  {/* LOGOUT */}
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 flex items-center gap-3 text-white/80 hover:bg-red-500/10 transition-all duration-300"
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
  );
}

export default AdminMobileProfile;