import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { EmployeeManagePanel } from '@/components/EmployeeManagePanel';
import { AddEmployee } from '@/pages/admin/AddEmployee';

import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useTheme, ThemeToggle } from '@/context/ThemeContext';

import {
  User,
  ChevronDown,
  LogOut,
  Sun,
  Moon,
  Plus
} from 'lucide-react';

export const AdminEmployeesPage = () => {
  const { canEditEmployeeInfo, logout } = useAuth();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Add Employee Page
  if (showAdd) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar
            open={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />
        </div>

        <div className="p-4 lg:p-6 lg:ml-64 pb-32 lg:pb-6">
          <AddEmployee
            onClose={() => setShowAdd(false)}
            onCancel={() => setShowAdd(false)}
            onCreated={() => setShowAdd(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>

      <div className="p-4 lg:p-6 lg:ml-64 space-y-6 max-md:space-y-4 pb-32 lg:pb-6 max-md:p-3">
        
        {/* MOBILE HEADER */}
        <div className="flex items-center justify-between md:hidden">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Employee Management
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Manage employees and their information
            </p>
          </div>

          <div
            onClick={() =>
              setShowProfileDropdown(!showProfileDropdown)
            }
            className="relative flex items-center gap-2 bg-[#111827] px-3 py-1.5 rounded-full border border-gray-800 cursor-pointer active:bg-gray-800 transition-all select-none"
          >
            <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-gray-300" />
            </div>

            <span className="text-xs font-medium text-gray-300">
              Admin
            </span>

            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />

            {showProfileDropdown && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-[#111827] border border-gray-800 rounded-xl shadow-xl p-1 z-[9999]">
                <div className="px-3 py-1.5 border-b border-gray-800 text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                  Admin Panel
                </div>

                <div className="w-full flex items-center justify-between px-3 py-2 text-left text-xs text-gray-300 rounded-lg">
                  <div className="flex items-center gap-2">
                    {isDarkMode ? (
                      <Sun className="w-3.5 h-3.5 text-yellow-400" />
                    ) : (
                      <Moon className="w-3.5 h-3.5 text-blue-400" />
                    )}

                    <span className="text-xs">
                      {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                    </span>
                  </div>

                  <div
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ThemeToggle />
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10 active:bg-red-500/20 rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* DESKTOP HEADER */}
        <div className="hidden md:flex items-center justify-between">
          <div>
            <h1 className="text-3xl max-md:text-2xl font-bold mb-2 max-md:mb-1">
              Employee Management
            </h1>

            <p className="text-gray-600 dark:text-gray-400 max-md:text-xs">
              Manage employees and their information
            </p>
          </div>

          {canEditEmployeeInfo && (
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            >
              Add Employee
            </button>
          )}
        </div>

        {/* EMPLOYEE PANEL */}
        <EmployeeManagePanel />

        {/* MOBILE FLOATING ADD BUTTON */}
        {canEditEmployeeInfo && (
          <button
            onClick={() => setShowAdd(true)}
            className="
              md:hidden
              fixed
              bottom-24
              right-4
              z-50
              w-14
              h-14
              rounded-full
              bg-blue-600
              hover:bg-blue-700
              text-white
              shadow-xl
              flex
              items-center
              justify-center
            "
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};

export default AdminEmployeesPage;
