import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Expense, ExpenseCategory } from '../../types';
import { api } from '../../services/api';
import { getTodayIsoDate } from '../../utils/formatters';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string, expense: Expense) => void;
  editExpense?: Expense | null;
}

const CATEGORIES: ExpenseCategory[] = [
  'Feed',
  'Veterinary',
  'Labour',
  'Transport',
  'Utilities',
  'Equipment',
  'Medication',
  'Maintenance',
  'Other',
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editExpense,
}) => {
  const [expenseDate, setExpenseDate] = useState<string>(editExpense?.expenseDate || getTodayIsoDate());
  const [category, setCategory] = useState<ExpenseCategory>(editExpense?.category || 'Feed');
  const [description, setDescription] = useState<string>(editExpense?.description || '');
  const [amount, setAmount] = useState<string>(editExpense ? String(editExpense.amount) : '');
  const [notes, setNotes] = useState<string>(editExpense?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!expenseDate) {
      setErrorMessage('Please select an expense date.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Please provide a short description.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Please enter a valid amount in UGX.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (editExpense) {
        const res = await api.updateExpense({
          expenseId: editExpense.expenseId,
          expenseDate,
          category,
          description: description.trim(),
          amount: numAmount,
          notes,
        });
        if (res.success) {
          onSuccess('Expense updated successfully.', {
            ...editExpense,
            expenseDate,
            category,
            description: description.trim(),
            amount: numAmount,
            notes,
          });
          onClose();
        } else {
          setErrorMessage(res.message || 'Failed to update expense.');
        }
      } else {
        const res = await api.createExpense({
          expenseDate,
          category,
          description: description.trim(),
          amount: numAmount,
          notes,
        });
        if (res.success && res.data) {
          onSuccess('Expense recorded successfully.', res.data);
          onClose();
        } else {
          setErrorMessage(res.message || 'Failed to record expense.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error saving expense.');
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
              {editExpense ? 'Edit Farm Expense' : '+ Record Farm Expense'}
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
                  <label className="dp-form-label" htmlFor="expense-date">
                    Date *
                  </label>
                  <input
                    id="expense-date"
                    type="date"
                    className="form-control"
                    value={expenseDate}
                    onChange={e => setExpenseDate(e.target.value)}
                    required
                  />
                </div>

                <div className="col-6">
                  <label className="dp-form-label" htmlFor="expense-category">
                    Category *
                  </label>
                  <select
                    id="expense-category"
                    className="form-select"
                    value={category}
                    onChange={e => setCategory(e.target.value as ExpenseCategory)}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-3">
                <label className="dp-form-label" htmlFor="expense-desc">
                  Description *
                </label>
                <input
                  id="expense-desc"
                  type="text"
                  placeholder="e.g. 5 bags dairy meal, mastitis treatment"
                  className="form-control"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="dp-form-label" htmlFor="expense-amount">
                  Amount (UGX) *
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light fw-bold text-secondary small">UGX</span>
                  <input
                    id="expense-amount"
                    type="number"
                    min="1"
                    inputMode="numeric"
                    placeholder="e.g. 150000"
                    className="form-control"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-2">
                <label className="dp-form-label" htmlFor="expense-notes">
                  Notes (Optional)
                </label>
                <input
                  id="expense-notes"
                  type="text"
                  placeholder="e.g. Purchased from Agrovet Kampala"
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
                id="btn-save-expense"
                type="submit"
                className="btn-dp-primary"
                disabled={isSubmitting}
              >
                <Check size={16} />
                <span>{isSubmitting ? 'Saving...' : editExpense ? 'Update Expense' : 'Save Expense'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
