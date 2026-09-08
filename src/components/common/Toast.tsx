import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className="dp-toast"
      style={{
        backgroundColor: type === 'error' ? 'var(--dp-danger)' : 'var(--dp-forest-dark)',
      }}
    >
      {type === 'error' ? (
        <AlertCircle size={18} className="text-warning" />
      ) : (
        <CheckCircle2 size={18} className="text-success" />
      )}
      <span>{message}</span>
      <button
        type="button"
        className="btn p-0 text-white ms-2 opacity-75 hover-opacity-100 border-0 bg-transparent"
        onClick={onClose}
      >
        <X size={16} />
      </button>
    </div>
  );
};
