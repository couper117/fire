import { Menu, LogOut, User } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { Button } from '../shared';

interface NavbarProps {
  onMenuClick: () => void;
}

export const Navbar = ({ onMenuClick }: NavbarProps) => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-6 py-4 flex items-center justify-between">
        <button
          onClick={onMenuClick}
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Menu size={24} />
        </button>

        <div className="flex-1 text-center">
          <h1 className="text-2xl font-bold text-primary-600">FEMS</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user?.email}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <User size={20} />
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              icon={<LogOut size={16} />}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
