import React from 'react';
import {
  User,
  ChevronDown,
  LogOut,
  Grid,
  MapPin,
  Users,
  Edit3,
  Calendar,
  Wallet,
  Clock,
  Activity,
  Shield,
  Lock,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme, ThemeToggle } from '@/context/ThemeContext';

const iconMap: Record<string, any> = {
  '/admin': Grid,
  '/admin/hubs': MapPin,
  '/admin/employees': Users,
  '/admin/edit-requests': Edit3,
  '/admin/leave-requests': Calendar,
  '/admin/payslip': Wallet,
  '/admin/attendance': Clock,
  '/admin/activity-logs': Activity,
  '/admin/security-alerts': Shield,
  '/admin/access-control': Lock,
};

const subtitleMap: Record<string, string> = {
  '/admin': 'Manage company operations',
  '/admin/hubs': 'Manage all hub locations',
  '/admin/employees': 'View and manage employees',
  '/admin/edit-requests': 'Pending modification approvals',
  '/admin/leave-requests': 'Approve employee leave requests',
  '/admin/payslip': 'Salary and payroll overview',
  '/admin/attendance': 'Employee attendance tracking',
  '/admin/activity-logs': 'System and employee activities',
  '/admin/security-alerts': 'Monitor suspicious activities',
  '/admin/access-control': 'Manage permissions and roles',
};

export const AdminMobileProfile: React.FC<{ title?: string; subtitle?: string }> = ({ title, subtitle }) => {
  const { user, logout } = useAuth();
  const { isDarkMode } = useTheme();
  const [open, setOpen] = React.useState(false);

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/admin';
  const routeKey = Object.keys(subtitleMap).find((k) => pathname.startsWith(k)) || '/admin';
  const Subtitle = subtitle || subtitleMap[routeKey];
  const IconComp = iconMap[routeKey] || User;

  const handleLogout = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    logout();
  };

  return (
    <div className="block md:hidden">
      <div
        className="w-full rounded-b-2xl text-white"
        style={{
          paddingTop: 'env(safe-area-inset-top,8px)',
          height: 68,
          background: 'linear-gradient(90deg, #04263A 0%, #0B6B8A 50%, #03394A 100%)',
          boxShadow: '0 6px 18px rgba(2,8,23,0.28), 0 1px 4px rgba(4,6,14,0.45)',
        }}
      >
        <div className="flex items-center justify-between px-4" style={{ height: '100%' }}>
          {/* Left: Logo + Text */}
          <div className="flex items-center gap-3">
            <img
              src="/MOBILELOGOLOGIN.png"
              alt="logo"
              style={{ height: 54, width: 'auto' }}
              className="rounded"
            />

            <div>
              <div className="text-white text-sm font-semibold uppercase tracking-wider">3PL BUSINESS</div>
              <div className="text-white text-xs font-medium uppercase tracking-wide opacity-90">SOLUTIONS</div>
              <div className="mt-1 flex items-center gap-2 text-xs text-white/80">
                <IconComp className="w-4 h-4 opacity-90" />
                <span className="truncate max-w-[140px]">{Subtitle}</span>
              </div>
            </div>
          </div>

          {/* Right: Glass profile capsule */}
          <div className="flex items-center">
            <div
              onClick={() => setOpen(!open)}
              className="flex items-center gap-3 px-3 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md cursor-pointer select-none"
              style={{
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02), 0 6px 18px rgba(4,36,134,0.18)',
                borderRadius: 9999,
                minWidth: 150,
                maxWidth: 200,
              }}
            >
              <div style={{ position: 'relative' }}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-teal-400 flex items-center justify-center text-white font-bold">
                  {user?.username?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <span
                  className="absolute right-0 bottom-0 w-3 h-3 rounded-full border-2 border-white"
                  style={{ background: '#16A34A' }}
                />
              </div>

              <div className="flex flex-col text-left truncate">
                <span className="text-sm font-semibold text-white truncate">{user?.username || 'admin_test'}</span>
                <span className="text-xs text-white/70">{user?.role === 'HR' ? 'HR' : 'Administrator'}</span>
              </div>

              <ChevronDown className="w-4 h-4 text-white/80" />
            </div>

            {open && (
              <div className="absolute right-4 mt-20 w-56 bg-white/6 border border-white/12 rounded-xl shadow-xl p-2 z-50 backdrop-blur-sm">
                <div className="px-3 py-1.5 border-b border-white/8 text-xs text-white/80 font-bold uppercase tracking-wider">
                  Account
                </div>
                <div className="px-3 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isDarkMode ? <Moon className="w-4 h-4 text-white/80" /> : <Sun className="w-4 h-4 text-yellow-400" />}
                    <span className="text-xs text-white/80 font-medium">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <ThemeToggle />
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
};

export default AdminMobileProfile;
