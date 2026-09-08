import React, { useState, useEffect } from 'react';
import { Plus, Search, Receipt, Edit, Trash2, Tag, Calendar, TrendingDown } from 'lucide-react';
import { Expense } from '../types';
import { api } from '../services/api';
import { formatDate, formatUGX } from '../utils/formatters';
import { EmptyState } from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/LoadingSkeleton';

interface ExpensesPageProps {
  onOpenAddExpense: (expense?: Expense) => void;
  onExpenseUpdated: () => void;
}

export const ExpensesPage: React.FC<ExpensesPageProps> = ({ onOpenAddExpense, onExpenseUpdated }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const res = await api.getExpenses();
      if (res.success && res.data) {
        setExpenses(res.data);
      }
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleDelete = async (expenseId: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      const res = await api.deleteExpense(expenseId);
      if (res.success) {
        setExpenses(prev => prev.filter(e => e.expenseId !== expenseId));
        onExpenseUpdated();
      }
    } catch (err) {
      alert('Failed to delete expense.');
    }
  };

  const filteredExpenses = expenses.filter(e => {
    const q = (searchQuery || '').toLowerCase();
    const desc = (e.description || '').toLowerCase();
    const notes = (e.notes || '').toLowerCase();
    const matchesSearch = desc.includes(q) || notes.includes(q);
    const matchesCategory = selectedCategory === 'ALL' || e.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Top category
  const categoryTotals: Record<string, number> = {};
  filteredExpenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });
  const topCategoryEntry = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="container-fluid py-4 px-3 px-md-4">
      {/* Header & Primary Action */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="dp-page-title">Farm Expenses</h1>
          <p className="dp-page-subtitle">Track feeds, veterinary care, labour, and operating costs</p>
        </div>

        <button
          id="btn-add-expense-top"
          type="button"
          className="btn-dp-primary"
          onClick={() => onOpenAddExpense()}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Record Expense</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-4">
          <div className="dp-card py-3">
            <span className="dp-kpi-label">Filtered Expenses Total</span>
            <div className="dp-kpi-value text-danger">{formatUGX(totalExpenseAmount)}</div>
          </div>
        </div>
        <div className="col-12 col-sm-4">
          <div className="dp-card py-3">
            <span className="dp-kpi-label">Largest Cost Category</span>
            <div className="dp-kpi-value text-dark" style={{ fontSize: '1.4rem' }}>
              {topCategoryEntry ? `${topCategoryEntry[0]} (${formatUGX(topCategoryEntry[1])})` : '—'}
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-4">
          <div className="dp-card py-3">
            <span className="dp-kpi-label">Expense Transactions</span>
            <div className="dp-kpi-value text-dark">{filteredExpenses.length}</div>
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
                placeholder="Search description or notes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="col-12 col-md-6">
            <select
              className="form-select"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              <option value="Feed">Feed</option>
              <option value="Veterinary">Veterinary</option>
              <option value="Labour">Labour</option>
              <option value="Transport">Transport</option>
              <option value="Utilities">Utilities</option>
              <option value="Equipment">Equipment</option>
              <option value="Medication">Medication</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No expenses recorded yet"
          description="Log farm purchases such as dairy meal, vet visits, and labour to calculate your real net profit margin per litre."
          actionLabel="+ Record Expense"
          onAction={() => onOpenAddExpense()}
        />
      ) : filteredExpenses.length === 0 ? (
        <div className="dp-card p-4 text-center text-muted small">
          No expenses match your search query.
        </div>
      ) : (
        <div className="dp-table-container table-responsive">
          <table className="table dp-table mb-0">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount (UGX)</th>
                <th>Notes</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(exp => (
                <tr key={exp.expenseId}>
                  <td className="fw-semibold text-dark">
                    {formatDate(exp.expenseDate)}
                  </td>
                  <td>
                    <span className="badge bg-light text-dark border px-2 py-1">
                      {exp.category}
                    </span>
                  </td>
                  <td className="fw-medium">{exp.description}</td>
                  <td className="fw-bold text-dark">{formatUGX(exp.amount)}</td>
                  <td className="text-muted small">{exp.notes || '—'}</td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      <button
                        type="button"
                        className="btn btn-outline-secondary p-1"
                        title="Edit Expense"
                        onClick={() => onOpenAddExpense(exp)}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger p-1"
                        title="Delete Expense"
                        onClick={() => handleDelete(exp.expenseId)}
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
