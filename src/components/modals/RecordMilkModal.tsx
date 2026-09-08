import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { getTodayIsoDate, formatLitres } from '../../utils/formatters';
import { api } from '../../services/api';
import { MilkRecord } from '../../types';

interface RecordMilkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string, record: MilkRecord) => void;
  editRecord?: MilkRecord | null;
}

export const RecordMilkModal: React.FC<RecordMilkModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editRecord,
}) => {
  const [recordDate, setRecordDate] = useState<string>(editRecord?.recordDate || getTodayIsoDate());
  const [morningLitres, setMorningLitres] = useState<string>(editRecord ? String(editRecord.morningLitres) : '');
  const [eveningLitres, setEveningLitres] = useState<string>(editRecord ? String(editRecord.eveningLitres) : '');
  const [notes, setNotes] = useState<string>(editRecord?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const morning = parseFloat(morningLitres) || 0;
  const evening = parseFloat(eveningLitres) || 0;
  const total = parseFloat((morning + evening).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordDate) {
      setErrorMessage('Please select a milking date.');
      return;
    }
    if (total <= 0) {
      setErrorMessage('Please enter morning or evening milking volume.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (editRecord) {
        const res = await api.updateMilkRecord({
          recordId: editRecord.recordId,
          recordDate,
          morningLitres: morning,
          eveningLitres: evening,
          notes,
        });
        if (res.success) {
          onSuccess('Milk record updated successfully.', {
            ...editRecord,
            recordDate,
            morningLitres: morning,
            eveningLitres: evening,
            totalLitres: total,
            notes,
          });
          onClose();
        } else {
          setErrorMessage(res.message || 'Failed to update milk record.');
        }
      } else {
        const res = await api.createMilkRecord({
          recordDate,
          morningLitres: morning,
          eveningLitres: evening,
          notes,
        });
        if (res.success && res.data) {
          onSuccess('Milk record saved successfully.', res.data);
          onClose();
        } else {
          setErrorMessage(res.message || 'Failed to save milk record.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error saving record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: 'rgba(17, 24, 39, 0.6)', backdropFilter: 'blur(3px)', zIndex: 1055 }}
      tabIndex={-1}
      role="dialog"
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title fw-bold text-dark">
              {editRecord ? 'Edit Milk Record' : 'Record Milk'}
            </h5>
            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onClose}
              disabled={isSubmitting}
            />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {errorMessage && (
                <div className="alert alert-danger py-2 small mb-3">
                  {errorMessage}
                </div>
              )}

              {/* Date */}
              <div className="mb-3">
                <label className="dp-form-label" htmlFor="milk-date">
                  Milking Date *
                </label>
                <input
                  id="milk-date"
                  type="date"
                  className="form-control"
                  value={recordDate}
                  onChange={e => setRecordDate(e.target.value)}
                  required
                />
              </div>

              {/* Litres grid */}
              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="dp-form-label" htmlFor="milk-morning">
                    Morning Litres
                  </label>
                  <div className="input-group">
                    <input
                      id="milk-morning"
                      type="number"
                      step="0.5"
                      min="0"
                      inputMode="decimal"
                      placeholder="0"
                      className="form-control"
                      value={morningLitres}
                      onChange={e => setMorningLitres(e.target.value)}
                    />
                    <span className="input-group-text bg-light text-muted small">L</span>
                  </div>
                </div>

                <div className="col-6">
                  <label className="dp-form-label" htmlFor="milk-evening">
                    Evening Litres
                  </label>
                  <div className="input-group">
                    <input
                      id="milk-evening"
                      type="number"
                      step="0.5"
                      min="0"
                      inputMode="decimal"
                      placeholder="0"
                      className="form-control"
                      value={eveningLitres}
                      onChange={e => setEveningLitres(e.target.value)}
                    />
                    <span className="input-group-text bg-light text-muted small">L</span>
                  </div>
                </div>
              </div>

              {/* Total display */}
              <div
                className="p-3 mb-3 rounded-3 d-flex justify-content-between align-items-center"
                style={{ backgroundColor: 'var(--dp-bg-subtle)', border: '1px solid var(--dp-border)' }}
              >
                <span className="small text-muted fw-semibold uppercase">Total Milk Collected</span>
                <span className="h5 mb-0 fw-bold text-success">{formatLitres(total)}</span>
              </div>

              {/* Notes */}
              <div className="mb-2">
                <label className="dp-form-label" htmlFor="milk-notes">
                  Notes (Optional)
                </label>
                <input
                  id="milk-notes"
                  type="text"
                  placeholder="e.g. Good weather, evening milking delayed 30 mins"
                  className="form-control"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer d-flex justify-content-between">
              <button
                type="button"
                className="btn-dp-secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                id="btn-save-milk"
                type="submit"
                className="btn-dp-primary"
                disabled={isSubmitting}
              >
                <Check size={16} />
                <span>{isSubmitting ? 'Saving...' : 'Save Milk Record'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
