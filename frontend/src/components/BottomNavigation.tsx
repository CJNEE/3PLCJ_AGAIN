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

  /**
   * MAIN NAV
   */
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

  /**
   * FLOATING ITEMS
   */
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

  /**
   * PERFECT ARC POSITIONS
   */
  const positions = [
    // LEFT
    { x: -118, y: -78 },
    { x: -74, y: -128 },
    { x: -22, y: -158 },

    // RIGHT
    { x: 22, y: -158 },
    { x: 74, y: -128 },
    { x: 118, y: -78 },
  ];

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
        <div className="relative w-full max-w-[430px]">
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
                  bg-black/10
                  backdrop-blur-[8px]
                "
              />
            )}
          </AnimatePresence>

          {/* FLOATING MENU */}
          <AnimatePresence>
            {expanded &&
              floatingItems.map((item, index) => {
                const Icon = item.icon;
                const pos = positions[index];

                const isActive =
                  location.pathname.startsWith(item.path);

                return (
                  <motion.div
                    key={item.path}
                    initial={{
                      opacity: 0,
                      scale: 0.4,
                      x: 0,
                      y: 0,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      x: pos.x,
                      y: pos.y,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 0.4,
                      x: 0,
                      y: 0,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 28,
                      delay: index * 0.02,
                    }}
                    className="
                      absolute
                      left-1/2
                      bottom-[36px]
                      z-40
                    "
                  >
                    <NavLink
                      to={item.path}
                      onClick={() => setExpanded(false)}
                    >
                      <motion.div
                        whileTap={{ scale: 0.94 }}
                        className="
                          flex
                          flex-col
                          items-center
                          gap-[4px]
                        "
                      >
                        {/* ICON CARD */}
                        <div
                          className={`
                            w-[56px]
                            h-[56px]
                            rounded-[20px]

                            flex
                            items-center
                            justify-center

                            border

                            backdrop-blur-xl

                            shadow-[0_8px_24px_rgba(0,0,0,0.08)]

                            transition-all
                            duration-300

                            ${
                              isActive
                                ? `
                                  bg-red-500
                                  border-red-400
                                  text-white
                                `
                                : `
                                  bg-white/90
                                  dark:bg-[#111827]/92
                                  border-white/30
                                  text-[#1f2937]
                                  dark:text-white
                                `
                            }
                          `}
                        >
                          <Icon
                            size={22}
                            strokeWidth={2.3}
                          />
                        </div>

                        {/* LABEL */}
                        <span
                          className="
                            text-[10px]
                            font-medium
                            leading-none
                            whitespace-nowrap
                            text-gray-700
                            dark:text-gray-200
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
              h-[84px]

              rounded-[32px]

              border
              border-white/20

              bg-white/80
              dark:bg-[#0b1120]/85

              backdrop-blur-3xl

              shadow-[0_10px_40px_rgba(0,0,0,0.10)]
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                h-full
                px-7
              "
            >
              {/* LEFT */}
              <div className="flex items-center gap-8">
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
                      "
                    >
                      <motion.div
                        whileTap={{ scale: 0.92 }}
                        animate={{
                          y: isActive ? -2 : 0,
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 22,
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

              {/* CENTER BUTTON */}
              <button
                onClick={() => setExpanded(!expanded)}
                className="
                  absolute
                  left-1/2
                  -translate-x-1/2
                  -top-7

                  z-50

                  w-[72px]
                  h-[72px]

                  rounded-full

                  border-[6px]
                  border-white
                  dark:border-[#0b1120]

                  bg-gradient-to-br
                  from-red-500
                  to-red-600

                  flex
                  items-center
                  justify-center

                  shadow-[0_18px_40px_rgba(239,68,68,0.35)]
                "
              >
                {/* FIXED BUTTON */}
                <motion.div
                  animate={{
                    rotate: expanded ? 180 : 0,
                  }}
                  transition={{
                    duration: 0.22,
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
              </button>

              {/* RIGHT */}
              <div className="flex items-center gap-8">
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
                      "
                    >
                      <motion.div
                        whileTap={{ scale: 0.92 }}
                        animate={{
                          y: isActive ? -2 : 0,
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 22,
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
