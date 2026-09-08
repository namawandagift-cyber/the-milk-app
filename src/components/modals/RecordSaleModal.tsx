import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Sale, Buyer } from '../../types';
import { api } from '../../services/api';
import { getTodayIsoDate, formatUGX } from '../../utils/formatters';

interface RecordSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string, sale: Sale) => void;
  buyers: Buyer[];
  onOpenAddBuyer: () => void;
  editSale?: Sale | null;
}

export const RecordSaleModal: React.FC<RecordSaleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  buyers,
  onOpenAddBuyer,
  editSale,
}) => {
  const [saleDate, setSaleDate] = useState<string>(editSale?.saleDate || getTodayIsoDate());
  const [buyerId, setBuyerId] = useState<string>(editSale?.buyerId || '');
  const [litres, setLitres] = useState<string>(editSale ? String(editSale.litres) : '');
  const [pricePerLitre, setPricePerLitre] = useState<string>(editSale ? String(editSale.pricePerLitre) : '1500');
  const [amountPaid, setAmountPaid] = useState<string>(editSale ? String(editSale.amountPaid) : '');
  const [paidInFull, setPaidInFull] = useState<boolean>(!editSale || editSale.amountDue === 0);
  const [notes, setNotes] = useState<string>(editSale?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const numLitres = parseFloat(litres) || 0;
  const numPrice = parseFloat(pricePerLitre) || 0;
  const calculatedTotal = parseFloat((numLitres * numPrice).toFixed(2));

  // If paid in full, keep amountPaid synced with calculatedTotal
  useEffect(() => {
    if (paidInFull) {
      setAmountPaid(calculatedTotal > 0 ? String(calculatedTotal) : '');
    }
  }, [calculatedTotal, paidInFull]);

  if (!isOpen) return null;

  const numPaid = parseFloat(amountPaid) || 0;
  const calculatedDue = Math.max(0, parseFloat((calculatedTotal - numPaid).toFixed(2)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleDate) {
      setErrorMessage('Please select a sale date.');
      return;
    }
    if (numLitres <= 0) {
      setErrorMessage('Please enter litres sold.');
      return;
    }
    if (numPrice <= 0) {
      setErrorMessage('Please enter price per litre.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (editSale) {
        const res = await api.updateSale({
          saleId: editSale.saleId,
          buyerId,
          saleDate,
          litres: numLitres,
          pricePerLitre: numPrice,
          amountPaid: numPaid,
          notes,
        });
        if (res.success) {
          onSuccess('Milk sale updated successfully.', {
            ...editSale,
            buyerId,
            buyerName: buyers.find(b => b.buyerId === buyerId)?.name || 'Direct / Cash Buyer',
            saleDate,
            litres: numLitres,
            pricePerLitre: numPrice,
            totalAmount: calculatedTotal,
            amountPaid: numPaid,
            amountDue: calculatedDue,
            notes,
          });
          onClose();
        } else {
          setErrorMessage(res.message || 'Failed to update sale.');
        }
      } else {
        const res = await api.createSale({
          buyerId,
          saleDate,
          litres: numLitres,
          pricePerLitre: numPrice,
          amountPaid: numPaid,
          notes,
        });
        if (res.success && res.data) {
          onSuccess('Milk sale recorded successfully.', res.data);
          onClose();
        } else {
          setErrorMessage(res.message || 'Failed to record sale.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing sale record.');
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
              {editSale ? 'Edit Milk Sale' : '+ Record Milk Sale'}
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

              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="dp-form-label" htmlFor="sale-date">
                    Sale Date *
                  </label>
                  <input
                    id="sale-date"
                    type="date"
                    className="form-control"
                    value={saleDate}
                    onChange={e => setSaleDate(e.target.value)}
                    required
                  />
                </div>

                <div className="col-6">
                  <div className="d-flex justify-content-between align-items-center">
                    <label className="dp-form-label mb-0" htmlFor="sale-buyer">
                      Buyer
                    </label>
                    <button
                      type="button"
                      className="btn btn-link p-0 text-success text-decoration-none small"
                      style={{ fontSize: '0.75rem', fontWeight: 600 }}
                      onClick={onOpenAddBuyer}
                    >
                      + New Buyer
                    </button>
                  </div>
                  <select
                    id="sale-buyer"
                    className="form-select mt-1"
                    value={buyerId}
                    onChange={e => setBuyerId(e.target.value)}
                  >
                    <option value="">Direct / Cash Walk-in</option>
                    {buyers.map(b => (
                      <option key={b.buyerId} value={b.buyerId}>
                        {b.name} {b.location ? `(${b.location})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="dp-form-label" htmlFor="sale-litres">
                    Litres Sold *
                  </label>
                  <div className="input-group">
                    <input
                      id="sale-litres"
                      type="number"
                      step="0.5"
                      min="0.5"
                      inputMode="decimal"
                      placeholder="e.g. 50"
                      className="form-control"
                      value={litres}
                      onChange={e => setLitres(e.target.value)}
                      required
                    />
                    <span className="input-group-text bg-light text-muted small">L</span>
                  </div>
                </div>

                <div className="col-6">
                  <label className="dp-form-label" htmlFor="sale-price">
                    Price / Litre (UGX) *
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light text-muted small">UGX</span>
                    <input
                      id="sale-price"
                      type="number"
                      min="100"
                      inputMode="numeric"
                      placeholder="1500"
                      className="form-control"
                      value={pricePerLitre}
                      onChange={e => setPricePerLitre(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Total & Payment Summary */}
              <div
                className="p-3 mb-3 rounded-3"
                style={{ backgroundColor: 'var(--dp-bg-subtle)', border: '1px solid var(--dp-border)' }}
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="small text-muted fw-semibold uppercase">Total Sale Revenue</span>
                  <span className="h6 mb-0 fw-bold text-dark">{formatUGX(calculatedTotal)}</span>
                </div>

                <div className="form-check mb-2">
                  <input
                    id="paid-full-check"
                    className="form-check-input"
                    type="checkbox"
                    checked={paidInFull}
                    onChange={e => {
                      setPaidInFull(e.target.checked);
                      if (e.target.checked) setAmountPaid(String(calculatedTotal));
                    }}
                  />
                  <label className="form-check-label small fw-medium" htmlFor="paid-full-check">
                    Paid in full immediately
                  </label>
                </div>

                {!paidInFull && (
                  <div className="row g-2 align-items-center pt-2 border-top border-light">
                    <div className="col-6">
                      <label className="dp-form-label small mb-1" htmlFor="amount-paid">
                        Amount Paid (UGX)
                      </label>
                      <input
                        id="amount-paid"
                        type="number"
                        min="0"
                        placeholder="0"
                        className="form-control form-control-sm"
                        value={amountPaid}
                        onChange={e => setAmountPaid(e.target.value)}
                      />
                    </div>
                    <div className="col-6 text-end">
                      <span className="small text-muted d-block">Outstanding Balance</span>
                      <span className={`fw-bold small ${calculatedDue > 0 ? 'text-danger' : 'text-success'}`}>
                        {formatUGX(calculatedDue)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-2">
                <label className="dp-form-label" htmlFor="sale-notes">
                  Notes (Optional)
                </label>
                <input
                  id="sale-notes"
                  type="text"
                  placeholder="e.g. Morning bulk delivery to dairy cooperative"
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
                id="btn-save-sale"
                type="submit"
                className="btn-dp-primary"
                disabled={isSubmitting}
              >
                <Check size={16} />
                <span>{isSubmitting ? 'Saving...' : editSale ? 'Update Sale' : 'Record Sale'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
