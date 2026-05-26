import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

import {
  LayoutDashboard,
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

  const rawRole = (user?.role || '')
    .toString()
    .trim()
    .toLowerCase();

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
      icon: LayoutDashboard,
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
          fixed
          bottom-4
          left-0
          right-0
          z-[9999]
          flex
          justify-center
          px-4
          lg:hidden
          ${className}
        `}
      >
        <div className="relative w-full max-w-[560px]">
          {/* GLASS BACKGROUND */}
          <div
            className="
              absolute
              inset-0
              h-[88px]
              rounded-[32px]
              border border-white/20
              bg-white/10
              dark:bg-[#081120]/75
              backdrop-blur-3xl
              shadow-[0_8px_30px_rgba(0,0,0,0.25)]
            "
          />

          {/* NAV SCROLLER */}
          <div
            className="
              relative
              overflow-x-auto
              scrollbar-hide
              px-2
              py-2
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
                      flex
                      items-center
                      justify-center
                      min-w-[74px]
                      h-[78px]
                    "
                  >
                    {/* FLOATING ACTIVE CIRCLE */}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        transition={{
                          type: 'spring',
                          stiffness: 350,
                          damping: 24,
                        }}
                        className="
                          absolute
                          -top-5
                          w-[58px]
                          h-[58px]
                          rounded-full
                          bg-white
                          dark:bg-[#111827]
                          border border-white/40
                          dark:border-white/10
                          shadow-[0_10px_25px_rgba(0,0,0,0.18)]
                          z-0
                        "
                      />
                    )}

                    {/* CONTENT */}
                    <motion.div
                      whileTap={{ scale: 0.92 }}
                      animate={{
                        y: isActive ? -18 : 0,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 25,
                      }}
                      className="
                        relative
                        z-10
                        flex
                        flex-col
                        items-center
                        justify-center
                        gap-1
                      "
                    >
                      {/* ICON */}
                      <div
                        className={`
                          transition-all
                          duration-300
                          ${
                            isActive
                              ? 'text-red-500'
                              : 'text-gray-500 dark:text-gray-400'
                          }
                        `}
                      >
                        <Icon
                          size={22}
                          strokeWidth={2.4}
                        />
                      </div>

                      {/* LABEL */}
                      <motion.span
                        animate={{
                          opacity: isActive ? 1 : 0.65,
                          y: isActive ? 8 : 0,
                        }}
                        transition={{
                          duration: 0.25,
                        }}
                        className={`
                          text-[10px]
                          font-semibold
                          tracking-wide
                          transition-colors
                          duration-300
                          whitespace-nowrap
                          ${
                            isActive
                              ? 'text-red-500 dark:text-red-400'
                              : 'text-gray-500 dark:text-gray-400'
                          }
                        `}
                      >
                        {item.label}
                      </motion.span>
                    </motion.div>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SPACER */}
      <div className="h-28 lg:hidden" />
    </>
  );
};

export default BottomNavigation;