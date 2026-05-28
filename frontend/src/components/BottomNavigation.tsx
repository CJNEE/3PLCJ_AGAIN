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
  Clock3,
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
   * BOTTOM NAVIGATION
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
        icon: Clock3,
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
   * PERFECT ARC POSITIONING
   */
  const positions = [
    { x: -170, y: -110 },
    { x: -112, y: -182 },
    { x: -42, y: -225 },

    { x: 42, y: -225 },
    { x: 112, y: -182 },
    { x: 170, y: -110 },
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
        <div className="relative w-full max-w-[430px]">
          {/* BACKDROP */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setExpanded(false)}
                className="
                  fixed
                  inset-0
                  bg-[#020617]/40
                  backdrop-blur-[10px]
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
                      scale: 0.2,
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
                      scale: 0.2,
                      x: 0,
                      y: 0,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 420,
                      damping: 24,
                      delay: index * 0.025,
                    }}
                    className="
                      absolute
                      left-1/2
                      bottom-[48px]
                      z-40
                    "
                    style={{
                      marginLeft: '-32px',
                    }}
                  >
                    <NavLink
                      to={item.path}
                      onClick={() => setExpanded(false)}
                    >
                      <motion.div
                        whileHover={{
                          y: -4,
                          scale: 1.04,
                        }}
                        whileTap={{
                          scale: 0.95,
                        }}
                        className="
                          flex
                          flex-col
                          items-center
                          gap-[8px]
                        "
                      >
                        {/* ICON CIRCLE */}
                        <div
                          className={`
                            relative

                            w-[64px]
                            h-[64px]

                            rounded-full

                            flex
                            items-center
                            justify-center

                            transition-all
                            duration-300

                            border

                            ${
                              isActive
                                ? `
                                  bg-gradient-to-b
                                  from-red-500
                                  to-red-600

                                  border-red-400

                                  text-white

                                  shadow-[0_10px_35px_rgba(239,68,68,0.40)]
                                `
                                : `
                                  bg-[#071226]/88

                                  border-white/20

                                  text-white

                                  hover:border-red-400
                                  hover:text-red-400
                                  hover:shadow-[0_10px_30px_rgba(239,68,68,0.25)]
                                `
                            }
                          `}
                        >
                          {/* INNER STROKE */}
                          <div
                            className="
                              absolute
                              inset-[4px]
                              rounded-full
                              border
                              border-white/5
                            "
                          />

                          <Icon
                            size={24}
                            strokeWidth={2.2}
                            className="relative z-10"
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

          {/* MAIN NAVIGATION */}
          <div
            className="
              relative

              h-[94px]

              rounded-[32px]

              overflow-visible

              border
              border-white/10

              bg-[rgba(8,15,35,0.88)]

              backdrop-blur-[24px]

              shadow-[0_20px_50px_rgba(0,0,0,0.40)]
            "
          >
            {/* INNER LIGHT */}
            <div
              className="
                absolute
                inset-0

                rounded-[32px]

                bg-gradient-to-b
                from-white/[0.03]
                to-transparent
              "
            />

            <div
              className="
                relative

                flex
                items-center
                justify-between

                h-full

                px-8
              "
            >
              {/* LEFT SIDE */}
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
                        gap-[4px]
                      "
                    >
                      <motion.div
                        whileHover={{
                          y: -2,
                        }}
                        whileTap={{
                          scale: 0.92,
                        }}
                        className={`
                          transition-all
                          duration-300

                          ${
                            isActive
                              ? 'text-red-500'
                              : 'text-gray-500'
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

                          transition-all
                          duration-300

                          ${
                            isActive
                              ? 'text-red-500'
                              : 'text-gray-500'
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
              <div
                className="
                  absolute
                  left-1/2
                  -translate-x-1/2
                  -top-[22px]

                  z-50
                "
              >
                <motion.button
                  whileTap={{
                    scale: 0.94,
                  }}
                  whileHover={{
                    scale: 1.03,
                  }}
                  onClick={() => setExpanded(!expanded)}
                  className="
                    relative

                    w-[92px]
                    h-[92px]

                    rounded-full

                    flex
                    items-center
                    justify-center

                    bg-gradient-to-b
                    from-[#ff4d4d]
                    to-[#ff3131]

                    shadow-[0_0_45px_rgba(255,59,59,0.45)]

                    transition-all
                    duration-300
                  "
                >
                  {/* INNER LIGHT */}
                  <div
                    className="
                      absolute
                      inset-[4px]

                      rounded-full

                      border
                      border-white/10
                    "
                  />

                  {/* ICON */}
                  <motion.div
                    animate={{
                      rotate: expanded ? 180 : 0,
                    }}
                    transition={{
                      duration: 0.25,
                    }}
                    className="relative z-10"
                  >
                    {expanded ? (
                      <X
                        size={32}
                        strokeWidth={2.5}
                        className="text-white"
                      />
                    ) : (
                      <Plus
                        size={32}
                        strokeWidth={2.5}
                        className="text-white"
                      />
                    )}
                  </motion.div>
                </motion.button>
              </div>

              {/* RIGHT SIDE */}
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
                        gap-[4px]
                      "
                    >
                      <motion.div
                        whileHover={{
                          y: -2,
                        }}
                        whileTap={{
                          scale: 0.92,
                        }}
                        className={`
                          transition-all
                          duration-300

                          ${
                            isActive
                              ? 'text-red-500'
                              : 'text-gray-500'
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

                          transition-all
                          duration-300

                          ${
                            isActive
                              ? 'text-red-500'
                              : 'text-gray-500'
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
