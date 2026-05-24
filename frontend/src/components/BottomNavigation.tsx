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
            overflow-hidden
            rounded-[30px]

            border border-white/20
            dark:border-gray-700/50

            bg-white/80
            dark:bg-gray-900/85

            backdrop-blur-2xl

            shadow-[0_-10px_40px_rgba(0,0,0,0.18)]

            before:absolute
            before:inset-0
            before:bg-gradient-to-r
            before:from-red-500/5
            before:via-transparent
            before:to-red-500/5
          "
        >
          {/* TOP GLOW */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/60 to-transparent" />

          {/* NAV ITEMS */}
          <div
            className="
              relative
              flex items-center
              gap-2
              overflow-x-auto
              scrollbar-hide
              px-2 py-3
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
                      group
                      relative
                      flex flex-col items-center justify-center

                      min-w-[76px]
                      px-3 py-2.5

                      rounded-2xl

                      transition-all duration-300 ease-out

                      active:scale-95

                      ${
                        isActive
                          ? `
                            bg-gradient-to-b
                            from-red-500
                            to-red-700

                            text-white

                            shadow-lg
                            shadow-red-700/30

                            scale-[1.02]
                          `
                          : `
                            text-gray-500
                            dark:text-gray-400

                            hover:bg-gray-100/80
                            dark:hover:bg-gray-800/70

                            hover:text-red-600
                            dark:hover:text-red-400

                            hover:-translate-y-1
                          `
                      }
                    `
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* ACTIVE GLOW */}
                      {isActive && (
                        <div
                          className="
                            absolute inset-0
                            rounded-2xl

                            bg-gradient-to-br
                            from-red-400/20
                            to-red-900/20

                            blur-xl
                            opacity-80
                          "
                        />
                      )}

                      {/* ICON */}
                      <div
                        className={`
                          relative z-10

                          flex items-center justify-center

                          w-10 h-10
                          rounded-xl

                          transition-all duration-300

                          ${
                            isActive
                              ? `
                                bg-white/15
                                backdrop-blur-md
                                shadow-inner
                              `
                              : `
                                group-hover:bg-red-50
                                dark:group-hover:bg-red-900/20
                              `
                          }
                        `}
                      >
                        <Icon
                          size={20}
                          className={`
                            transition-all duration-300

                            ${
                              isActive
                                ? 'scale-110'
                                : 'group-hover:scale-110'
                            }
                          `}
                        />
                      </div>

                      {/* LABEL */}
                      <span
                        className="
                          relative z-10
                          mt-1.5

                          text-[10px]
                          font-extrabold
                          tracking-wide
                          whitespace-nowrap

                          transition-all duration-300
                        "
                      >
                        {item.label}
                      </span>

                      {/* ACTIVE DOT */}
                      {isActive && (
                        <div
                          className="
                            absolute top-1.5

                            w-1.5 h-1.5
                            rounded-full

                            bg-white

                            shadow-[0_0_10px_rgba(255,255,255,0.9)]
                          "
                        />
                      )}

                      {/* HOVER LIGHT */}
                      {!isActive && (
                        <div
                          className="
                            absolute inset-0
                            rounded-2xl

                            opacity-0
                            group-hover:opacity-100

                            transition-opacity duration-300

                            bg-gradient-to-b
                            from-white/40
                            to-transparent

                            pointer-events-none
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
      <div className="h-28 lg:hidden" />
    </>
  );
};

export default BottomNavigation;