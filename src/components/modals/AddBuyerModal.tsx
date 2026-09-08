import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Buyer } from '../../types';
import { api } from '../../services/api';

interface AddBuyerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string, buyer: Buyer) => void;
  editBuyer?: Buyer | null;
}

export const AddBuyerModal: React.FC<AddBuyerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editBuyer,
}) => {
  const [name, setName] = useState<string>(editBuyer?.name || '');
  const [phone, setPhone] = useState<string>(editBuyer?.phone || '');
  const [location, setLocation] = useState<string>(editBuyer?.location || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Buyer or cooperative name is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (editBuyer) {
        const res = await api.updateBuyer({
          buyerId: editBuyer.buyerId,
          name: name.trim(),
          phone: phone.trim(),
          location: location.trim(),
        });
        if (res.success) {
          onSuccess('Buyer updated successfully.', {
            ...editBuyer,
            name: name.trim(),
            phone: phone.trim(),
            location: location.trim(),
          });
          onClose();
        } else {
          setErrorMessage(res.message || 'Failed to update buyer.');
        }
      } else {
        const res = await api.createBuyer({
          name: name.trim(),
          phone: phone.trim(),
          location: location.trim(),
        });
        if (res.success && res.data) {
          onSuccess('Milk buyer added successfully.', res.data);
          onClose();
        } else {
          setErrorMessage(res.message || 'Failed to add buyer.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: 'rgba(17, 24, 39, 0.6)', backdropFilter: 'blur(3px)', zIndex: 1060 }}
      tabIndex={-1}
      role="dialog"
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title fw-bold text-dark">
              {editBuyer ? 'Edit Milk Buyer' : '+ Add Milk Buyer'}
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

              <div className="mb-3">
                <label className="dp-form-label" htmlFor="buyer-name">
                  Buyer or Cooperative Name *
                </label>
                <input
                  id="buyer-name"
                  type="text"
                  placeholder="e.g. Mbarara Dairy Co-op, Mama Joy Dairy"
                  className="form-control"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="row g-3 mb-2">
                <div className="col-6">
                  <label className="dp-form-label" htmlFor="buyer-phone">
                    Phone Number
                  </label>
                  <input
                    id="buyer-phone"
                    type="tel"
                    placeholder="e.g. +256 701 234567"
                    className="form-control"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>

                <div className="col-6">
                  <label className="dp-form-label" htmlFor="buyer-loc">
                    Location / Town
                  </label>
                  <input
                    id="buyer-loc"
                    type="text"
                    placeholder="e.g. Wakiso Town"
                    className="form-control"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                  />
                </div>
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
                id="btn-save-buyer"
                type="submit"
                className="btn-dp-primary"
                disabled={isSubmitting}
              >
                <Check size={16} />
                <span>{isSubmitting ? 'Saving...' : editBuyer ? 'Update Buyer' : 'Add Buyer'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
