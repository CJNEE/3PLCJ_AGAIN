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
   * FLOATING MENU
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
   * PERFECT ARC SPACING
   */
  const positions = [
    // LEFT
    { x: -168, y: -102 },
    { x: -118, y: -164 },
    { x: -52, y: -206 },

    // RIGHT
    { x: 14, y: -206 },
    { x: 80, y: -164 },
    { x: 130, y: -102 },
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
                  bg-black/20
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
                      stiffness: 430,
                      damping: 24,
                      delay: index * 0.025,
                    }}
                    className="
                      absolute
                      left-1/2
                      bottom-[28px]
                      z-40
                    "
                  >
                    <NavLink
                      to={item.path}
                      onClick={() => setExpanded(false)}
                    >
                      <motion.div
                        whileHover={{
                          y: -4,
                          scale: 1.05,
                        }}
                        whileTap={{ scale: 0.94 }}
                        className="
                          flex
                          flex-col
                          items-center
                          gap-[6px]
                        "
                      >
                        {/* FLOATING CARD */}
                        <div
                          className={`
                            group
                            relative

                            w-[62px]
                            h-[62px]

                            rounded-[22px]

                            flex
                            items-center
                            justify-center

                            border

                            transition-all
                            duration-300

                            backdrop-blur-2xl

                            shadow-[0_12px_35px_rgba(0,0,0,0.14)]

                            ${
                              isActive
                                ? `
                                  bg-gradient-to-br
                                  from-red-500
                                  to-red-600
                                  border-red-400
                                  text-white
                                  shadow-[0_12px_35px_rgba(239,68,68,0.40)]
                                `
                                : `
                                  bg-white/92
                                  dark:bg-[#182235]/94
                                  border-white/30
                                  text-[#374151]
                                  dark:text-gray-100
                                  hover:bg-red-500
                                  hover:text-white
                                  hover:border-red-400
                                  hover:shadow-[0_12px_35px_rgba(239,68,68,0.28)]
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
                            text-[10px]
                            font-semibold
                            leading-tight
                            whitespace-pre-line
                            text-center
                            text-white
                            drop-shadow-sm
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
              h-[88px]

              rounded-[32px]

              border
              border-white/10

              bg-gradient-to-r
              from-[#f8fafc]
              via-[#eef2ff]
              to-[#f8fafc]

              dark:from-[#111827]
              dark:via-[#172033]
              dark:to-[#111827]

              backdrop-blur-3xl

              shadow-[0_14px_45px_rgba(15,23,42,0.16)]
            "
          >
            {/* INNER GLOW */}
            <div
              className="
                absolute
                inset-[1px]
                rounded-[31px]
                bg-white/65
                dark:bg-white/[0.03]
              "
            />

            <div
              className="
                relative
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
                        gap-[3px]
                      "
                    >
                      <motion.div
                        whileTap={{ scale: 0.92 }}
                        whileHover={{ y: -2 }}
                        animate={{
                          y: isActive ? -2 : 0,
                        }}
                        className={`
                          transition-all
                          duration-300
                          ${
                            isActive
                              ? 'text-red-500'
                              : 'text-gray-400 dark:text-gray-500'
                          }
                        `}
                      >
                        <Icon
                          size={22}
                          strokeWidth={2.3}
                        />
                      </motion.div>

                      <span
                        className={`
                          text-[10px]
                          font-semibold
                          tracking-wide
                          transition-all
                          duration-300
                          ${
                            isActive
                              ? 'text-red-500'
                              : 'text-gray-400 dark:text-gray-500'
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
              <motion.button
                whileTap={{ scale: 0.94 }}
                whileHover={{
                  scale: 1.04,
                }}
                onClick={() => setExpanded(!expanded)}
                className="
                  absolute
                  left-1/2
                  -translate-x-1/2
                  -top-9

                  z-50

                  w-[82px]
                  h-[82px]

                  rounded-full

                  border-[7px]
                  border-[#f8fafc]
                  dark:border-[#111827]

                  bg-gradient-to-br
                  from-red-500
                  via-red-500
                  to-rose-600

                  flex
                  items-center
                  justify-center

                  shadow-[0_22px_55px_rgba(239,68,68,0.45)]

                  transition-all
                  duration-300

                  hover:shadow-[0_26px_65px_rgba(239,68,68,0.55)]
                "
              >
                {/* INNER RING */}
                <div
                  className="
                    absolute
                    inset-[6px]
                    rounded-full
                    border
                    border-white/20
                  "
                />

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
                        gap-[3px]
                      "
                    >
                      <motion.div
                        whileTap={{ scale: 0.92 }}
                        whileHover={{ y: -2 }}
                        animate={{
                          y: isActive ? -2 : 0,
                        }}
                        className={`
                          transition-all
                          duration-300
                          ${
                            isActive
                              ? 'text-red-500'
                              : 'text-gray-400 dark:text-gray-500'
                          }
                        `}
                      >
                        <Icon
                          size={22}
                          strokeWidth={2.3}
                        />
                      </motion.div>

                      <span
                        className={`
                          text-[10px]
                          font-semibold
                          tracking-wide
                          transition-all
                          duration-300
                          ${
                            isActive
                              ? 'text-red-500'
                              : 'text-gray-400 dark:text-gray-500'
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
