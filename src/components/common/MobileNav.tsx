import React, { useState } from 'react';
import {
  LayoutDashboard,
  Milk,
  Users2,
  TrendingUp,
  MoreHorizontal,
  Receipt,
  FileBarChart,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { PageId } from './Sidebar';
import { useAuth } from '../../context/AuthContext';

interface MobileNavProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentPage, onNavigate }) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const { logout, user } = useAuth();

  const handleNavClick = (page: PageId) => {
    onNavigate(page);
    setShowMoreMenu(false);
  };

  return (
    <>
      {/* "More" Drawer Backdrop and Sheet */}
      {showMoreMenu && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-lg-none"
          style={{ zIndex: 1050 }}
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            className="position-absolute bottom-0 start-0 w-100 bg-white rounded-top-4 p-4 shadow-lg"
            style={{ animation: 'dpSlideUp 0.2s ease-out' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">More Options</h6>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowMoreMenu(false)}
              />
            </div>

            <div className="list-group list-group-flush mb-3">
              <button
                type="button"
                className={`list-group-item list-group-item-action d-flex align-items-center gap-3 py-3 border-0 rounded-3 ${currentPage === 'expenses' ? 'bg-light text-success fw-bold' : ''}`}
                onClick={() => handleNavClick('expenses')}
              >
                <Receipt size={20} className="text-secondary" />
                <span>Expenses Management</span>
              </button>
              <button
                type="button"
                className={`list-group-item list-group-item-action d-flex align-items-center gap-3 py-3 border-0 rounded-3 ${currentPage === 'reports' ? 'bg-light text-success fw-bold' : ''}`}
                onClick={() => handleNavClick('reports')}
              >
                <FileBarChart size={20} className="text-secondary" />
                <span>Farm Performance Reports</span>
              </button>
              <button
                type="button"
                className={`list-group-item list-group-item-action d-flex align-items-center gap-3 py-3 border-0 rounded-3 ${currentPage === 'settings' ? 'bg-light text-success fw-bold' : ''}`}
                onClick={() => handleNavClick('settings')}
              >
                <Settings size={20} className="text-secondary" />
                <span>Farm & Backend Settings</span>
              </button>
            </div>

            <div className="border-top pt-3 d-flex justify-content-between align-items-center">
              <div>
                <div className="fw-bold small">{user?.fullName}</div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>{user?.email}</div>
              </div>
              <button
                type="button"
                className="btn btn-outline-danger btn-sm d-flex align-items-center gap-2"
                onClick={() => {
                  setShowMoreMenu(false);
                  logout();
                }}
              >
                <LogOut size={16} />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar */}
      <nav className="dp-mobile-bottom-nav d-lg-none">
        <button
          type="button"
          className={`dp-mobile-nav-item border-0 bg-transparent ${currentPage === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleNavClick('dashboard')}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </button>

        <button
          type="button"
          className={`dp-mobile-nav-item border-0 bg-transparent ${currentPage === 'milk' ? 'active' : ''}`}
          onClick={() => handleNavClick('milk')}
        >
          <Milk size={20} />
          <span>Milk</span>
        </button>

        <button
          type="button"
          className={`dp-mobile-nav-item border-0 bg-transparent ${currentPage === 'cows' ? 'active' : ''}`}
          onClick={() => handleNavClick('cows')}
        >
          <Users2 size={20} />
          <span>Herd</span>
        </button>

        <button
          type="button"
          className={`dp-mobile-nav-item border-0 bg-transparent ${currentPage === 'sales' ? 'active' : ''}`}
          onClick={() => handleNavClick('sales')}
        >
          <TrendingUp size={20} />
          <span>Sales</span>
        </button>

        <button
          type="button"
          className={`dp-mobile-nav-item border-0 bg-transparent ${['expenses', 'reports', 'settings'].includes(currentPage) ? 'active' : ''}`}
          onClick={() => setShowMoreMenu(true)}
        >
          <MoreHorizontal size={20} />
          <span>More</span>
        </button>
      </nav>
    </>
  );
};
