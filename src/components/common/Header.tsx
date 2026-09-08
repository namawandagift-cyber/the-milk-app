import React from 'react';
import { Plus, Calendar, MapPin, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatDate, getTodayIsoDate } from '../../utils/formatters';

interface HeaderProps {
  onRecordMilkClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onRecordMilkClick }) => {
  const { user, farm, logout } = useAuth();
  const today = getTodayIsoDate();

  // Get current hour for time-appropriate greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'Farmer';

  return (
    <header className="bg-white px-3 px-md-4 py-3 sticky-top" style={{ zIndex: 1020, borderBottom: '1px solid var(--dp-border)' }}>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
        {/* Left Greeting & Farm meta */}
        <div>
          <div className="d-flex align-items-center gap-2">
            <h1 className="h4 mb-0 fw-bold" style={{ color: 'var(--dp-charcoal)', letterSpacing: '-0.025em' }}>
              {getGreeting()}, {firstName}
            </h1>
          </div>
          <div className="d-flex flex-wrap align-items-center gap-3 small mt-1" style={{ color: 'var(--dp-text-muted)', fontWeight: 500 }}>
            {farm ? (
              <span className="d-inline-flex align-items-center gap-1">
                <MapPin size={14} style={{ color: 'var(--dp-forest)' }} />
                <span className="fw-semibold" style={{ color: 'var(--dp-charcoal)' }}>{farm.farmName}</span> · {farm.location}
              </span>
            ) : (
              <span>Farm Setup Pending</span>
            )}
            <span className="d-inline-flex align-items-center gap-1">
              <Calendar size={13} />
              {formatDate(today)}
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="d-flex align-items-center gap-2 ms-auto">
          <button
            id="btn-header-record-milk"
            type="button"
            className="btn-dp-primary"
            onClick={onRecordMilkClick}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Record Milk</span>
          </button>

          {/* Quick logout button on small screens where sidebar is hidden */}
          <button
            id="btn-header-logout"
            type="button"
            className="btn btn-outline-secondary d-md-none p-2 border-0"
            title="Log out"
            onClick={logout}
          >
            <LogOut size={18} style={{ color: 'var(--dp-text-muted)' }} />
          </button>
        </div>
      </div>
    </header>
  );
};
