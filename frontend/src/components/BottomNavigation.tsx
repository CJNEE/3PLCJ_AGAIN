import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  Home,
  Users,
  MapPin,
  FileText,
  CalendarDays,
  Lock,
  Clock,
  DollarSign,
  Activity,
  AlertTriangle,
} from 'lucide-react';

type BottomNavigationProps = {
  className?: string;
};

export const BottomNavigation = ({
  className = '',
}: BottomNavigationProps) => {
  const { user } = useAuth();

  const rawRole = (user?.role || '').toString().trim().toLowerCase();

  const normalizedRole =
    rawRole.includes('admin')
      ? 'admin'
      : rawRole.includes('hr')
      ? 'hr'
      : rawRole;

  const basePath =
    normalizedRole === 'admin'
      ? '/admin'
      : normalizedRole === 'hr'
      ? '/hr'
      : '/employee';

  const navItems = [
    {
      label: 'Dashboard',
      icon: Home,
      path: basePath,
    },
    {
      label: 'Employees',
      icon: Users,
      path: `${basePath}/employees`,
    },
    {
      label: 'Hubs',
      icon: MapPin,
      path: `${basePath}/hubs`,
    },
    {
      label: 'Edit',
      icon: FileText,
      path: `${basePath}/edit-requests`,
    },
    {
      label: 'Leave',
      icon: CalendarDays,
      path: `${basePath}/leave-requests`,
    },
    {
      label: 'Access',
      icon: Lock,
      path: `${basePath}/access-control`,
    },
    {
      label: 'Attendance',
      icon: Clock,
      path: `${basePath}/attendance`,
    },
    {
      label: 'Payroll',
      icon: DollarSign,
      path: `${basePath}/payslip`,
    },
    {
      label: 'Logs',
      icon: Activity,
      path: `${basePath}/activity-logs`,
    },
    {
      label: 'Alerts',
      icon: AlertTriangle,
      path: `${basePath}/security-alerts`,
    },
  ];

  return (
    <>
      {/* MOBILE ONLY */}
      <div
        className={`
          fixed bottom-0 left-0 right-0
          z-[9999]
          lg:hidden
          ${className}
        `}
      >
        <div
          className="
            bg-white/95 dark:bg-gray-900/95
            backdrop-blur-2xl
            border-t border-gray-200 dark:border-gray-800
            shadow-2xl
          "
        >
          <div
            className="
              flex items-center
              overflow-x-auto
              scrollbar-hide
              px-2 py-2 gap-2
            "
          >
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === basePath}
                  className={({ isActive }) =>
                    `
                      relative
                      flex flex-col items-center justify-center
                      min-w-[72px]
                      px-3 py-2
                      rounded-2xl
                      transition-all duration-300
                      ${
                        isActive
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }
                    `
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={20}
                        className={`
                          mb-1 transition-all duration-300
                          ${isActive ? 'scale-110' : ''}
                        `}
                      />

                      <span className="text-[10px] font-bold whitespace-nowrap">
                        {item.label}
                      </span>

                      {isActive && (
                        <div
                          className="
                            absolute top-1
                            w-1.5 h-1.5
                            rounded-full
                            bg-red-600
                          "
                        />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* SPACER */}
      <div className="h-24 lg:hidden" />
    </>
  );
};

export default BottomNavigation;