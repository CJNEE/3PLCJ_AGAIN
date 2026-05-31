import React, { useState, useEffect } from 'react';
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
  const [pulseIds, setPulseIds] = useState<Set<number>>(new Set());
  const intervalMs = 5000; // fixed 5s refresh
  const prevIdsRef = React.useRef<Set<number>>(new Set());

  const fetchOnline = async () => {
    try {
      const res = await employeeAPI.getOnlineEmployees();
      const list = res?.employees || [];
      setOnline(Array.isArray(list) ? list : []);

      const newIds = new Set<number>((list || []).map((e: any) => e.id));
      const prev = prevIdsRef.current;
      const newlyOnline: number[] = [];
      for (const id of newIds) if (!prev.has(id)) newlyOnline.push(id);

      if (newlyOnline.length) {
        setPulseIds((prevSet) => {
          const next = new Set(prevSet);
          newlyOnline.forEach((id) => next.add(id));
          return next;
        });
        setTimeout(() => {
          setPulseIds((prevSet) => {
            const next = new Set(prevSet);
            newlyOnline.forEach((id) => next.delete(id));
            return next;
          });
        }, 2500);
      }

      prevIdsRef.current = newIds;
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchOnline();
    const id = setInterval(fetchOnline, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  if (!online.length) return null;

  return (
    <div>
      <style>{`
        @keyframes online-pulse { 0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.6); } 70% { box-shadow: 0 0 0 8px rgba(34,197,94,0); } 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); } }
      `}</style>

      <div className="mb-4">
        <div className="rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.06] p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">Online Now</div>
            <div className="text-xs text-gray-400">Auto-refresh: 5s</div>
          </div>

          <div className="w-full overflow-x-auto hide-scrollbar">
            <div className="flex items-center gap-3 py-2">
              {online.map((e: any) => {
                const isPulsing = pulseIds.has(e.id);
                return (
                  <div key={e.id} className="flex flex-col items-center text-center w-16">
                    <div className="relative w-12 h-12">
                      {e.profile_image ? (
                        <img src={e.profile_image} alt={e.full_name} className="w-12 h-12 rounded-full object-cover border-2 border-white" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-teal-500 flex items-center justify-center text-white font-bold">{(e.firstname || '')[0]}{(e.lastname || '')[0]}</div>
                      )}

                      <span className="absolute right-0 bottom-0 inline-block w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-white" />
                      {isPulsing && (
                        <span className="absolute right-0 bottom-0 inline-block w-3 h-3 rounded-full bg-emerald-400 opacity-40" style={{ animation: 'online-pulse 1.6s ease-out' }} />
                      )}
                    </div>

                    <div className="text-xs text-gray-700 dark:text-gray-200 truncate mt-1 max-w-[64px]">{e.full_name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AdminEmployeesPage = () => {
  const { user, canEditEmployeeInfo, logout, canViewEmployees } = useAuth();
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

        {/* Mobile title removed — AdminMobileProfile provides the header */}

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
