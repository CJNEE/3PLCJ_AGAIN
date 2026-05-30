import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { EmployeeManagePanel } from '@/components/EmployeeManagePanel';
import { AddEmployee } from '@/pages/admin/AddEmployee';

import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useTheme, ThemeToggle } from '@/context/ThemeContext';

import {
  ChevronDown,
  LogOut,
  Sun,
  Moon,
  Plus,
  User,
} from 'lucide-react';

export const AdminEmployeesPage = () => {
  const { user, canEditEmployeeInfo, logout } = useAuth();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (showAdd) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
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

      <div className="px-4 pt-5 lg:p-6 lg:ml-64 space-y-6 max-md:space-y-4 pb-32 lg:pb-6">

        {/* MOBILE HEADER */}
        <div className="md:hidden flex justify-between items-start">
          <div>
            <h1 className="text-[2rem] leading-[1.05] font-bold text-gray-900 dark:text-white tracking-tight">
              Employee
              <br />
              Management
            </h1>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-[220px]">
              Manage employees and their information
            </p>
          </div>

          <div className="relative">
            <button
              onClick={() =>
                setShowProfileDropdown(!showProfileDropdown)
              }
              className="
                flex
                items-center
                gap-2
                h-12
                px-4
                rounded-full
                bg-white
                dark:bg-[#111827]
                border
                border-gray-200
                dark:border-gray-700
                shadow-sm
                transition-all
              "
            >
              <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-gray-500 dark:text-gray-300" />
              </div>

              <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 max-w-[90px] truncate">
                {user?.username || 'Admin'}
              </span>

              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  showProfileDropdown ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showProfileDropdown && (
              <div
                className="
                  absolute
                  right-0
                  top-full
                  mt-2
                  w-48
                  overflow-hidden
                  rounded-2xl
                  bg-white
                  dark:bg-[#111827]
                  border
                  border-gray-200
                  dark:border-gray-700
                  shadow-xl
                  z-[9999]
                "
              >
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {user?.username || 'Admin'}
                  </p>

                  <p className="text-[10px] uppercase tracking-wider text-gray-500">
                    {user?.role || 'Administrator'}
                  </p>
                </div>

                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    {isDarkMode ? (
                      <Sun className="w-4 h-4 text-yellow-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-blue-400" />
                    )}

                    <span className="text-sm text-gray-700 dark:text-gray-300">
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
                  className="
                    w-full
                    flex
                    items-center
                    gap-2
                    px-4
                    py-3
                    text-red-500
                    hover:bg-red-50
                    dark:hover:bg-red-500/10
                    transition-colors
                  "
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* DESKTOP HEADER */}
        <div className="hidden md:flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Employee Management
            </h1>

            <p className="text-gray-600 dark:text-gray-400">
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
