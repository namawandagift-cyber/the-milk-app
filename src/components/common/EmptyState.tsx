import React from 'react';
import { LucideIcon, Plus } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  return (
    <div className="dp-empty-state my-4">
      <div className="dp-empty-icon-wrap">
        <Icon size={28} strokeWidth={1.75} />
      </div>
      <h3 className="dp-empty-title">{title}</h3>
      <p className="dp-empty-description">{description}</p>
      <div className="d-flex flex-wrap justify-content-center gap-2">
        {actionLabel && onAction && (
          <button type="button" className="btn-dp-primary" onClick={onAction}>
            <Plus size={16} strokeWidth={2.5} />
            <span>{actionLabel}</span>
          </button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <button type="button" className="btn-dp-secondary" onClick={onSecondaryAction}>
            <span>{secondaryActionLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
};
