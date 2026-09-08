import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Cow, CowStatus } from '../../types';
import { api } from '../../services/api';

interface AddCowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string, cow: Cow) => void;
  editCow?: Cow | null;
}

const BREEDS = ['Friesian', 'Jersey', 'Ayrshire', 'Ankole', 'Guernsey', 'Crossbreed', 'Other'];
const STATUSES: CowStatus[] = ['Lactating', 'Dry', 'Pregnant', 'Calf', 'Sick', 'Sold', 'Other'];

export const AddCowModal: React.FC<AddCowModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editCow,
}) => {
  const [cowNumber, setCowNumber] = useState<string>(editCow?.cowNumber || '');
  const [name, setName] = useState<string>(editCow?.name || '');
  const [breed, setBreed] = useState<string>(editCow?.breed || 'Friesian');
  const [status, setStatus] = useState<CowStatus>(editCow?.status || 'Lactating');
  const [dateOfBirth, setDateOfBirth] = useState<string>(editCow?.dateOfBirth || '');
  const [notes, setNotes] = useState<string>(editCow?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cowNumber.trim()) {
      setErrorMessage('Please enter an ear tag or cow identification number.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (editCow) {
        const res = await api.updateCow({
          cowId: editCow.cowId,
          cowNumber: cowNumber.trim(),
          name: name.trim(),
          breed,
          status,
          dateOfBirth,
          notes,
        });
        if (res.success) {
          onSuccess('Cow profile updated successfully.', {
            ...editCow,
            cowNumber: cowNumber.trim(),
            name: name.trim(),
            breed,
            status,
            dateOfBirth,
            notes,
          });
          onClose();
        } else {
          setErrorMessage(res.message || 'Failed to update cow.');
        }
      } else {
        const res = await api.createCow({
          cowNumber: cowNumber.trim(),
          name: name.trim(),
          breed,
          status,
          dateOfBirth,
          notes,
        });
        if (res.success && res.data) {
          onSuccess('Cow added to herd successfully.', res.data);
          onClose();
        } else {
          setErrorMessage(res.message || 'Failed to add cow.');
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
      style={{ backgroundColor: 'rgba(17, 24, 39, 0.6)', backdropFilter: 'blur(3px)', zIndex: 1055 }}
      tabIndex={-1}
      role="dialog"
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title fw-bold text-dark">
              {editCow ? `Edit Cow #${editCow.cowNumber}` : '+ Add Cow to Herd'}
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
                  <label className="dp-form-label" htmlFor="cow-tag">
                    Tag / Number *
                  </label>
                  <input
                    id="cow-tag"
                    type="text"
                    placeholder="e.g. 042"
                    className="form-control"
                    value={cowNumber}
                    onChange={e => setCowNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="dp-form-label" htmlFor="cow-name">
                    Cow Name (Optional)
                  </label>
                  <input
                    id="cow-name"
                    type="text"
                    placeholder="e.g. Bella"
                    className="form-control"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label className="dp-form-label" htmlFor="cow-breed">
                    Breed
                  </label>
                  <select
                    id="cow-breed"
                    className="form-select"
                    value={breed}
                    onChange={e => setBreed(e.target.value)}
                  >
                    {BREEDS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div className="col-6">
                  <label className="dp-form-label" htmlFor="cow-status">
                    Status *
                  </label>
                  <select
                    id="cow-status"
                    className="form-select"
                    value={status}
                    onChange={e => setStatus(e.target.value as CowStatus)}
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label className="dp-form-label" htmlFor="cow-dob">
                  Date of Birth / Estimated
                </label>
                <input
                  id="cow-dob"
                  type="date"
                  className="form-control"
                  value={dateOfBirth}
                  onChange={e => setDateOfBirth(e.target.value)}
                />
              </div>

              <div className="mb-2">
                <label className="dp-form-label" htmlFor="cow-notes">
                  Notes
                </label>
                <textarea
                  id="cow-notes"
                  rows={2}
                  placeholder="e.g. Insemination history, parentage, health remarks"
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
                id="btn-save-cow"
                type="submit"
                className="btn-dp-primary"
                disabled={isSubmitting}
              >
                <Check size={16} />
                <span>{isSubmitting ? 'Saving...' : editCow ? 'Update Cow' : 'Add Cow'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
