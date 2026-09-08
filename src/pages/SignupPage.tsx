import React, { useState } from 'react';
import { Droplets, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SignupPageProps {
  onSwitchToLogin: () => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onSwitchToLogin }) => {
  const { signup } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password should be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await signup(fullName.trim(), email.trim(), password);
    if (!result.success) {
      setErrorMessage(result.message || 'Failed to create account.');
      setIsSubmitting(false);
    }
    // On success, AuthContext triggers redirect to Farm Setup
  };

  return (
    <div className="container-fluid p-0 min-vh-100 d-flex flex-column bg-white">
      <div className="row g-0 flex-grow-1">
        {/* Left Column (Desktop) */}
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
              <h2 className="display-6 fw-bold mb-4" style={{ letterSpacing: '-0.03em', lineHeight: 1.2 }}>
                Start tracking your farm with clarity.
              </h2>
              <p className="lead text-light opacity-90 mb-4" style={{ fontSize: '1.05rem', lineHeight: 1.6 }}>
                Join forward-thinking dairy farm owners and managers in East Africa turning daily records into profitable operational decisions.
              </p>

              <div className="d-flex flex-column gap-3 mt-4 pt-2">
                <div className="d-flex align-items-center gap-3">
                  <CheckCircle2 size={20} className="text-success" />
                  <span className="small text-light opacity-90">100% private, isolated farm database</span>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <CheckCircle2 size={20} className="text-success" />
                  <span className="small text-light opacity-90">Fast data entry designed for smartphones</span>
                </div>
                <div className="d-flex align-items-center gap-3">
                  <CheckCircle2 size={20} className="text-success" />
                  <span className="small text-light opacity-90">Instant profit margins and production alerts</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-top border-secondary border-opacity-25 small text-light opacity-75">
            DairyPulse Farm Intelligence © 2026
          </div>
        </div>

        {/* Right Column: Signup Form */}
        <div className="col-12 col-lg-6 d-flex flex-column justify-content-center p-4 p-sm-5 bg-white">
          <div className="mx-auto w-100" style={{ maxWidth: 420 }}>
            {/* Mobile Logo */}
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
              Create your farm account
            </h1>
            <p className="text-muted small mb-4">
              Enter your details to create an account and personalize your farm workspace.
            </p>

            {errorMessage && (
              <div className="alert alert-danger py-2 small mb-3">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="dp-form-label" htmlFor="signup-name">
                  Full Name *
                </label>
                <input
                  id="signup-name"
                  type="text"
                  placeholder="e.g. Grace Nalubega"
                  className="form-control"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="dp-form-label" htmlFor="signup-email">
                  Email Address *
                </label>
                <input
                  id="signup-email"
                  type="email"
                  placeholder="farmer@example.com"
                  className="form-control"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="row g-2 mb-4">
                <div className="col-sm-6">
                  <label className="dp-form-label" htmlFor="signup-password">
                    Password *
                  </label>
                  <input
                    id="signup-password"
                    type="password"
                    placeholder="Min. 6 chars"
                    className="form-control"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div className="col-sm-6">
                  <label className="dp-form-label" htmlFor="signup-confirm">
                    Confirm Password *
                  </label>
                  <input
                    id="signup-confirm"
                    type="password"
                    placeholder="Repeat password"
                    className="form-control"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              <button
                id="btn-signup-submit"
                type="submit"
                className="btn-dp-primary w-100 py-2 fs-6 mb-3"
                disabled={isSubmitting}
              >
                <span>{isSubmitting ? 'Creating account...' : 'Create Account & Continue'}</span>
                {!isSubmitting && <ArrowRight size={18} />}
              </button>

              <div className="text-center">
                <span className="text-muted small">Already have an account? </span>
                <button
                  type="button"
                  className="btn btn-link p-0 text-success fw-bold text-decoration-none small"
                  onClick={onSwitchToLogin}
                >
                  Sign in here
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
