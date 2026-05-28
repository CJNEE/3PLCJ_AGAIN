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
   * BOTTOM NAV
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
        label: 'Leave\nRequest',
        icon: CalendarDays,
        path: `${basePath}/leave-requests`,
      },
      {
        label: 'Access\nControl',
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
        label: 'Activity\nLog',
        icon: Activity,
        path: `${basePath}/activity-logs`,
      },
      {
        label: 'Security\nAlerts',
        icon: AlertTriangle,
        path: `${basePath}/security-alerts`,
      },
    ],
    [basePath]
  );

  /**
   * PERFECT RADIAL POSITIONS
   */
  const positions = [
    // LEFT
    { x: -170, y: -120 },
    { x: -105, y: -205 },
    { x: -18, y: -255 },

    // RIGHT
    { x: 82, y: -255 },
    { x: 170, y: -205 },
    { x: 235, y: -120 },
  ];

  return (
    <>
      {/* MOBILE ONLY */}
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
        <div className="relative w-full max-w-[520px]">
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
                  backdrop-blur-[10px]
                "
              />
            )}
          </AnimatePresence>

          {/* FLOATING ITEMS */}
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
                      stiffness: 420,
                      damping: 24,
                      delay: index * 0.03,
                    }}
                    className="
                      absolute
                      left-1/2
                      bottom-[18px]
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
                          gap-[8px]
                        "
                      >
                        {/* ICON CARD */}
                        <div
                          className={`
                            w-[72px]
                            h-[72px]

                            rounded-[28px]

                            flex
                            items-center
                            justify-center

                            border

                            backdrop-blur-2xl

                            transition-all
                            duration-300

                            shadow-[0_15px_35px_rgba(0,0,0,0.10)]

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
                                  border-white/40
                                  text-[#1f2937]
                                  dark:text-white
                                `
                            }
                          `}
                        >
                          <Icon
                            size={30}
                            strokeWidth={2.1}
                          />
                        </div>

                        {/* LABEL */}
                        <span
                          className="
                            text-[11px]
                            font-semibold
                            leading-tight
                            whitespace-pre-line
                            text-center
                            text-gray-800
                            dark:text-gray-100
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
              h-[90px]

              rounded-[34px]

              border
              border-white/20

              bg-white/80
              dark:bg-[#0b1120]/88

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
                px-8
              "
            >
              {/* LEFT */}
              <div className="flex items-center gap-10">
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
                          size={24}
                          strokeWidth={2.2}
                        />
                      </motion.div>

                      <span
                        className={`
                          text-[11px]
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

              {/* CENTER FAB */}
              <button
                onClick={() => setExpanded(!expanded)}
                className="
                  absolute
                  left-1/2
                  -translate-x-1/2
                  -top-8

                  z-50

                  w-[84px]
                  h-[84px]

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

                  shadow-[0_20px_50px_rgba(239,68,68,0.35)]
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
                      size={34}
                      className="text-white"
                    />
                  ) : (
                    <Plus
                      size={34}
                      className="text-white"
                    />
                  )}
                </motion.div>
              </button>

              {/* RIGHT */}
              <div className="flex items-center gap-10">
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
                          size={24}
                          strokeWidth={2.2}
                        />
                      </motion.div>

                      <span
                        className={`
                          text-[11px]
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
      <div className="h-32 lg:hidden" />
    </>
  );
};

export default BottomNavigation;
