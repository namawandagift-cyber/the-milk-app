import React, { useState } from 'react';
import { Droplets, ArrowRight, Check, MapPin, Building, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface FarmSetupPageProps {
  onSetupComplete: () => void;
}

export const FarmSetupPage: React.FC<FarmSetupPageProps> = ({ onSetupComplete }) => {
  const { user, createFarm } = useAuth();
  const [farmName, setFarmName] = useState('');
  const [location, setLocation] = useState('');
  const [mainMilkBuyer, setMainMilkBuyer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmName.trim() || !location.trim()) {
      setErrorMessage('Please enter your farm name and location.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await createFarm(farmName.trim(), location.trim(), mainMilkBuyer.trim());
    if (res.success) {
      onSetupComplete();
    } else {
      setErrorMessage(res.message || 'Failed to save farm setup.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: 'var(--dp-bg)' }}>
      {/* Top minimal header */}
      <header className="bg-white border-bottom border-light py-3 px-4">
        <div className="container d-flex align-items-center gap-2">
          <div
            className="rounded-2 d-flex align-items-center justify-content-center"
            style={{ width: 32, height: 32, backgroundColor: 'var(--dp-forest)' }}
          >
            <Droplets size={18} className="text-white" />
          </div>
          <span className="fw-bold fs-5 text-dark">DAIRYPULSE</span>
        </div>
      </header>

      {/* Main onboarding container */}
      <main className="container flex-grow-1 d-flex flex-column justify-content-center py-5">
        <div className="mx-auto w-100" style={{ maxWidth: 560 }}>
          {/* Progress / Step pill */}
          <div className="d-flex align-items-center gap-2 mb-3">
            <span
              className="badge rounded-pill px-3 py-1 text-uppercase"
              style={{ backgroundColor: '#ECFDF5', color: 'var(--dp-forest)', fontWeight: 700, fontSize: '0.75rem' }}
            >
              Step 1 of 1 · Farm Profile
            </span>
          </div>

          <h1 className="h2 fw-bold text-dark mb-2" style={{ letterSpacing: '-0.02em' }}>
            Let's set up your farm.
          </h1>
          <p className="text-muted mb-4" style={{ fontSize: '1rem', lineHeight: 1.5 }}>
            Tell DairyPulse a little about your farm so we can personalize your dashboard and reports.
          </p>

          <div className="dp-card bg-white p-4 p-sm-5 shadow-sm">
            {errorMessage && (
              <div className="alert alert-danger py-2 small mb-4">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="dp-form-label" htmlFor="setup-farm-name">
                  Farm Name *
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light text-muted">
                    <Building size={16} />
                  </span>
                  <input
                    id="setup-farm-name"
                    type="text"
                    placeholder="e.g. Bukoto Modern Dairy Farm"
                    className="form-control form-control-lg fs-6"
                    value={farmName}
                    onChange={e => setFarmName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="form-text small text-muted">
                  The primary business or registered name of your farm.
                </div>
              </div>

              <div className="mb-4">
                <label className="dp-form-label" htmlFor="setup-location">
                  Farm Location / District *
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light text-muted">
                    <MapPin size={16} />
                  </span>
                  <input
                    id="setup-location"
                    type="text"
                    placeholder="e.g. Mbarara, Kiruhura, Wakiso, Masaka"
                    className="form-control form-control-lg fs-6"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    required
                  />
                </div>
                <div className="form-text small text-muted">
                  Used for regional reporting and climate benchmarks.
                </div>
              </div>

              <div className="mb-4">
                <label className="dp-form-label" htmlFor="setup-buyer">
                  Main Milk Buyer or Cooperative (Optional)
                </label>
                <input
                  id="setup-buyer"
                  type="text"
                  placeholder="e.g. Uganda Crane Creameries, Local Cooperative, Dairy Hub"
                  className="form-control"
                  value={mainMilkBuyer}
                  onChange={e => setMainMilkBuyer(e.target.value)}
                />
                <div className="form-text small text-muted">
                  You can add multiple specific buyers later on the Sales page.
                </div>
              </div>

              <div
                className="p-3 mb-4 rounded-3 d-flex align-items-start gap-3"
                style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}
              >
                <Sparkles size={20} className="text-success flex-shrink-0 mt-1" />
                <div className="small text-dark">
                  <strong>Clean Slate Guarantee:</strong> Your farm will start with zero fake demo records. Every metric, chart, and alert in your dashboard will be calculated strictly from the real records you log.
                </div>
              </div>

              <button
                id="btn-complete-farm-setup"
                type="submit"
                className="btn-dp-primary w-100 py-2 fs-6"
                disabled={isSubmitting}
              >
                <Check size={18} />
                <span>{isSubmitting ? 'Personalizing your workspace...' : 'Save & Open Dashboard'}</span>
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};
