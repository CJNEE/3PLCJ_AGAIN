import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  ClipboardList,
  Settings,
} from 'lucide-react';

type BottomNavigationProps = {
  className?: string;
};

const navItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/admin/dashboard',
  },
  {
    label: 'Employees',
    icon: Users,
    path: '/admin/employees',
  },
  {
    label: 'Hubs',
    icon: Building2,
    path: '/admin/hubs',
  },
  {
    label: 'Requests',
    icon: ClipboardList,
    path: '/admin/requests',
  },
  {
    label: 'Settings',
    icon: Settings,
    path: '/admin/settings',
  },
];

export const BottomNavigation = ({
  className = '',
}: BottomNavigationProps) => {
  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-[9999]
          md:hidden
          px-3 pb-3
          ${className}
        `}
      >
        <div
          className="
            bg-white/90 dark:bg-gray-900/90
            backdrop-blur-xl
            border border-gray-200 dark:border-gray-800
            shadow-2xl
            rounded-3xl
            px-2 py-2
          "
        >
          <div className="grid grid-cols-5 items-center">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `
                      flex flex-col items-center justify-center
                      gap-1
                      py-2 px-1
                      rounded-2xl
                      transition-all duration-300
                      relative
                      ${
                        isActive
                          ? 'text-red-700 dark:text-red-500'
                          : 'text-gray-500 dark:text-gray-400'
                      }
                    `
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Active Background */}
                      {isActive && (
                        <div
                          className="
                            absolute inset-0
                            rounded-2xl
                            bg-red-50 dark:bg-red-900/20
                            border border-red-100 dark:border-red-800/40
                          "
                        />
                      )}

                      {/* Icon */}
                      <div className="relative z-10">
                        <Icon
                          size={22}
                          className={`
                            transition-all duration-300
                            ${isActive ? 'scale-110' : 'scale-100'}
                          `}
                        />
                      </div>

                      {/* Label */}
                      <span
                        className={`
                          relative z-10
                          text-[10px]
                          font-bold
                          tracking-wide
                        `}
                      >
                        {item.label}
                      </span>

                      {/* Active Indicator */}
                      {isActive && (
                        <div
                          className="
                            absolute -top-1
                            w-1.5 h-1.5
                            rounded-full
                            bg-red-600
                          "
                        />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* Spacer so content won't be hidden */}
      <div className="h-24 md:hidden" />
    </>
  );
};

export default BottomNavigation;