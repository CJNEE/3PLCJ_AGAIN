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

  const Subtitle =
    path.replace('/admin', '').replace('/', '') || 'Dashboard';

  return (
    <div className="block md:hidden px-4 pt-3">
      <div className="relative overflow-visible rounded-[28px] border border-red-500/20 bg-[#050505] shadow-[0_0_45px_rgba(255,0,0,0.12)]">

        {/* RED GLOW */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,0,0,0.25),transparent_40%)]" />

        {/* SOFT LIGHT */}
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent)]" />

        <div className="relative z-10 p-4">

          {/* TOP */}
          <div className="flex items-start justify-between gap-3">

            {/* LEFT SIDE */}
            <div className="flex items-center gap-3 flex-1 min-w-0">

              {/* LOGO */}
              <div className="relative shrink-0">

                <div className="absolute inset-0 rounded-2xl bg-red-500 blur-xl opacity-30" />

                <div className="relative w-14 h-14 rounded-2xl border border-red-500/20 bg-gradient-to-br from-[#181818] to-[#050505] flex items-center justify-center overflow-hidden">
                  <img
                    src="/MOBILELOGOLOGIN.png"
                    alt="logo"
                    className="h-10 w-auto object-contain"
                  />
                </div>
              </div>

              {/* TEXT */}
              <div className="min-w-0">

                <h1 className="text-white text-[15px] font-black leading-tight tracking-wide">
                  3PL BUSINESS
                </h1>

                <p className="text-[11px] text-red-400 font-semibold uppercase tracking-[0.15em] mt-0.5">
                  Access Control
                </p>

                <div className="flex items-center gap-1 mt-2 text-white/45 text-[10px]">
                  <IconComp className="w-3 h-3" />

                  <span className="truncate capitalize">
                    {Subtitle}
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-2 shrink-0">

              {/* BELL */}
              <button className="relative w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl flex items-center justify-center">

                <Bell className="w-5 h-5 text-white/90" />

                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center shadow-[0_0_10px_rgba(255,0,0,0.8)]">
                  3
                </span>
              </button>

              {/* PROFILE */}
              <div className="relative">

                <button
                  onClick={() => setOpen(!open)}
                  className="flex items-center gap-2 rounded-2xl border border-red-500/20 bg-white/[0.04] backdrop-blur-xl px-2.5 py-2"
                >

                  {/* AVATAR */}
                  <div className="relative shrink-0">

                    <div className="absolute inset-0 rounded-full bg-red-500 blur-md opacity-40" />

                    <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 border border-red-400/30 flex items-center justify-center text-white font-bold">
                      {user?.username?.charAt(0)?.toUpperCase() || 'A'}
                    </div>

                    {/* ONLINE */}
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-[#050505]" />
                  </div>

                  {/* USER INFO */}
                  <div className="text-left leading-tight hidden xs:block">

                    <div className="text-white text-sm font-semibold max-w-[70px] truncate">
                      {user?.username || 'admin'}
                    </div>

                    <div className="text-red-400 text-[10px] uppercase tracking-wide">
                      {user?.role === 'HR' ? 'HR' : 'Admin'}
                    </div>
                  </div>

                  <ChevronDown className="w-4 h-4 text-white/50" />
                </button>

                {/* DROPDOWN */}
                {open && (
                  <div className="absolute right-0 top-16 w-60 rounded-2xl border border-red-500/20 bg-[#0a0a0a]/95 backdrop-blur-2xl shadow-[0_0_40px_rgba(255,0,0,0.15)] overflow-hidden z-50">

                    {/* HEADER */}
                    <div className="px-4 py-3 border-b border-white/5">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-red-400 font-bold">
                        Account
                      </p>
                    </div>

                    {/* USER */}
                    <div className="px-4 py-3 flex items-center gap-3 border-b border-white/5">

                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold">
                        {user?.username?.charAt(0)?.toUpperCase() || 'A'}
                      </div>

                      <div>
                        <p className="text-white text-sm font-semibold">
                          {user?.username || 'admin'}
                        </p>

                        <p className="text-red-400 text-xs">
                          {user?.role === 'HR' ? 'HR' : 'Admin'}
                        </p>
                      </div>
                    </div>

                    {/* THEME */}
                    <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">

                      <div className="flex items-center gap-2">
                        {isDarkMode ? (
                          <Moon className="w-4 h-4 text-white/80" />
                        ) : (
                          <Sun className="w-4 h-4 text-yellow-400" />
                        )}

                        <span className="text-sm text-white/80">
                          {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                        </span>
                      </div>
                    </div>

                    {/* LOGOUT */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-white/90 hover:bg-red-500/10 transition-all duration-300"
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