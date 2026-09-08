import React, { useState, useEffect } from 'react';
import {
  Droplets,
  TrendingUp,
  Receipt,
  Scale,
  Users2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Calendar,
  DollarSign,
  Milk as MilkIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { PageId } from '../components/common/Sidebar';
import { DashboardData } from '../types';
import { api } from '../services/api';
import { formatUGX, formatLitres, formatDate } from '../utils/formatters';
import { CardSkeleton, TableSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';

interface DashboardPageProps {
  onNavigate: (page: PageId) => void;
  onOpenRecordMilk: () => void;
  onOpenAddCow: () => void;
  onOpenAddExpense: () => void;
  onOpenRecordSale: () => void;
}

const DONUT_COLORS = ['#1B4332', '#2D6A4F', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#8B5CF6'];

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenRecordMilk,
  onOpenAddCow,
  onOpenAddExpense,
  onOpenRecordSale,
}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [chartRange, setChartRange] = useState<'7d' | '30d'>('7d');

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await api.getDashboardData();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };
useEffect(() => {
  fetchDashboard();

  const handleDashboardRefresh = () => {
    fetchDashboard();
  };

  window.addEventListener('dairypulse:dashboard-refresh', handleDashboardRefresh);

  return () => {
    window.removeEventListener(
      'dairypulse:dashboard-refresh',
      handleDashboardRefresh
    );
  };
}, []);

  if (isLoading) {
    return (
      <div className="container-fluid py-4 px-3 px-md-4">
        <div className="row g-3 mb-4">
          <div className="col-12"><CardSkeleton height={80} /></div>
          <div className="col-6 col-md-3"><CardSkeleton /></div>
          <div className="col-6 col-md-3"><CardSkeleton /></div>
          <div className="col-6 col-md-3"><CardSkeleton /></div>
          <div className="col-6 col-md-3"><CardSkeleton /></div>
        </div>
        <div className="row g-3">
          <div className="col-lg-8"><CardSkeleton height={320} /></div>
          <div className="col-lg-4"><CardSkeleton height={320} /></div>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis;
  const pulse = data?.farmPulse || {
    status: 'getting_started',
    headline: 'Welcome to DairyPulse',
    summary: 'Start recording your milk production and expenses to generate farm intelligence.',
  };

  const isBrandNewFarm =
    (kpis?.herdSize || 0) === 0 &&
    (kpis?.todayMilkLitres || 0) === 0 &&
    (kpis?.monthMilkLitres || 0) === 0 &&
    (kpis?.monthRevenue || 0) === 0;

  // Filter milk production chart data according to selected tab (7d vs 30d)
  const rawTrend = data?.milkTrend || [];
  const displayMilkTrend = chartRange === '7d' ? rawTrend.slice(-7) : rawTrend.slice(-30);

  return (
    <div className="container-fluid py-4 px-3 px-md-4">
      {/* 1. FARM PULSE STATUS BANNER */}
      <div className={`dp-pulse-card dp-pulse-${pulse.status} mb-4 d-flex flex-wrap align-items-center justify-content-between gap-4`}>
        <div className="d-flex align-items-center gap-3">
          <div className={`dp-pulse-icon-circle dp-pulse-icon-${pulse.status}`}>
            {pulse.status === 'steady' && <CheckCircle2 size={22} />}
            {pulse.status === 'watch' && <AlertTriangle size={22} />}
            {pulse.status === 'attention' && <AlertTriangle size={22} />}
            {pulse.status === 'getting_started' && <Droplets size={22} />}
          </div>
          <div>
            <div className="text-uppercase fw-bold mb-1" style={{ fontSize: '0.6875rem', letterSpacing: '0.1em', color: 'var(--dp-text-muted)' }}>
              Farm Pulse
            </div>
            <div className="d-flex flex-wrap align-items-baseline gap-2">
              <span className="fw-bold fs-4 text-capitalize" style={{ color: 'var(--dp-charcoal)' }}>
                {pulse.status === 'getting_started' ? 'Getting Started' : pulse.status}
              </span>
              <span className="small" style={{ color: 'var(--dp-charcoal-muted)' }}>
                {pulse.summary || pulse.headline}
              </span>
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-3 ms-auto">
          <button
            type="button"
            className="btn btn-link text-decoration-underline p-0 fw-semibold small"
            style={{ color: 'var(--dp-forest-dark)', textUnderlineOffset: '4px' }}
            onClick={() => onNavigate('reports')}
          >
            Review Insights
          </button>
          <button
            type="button"
            className="btn-dp-primary btn-sm"
            onClick={onOpenRecordMilk}
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Record Milk</span>
          </button>
        </div>
      </div>

      {/* 2. BRAND NEW FARM ONBOARDING HERO (IF 0 RECORDS) */}
      {isBrandNewFarm ? (
        <EmptyState
          icon={Droplets}
          title="Your farm workspace is ready"
          description="DairyPulse has initialized a clean tabular database for your farm. Record today's milk collection or add your first cow to unlock real-time financial tracking and production analytics."
          actionLabel="Record Today's Milk"
          onAction={onOpenRecordMilk}
          secondaryActionLabel="+ Add First Cow"
          onSecondaryAction={onOpenAddCow}
        />
      ) : (
        <>
          {/* 3. PRIMARY 4-CARD KPI GRID */}
          <div className="row g-3 mb-4">
            {/* KPI 1: Today's Milk */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div
                id="kpi-card-milk"
                className="dp-card dp-card-clickable h-100"
                onClick={() => onNavigate('milk')}
                title="View Milk Records"
              >
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="dp-kpi-label">Today's Milk</span>
                  <div className="p-2 rounded-2 bg-light text-success">
                    <MilkIcon size={18} />
                  </div>
                </div>
                <div className="dp-kpi-value text-dark mb-1">
                  {formatLitres(kpis?.todayMilkLitres || 0)}
                </div>
                <div className="d-flex align-items-center gap-1 small">
                  {(kpis?.milkChangePercent || 0) >= 0 ? (
                    <span className="text-success fw-semibold d-inline-flex align-items-center">
                      <ArrowUpRight size={14} />
                      +{kpis?.milkChangePercent}%
                    </span>
                  ) : (
                    <span className="text-danger fw-semibold d-inline-flex align-items-center">
                      <ArrowDownRight size={14} />
                      {kpis?.milkChangePercent}%
                    </span>
                  )}
                  <span className="text-muted">vs 7-day average</span>
                </div>
              </div>
            </div>

            {/* KPI 2: Today's Revenue */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div
                id="kpi-card-revenue"
                className="dp-card dp-card-clickable h-100"
                onClick={() => onNavigate('sales')}
                title="View Milk Sales"
              >
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="dp-kpi-label">Today's Revenue</span>
                  <div className="p-2 rounded-2 bg-light text-primary">
                    <TrendingUp size={18} />
                  </div>
                </div>
                <div className="dp-kpi-value text-dark mb-1">
                  {formatUGX(kpis?.todayRevenue || 0)}
                </div>
                <div className="text-muted small">
                  Month to date: <strong className="text-dark">{formatUGX(kpis?.monthRevenue || 0)}</strong>
                </div>
              </div>
            </div>

            {/* KPI 3: Today's Expenses */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div
                id="kpi-card-expenses"
                className="dp-card dp-card-clickable h-100"
                onClick={() => onNavigate('expenses')}
                title="View Expenses"
              >
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="dp-kpi-label">Today's Expenses</span>
                  <div className="p-2 rounded-2 bg-light text-warning">
                    <Receipt size={18} />
                  </div>
                </div>
                <div className="dp-kpi-value text-dark mb-1">
                  {formatUGX(kpis?.todayExpenses || 0)}
                </div>
                <div className="text-muted small">
                  Month total: <strong className="text-dark">{formatUGX(kpis?.monthExpenses || 0)}</strong>
                </div>
              </div>
            </div>

            {/* KPI 4: Estimated Margin */}
            <div className="col-12 col-sm-6 col-xl-3">
              <div
                id="kpi-card-margin"
                className="dp-card dp-card-clickable h-100"
                onClick={() => onNavigate('reports')}
                title="View Performance Reports"
              >
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="dp-kpi-label">Month Net Margin</span>
                  <div className="p-2 rounded-2 bg-light text-success">
                    <Scale size={18} />
                  </div>
                </div>
                <div className={`dp-kpi-value mb-1 ${(kpis?.monthNetMargin || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatUGX(kpis?.monthNetMargin || 0)}
                </div>
                <div className="text-muted small">
                  Outstanding receivables: <strong className="text-danger">{formatUGX(kpis?.outstandingReceivables || 0)}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* 4. SECONDARY METRICS BAR */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-md-4">
              <div
                className="dp-card dp-card-clickable d-flex align-items-center justify-content-between py-2 px-3"
                onClick={() => onNavigate('cows')}
              >
                <div className="d-flex align-items-center gap-3">
                  <Users2 size={20} className="text-success" />
                  <div>
                    <span className="text-muted small d-block">Active Herd Size</span>
                    <strong className="text-dark fs-6">{kpis?.herdSize || 0} cows ({kpis?.lactatingCows || 0} lactating)</strong>
                  </div>
                </div>
                <ArrowUpRight size={16} className="text-muted" />
              </div>
            </div>

            <div className="col-12 col-sm-6 col-md-4">
              <div
                className="dp-card dp-card-clickable d-flex align-items-center justify-content-between py-2 px-3"
                onClick={() => onNavigate('sales')}
              >
                <div className="d-flex align-items-center gap-3">
                  <DollarSign size={20} className="text-warning" />
                  <div>
                    <span className="text-muted small d-block">Outstanding Buyer Due</span>
                    <strong className="text-dark fs-6">{formatUGX(kpis?.outstandingReceivables || 0)}</strong>
                  </div>
                </div>
                <ArrowUpRight size={16} className="text-muted" />
              </div>
            </div>

            <div className="col-12 col-sm-6 col-md-4">
              <div
                className="dp-card dp-card-clickable d-flex align-items-center justify-content-between py-2 px-3"
                onClick={() => onNavigate('milk')}
              >
                <div className="d-flex align-items-center gap-3">
                  <Droplets size={20} className="text-primary" />
                  <div>
                    <span className="text-muted small d-block">Month Total Production</span>
                    <strong className="text-dark fs-6">{formatLitres(kpis?.monthMilkLitres || 0)}</strong>
                  </div>
                </div>
                <ArrowUpRight size={16} className="text-muted" />
              </div>
            </div>
          </div>

          {/* 5. CHARTS SECTION */}
          <div className="row g-3 mb-4">
            {/* Chart 1: Milk Production Line/Area */}
            <div className="col-12 col-xl-8">
              <div className="dp-card h-100">
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
                  <div>
                    <h3 className="h6 fw-bold mb-0 text-dark">Milk Production Trajectory</h3>
                    <span className="text-muted small">Daily volume yield in litres</span>
                  </div>

                  <div className="d-flex gap-1 p-1 rounded" style={{ backgroundColor: 'var(--dp-bg-subtle)' }}>
                    <button
                      type="button"
                      className={`btn-dp-pill-filter ${chartRange === '7d' ? 'active' : ''}`}
                      onClick={() => setChartRange('7d')}
                    >
                      7D
                    </button>
                    <button
                      type="button"
                      className={`btn-dp-pill-filter ${chartRange === '30d' ? 'active' : ''}`}
                      onClick={() => setChartRange('30d')}
                    >
                      30D
                    </button>
                  </div>
                </div>

                <div style={{ width: '100%', height: 260 }}>
                  {displayMilkTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={displayMilkTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="milkGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={val => val.slice(5)}
                          tick={{ fontSize: 11, fill: '#78716c' }}
                          axisLine={{ stroke: '#e7e5e4' }}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#78716c' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          formatter={(value: any) => [`${value} Litres`, 'Production']}
                          labelFormatter={(label: any) => `Date: ${label}`}
                          contentStyle={{
                            backgroundColor: '#1c1917',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#FFFFFF',
                            fontSize: '12px',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="litres"
                          stroke="#059669"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#milkGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-100 d-flex align-items-center justify-content-center text-muted small">
                      Log at least 1 day of milk collection to view your production chart.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Chart 2: Farm Finances (Monthly Revenue vs Expenses) */}
            <div className="col-12 col-xl-4">
              <div className="dp-card h-100">
                <div className="mb-3">
                  <h3 className="h6 fw-bold mb-0 text-dark">Farm Cash Flow</h3>
                  <span className="text-muted small">Recent 6 months comparison (UGX)</span>
                </div>

                <div style={{ width: '100%', height: 260 }}>
                  {data?.financialComparison && data.financialComparison.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.financialComparison} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 11, fill: '#78716c' }}
                          axisLine={{ stroke: '#e7e5e4' }}
                        />
                        <YAxis
                          tickFormatter={val => `${Math.round(val / 1000)}k`}
                          tick={{ fontSize: 11, fill: '#78716c' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          formatter={(value: any) => [formatUGX(Number(value)), '']}
                          contentStyle={{
                            backgroundColor: '#1c1917',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#FFFFFF',
                            fontSize: '12px',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <Bar dataKey="revenue" fill="#10b981" name="Revenue" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expenses" fill="#fbbf24" name="Expenses" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-100 d-flex align-items-center justify-content-center text-muted small">
                      No financial records recorded yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 6. ALERTS & RECENT ACTIVITY SECTION */}
          <div className="row g-3">
            {/* Needs Attention Column */}
            <div className="col-12 col-lg-6">
              <div className="dp-card h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="h6 fw-bold mb-0 text-dark">Needs Attention</h3>
                  <span className="badge bg-light text-muted fw-semibold">
                    {data?.alerts?.length || 0} active
                  </span>
                </div>

                {data?.alerts && data.alerts.length > 0 ? (
                  <div>
                    {data.alerts.map(alert => (
                      <div key={alert.id} className={`dp-alert-card ${alert.severity}`}>
                        <AlertTriangle
                          size={18}
                          className={
                            alert.severity === 'critical'
                              ? 'text-danger'
                              : alert.severity === 'warning'
                              ? 'text-warning'
                              : 'text-info'
                          }
                        />
                        <div className="flex-grow-1">
                          <strong className="d-block small text-dark">{alert.title}</strong>
                          <span className="small text-muted">{alert.message}</span>
                        </div>
                        {alert.actionLabel && alert.actionPage && (
                          <button
                            type="button"
                            className="btn btn-sm btn-link p-0 fw-bold text-decoration-none small align-self-center"
                            style={{ color: 'var(--dp-forest-dark)' }}
                            onClick={() => onNavigate(alert.actionPage as PageId)}
                          >
                            {alert.actionLabel} →
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted small rounded-3" style={{ backgroundColor: 'var(--dp-bg-subtle)' }}>
                    <CheckCircle2 size={24} style={{ color: 'var(--dp-forest)' }} className="mb-2" />
                    <div>All systems steady. No operational alerts flagged today.</div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity Column */}
            <div className="col-12 col-lg-6">
              <div className="dp-card h-100 p-0 overflow-hidden d-flex flex-col">
                <div className="d-flex justify-content-between align-items-center p-3" style={{ borderBottom: '1px solid var(--dp-border-subtle)' }}>
                  <h3 className="h6 fw-bold mb-0" style={{ color: 'var(--dp-charcoal)' }}>Recent Farm Activity</h3>
                  <span className="small" style={{ color: 'var(--dp-text-muted)' }}>Latest recordings</span>
                </div>

                <div className="p-3 flex-grow-1">
                  {data?.recentActivity && data.recentActivity.length > 0 ? (
                    <div className="d-flex flex-column gap-3">
                      {data.recentActivity.slice(0, 5).map(act => (
                        <div
                          key={act.id}
                          className="d-flex align-items-start gap-3"
                        >
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              marginTop: '6px',
                              backgroundColor: act.type === 'milk' ? '#10b981' : '#a8a29e',
                              borderRadius: '50%',
                              boxShadow: act.type === 'milk' ? '0 0 0 4px rgba(16, 185, 129, 0.12)' : 'none',
                              flexShrink: 0,
                            }}
                          />
                          <div className="flex-grow-1">
                            <div className="small fw-bold" style={{ color: 'var(--dp-charcoal)' }}>{act.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--dp-text-muted)' }}>
                              {act.description} · {formatDate(act.timestamp)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center small rounded-3" style={{ backgroundColor: 'var(--dp-bg-subtle)', color: 'var(--dp-text-muted)' }}>
                      <Clock size={24} className="mb-2" style={{ color: 'var(--dp-text-light)' }} />
                      <div>No farm activity recorded yet. Entries will appear here in real time.</div>
                    </div>
                  )}
                </div>

                <div className="p-2 text-center" style={{ backgroundColor: 'var(--dp-bg)', borderTop: '1px solid var(--dp-border-subtle)' }}>
                  <button
                    type="button"
                    className="btn btn-link p-0 fw-bold text-decoration-none"
                    style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dp-forest-dark)' }}
                    onClick={() => onNavigate('reports')}
                  >
                    View All Activity
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
