import { useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
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
  Plus,
  X,
} from 'lucide-react';

type BottomNavigationProps = {
  className?: string;
};

export const BottomNavigation = ({
  className = '',
}: BottomNavigationProps) => {
  const { user } = useAuth();
  const location = useLocation();

  const [expanded, setExpanded] = useState(false);

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

  // ONLY THE FLOATING MENU ITEMS
  // NO DUPLICATES
  const floatingItems = useMemo(
    () => [
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
    ],
    [basePath]
  );

  // BOTTOM BAR ITEMS
  const bottomItems = useMemo(
    () => [
      {
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: basePath,
      },
      {
        label: 'Hubs',
        icon: MapPin,
        path: `${basePath}/hubs`,
      },
      {
        label: 'Employees',
        icon: Users,
        path: `${basePath}/employees`,
      },
      {
        label: 'Edit',
        icon: FileText,
        path: `${basePath}/edit-requests`,
      },
    ],
    [basePath]
  );

  return (
    <>
      {/* MOBILE NAV */}
      <div
        className={`
          fixed
          bottom-3
          left-0
          right-0
          z-[9999]
          flex
          justify-center
          px-3
          lg:hidden
          ${className}
        `}
      >
        <div className="relative w-full max-w-[400px]">
          {/* BACKDROP */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setExpanded(false)}
                className="
                  fixed
                  inset-0
                  bg-black/20
                  backdrop-blur-[2px]
                "
              />
            )}
          </AnimatePresence>

          {/* FLOATING MENU */}
          <AnimatePresence>
            {expanded &&
              floatingItems.map((item, index) => {
                const Icon = item.icon;

                const isActive =
                  location.pathname.startsWith(item.path);

                // COMPACT CURVE
                const angle = -145 + index * 18;
                const radius = 118;

                const x =
                  Math.cos((angle * Math.PI) / 180) *
                  radius;

                const y =
                  Math.sin((angle * Math.PI) / 180) *
                  radius;

                return (
                  <motion.div
                    key={item.path}
                    initial={{
                      opacity: 0,
                      scale: 0.2,
                      x: 0,
                      y: 0,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      x,
                      y,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.2,
                      x: 0,
                      y: 0,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 450,
                      damping: 24,
                      delay: index * 0.03,
                    }}
                    className="
                      absolute
                      left-1/2
                      bottom-[38px]
                      z-40
                    "
                  >
                    <NavLink
                      to={item.path}
                      onClick={() => setExpanded(false)}
                    >
                      <motion.div
                        whileTap={{ scale: 0.92 }}
                        className="
                          flex
                          flex-col
                          items-center
                          gap-1
                        "
                      >
                        <div
                          className={`
                            w-[52px]
                            h-[52px]
                            rounded-2xl
                            flex
                            items-center
                            justify-center
                            backdrop-blur-xl
                            border
                            transition-all
                            duration-300
                            shadow-[0_8px_20px_rgba(0,0,0,0.18)]
                            ${
                              isActive
                                ? `
                                  bg-red-500
                                  text-white
                                  border-red-400
                                `
                                : `
                                  bg-white/90
                                  dark:bg-[#0f172a]/95
                                  border-white/20
                                  text-gray-700
                                  dark:text-white
                                `
                            }
                          `}
                        >
                          <Icon
                            size={20}
                            strokeWidth={2.5}
                          />
                        </div>

                        <span
                          className="
                            text-[9px]
                            font-semibold
                            text-white
                            whitespace-nowrap
                          "
                        >
                          {item.label}
                        </span>
                      </motion.div>
                    </NavLink>
                  </motion.div>
                );
              })}
          </AnimatePresence>

          {/* NAVBAR */}
          <div
            className="
              relative
              h-[74px]
              rounded-[28px]
              border border-white/10
              bg-white/10
              dark:bg-[#081120]/80
              backdrop-blur-3xl
              shadow-[0_10px_35px_rgba(0,0,0,0.20)]
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                h-full
                px-5
              "
            >
              {/* LEFT */}
              <div className="flex items-center gap-5">
                {bottomItems.slice(0, 2).map((item) => {
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
                        flex
                        flex-col
                        items-center
                        gap-1
                        min-w-[50px]
                      "
                    >
                      <motion.div
                        whileTap={{ scale: 0.92 }}
                        animate={{
                          y: isActive ? -3 : 0,
                        }}
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
                        <Icon size={21} />
                      </motion.div>

                      <span
                        className={`
                          text-[10px]
                          font-medium
                          ${
                            isActive
                              ? 'text-red-500'
                              : 'text-gray-500 dark:text-gray-400'
                          }
                        `}
                      >
                        {item.label}
                      </span>
                    </NavLink>
                  );
                })}
              </div>

              {/* FAB */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setExpanded(!expanded)}
                className="
                  absolute
                  left-1/2
                  -translate-x-1/2
                  -top-5
                  w-[62px]
                  h-[62px]
                  rounded-full
                  bg-gradient-to-br
                  from-red-500
                  to-red-600
                  border-[5px]
                  border-white
                  dark:border-[#081120]
                  shadow-[0_12px_30px_rgba(239,68,68,0.45)]
                  flex
                  items-center
                  justify-center
                  z-50
                "
              >
                <motion.div
                  animate={{
                    rotate: expanded ? 180 : 0,
                  }}
                  transition={{
                    duration: 0.28,
                  }}
                >
                  {expanded ? (
                    <X
                      size={26}
                      className="text-white"
                    />
                  ) : (
                    <Plus
                      size={26}
                      className="text-white"
                    />
                  )}
                </motion.div>
              </motion.button>

              {/* RIGHT */}
              <div className="flex items-center gap-5">
                {bottomItems.slice(2, 4).map((item) => {
                  const Icon = item.icon;

                  const isActive =
                    location.pathname.startsWith(item.path);

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className="
                        flex
                        flex-col
                        items-center
                        gap-1
                        min-w-[50px]
                      "
                    >
                      <motion.div
                        whileTap={{ scale: 0.92 }}
                        animate={{
                          y: isActive ? -3 : 0,
                        }}
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
                        <Icon size={21} />
                      </motion.div>

                      <span
                        className={`
                          text-[10px]
                          font-medium
                          ${
                            isActive
                              ? 'text-red-500'
                              : 'text-gray-500 dark:text-gray-400'
                          }
                        `}
                      >
                        {item.label}
                      </span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SPACER */}
      <div className="h-24 lg:hidden" />
    </>
  );
};

export default BottomNavigation;
