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

  const navItems = useMemo(
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
        label: 'Edit Request',
        icon: FileText,
        path: `${basePath}/edit-requests`,
      },
      {
        label: 'Leave Request',
        icon: CalendarDays,
        path: `${basePath}/leave-requests`,
      },
      {
        label: 'Access Control',
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
        label: 'Activity Log',
        icon: Activity,
        path: `${basePath}/activity-logs`,
      },
      {
        label: 'Security Alerts',
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
          {/* BACKDROP WHEN EXPANDED */}
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
                  bg-black/30
                  backdrop-blur-[2px]
                  z-0
                "
              />
            )}
          </AnimatePresence>

          {/* RADIAL MENU */}
          <AnimatePresence>
            {expanded && (
              <>
                {navItems.map((item, index) => {
                  const Icon = item.icon;

                  const isActive =
                    item.path === basePath
                      ? location.pathname === item.path
                      : location.pathname.startsWith(item.path);

                  // PERFECT FAN LAYOUT
                  const angle = -160 + index * 16;
                  const radius = 170;

                  const x =
                    Math.cos((angle * Math.PI) / 180) * radius;

                  const y =
                    Math.sin((angle * Math.PI) / 180) * radius;

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
                        stiffness: 420,
                        damping: 24,
                        delay: index * 0.02,
                      }}
                      className="
                        absolute
                        left-1/2
                        bottom-[42px]
                        z-30
                      "
                    >
                      <NavLink
                        to={item.path}
                        onClick={() => setExpanded(false)}
                        className="relative"
                      >
                        <motion.div
                          whileTap={{ scale: 0.9 }}
                          className="
                            flex
                            flex-col
                            items-center
                            gap-1
                          "
                        >
                          {/* ICON BUTTON */}
                          <div
                            className={`
                              w-[56px]
                              h-[56px]
                              rounded-2xl
                              flex
                              items-center
                              justify-center
                              backdrop-blur-2xl
                              border
                              shadow-[0_10px_30px_rgba(0,0,0,0.20)]
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
                                    bg-white/80
                                    dark:bg-[#0f172a]/90
                                    border-white/20
                                    text-gray-700
                                    dark:text-white
                                  `
                              }
                            `}
                          >
                            <Icon
                              size={22}
                              strokeWidth={2.4}
                            />
                          </div>

                          {/* LABEL */}
                          <span
                            className="
                              text-[10px]
                              font-semibold
                              whitespace-nowrap
                              text-white
                              drop-shadow-lg
                            "
                          >
                            {item.label}
                          </span>
                        </motion.div>
                      </NavLink>
                    </motion.div>
                  );
                })}
              </>
            )}
          </AnimatePresence>

          {/* BOTTOM BAR */}
          <div
            className="
              relative
              h-[82px]
              rounded-[30px]
              border
              border-white/15
              bg-white/10
              dark:bg-[#081120]/80
              backdrop-blur-3xl
              shadow-[0_10px_40px_rgba(0,0,0,0.25)]
              overflow-hidden
            "
          >
            {/* INNER GLOW */}
            <div
              className="
                absolute
                inset-0
                bg-gradient-to-t
                from-white/5
                to-transparent
                pointer-events-none
              "
            />

            {/* MAIN NAV */}
            <div
              className="
                relative
                h-full
                flex
                items-center
                justify-between
                px-6
              "
            >
              {/* LEFT */}
              <div className="flex items-center gap-5">
                {navItems.slice(0, 2).map((item) => {
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
                        flex-col
                        items-center
                        justify-center
                        gap-1
                        min-w-[54px]
                      "
                    >
                      <motion.div
                        whileTap={{ scale: 0.92 }}
                        animate={{
                          y: isActive ? -4 : 0,
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
                          strokeWidth={2.4}
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

              {/* CENTER FAB */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setExpanded(!expanded)}
                className="
                  absolute
                  left-1/2
                  -translate-x-1/2
                  -top-7
                  w-[74px]
                  h-[74px]
                  rounded-full
                  bg-gradient-to-br
                  from-red-500
                  to-red-600
                  border-[6px]
                  border-white
                  dark:border-[#081120]
                  shadow-[0_15px_40px_rgba(239,68,68,0.45)]
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
                    duration: 0.35,
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
              <div className="flex items-center gap-5">
                {navItems.slice(2, 4).map((item) => {
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
                        flex-col
                        items-center
                        justify-center
                        gap-1
                        min-w-[54px]
                      "
                    >
                      <motion.div
                        whileTap={{ scale: 0.92 }}
                        animate={{
                          y: isActive ? -4 : 0,
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
                          strokeWidth={2.4}
                        />
                      </motion.div>

                      <span
                        className={`
                          text-[10px]
                          font-semibold
                          whitespace-nowrap
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
