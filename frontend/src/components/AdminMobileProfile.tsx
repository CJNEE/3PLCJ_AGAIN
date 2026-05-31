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

  const path = typeof window !== 'undefined' ? window.location.pathname : '/admin';
  const IconComp = iconMap[path] || Grid;
  const Subtitle = path.replace('/admin', '').replace('/', '') || 'Dashboard';

  return (
    <div className="block md:hidden px-4">
      <div className="w-full mt-3">
        <div className="w-full rounded-2xl overflow-hidden bg-gradient-to-r from-[#0b1820] via-[#0b2430] to-[#1a2a33] shadow-lg border border-white/6 p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-400 rounded-lg flex items-center justify-center shadow-inner">
              <img src="/MOBILELOGOLOGIN.png" alt="logo" className="h-10 w-auto" />
            </div>

            <div className="flex flex-col">
              <div className="text-white text-sm font-bold">3PL BUSINESS SOLUTIONS</div>
              <div className="text-white/70 text-xs">Manage company operations efficiently</div>
              <div className="mt-1 flex items-center gap-2 text-xs text-white/60">
                <IconComp className="w-4 h-4 opacity-90" />
                <span className="truncate max-w-[140px]">{Subtitle}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="w-6 h-6 text-white/90" />
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full">3</span>
            </div>

            <div
              onClick={() => setOpen(!open)}
              className="flex items-center gap-3 px-3 py-2 rounded-full bg-white/5 border border-white/6 backdrop-blur-md cursor-pointer select-none"
              style={{ minWidth: 160 }}
            >
              <div style={{ position: 'relative' }}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-teal-400 flex items-center justify-center text-white font-bold">
                  {user?.username?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <span className="absolute right-0 bottom-0 w-3 h-3 rounded-full border-2 border-white" style={{ background: '#16A34A' }} />
              </div>

              <div className="flex flex-col text-left truncate">
                <span className="text-sm font-semibold text-white truncate">{user?.username || 'admin'}</span>
                <span className="text-xs text-white/70">{user?.role === 'HR' ? 'HR' : 'Admin'}</span>
              </div>

              <ChevronDown className="w-4 h-4 text-white/80" />
            </div>

            {open && (
              <div className="absolute right-4 mt-24 w-56 bg-white/6 border border-white/12 rounded-xl shadow-xl p-2 z-50 backdrop-blur-sm">
                <div className="px-3 py-1.5 border-b border-white/8 text-xs text-white/80 font-bold uppercase tracking-wider">Account</div>
                <div className="px-3 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isDarkMode ? <Moon className="w-4 h-4 text-white/80" /> : <Sun className="w-4 h-4 text-yellow-400" />}
                    <span className="text-xs text-white/80 font-medium">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full mt-2 flex items-center gap-2 px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10 rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminMobileProfile;
