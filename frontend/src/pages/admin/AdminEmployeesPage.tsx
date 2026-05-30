import { useState, useEffect } from 'react';
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

import AdminMobileProfile from '@/components/AdminMobileProfile';
import { employeeAPI } from '@/api/apiService';

const OnlinePresence: React.FC = () => {
  const [online, setOnline] = useState<any[]>([]);

  const fetchOnline = async () => {
    try {
      const res = await employeeAPI.getOnlineEmployees();
      setOnline(res.employees || []);
    } catch (err) {
      // ignore silently
    }
  };

  useEffect(() => {
    fetchOnline();
    const id = setInterval(fetchOnline, 15000);
    return () => clearInterval(id);
  }, []);

  if (!online.length) return null;

  return (
    <div className="w-full overflow-x-auto hide-scrollbar">
      <div className="flex items-center gap-3 py-2">
        {online.map((e: any) => (
          <div key={e.id} className="flex flex-col items-center text-center w-16">
            <div className="relative w-10 h-10">
              {e.profile_image ? (
                <img src={e.profile_image} alt={e.full_name} className="w-10 h-10 rounded-full object-cover border-2 border-white" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-teal-500 flex items-center justify-center text-white font-bold">{(e.firstname||'')[0]}{(e.lastname||'')[0]}</div>
              )}

              {/* Online indicator - small green ring at bottom-right */}
              <span className="absolute right-0 bottom-0 inline-block w-3 h-3 rounded-full bg-green-400 ring-2 ring-white" />
            </div>

            <div className="text-xs text-gray-700 dark:text-gray-200 truncate mt-1">{e.full_name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

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
        <AdminMobileProfile />

        {/* ONLINE PRESENCE (Admins/HR only) */}
        {canViewEmployees && (
          <div className="mt-3 md:mt-0">
            <OnlinePresence />
          </div>
        )}

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
              bottom-20
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
