import React, { useState, useEffect } from 'react';
import { Plus, Search, TrendingUp, Edit, Trash2, Users, DollarSign, AlertCircle, Phone, MapPin } from 'lucide-react';
import { Sale, Buyer } from '../types';
import { api } from '../services/api';
import { formatDate, formatUGX, formatLitres } from '../utils/formatters';
import { EmptyState } from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/LoadingSkeleton';

interface SalesPageProps {
  onOpenRecordSale: (sale?: Sale) => void;
  onOpenAddBuyer: (buyer?: Buyer) => void;
  buyers: Buyer[];
  onDataUpdated: () => void;
}

export const SalesPage: React.FC<SalesPageProps> = ({
  onOpenRecordSale,
  onOpenAddBuyer,
  buyers,
  onDataUpdated,
}) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sales' | 'buyers'>('sales');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      const res = await api.getSales();
      if (res.success && res.data) {
        setSales(res.data);
      }
    } catch (err) {
      console.error('Failed to load sales:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handleDeleteSale = async (saleId: string) => {
    if (!window.confirm('Are you sure you want to delete this sales transaction?')) return;
    try {
      const res = await api.deleteSale(saleId);
      if (res.success) {
        setSales(prev => prev.filter(s => s.saleId !== saleId));
        onDataUpdated();
      }
    } catch (err) {
      alert('Failed to delete sale.');
    }
  };

  const handleDeleteBuyer = async (buyerId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove buyer "${name}"?`)) return;
    try {
      const res = await api.deleteBuyer(buyerId);
      if (res.success) {
        onDataUpdated();
      }
    } catch (err) {
      alert('Failed to delete buyer.');
    }
  };

  // Summaries
  const totalSalesRevenue = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  const totalAmountPaid = sales.reduce((sum, s) => sum + (s.amountPaid || 0), 0);
  const totalOutstanding = sales.reduce((sum, s) => sum + (s.amountDue || 0), 0);
  const totalLitresSold = sales.reduce((sum, s) => sum + (s.litres || 0), 0);

  const filteredSales = sales.filter(s => {
    const q = (searchQuery || '').toLowerCase();
    const bName = (s.buyerName || '').toLowerCase();
    const sDate = (s.saleDate || (s as any).date || '').toLowerCase();
    const notes = (s.notes || '').toLowerCase();
    return bName.includes(q) || sDate.includes(q) || notes.includes(q);
  });

  const filteredBuyers = buyers.filter(b => {
    const q = (searchQuery || '').toLowerCase();
    const bName = (b.name || (b as any).buyerName || '').toLowerCase();
    const bLoc = (b.location || '').toLowerCase();
    const bPhone = (b.phone || '').toLowerCase();
    return bName.includes(q) || bLoc.includes(q) || bPhone.includes(q);
  });

  return (
    <div className="container-fluid py-4 px-3 px-md-4">
      {/* Header & Primary Actions */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="dp-page-title">Milk Sales & Revenue</h1>
          <p className="dp-page-subtitle">Commercial deliveries, buyer accounts, and payment settlements</p>
        </div>

        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn-dp-secondary"
            onClick={() => onOpenAddBuyer()}
          >
            <Users size={16} />
            <span>Add Buyer</span>
          </button>
          <button
            id="btn-record-sale-top"
            type="button"
            className="btn-dp-primary"
            onClick={() => onOpenRecordSale()}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Record Milk Sale</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-md-3">
          <div className="dp-card py-3">
            <span className="dp-kpi-label">Total Milk Sales</span>
            <div className="dp-kpi-value text-success">{formatUGX(totalSalesRevenue)}</div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-md-3">
          <div className="dp-card py-3">
            <span className="dp-kpi-label">Collected Payments</span>
            <div className="dp-kpi-value text-dark">{formatUGX(totalAmountPaid)}</div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-md-3">
          <div className="dp-card py-3">
            <span className="dp-kpi-label">Outstanding Due</span>
            <div className="dp-kpi-value text-danger">{formatUGX(totalOutstanding)}</div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-md-3">
          <div className="dp-card py-3">
            <span className="dp-kpi-label">Volume Dispatched</span>
            <div className="dp-kpi-value text-primary">{formatLitres(totalLitresSold)}</div>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
        <ul className="nav nav-pills gap-2">
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link py-1 px-3 fw-semibold ${activeTab === 'sales' ? 'active bg-success text-white' : 'text-dark bg-white border'}`}
              onClick={() => setActiveTab('sales')}
            >
              Sales Orders ({sales.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link py-1 px-3 fw-semibold ${activeTab === 'buyers' ? 'active bg-success text-white' : 'text-dark bg-white border'}`}
              onClick={() => setActiveTab('buyers')}
            >
              Registered Buyers ({buyers.length})
            </button>
          </li>
        </ul>

        <div style={{ maxWidth: 300 }} className="w-100">
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-white border-end-0 text-muted">
              <Search size={14} />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder={activeTab === 'sales' ? 'Search sales...' : 'Search buyers...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Content based on Tab */}
      {activeTab === 'sales' ? (
        isLoading ? (
          <TableSkeleton rows={5} />
        ) : sales.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No milk sales recorded"
            description="Record your commercial milk deliveries and sales to cooperatives or local customers to track real earnings."
            actionLabel="+ Record Milk Sale"
            onAction={() => onOpenRecordSale()}
          />
        ) : filteredSales.length === 0 ? (
          <div className="dp-card p-4 text-center text-muted small">
            No sales match your search filter.
          </div>
        ) : (
          <div className="dp-table-container table-responsive">
            <table className="table dp-table mb-0">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Buyer</th>
                  <th>Litres</th>
                  <th>Price / L</th>
                  <th>Total Amount</th>
                  <th>Paid</th>
                  <th>Outstanding</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map(s => (
                  <tr key={s.saleId}>
                    <td className="fw-semibold text-dark">{formatDate(s.saleDate)}</td>
                    <td>
                      <span className="fw-medium text-dark">{s.buyerName || 'Direct / Walk-in'}</span>
                    </td>
                    <td>{formatLitres(s.litres)}</td>
                    <td>{formatUGX(s.pricePerLitre)}</td>
                    <td className="fw-bold text-dark">{formatUGX(s.totalAmount)}</td>
                    <td className="text-success fw-medium">{formatUGX(s.amountPaid)}</td>
                    <td>
                      {s.amountDue > 0 ? (
                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1">
                          {formatUGX(s.amountDue)}
                        </span>
                      ) : (
                        <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                          Paid Full
                        </span>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-secondary p-1"
                          title="Edit Sale"
                          onClick={() => onOpenRecordSale(s)}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger p-1"
                          title="Delete Sale"
                          onClick={() => handleDeleteSale(s.saleId)}
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
        )
      ) : (
        /* Buyers Registry Tab */
        buyers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No buyers added yet"
            description="Add your dairy cooperative, milk collection centre, or commercial milk buyers to track customer sales and debt."
            actionLabel="+ Add First Buyer"
            onAction={() => onOpenAddBuyer()}
          />
        ) : (
          <div className="row g-3">
            {filteredBuyers.map(buyer => {
              // Calculate specific buyer balance from sales
              const buyerSales = sales.filter(s => s.buyerId === buyer.buyerId);
              const buyerDue = buyerSales.reduce((acc, s) => acc + (s.amountDue || 0), 0);
              const buyerVol = buyerSales.reduce((acc, s) => acc + (s.litres || 0), 0);

              return (
                <div key={buyer.buyerId} className="col-12 col-md-6 col-lg-4">
                  <div className="dp-card h-100 d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h3 className="h6 fw-bold text-dark mb-0">{buyer.name}</h3>
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary p-1 border-0"
                            onClick={() => onOpenAddBuyer(buyer)}
                            title="Edit Buyer"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger p-1 border-0"
                            onClick={() => handleDeleteBuyer(buyer.buyerId, buyer.name)}
                            title="Delete Buyer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {buyer.location && (
                        <div className="small text-muted d-flex align-items-center gap-1 mb-1">
                          <MapPin size={13} />
                          <span>{buyer.location}</span>
                        </div>
                      )}
                      {buyer.phone && (
                        <div className="small text-muted d-flex align-items-center gap-1 mb-3">
                          <Phone size={13} />
                          <span>{buyer.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-top border-light d-flex justify-content-between align-items-center">
                      <div>
                        <span className="small text-muted d-block">Volume Purchased</span>
                        <strong className="text-dark small">{formatLitres(buyerVol)}</strong>
                      </div>
                      <div className="text-end">
                        <span className="small text-muted d-block">Balance Due</span>
                        <strong className={`small ${buyerDue > 0 ? 'text-danger' : 'text-success'}`}>
                          {formatUGX(buyerDue)}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};
