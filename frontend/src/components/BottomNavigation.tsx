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
   * BOTTOM NAV ITEMS
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
   * FLOATING ACTIONS
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
   * PERFECT ARC POSITION
   */
  const positions = [
    { x: -182, y: -118 },
    { x: -120, y: -205 },
    { x: -48, y: -255 },

    { x: 48, y: -255 },
    { x: 120, y: -205 },
    { x: 182, y: -118 },
  ];

  return (
    <>
      {/* MOBILE ONLY */}
      <div
        className={`
          fixed
          bottom-5
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
                      stiffness: 400,
                      damping: 24,
                      delay: index * 0.025,
                    }}
                    className="
                      absolute
                      left-1/2
                      bottom-[52px]
                      z-40
                    "
                    style={{
                      marginLeft: '-36px',
                    }}
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
                        whileTap={{
                          scale: 0.94,
                        }}
                        className="
                          flex
                          flex-col
                          items-center
                          gap-[10px]
                        "
                      >
                        {/* PERFECT CIRCLE */}
                        <div
                          className={`
                            relative

                            w-[72px]
                            h-[72px]

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

                                  shadow-[0_10px_35px_rgba(239,68,68,0.45)]
                                `
                                : `
                                  bg-[#071226]/88

                                  border-white/20

                                  text-white

                                  hover:border-red-400
                                  hover:text-red-400
                                  hover:shadow-[0_10px_30px_rgba(239,68,68,0.28)]
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
                            size={28}
                            strokeWidth={2.2}
                            className="relative z-10"
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

          {/* MAIN NAV */}
          <div
            className="
              relative

              h-[102px]

              rounded-[38px]

              overflow-visible

              border
              border-white/10

              bg-[rgba(8,15,35,0.88)]

              backdrop-blur-[24px]

              shadow-[0_25px_60px_rgba(0,0,0,0.45)]
            "
          >
            {/* GLOW */}
            <div
              className="
                absolute
                inset-0

                rounded-[38px]

                bg-gradient-to-b
                from-white/[0.04]
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
              <div className="flex items-center gap-9">
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
                        gap-[5px]
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
                          size={24}
                          strokeWidth={2.2}
                        />
                      </motion.div>

                      <span
                        className={`
                          text-[11px]
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
                  -top-[34px]

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

                    w-[118px]
                    h-[118px]

                    rounded-full

                    flex
                    items-center
                    justify-center

                    bg-gradient-to-b
                    from-[#ff4d4d]
                    to-[#ff3131]

                    shadow-[0_0_60px_rgba(255,59,59,0.55)]

                    transition-all
                    duration-300
                  "
                >
                  {/* INNER LIGHT */}
                  <div
                    className="
                      absolute
                      inset-[5px]

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
                        size={38}
                        strokeWidth={2.5}
                        className="text-white"
                      />
                    ) : (
                      <Plus
                        size={38}
                        strokeWidth={2.5}
                        className="text-white"
                      />
                    )}
                  </motion.div>
                </motion.button>
              </div>

              {/* RIGHT SIDE */}
              <div className="flex items-center gap-9">
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
                        gap-[5px]
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
                          size={24}
                          strokeWidth={2.2}
                        />
                      </motion.div>

                      <span
                        className={`
                          text-[11px]
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
      <div className="h-32 lg:hidden" />
    </>
  );
};

export default BottomNavigation;
