import React from 'react';

export const CardSkeleton: React.FC<{ height?: number }> = ({ height = 120 }) => (
  <div
    className="dp-card placeholder-glow"
    style={{ minHeight: height, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
  >
    <div className="placeholder col-4 mb-2 rounded" style={{ height: '0.8rem' }} />
    <div className="placeholder col-7 mb-2 rounded" style={{ height: '1.8rem' }} />
    <div className="placeholder col-5 rounded" style={{ height: '0.75rem' }} />
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="dp-table-container p-3 placeholder-glow">
    <div className="placeholder col-3 mb-3 rounded" style={{ height: '1.25rem' }} />
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="d-flex align-items-center gap-3 py-3 border-bottom border-light">
        <div className="placeholder col-2 rounded" style={{ height: '1rem' }} />
        <div className="placeholder col-3 rounded" style={{ height: '1rem' }} />
        <div className="placeholder col-2 rounded" style={{ height: '1rem' }} />
        <div className="placeholder col-2 ms-auto rounded" style={{ height: '1rem' }} />
      </div>
    ))}
  </div>
);
