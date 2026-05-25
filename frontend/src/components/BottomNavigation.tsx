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
    { label: 'Home', icon: Home, path: basePath },
    { label: 'Employees', icon: Users, path: `${basePath}/employees` },
    { label: 'Hubs', icon: MapPin, path: `${basePath}/hubs` },
    { label: 'Edit', icon: FileText, path: `${basePath}/edit-requests` },
    { label: 'Leave', icon: CalendarDays, path: `${basePath}/leave-requests` },
    { label: 'Access', icon: Lock, path: `${basePath}/access-control` },
    { label: 'Attendance', icon: Clock, path: `${basePath}/attendance` },
    { label: 'Payroll', icon: DollarSign, path: `${basePath}/payslip` },
    { label: 'Logs', icon: Activity, path: `${basePath}/activity-logs` },
    { label: 'Alerts', icon: AlertTriangle, path: `${basePath}/security-alerts` },
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
          px-4
          ${className}
        `}
      >
        <div className="relative w-full max-w-[540px]">
          {/* BACKGROUND LAYER */}
          <div
            className="
              absolute
              bottom-0 left-0 right-0
              h-[80px]
              rounded-3xl
              border border-white/20 dark:border-gray-800/50
              bg-white/80 dark:bg-gray-900/80
              backdrop-blur-xl
              shadow-[0_8px_32px_rgba(0,0,0,0.12)]
            "
          />

          {/* SCROLL CONTAINER WITH TOP PADDING TO PREVENT CLIPPING */}
          <div
            className="
              relative
              w-full
              overflow-x-auto
              scrollbar-hide
              px-2 pb-2 pt-6
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
                      min-w-[70px]
                      h-[64px]
                      group
                    "
                  >
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      className="relative flex flex-col items-center justify-center w-full h-full z-20"
                    >
                      {/* FLOATING CIRCLE BACKGROUND */}
                      {isActive && (
                        <motion.div
                          layoutId="nav-circle"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="
                            absolute
                            -top-6
                            left-1/2 -translate-x-1/2
                            w-[58px]
                            h-[58px]
                            rounded-full
                            bg-gradient-to-tr from-red-600 to-red-500
                            shadow-[0_4px_12px_rgba(220,38,38,0.4)]
                            border-[6px] border-gray-50 dark:border-gray-950
                            z-0
                          "
                        />
                      )}

                      {/* ICON */}
                      <motion.div
                        animate={{ y: isActive ? -27 : 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className={`
                          relative z-10
                          flex items-center justify-center
                          w-[40px] h-[40px]
                          transition-colors duration-300
                          ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-red-500'}
                        `}
                      >
                        <Icon size={24} className={isActive ? 'scale-110' : ''} />
                      </motion.div>

                      {/* LABEL */}
                      <motion.span
                        animate={{
                          y: isActive ? 4 : 0,
                          opacity: isActive ? 1 : 0.7,
                        }}
                        className={`
                          absolute bottom-1
                          text-[10px] font-bold tracking-wide
                          transition-colors duration-300
                          ${isActive ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}
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