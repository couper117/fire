import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Flame,
  Calendar,
  BarChart3,
  Users,
  Settings,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../../AuthContext';
import clsx from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar = ({ isOpen, onToggle }: SidebarProps) => {
  const { user } = useAuth();
  const location = useLocation();

  const navItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: '/',
      roles: ['Admin', 'Inspector', 'User'],
    },
    {
      label: 'Extinguishers',
      icon: Flame,
      path: '/extinguishers',
      roles: ['Admin', 'Inspector', 'User'],
    },
    {
      label: 'Inspections',
      icon: Calendar,
      path: '/inspections',
      roles: ['Admin', 'Inspector', 'User'],
    },
    {
      label: 'Reports',
      icon: BarChart3,
      path: '/reports',
      roles: ['Admin', 'Inspector'],
    },
    {
      label: 'Users',
      icon: Users,
      path: '/admin/users',
      roles: ['Admin'],
    },
    {
      label: 'Settings',
      icon: Settings,
      path: '/settings',
      roles: ['Admin'],
    },
  ];

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(user?.role || 'User')
  );

  return (
    <>
      {/* Sidebar */}
      <aside
        className={clsx(
          'bg-gray-900 text-white transition-all duration-300 flex flex-col',
          isOpen ? 'w-64' : 'w-20'
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          {isOpen && <h1 className="text-xl font-bold">FEMS</h1>}
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className={clsx(isOpen && 'hidden')} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex items-center gap-4 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                )}
                title={!isOpen ? item.label : undefined}
              >
                <Icon size={20} />
                {isOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {isOpen && (
          <div className="p-4 border-t border-gray-800">
            <p className="text-xs text-gray-400">
              © 2026 TZW LTD
            </p>
          </div>
        )}
      </aside>
    </>
  );
};
