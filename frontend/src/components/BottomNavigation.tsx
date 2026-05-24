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
      {/* MOBILE NAVIGATION */}
      <div
        className={`
          fixed bottom-0 left-0 right-0
          z-[9999]
          lg:hidden
          px-3 pb-3
          ${className}
        `}
      >
        <div
          className="
            relative
            overflow-x-auto
            scrollbar-hide
            rounded-[2rem]
            border border-white/20
            bg-white/80 dark:bg-gray-900/80
            backdrop-blur-2xl
            shadow-[0_10px_40px_rgba(0,0,0,0.18)]
          "
        >
          {/* Gradient Glow */}
          <div
            className="
              pointer-events-none
              absolute inset-0
              bg-gradient-to-r
              from-red-500/5
              via-transparent
              to-red-500/5
            "
          />

          <div
            className="
              relative
              flex items-end
              gap-2
              px-3
              py-3
              min-w-max
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
                      flex
                      flex-col
                      items-center
                      justify-end
                      min-w-[74px]
                      transition-all
                      duration-500
                      ease-out
                      group
                      ${
                        isActive
                          ? '-translate-y-3'
                          : 'translate-y-0'
                      }
                    `
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* ACTIVE GLOW */}
                      {isActive && (
                        <>
                          <div
                            className="
                              absolute
                              top-0
                              w-16
                              h-16
                              rounded-full
                              bg-red-500/20
                              blur-2xl
                              animate-pulse
                            "
                          />

                          <div
                            className="
                              absolute
                              -bottom-1
                              w-10
                              h-1
                              rounded-full
                              bg-red-500
                              blur-sm
                            "
                          />
                        </>
                      )}

                      {/* ICON CONTAINER */}
                      <div
                        className={`
                          relative
                          z-10
                          flex
                          items-center
                          justify-center
                          transition-all
                          duration-500
                          rounded-2xl
                          border
                          ${
                            isActive
                              ? `
                                w-14 h-14
                                bg-gradient-to-br
                                from-red-500
                                to-red-700
                                border-red-400/40
                                shadow-[0_12px_30px_rgba(239,68,68,0.45)]
                              `
                              : `
                                w-12 h-12
                                bg-white/70 dark:bg-gray-800/70
                                border-gray-200 dark:border-gray-700
                                group-hover:-translate-y-1
                                group-hover:shadow-lg
                              `
                          }
                        `}
                      >
                        <Icon
                          size={isActive ? 24 : 21}
                          className={`
                            transition-all
                            duration-500
                            ${
                              isActive
                                ? 'text-white scale-110'
                                : 'text-gray-500 dark:text-gray-400 group-hover:scale-110'
                            }
                          `}
                        />
                      </div>

                      {/* LABEL */}
                      <span
                        className={`
                          mt-2
                          text-[10px]
                          font-extrabold
                          tracking-wide
                          transition-all
                          duration-300
                          whitespace-nowrap
                          ${
                            isActive
                              ? 'text-red-600 dark:text-red-400 scale-105'
                              : 'text-gray-500 dark:text-gray-400'
                          }
                        `}
                      >
                        {item.label}
                      </span>

                      {/* ACTIVE DOT */}
                      <div
                        className={`
                          mt-1
                          transition-all
                          duration-300
                          rounded-full
                          ${
                            isActive
                              ? 'w-5 h-1 bg-red-500'
                              : 'w-1 h-1 bg-transparent'
                          }
                        `}
                      />
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* SPACER */}
      <div className="h-32 lg:hidden" />
    </>
  );
};

export default BottomNavigation;