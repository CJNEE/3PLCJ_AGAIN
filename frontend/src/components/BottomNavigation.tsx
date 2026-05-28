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

  // MAIN NAVBAR
  const bottomItems = [
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
  ];

  // FLOATING MENU
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

  return (
    <>
      {/* MOBILE NAV */}
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
        <div className="relative w-full max-w-[420px]">
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
                  backdrop-blur-[8px]
                "
              />
            )}
          </AnimatePresence>

          {/* FLOATING ITEMS */}
          <AnimatePresence>
            {expanded &&
              floatingItems.map((item, index) => {
                const Icon = item.icon;

                const isActive =
                  location.pathname.startsWith(item.path);

                // CLEAN CURVED LAYOUT
                const angle = -145 + index * 18;
                const radius = 140;

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
                      scale: 0.3,
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
                      scale: 0.3,
                      x: 0,
                      y: 0,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 420,
                      damping: 24,
                      delay: index * 0.03,
                    }}
                    className="
                      absolute
                      left-1/2
                      bottom-[42px]
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
                          gap-2
                        "
                      >
                        {/* ICON CARD */}
                        <div
                          className={`
                            w-[62px]
                            h-[62px]
                            rounded-[22px]
                            flex
                            items-center
                            justify-center
                            border
                            backdrop-blur-xl
                            transition-all
                            duration-300
                            shadow-[0_12px_30px_rgba(0,0,0,0.10)]
                            ${
                              isActive
                                ? `
                                  bg-red-500
                                  border-red-400
                                  text-white
                                `
                                : `
                                  bg-white/88
                                  dark:bg-[#0f172a]/92
                                  border-white/30
                                  text-[#1e293b]
                                  dark:text-white
                                `
                            }
                          `}
                        >
                          <Icon
                            size={24}
                            strokeWidth={2.2}
                          />
                        </div>

                        {/* LABEL */}
                        <span
                          className="
                            text-[11px]
                            font-semibold
                            text-gray-700
                            dark:text-white
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

          {/* BOTTOM BAR */}
          <div
            className="
              relative
              h-[82px]
              rounded-[32px]
              border border-white/20
              bg-white/75
              dark:bg-[#081120]/85
              backdrop-blur-3xl
              shadow-[0_10px_40px_rgba(0,0,0,0.12)]
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                h-full
                px-6
              "
            >
              {/* LEFT SIDE */}
              <div className="flex items-center gap-7">
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
                        relative
                      "
                    >
                      <motion.div
                        animate={{
                          y: isActive ? -2 : 0,
                        }}
                        whileTap={{ scale: 0.92 }}
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
                          strokeWidth={2.2}
                        />
                      </motion.div>

                      <span
                        className={`
                          text-[10px]
                          font-semibold
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

              {/* FAB BUTTON */}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setExpanded(!expanded)}
                className="
                  absolute
                  left-1/2
                  -translate-x-1/2
                  -top-7
                  w-[72px]
                  h-[72px]
                  rounded-full
                  bg-gradient-to-br
                  from-red-500
                  to-red-600
                  border-[6px]
                  border-white
                  dark:border-[#081120]
                  flex
                  items-center
                  justify-center
                  shadow-[0_15px_40px_rgba(239,68,68,0.35)]
                  z-50
                "
              >
                <motion.div
                  animate={{
                    rotate: expanded ? 180 : 0,
                  }}
                  transition={{
                    duration: 0.25,
                  }}
                >
                  {expanded ? (
                    <X
                      size={30}
                      className="text-white"
                    />
                  ) : (
                    <Plus
                      size={30}
                      className="text-white"
                    />
                  )}
                </motion.div>
              </motion.button>

              {/* RIGHT SIDE */}
              <div className="flex items-center gap-7">
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
                        relative
                      "
                    >
                      <motion.div
                        animate={{
                          y: isActive ? -2 : 0,
                        }}
                        whileTap={{ scale: 0.92 }}
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
                          strokeWidth={2.2}
                        />
                      </motion.div>

                      <span
                        className={`
                          text-[10px]
                          font-semibold
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
      <div className="h-28 lg:hidden" />
    </>
  );
};

export default BottomNavigation;
