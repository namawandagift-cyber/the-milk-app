import React from 'react';
import {
  LayoutDashboard,
  Milk,
  Users2,
  Receipt,
  TrendingUp,
  FileBarChart,
  Settings,
  LogOut,
  Droplets,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type PageId = 'dashboard' | 'milk' | 'cows' | 'expenses' | 'sales' | 'reports' | 'settings';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  const { user, farm, logout } = useAuth();

  const navItems = [
    { id: 'dashboard' as PageId, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'milk' as PageId, label: 'Milk', icon: Milk },
    { id: 'cows' as PageId, label: 'Herd', icon: Users2 },
    { id: 'expenses' as PageId, label: 'Expenses', icon: Receipt },
    { id: 'sales' as PageId, label: 'Sales', icon: TrendingUp },
    { id: 'reports' as PageId, label: 'Reports', icon: FileBarChart },
  ];

  return (
    <aside className="dp-sidebar">
      {/* Brand */}
      <div className="dp-sidebar-brand">
        <div className="dp-brand-logo">
          D
        </div>
        <div>
          <div className="dp-brand-text">DAIRYPULSE</div>
          <div style={{ fontSize: '0.6875rem', color: 'rgba(209, 250, 229, 0.6)', fontWeight: 600, letterSpacing: '0.05em' }}>
            FARM INTELLIGENCE
          </div>
        </div>
      </div>

      {/* Primary Navigation List */}
      <ul className="dp-nav-list">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <li key={item.id} className="dp-nav-item">
              <button
                id={`nav-link-${item.id}`}
                type="button"
                className={`dp-nav-link w-100 border-0 bg-transparent text-start ${isActive ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Bottom section: Settings & Account */}
      <div className="dp-sidebar-footer">
        <button
          id="nav-link-settings"
          type="button"
          className={`dp-nav-link w-100 border-0 bg-transparent text-start mb-2 ${currentPage === 'settings' ? 'active' : ''}`}
          onClick={() => onNavigate('settings')}
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>

        <div className="d-flex align-items-center justify-content-between pt-2 border-top" style={{ borderColor: 'rgba(6, 78, 59, 0.4)' }}>
          <div className="overflow-hidden me-2">
            <div className="text-truncate fw-bold text-white small" title={user?.fullName || ''}>
              {user?.fullName || 'Farmer'}
            </div>
            <div className="text-truncate" style={{ fontSize: '0.6875rem', color: 'rgba(209, 250, 229, 0.6)' }} title={user?.email || ''}>
              {user?.email || ''}
            </div>
          </div>
          <button
            id="btn-sidebar-logout"
            type="button"
            className="btn btn-sm p-1 border-0"
            style={{ color: 'rgba(209, 250, 229, 0.7)' }}
            title="Log out"
            onClick={logout}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
