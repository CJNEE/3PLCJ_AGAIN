import React, { useState } from 'react';
import {
  ChevronDown,
  LogOut,
  Grid,
  MapPin,
  Users,
  Edit3,
  Sun,
  Moon,
  Bell,
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
  const { isDarkMode } = useTheme();

  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    try {
      logout?.();
    } catch (e) {
      console.error('logout failed', e);
    }
  };

  const path =
    typeof window !== 'undefined'
      ? window.location.pathname
      : '/admin';

  const IconComp = iconMap[path] || Grid;

  return (
    <div className="block md:hidden px-4 pt-3">

      {/* MAIN HEADER */}
      <div className="relative overflow-hidden rounded-[28px] bg-[#050505] shadow-[0_10px_40px_rgba(0,0,0,0.65)]">

        {/* RED AMBIENT LIGHT */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,0,0,0.28),transparent_40%)]" />

        {/* RED LINE DESIGN */}
        <div className="absolute top-0 right-0 w-[220px] h-full opacity-30">
          <div className="absolute top-0 right-16 w-[1px] h-full bg-gradient-to-b from-red-500/60 to-transparent rotate-[35deg]" />
          <div className="absolute top-0 right-24 w-[1px] h-full bg-gradient-to-b from-red-500/40 to-transparent rotate-[35deg]" />
        </div>

        {/* CONTENT */}
        <div className="relative z-10 px-5 py-4">

          <div className="flex items-start justify-between gap-3">

            {/* LEFT SIDE */}
            <div className="flex items-start gap-4 flex-1 min-w-0">

              {/* LOGO AREA */}
              <div className="flex items-center gap-4 shrink-0">

                {/* LOGO */}
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

              {/* TEXT AREA */}
              <div className="min-w-0 flex-1">

                {/* COMPANY */}
                <h1 className="text-white text-[16px] font-bold tracking-wide leading-none">
                  3PL BUSINESS SOLUTIONS
                </h1>

                <p className="text-white/50 text-[11px] mt-2">
                  Manage company operations efficiently
                </p>

                {/* ACCESS SECTION */}
                <div className="flex items-center gap-3 mt-5">

                  {/* ICON BOX */}
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-700 to-red-500 flex items-center justify-center shadow-[0_0_25px_rgba(255,0,0,0.35)]">

                    <IconComp className="w-5 h-5 text-white" />
                  </div>

                  {/* TITLE */}
                  <div>

                    <h2 className="text-white text-[15px] font-bold leading-none">
                      Access Control
                    </h2>

                    <p className="text-white/45 text-[11px] mt-1">
                      Manage user access and security
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="relative shrink-0">

              {/* PROFILE BUTTON */}
              <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-3 rounded-full bg-black/30 backdrop-blur-sm px-4 py-3"
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

                  <p className="text-white text-[15px] font-semibold max-w-[70px] truncate">
                    {user?.username || 'hr'}
                  </p>

                  <p className="text-white/50 text-[12px]">
                    {user?.role === 'HR' ? 'HR' : 'Admin'}
                  </p>
                </div>

                {/* CHEVRON */}
                <ChevronDown className="w-4 h-4 text-white/50" />

                {/* BELL */}
                <div className="relative ml-1">

                  <Bell className="w-5 h-5 text-white/90" />

                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center shadow-[0_0_12px_rgba(255,0,0,0.8)]">
                    3
                  </span>
                </div>
              </button>

              {/* DROPDOWN */}
              {open && (
                <div className="absolute right-0 top-[72px] w-60 rounded-2xl bg-[#0a0a0a] shadow-[0_20px_60px_rgba(0,0,0,0.75)] overflow-hidden z-50">

                  {/* HEADER */}
                  <div className="px-4 py-3 border-b border-white/5">

                    <p className="text-red-400 text-[10px] uppercase tracking-[0.2em] font-bold">
                      Account
                    </p>
                  </div>

                  {/* USER */}
                  <div className="px-4 py-4 flex items-center gap-3">

                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center text-white font-bold">
                      {user?.username?.charAt(0)?.toUpperCase() || 'A'}
                    </div>

                    <div>

                      <p className="text-white text-sm font-semibold">
                        {user?.username || 'admin'}
                      </p>

                      <p className="text-white/50 text-xs">
                        {user?.role === 'HR' ? 'HR' : 'Admin'}
                      </p>
                    </div>
                  </div>

                  {/* THEME */}
                  <div className="px-4 py-3 border-t border-b border-white/5 flex items-center gap-2">

                    {isDarkMode ? (
                      <Moon className="w-4 h-4 text-white/70" />
                    ) : (
                      <Sun className="w-4 h-4 text-yellow-400" />
                    )}

                    <span className="text-sm text-white/70">
                      {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                    </span>
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