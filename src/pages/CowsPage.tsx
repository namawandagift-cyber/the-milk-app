import React, { useState, useEffect } from 'react';
import { Plus, Search, Users2, Edit, Trash2, Tag, Calendar, HeartPulse } from 'lucide-react';
import { Cow, CowStatus } from '../types';
import { api } from '../services/api';
import { formatDate } from '../utils/formatters';
import { EmptyState } from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/LoadingSkeleton';

interface CowsPageProps {
  onOpenAddCow: (cow?: Cow) => void;
  onCowUpdated: () => void;
}

export const CowsPage: React.FC<CowsPageProps> = ({ onOpenAddCow, onCowUpdated }) => {
  const [cows, setCows] = useState<Cow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const fetchCows = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCows();
      if (res.success && res.data) {
        setCows(res.data);
      }
    } catch (err) {
      console.error('Failed to load cows:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCows();
  }, []);

  const handleDelete = async (cowId: string, cowNumber: string) => {
    if (!window.confirm(`Are you sure you want to remove cow #${cowNumber} from your herd?`)) return;
    try {
      const res = await api.deleteCow(cowId);
      if (res.success) {
        setCows(prev => prev.filter(c => c.cowId !== cowId));
        onCowUpdated();
      }
    } catch (err) {
      alert('Failed to delete cow.');
    }
  };

  // Herd statistics calculated directly from real records
  const totalCows = cows.length;
  const lactatingCount = cows.filter(c => c.status === 'Lactating').length;
  const dryCount = cows.filter(c => c.status === 'Dry').length;
  const pregnantCount = cows.filter(c => c.status === 'Pregnant').length;
  const calvesCount = cows.filter(c => c.status === 'Calf').length;
  const sickCount = cows.filter(c => c.status === 'Sick').length;

  const filteredCows = cows.filter(c => {
    const q = (searchQuery || '').toLowerCase();
    const tag = (c.cowNumber || (c as any).earTag || '').toLowerCase();
    const name = (c.name || (c as any).cowName || '').toLowerCase();
    const breed = (c.breed || '').toLowerCase();
    const matchesSearch = tag.includes(q) || name.includes(q) || breed.includes(q);
    const matchesStatus = selectedStatus === 'ALL' || c.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClass = (status: CowStatus) => {
    switch (status) {
      case 'Lactating':
        return 'dp-badge-lactating';
      case 'Dry':
        return 'dp-badge-dry';
      case 'Pregnant':
        return 'dp-badge-pregnant';
      case 'Calf':
        return 'dp-badge-calf';
      case 'Sick':
        return 'dp-badge-sick';
      default:
        return 'dp-badge-dry';
    }
  };

  return (
    <div className="container-fluid py-4 px-3 px-md-4">
      {/* Header & Primary Action */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="dp-page-title">Herd Management</h1>
          <p className="dp-page-subtitle">Cattle registry, lifecycle stages, and health records</p>
        </div>

        <button
          id="btn-add-cow-top"
          type="button"
          className="btn-dp-primary"
          onClick={() => onOpenAddCow()}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Add Cow</span>
        </button>
      </div>

      {/* Herd Stat Cards */}
      <div className="row g-2 g-md-3 mb-4">
        <div className="col-6 col-md-2">
          <div className="dp-card py-2 px-3 text-center">
            <span className="dp-kpi-label">Total Herd</span>
            <div className="h4 mb-0 fw-bold text-dark">{totalCows}</div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="dp-card py-2 px-3 text-center">
            <span className="dp-kpi-label">Lactating</span>
            <div className="h4 mb-0 fw-bold text-success">{lactatingCount}</div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="dp-card py-2 px-3 text-center">
            <span className="dp-kpi-label">Dry Cows</span>
            <div className="h4 mb-0 fw-bold text-secondary">{dryCount}</div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="dp-card py-2 px-3 text-center">
            <span className="dp-kpi-label">Pregnant</span>
            <div className="h4 mb-0 fw-bold text-primary">{pregnantCount}</div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="dp-card py-2 px-3 text-center">
            <span className="dp-kpi-label">Calves</span>
            <div className="h4 mb-0 fw-bold text-warning">{calvesCount}</div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="dp-card py-2 px-3 text-center">
            <span className="dp-kpi-label">Sick / Care</span>
            <div className="h4 mb-0 fw-bold text-danger">{sickCount}</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="dp-card p-3 mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 text-muted">
                <Search size={16} />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search tag number, name, or breed..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="d-flex flex-wrap gap-1">
              {['ALL', 'Lactating', 'Dry', 'Pregnant', 'Calf', 'Sick'].map(st => (
                <button
                  key={st}
                  type="button"
                  className={`btn btn-sm ${selectedStatus === st ? 'btn-success' : 'btn-outline-secondary'}`}
                  onClick={() => setSelectedStatus(st)}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cows Table / Grid */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : cows.length === 0 ? (
        <EmptyState
          icon={Users2}
          title="Your herd is empty"
          description="Add your dairy cows to start tracking herd size, lactation cycles, and milk production performance."
          actionLabel="+ Add First Cow"
          onAction={() => onOpenAddCow()}
        />
      ) : filteredCows.length === 0 ? (
        <div className="dp-card p-4 text-center text-muted small">
          No cows found matching "{searchQuery}".
        </div>
      ) : (
        <div className="dp-table-container table-responsive">
          <table className="table dp-table mb-0">
            <thead>
              <tr>
                <th>Tag / Cow #</th>
                <th>Name</th>
                <th>Breed</th>
                <th>Status</th>
                <th>Age / DOB</th>
                <th>Notes</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCows.map(cow => (
                <tr key={cow.cowId}>
                  <td>
                    <span className="badge bg-light text-dark border px-2 py-1 fw-bold">
                      #{cow.cowNumber}
                    </span>
                  </td>
                  <td className="fw-semibold text-dark">
                    {cow.name || '—'}
                  </td>
                  <td>{cow.breed}</td>
                  <td>
                    <span className={`dp-badge ${getStatusBadgeClass(cow.status)}`}>
                      {cow.status}
                    </span>
                  </td>
                  <td className="text-muted small">
                    {cow.dateOfBirth ? formatDate(cow.dateOfBirth) : '—'}
                  </td>
                  <td className="text-muted small" style={{ maxWidth: 200 }}>
                    {cow.notes || '—'}
                  </td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      <button
                        type="button"
                        className="btn btn-outline-secondary p-1"
                        title="Edit Cow"
                        onClick={() => onOpenAddCow(cow)}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger p-1"
                        title="Delete Cow"
                        onClick={() => handleDelete(cow.cowId, cow.cowNumber)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
