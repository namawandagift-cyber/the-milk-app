import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Edit,
  Milk as MilkIcon,
} from 'lucide-react';

import { MilkRecord } from '../types';
import { api } from '../services/api';
import { formatDate, formatLitres } from '../utils/formatters';
import { EmptyState } from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/LoadingSkeleton';

interface MilkPageProps {
  onOpenRecordMilk: (record?: MilkRecord) => void;
  onRecordDeleted: () => void;
}

export const MilkPage: React.FC<MilkPageProps> = ({
  onOpenRecordMilk,
  onRecordDeleted,
}) => {
  const [records, setRecords] = useState<MilkRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  const fetchRecords = async () => {
    setIsLoading(true);

    try {
      console.log('🟢 Fetching milk records...');

      const res = await api.getMilkRecords();

      console.log('🟢 Milk API response:', res);
      console.log('🟢 Milk success:', res?.success);
      console.log('🟢 Milk data:', res?.data);
      console.log(
        '🟢 Milk data is array:',
        Array.isArray(res?.data)
      );
      console.log(
        '🟢 Milk record count:',
        Array.isArray(res?.data)
          ? res.data.length
          : 'NOT AN ARRAY'
      );

      if (res.success && Array.isArray(res.data)) {
        setRecords(res.data);
      } else {
        console.error(
          '🔴 Milk records response is invalid:',
          res
        );

        setRecords([]);

        alert(
          res.message ||
            'Milk records could not be loaded from the server.'
        );
      }
    } catch (err) {
      console.error(
        '🔴 Failed to load milk records:',
        err
      );

      setRecords([]);

      alert(
        'Failed to load milk records. Check the browser console.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleDelete = async (recordId: string) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this milk record?'
      )
    ) {
      return;
    }

    try {
      const res = await api.deleteMilkRecord(recordId);

      if (res.success) {
        setRecords((prev) =>
          prev.filter(
            (r) => r.recordId !== recordId
          )
        );

        onRecordDeleted();
      } else {
        alert(
          res.message ||
            'Failed to delete milk record.'
        );
      }
    } catch (err) {
      console.error(
        'Failed to delete milk record:',
        err
      );

      alert('Failed to delete milk record.');
    }
  };

  // Filter records
  const filtered = records.filter((r) => {
    const recDate =
      r.recordDate ||
      (r as any).date ||
      '';

    const recNotes =
      r.notes || '';

    const matchesSearch =
      recDate.includes(searchTerm) ||
      recNotes
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesMonth = selectedMonth
      ? recDate.startsWith(selectedMonth)
      : true;

    return matchesSearch && matchesMonth;
  });

  const totalLitres = filtered.reduce(
    (acc, r) =>
      acc +
      (r.totalLitres ??
        (r as any).litres ??
        0),
    0
  );

  const avgLitres =
    filtered.length > 0
      ? (totalLitres / filtered.length).toFixed(1)
      : '0';

  return (
    <div className="container-fluid py-4 px-3 px-md-4">

      {/* Header & Primary Action */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="dp-page-title">
            Milk Production
          </h1>

          <p className="dp-page-subtitle">
            Daily morning and evening milk collection logs
          </p>
        </div>

        <button
          id="btn-milk-record-new"
          type="button"
          className="btn-dp-primary"
          onClick={() => onOpenRecordMilk()}
        >
          <Plus
            size={16}
            strokeWidth={2.5}
          />

          <span>
            Record Today's Milk
          </span>
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="row g-3 mb-4">

        <div className="col-12 col-sm-4">
          <div className="dp-card py-3">
            <span className="dp-kpi-label">
              Filtered Total Litres
            </span>

            <div className="dp-kpi-value text-success">
              {formatLitres(totalLitres)}
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-4">
          <div className="dp-card py-3">
            <span className="dp-kpi-label">
              Daily Average Yield
            </span>

            <div className="dp-kpi-value text-dark">
              {avgLitres} L
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-4">
          <div className="dp-card py-3">
            <span className="dp-kpi-label">
              Days Logged
            </span>

            <div className="dp-kpi-value text-dark">
              {filtered.length}
            </div>
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
                placeholder="Search by date or notes..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
              />

            </div>
          </div>

          <div className="col-12 col-md-4">
            <input
              type="month"
              className="form-control"
              value={selectedMonth}
              onChange={(e) =>
                setSelectedMonth(e.target.value)
              }
            />
          </div>

          {selectedMonth && (
            <div className="col-12 col-md-2">

              <button
                type="button"
                className="btn btn-outline-secondary btn-sm w-100 py-2"
                onClick={() =>
                  setSelectedMonth('')
                }
              >
                Clear Month
              </button>

            </div>
          )}

        </div>
      </div>

      {/* Records Table / Empty State */}
      {isLoading ? (

        <TableSkeleton rows={6} />

      ) : records.length === 0 ? (

        <EmptyState
          icon={MilkIcon}
          title="No milk records recorded yet"
          description="Track your morning and evening milking volumes daily to see productivity trends and identify herd drops."
          actionLabel="Record Today's Milk"
          onAction={() =>
            onOpenRecordMilk()
          }
        />

      ) : filtered.length === 0 ? (

        <div className="dp-card p-4 text-center text-muted small">
          No records match your search filter.
          Try clearing your filters.
        </div>

      ) : (

        <div className="dp-table-container table-responsive">

          <table className="table dp-table mb-0">

            <thead>
              <tr>
                <th>Date</th>
                <th>Morning</th>
                <th>Evening</th>
                <th>Total Volume</th>
                <th>Notes</th>
                <th className="text-end">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>

              {filtered.map((rec) => (

                <tr key={rec.recordId}>

                  <td className="fw-semibold text-dark">
                    {formatDate(rec.recordDate)}
                  </td>

                  <td>
                    {rec.morningLitres} L
                  </td>

                  <td>
                    {rec.eveningLitres} L
                  </td>

                  <td>
                    <span className="fw-bold text-success">
                      {formatLitres(
                        rec.totalLitres
                      )}
                    </span>
                  </td>

                  <td className="text-muted small">
                    {rec.notes || '—'}
                  </td>

                  <td className="text-end">

                    <div className="btn-group btn-group-sm">

                      <button
                        type="button"
                        className="btn btn-outline-secondary p-1"
                        title="Edit Record"
                        onClick={() =>
                          onOpenRecordMilk(rec)
                        }
                      >
                        <Edit size={14} />
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline-danger p-1"
                        title="Delete Record"
                        onClick={() =>
                          handleDelete(
                            rec.recordId
                          )
                        }
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