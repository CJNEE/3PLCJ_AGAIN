import React from 'react';
import { User, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/context/ThemeContext';

export const AdminMobileProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = React.useState(false);

  const handleLogout = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    logout();
    // navigation handled by callers if necessary
  };

  return (
    <div className="block md:hidden">
      <div className="flex items-center justify-between p-3">
        <div>
          <h2 className="text-lg font-semibold">{user?.role === 'HR' ? 'HR Panel' : 'Admin'}</h2>
          <p className="text-xs text-gray-500">{user?.username || ''}</p>
        </div>
        <div
          onClick={() => setOpen(!open)}
          className="relative flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-gray-200/10 cursor-pointer select-none"
        >
          <div className="w-8 h-8 rounded-full bg-[#8B0000] flex items-center justify-center text-white font-bold">
            {user?.username?.charAt(0)?.toUpperCase()}
          </div>
          <span className="text-sm font-medium text-gray-200">Admin</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />

          {open && (
            <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-[#0f1724] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-2 z-50">
              <div className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-700 text-xs text-gray-500 font-bold uppercase tracking-wider">
                Admin Panel
              </div>
              <div className="px-2 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <User className="w-4 h-4" />
                  <span>Theme</span>
                </div>
                <ThemeToggle />
              </div>
              <button
                onClick={handleLogout}
                className="w-full mt-1 flex items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMobileProfile;
