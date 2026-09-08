import React, { useState } from 'react';
import { Droplets, ArrowRight, ShieldCheck, CheckCircle2, TrendingUp, BarChart2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onSwitchToSignup: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToSignup }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('namawandagift@gmail.com');
  const [password, setPassword] = useState('password123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fillDemoAccount = () => {
    setEmail('namawandagift@gmail.com');
    setPassword('password123');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please enter your email and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await login(email.trim(), password);
    if (!result.success) {
      setErrorMessage(result.message || 'Invalid login credentials.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-fluid p-0 min-vh-100 d-flex flex-column bg-white">
      <div className="row g-0 flex-grow-1">
        {/* Left Column: Brand Hero & Statement (Desktop) */}
        <div
          className="col-lg-6 d-none d-lg-flex flex-column justify-content-between p-5 text-white"
          style={{
            backgroundColor: 'var(--dp-forest-dark)',
            backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(45, 106, 79, 0.4) 0%, transparent 60%)',
          }}
        >
          <div>
            <div className="d-flex align-items-center gap-3 mb-5">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: 44, height: 44, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
              >
                <Droplets size={26} className="text-white" />
              </div>
              <span className="fw-extrabold fs-4 tracking-tight">DAIRYPULSE</span>
            </div>

            <div className="my-auto py-5" style={{ maxWidth: 480 }}>
              <div
                className="badge mb-3 px-3 py-2 text-uppercase fw-semibold"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#A7F3D0', letterSpacing: '0.05em' }}
              >
                Dairy Farm Business Intelligence
              </div>
              <h2 className="display-6 fw-bold mb-4" style={{ letterSpacing: '-0.03em', lineHeight: 1.2 }}>
                Know your farm.<br />Understand your business.
              </h2>
              <p className="lead text-light opacity-90 mb-4" style={{ fontSize: '1.05rem', lineHeight: 1.6 }}>
                DairyPulse turns your daily milk collections, expenses, and buyer sales into clear, actionable business insights.
              </p>

              <div className="d-flex flex-column gap-3 mt-4 pt-2">
                <div className="d-flex align-items-center gap-3">
                  <CheckCircle2 size={20} className="text-success" />
                  <span className="small text-light opacity-90">Daily production & herd yield tracking</span>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <TrendingUp size={20} className="text-success" />
                  <span className="small text-light opacity-90">Real-time revenue, expense, and margin calculations</span>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <BarChart2 size={20} className="text-success" />
                  <span className="small text-light opacity-90">Google Sheets tabular backend with full data isolation</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-top border-secondary border-opacity-25 small text-light opacity-75 d-flex justify-content-between">
            <span>Built for Uganda & East African Dairy Producers</span>
            <span>2026 Edition</span>
          </div>
        </div>

        {/* Right Column: Modern Sign-In Form */}
        <div className="col-12 col-lg-6 d-flex flex-column justify-content-center p-4 p-sm-5 bg-white">
          <div className="mx-auto w-100" style={{ maxWidth: 420 }}>
            {/* Mobile Brand Header */}
            <div className="d-flex align-items-center gap-2 mb-4 d-lg-none">
              <div
                className="rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: 36, height: 36, backgroundColor: 'var(--dp-forest)' }}
              >
                <Droplets size={20} className="text-white" />
              </div>
              <span className="fw-bold fs-5 text-dark">DAIRYPULSE</span>
            </div>

            <h1 className="h3 fw-bold text-dark mb-1" style={{ letterSpacing: '-0.02em' }}>
              Sign in to your farm
            </h1>
            <p className="text-muted small mb-4">
              Enter your credentials to access your real farm records and reports.
            </p>

            {errorMessage && (
              <div className="alert alert-danger py-2 small mb-3">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="dp-form-label" htmlFor="login-email">
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  placeholder="farmer@example.com"
                  className="form-control"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center">
                  <label className="dp-form-label mb-0" htmlFor="login-password">
                    Password
                  </label>
                </div>
                <input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  className="form-control mt-1"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              <button
                id="btn-login-submit"
                type="submit"
                className="btn-dp-primary w-100 py-2 fs-6 mb-3"
                disabled={isSubmitting}
              >
                <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
                {!isSubmitting && <ArrowRight size={18} />}
              </button>

              <div
                className="p-2 mb-3 rounded-2 text-center small"
                style={{ backgroundColor: 'var(--dp-bg-subtle)', border: '1px solid var(--dp-border-subtle)' }}
              >
                <span className="text-muted">Pre-filled with test farm account: </span>
                <button
                  type="button"
                  className="btn btn-link p-0 fw-semibold text-decoration-underline small"
                  style={{ color: 'var(--dp-forest-dark)' }}
                  onClick={fillDemoAccount}
                >
                  namawandagift@gmail.com
                </button>
              </div>

              <div className="text-center">
                <span className="text-muted small">Don't have a farm account yet? </span>
                <button
                  type="button"
                  className="btn btn-link p-0 text-success fw-bold text-decoration-none small"
                  onClick={onSwitchToSignup}
                >
                  Create one now
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
