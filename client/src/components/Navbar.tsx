import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useNotifications, useMarkAllAsRead } from '@/hooks/useNotifications';
import { Bell, Search, Menu, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavbarProps {
  onMenuToggle: () => void;
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { data: notifications } = useNotifications();
  const markAllRead = useMarkAllAsRead();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="fixed top-0 right-0 left-[var(--sidebar-width)] h-[var(--topbar-height)] bg-surface-500/80 backdrop-blur-xl border-b border-zinc-800 flex items-center justify-between px-6 z-40 transition-all duration-300">
      {/* Left: Menu + Search */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden w-9 h-9 rounded-lg bg-surface-200 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search meetings, teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 pl-9 pr-4 py-2 bg-surface-400 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all"
          />
        </div>
      </div>

      {/* Right: Notifications + User */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="relative w-9 h-9 rounded-lg bg-surface-200 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-surface-300 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-scale-in z-50">
              <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <h4 className="text-sm font-semibold text-zinc-200">Notifications</h4>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead.mutate()}
                    className="text-xs text-primary-400 hover:text-primary-300"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {(!notifications || notifications.length === 0) ? (
                  <p className="text-sm text-zinc-500 text-center py-8">No notifications</p>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n._id}
                      className={cn(
                        'px-4 py-3 border-b border-zinc-800/50 text-sm transition-colors',
                        n.read ? 'text-zinc-500' : 'text-zinc-200 bg-primary-500/5'
                      )}
                    >
                      <p>{n.message}</p>
                      <span className="text-xs text-zinc-600 mt-1 block">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-surface-200 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-xs font-bold text-white">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                user?.name?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
            <span className="text-sm font-medium text-zinc-300 hidden md:block">{user?.name}</span>
            <ChevronDown className="w-4 h-4 text-zinc-500 hidden md:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-12 w-48 bg-surface-300 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-scale-in z-50">
              <button
                onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                className="w-full px-4 py-2.5 text-sm text-zinc-300 hover:bg-surface-200 text-left transition-colors"
              >
                Profile
              </button>
              <hr className="border-zinc-800" />
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 text-left transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close */}
      {(showNotifications || showUserMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setShowNotifications(false); setShowUserMenu(false); }}
        />
      )}
    </header>
  );
}
