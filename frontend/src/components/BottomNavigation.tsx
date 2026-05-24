import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  const location = useLocation();

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
      label: 'Home',
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
      {/* MOBILE NAV */}
      <div
        className={`
          fixed bottom-4 left-0 right-0
          z-[9999]
          lg:hidden
          flex justify-center
          px-3
          ${className}
        `}
      >
        <div
          className="
            relative
            w-full max-w-[540px]
            overflow-x-auto
            scrollbar-hide
            rounded-[32px]
            border border-white/20
            bg-white/70 dark:bg-[#111827]/70
            backdrop-blur-3xl
            shadow-[0_8px_40px_rgba(0,0,0,0.15)]
            px-2 py-3
          "
        >
          <div className="flex items-center gap-1 min-w-max">
            {navItems.map((item) => {
              const Icon = item.icon;

              const isActive =
                item.path === basePath
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="
                    relative
                    flex flex-col items-center justify-center
                    min-w-[72px]
                    h-[64px]
                  "
                >
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    animate={{
                      y: isActive ? -16 : 0,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 22,
                    }}
                    className="relative flex flex-col items-center"
                  >
                    {/* ACTIVE BACKGROUND */}
                    {isActive && (
                      <motion.div
                        layoutId="bottom-nav-pill"
                        transition={{
                          type: 'spring',
                          stiffness: 500,
                          damping: 35,
                        }}
                        className="
                          absolute
                          -top-1
                          w-[58px]
                          h-[58px]
                          rounded-2xl
                          bg-gradient-to-b
                          from-red-500
                          to-red-700
                          shadow-[0_10px_25px_rgba(220,38,38,0.45)]
                          border border-white/20
                        "
                      />
                    )}

                    {/* ICON */}
                    <div
                      className={`
                        relative z-10
                        flex items-center justify-center
                        w-[58px]
                        h-[58px]
                        rounded-2xl
                        transition-all duration-300
                        ${
                          isActive
                            ? 'text-white'
                            : 'text-gray-500 dark:text-gray-400'
                        }
                      `}
                    >
                      <Icon
                        size={22}
                        className={`
                          transition-all duration-300
                          ${isActive ? 'scale-110' : ''}
                        `}
                      />
                    </div>

                    {/* LABEL */}
                    <span
                      className={`
                        mt-1 text-[10px]
                        font-bold tracking-wide
                        transition-all duration-300
                        ${
                          isActive
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-500 dark:text-gray-400'
                        }
                      `}
                    >
                      {item.label}
                    </span>

                    {/* GLOW DOT */}
                    {isActive && (
                      <motion.div
                        layoutId="bottom-dot"
                        className="
                          absolute
                          -bottom-2
                          w-1.5 h-1.5
                          rounded-full
                          bg-red-500
                        "
                      />
                    )}
                  </motion.div>
                </NavLink>
              );
            })}
          </div>

          {/* GLASS SHINE */}
          <div
            className="
              pointer-events-none
              absolute inset-0
              rounded-[32px]
              bg-gradient-to-b
              from-white/30
              to-transparent
            "
          />
        </div>
      </div>

      {/* SPACER */}
      <div className="h-28 lg:hidden" />
    </>
  );
};

export default BottomNavigation;