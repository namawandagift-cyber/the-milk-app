import React, { useState, useEffect } from 'react';
import { FileBarChart, Calendar, Printer, TrendingUp, Receipt, Scale, Droplets, Info } from 'lucide-react';
import { api } from '../services/api';
import { ReportData } from '../types';
import { formatUGX, formatLitres } from '../utils/formatters';
import { CardSkeleton } from '../components/common/LoadingSkeleton';

export const ReportsPage: React.FC = () => {
  const [period, setPeriod] = useState<string>('this_month');
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReport = async (p: string) => {
    setIsLoading(true);
    try {
      const res = await api.getReportData(p);
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(period);
  }, [period]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container-fluid py-4 px-3 px-md-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="dp-page-title">Farm Business Performance</h1>
          <p className="dp-page-subtitle">Profit & loss analysis, unit economics, and operational efficiency</p>
        </div>

        <div className="d-flex gap-2">
          <select
            className="form-select form-select-sm"
            value={period}
            onChange={e => setPeriod(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="all_time">All Time</option>
          </select>

          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
            onClick={handlePrint}
            title="Print or export as PDF"
          >
            <Printer size={15} />
            <span className="d-none d-sm-inline">Print Report</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="row g-3">
          <div className="col-12"><CardSkeleton height={140} /></div>
          <div className="col-6 col-md-3"><CardSkeleton /></div>
          <div className="col-6 col-md-3"><CardSkeleton /></div>
          <div className="col-6 col-md-3"><CardSkeleton /></div>
          <div className="col-6 col-md-3"><CardSkeleton /></div>
        </div>
      ) : !data || data.daysRecorded < 1 ? (
        /* Insufficient data state */
        <div className="dp-card p-5 text-center my-4">
          <Info size={36} className="text-secondary mb-3" />
          <h3 className="h5 fw-bold text-dark mb-2">Not enough data to generate report</h3>
          <p className="text-muted small mx-auto mb-0" style={{ maxWidth: 460 }}>
            Record at least a few days of milk production, sales, and feed expenses to unlock automated profit & loss statements and unit margins.
          </p>
        </div>
      ) : (
        <>
          {/* Executive Summary Narrative */}
          <div className="dp-card mb-4 bg-white" style={{ borderLeft: '5px solid var(--dp-forest)' }}>
            <span className="dp-kpi-label">Executive Intelligence Brief</span>
            <p className="lead fs-6 text-dark fw-medium mb-0 mt-1" style={{ lineHeight: 1.65 }}>
              "{data.narrativeSummary}"
            </p>
          </div>

          {/* Primary Financial & Production KPIs */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-xl-3">
              <div className="dp-card py-3">
                <span className="dp-kpi-label">Total Milk Output</span>
                <div className="dp-kpi-value text-dark mb-1">{formatLitres(data.totalLitres)}</div>
                <span className="text-muted small">Daily avg: {data.avgLitresPerDay} L / day</span>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="dp-card py-3">
                <span className="dp-kpi-label">Gross Farm Revenue</span>
                <div className="dp-kpi-value text-success mb-1">{formatUGX(data.totalRevenue)}</div>
                <span className="text-muted small">Sales revenue logged</span>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="dp-card py-3">
                <span className="dp-kpi-label">Operating Costs</span>
                <div className="dp-kpi-value text-danger mb-1">{formatUGX(data.totalExpenses)}</div>
                <span className="text-muted small">Feeds, vet, labour & upkeep</span>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-3">
              <div className="dp-card py-3">
                <span className="dp-kpi-label">Net Profit / Margin</span>
                <div className={`dp-kpi-value mb-1 ${data.netProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatUGX(data.netProfit)}
                </div>
                <span className="text-muted small">Net margin: {data.marginPercent}%</span>
              </div>
            </div>
          </div>

          {/* Unit Economics Breakdown */}
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <div className="dp-card h-100">
                <h3 className="h6 fw-bold text-dark mb-3">Unit Economics per Litre</h3>
                <div className="d-flex flex-column gap-3">
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                    <span className="text-muted small">Avg. Sales Price per Litre</span>
                    <strong className="text-dark">
                      {formatUGX(data.totalLitres > 0 ? Math.round(data.totalRevenue / data.totalLitres) : 0)} / L
                    </strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                    <span className="text-muted small">Operating Cost per Litre</span>
                    <strong className="text-danger">
                      {formatUGX(data.costPerLitre)} / L
                    </strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                    <span className="text-muted small">Feed Expense per Litre</span>
                    <strong className="text-warning">
                      {formatUGX(data.feedCostPerLitre)} / L
                    </strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-2">
                    <span className="text-muted small">Estimated Net Profit per Litre</span>
                    <strong className={data.netProfitPerLitre >= 0 ? 'text-success' : 'text-danger'}>
                      {formatUGX(data.netProfitPerLitre)} / L
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div className="dp-card h-100">
                <h3 className="h6 fw-bold text-dark mb-3">Auditing & Period Meta</h3>
                <div className="d-flex flex-column gap-3">
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                    <span className="text-muted small">Report Window</span>
                    <strong className="text-dark">{data.periodLabel}</strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                    <span className="text-muted small">Days with Logged Production</span>
                    <strong className="text-dark">{data.daysRecorded} days</strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-2 border-bottom border-light">
                    <span className="text-muted small">Profitability Status</span>
                    <span className={`badge ${data.netProfit >= 0 ? 'bg-success' : 'bg-danger'} px-2 py-1`}>
                      {data.netProfit >= 0 ? 'Profitable' : 'Deficit / In Loss'}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center py-2">
                    <span className="text-muted small">Generated By</span>
                    <span className="text-dark fw-medium small">DairyPulse Business Intelligence</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
