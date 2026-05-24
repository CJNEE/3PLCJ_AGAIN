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
            rounded-[28px]
            border border-white/10
            bg-white/75 dark:bg-[#111827]/80
            backdrop-blur-2xl
            shadow-[0_8px_30px_rgba(0,0,0,0.15)]
          "
        >
          {/* Top Gradient Line */}
          <div
            className="
              absolute top-0 inset-x-0 h-[1px]
              bg-gradient-to-r
              from-transparent
              via-red-400/50
              to-transparent
            "
          />

          <div
            className="
              relative
              flex items-center
              gap-1.5
              px-2 py-2
              overflow-x-auto
              scrollbar-hide
            "
          >
            {navItems.map((item) => {
              const Icon = item.icon;

              const isActive =
                location.pathname === item.path ||
                (item.path !== basePath &&
                  location.pathname.startsWith(item.path));

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === basePath}
                  className="relative shrink-0"
                >
                  <motion.div
                    whileTap={{ scale: 0.92 }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 18,
                    }}
                    className={`
                      relative
                      flex flex-col items-center justify-center
                      min-w-[64px]
                      px-2.5 py-2
                      rounded-2xl
                      transition-all duration-300
                    `}
                  >
                    {/* Sliding Active Background */}
                    {isActive && (
                      <motion.div
                        layoutId="bottom-nav-pill"
                        transition={{
                          type: 'spring',
                          stiffness: 380,
                          damping: 30,
                        }}
                        className="
                          absolute inset-0
                          rounded-2xl
                          bg-gradient-to-b
                          from-red-500
                          to-red-700
                          shadow-[0_10px_25px_rgba(239,68,68,0.35)]
                        "
                      />
                    )}

                    {/* Floating Circle */}
                    <motion.div
                      animate={{
                        y: isActive ? -10 : 0,
                        scale: isActive ? 1.08 : 1,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 18,
                      }}
                      className={`
                        relative z-10
                        flex items-center justify-center
                        w-10 h-10
                        rounded-2xl
                        transition-all duration-300
                        ${
                          isActive
                            ? `
                              bg-white text-red-600
                              shadow-[0_8px_20px_rgba(255,255,255,0.35)]
                            `
                            : `
                              bg-transparent
                              text-gray-500 dark:text-gray-400
                            `
                        }
                      `}
                    >
                      <Icon size={19} strokeWidth={2.4} />
                    </motion.div>

                    {/* Label */}
                    <motion.span
                      animate={{
                        opacity: isActive ? 1 : 0.7,
                        y: isActive ? 2 : 0,
                      }}
                      transition={{
                        duration: 0.25,
                      }}
                      className={`
                        relative z-10
                        text-[9px]
                        font-extrabold
                        tracking-wide
                        mt-1
                        whitespace-nowrap
                        ${
                          isActive
                            ? 'text-white'
                            : 'text-gray-500 dark:text-gray-400'
                        }
                      `}
                    >
                      {item.label}
                    </motion.span>

                    {/* Active Dot */}
                    {isActive && (
                      <motion.div
                        layoutId="bottom-nav-dot"
                        className="
                          absolute
                          -bottom-1
                          w-1.5 h-1.5
                          rounded-full
                          bg-white
                        "
                      />
                    )}
                  </motion.div>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="h-24 lg:hidden" />
    </>
  );
};

export default BottomNavigation;