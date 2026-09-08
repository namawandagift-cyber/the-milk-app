import React, { useState } from 'react';
import { Settings, Building, MapPin, Database, Check, Copy, ExternalLink, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, getApiUrl, setCustomApiUrl } from '../services/api';

export const SettingsPage: React.FC = () => {
  const { farm, user, refreshFarm, logout } = useAuth();

  const [farmName, setFarmName] = useState(farm?.farmName || '');
  const [location, setLocation] = useState(farm?.location || '');
  const [mainBuyer, setMainBuyer] = useState(farm?.mainMilkBuyer || '');
  const [isSavingFarm, setIsSavingFarm] = useState(false);
  const [farmSaveSuccess, setFarmSaveSuccess] = useState(false);

  // Custom API configuration
  const [apiUrl, setApiUrl] = useState(getApiUrl());
  const [isSavingApi, setIsSavingApi] = useState(false);
  const [apiSaveMessage, setApiSaveMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleSaveFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingFarm(true);
    setFarmSaveSuccess(false);

    try {
      const res = await api.updateFarm({
        farmName: farmName.trim(),
        location: location.trim(),
        mainMilkBuyer: mainBuyer.trim(),
      });
      if (res.success) {
        await refreshFarm();
        setFarmSaveSuccess(true);
        setTimeout(() => setFarmSaveSuccess(false), 3000);
      } else {
        alert(res.message || 'Failed to update farm details.');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating farm.');
    } finally {
      setIsSavingFarm(false);
    }
  };

  const handleSaveApiUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingApi(true);
    if (apiUrl.trim().startsWith('http')) {
      setCustomApiUrl(apiUrl.trim());
      setApiSaveMessage('Custom Google Apps Script URL active.');
    } else {
      setCustomApiUrl(null);
      setApiUrl('/api');
      setApiSaveMessage('Reset to local development proxy.');
    }
    setIsSavingApi(false);
    setTimeout(() => setApiSaveMessage(null), 3500);
  };

  return (
    <div className="container-fluid py-4 px-3 px-md-4">
      <div className="mb-4">
        <h1 className="dp-page-title">Farm & System Settings</h1>
        <p className="dp-page-subtitle">Manage farm profile, data storage, and Google Apps Script integration</p>
      </div>

      <div className="row g-4">
        {/* Farm Profile Settings */}
        <div className="col-12 col-lg-7">
          <div className="dp-card mb-4">
            <h3 className="h6 fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <Building size={18} className="text-success" />
              <span>Farm Identity</span>
            </h3>

            {farmSaveSuccess && (
              <div className="alert alert-success py-2 small mb-3">
                ✓ Farm profile updated successfully.
              </div>
            )}

            <form onSubmit={handleSaveFarm}>
              <div className="mb-3">
                <label className="dp-form-label" htmlFor="settings-farm-name">
                  Farm Name
                </label>
                <input
                  id="settings-farm-name"
                  type="text"
                  className="form-control"
                  value={farmName}
                  onChange={e => setFarmName(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="dp-form-label" htmlFor="settings-farm-loc">
                  Location / District
                </label>
                <input
                  id="settings-farm-loc"
                  type="text"
                  className="form-control"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="dp-form-label" htmlFor="settings-farm-buyer">
                  Primary Milk Buyer / Cooperative
                </label>
                <input
                  id="settings-farm-buyer"
                  type="text"
                  className="form-control"
                  value={mainBuyer}
                  onChange={e => setMainBuyer(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn-dp-primary"
                disabled={isSavingFarm}
              >
                <Check size={16} />
                <span>{isSavingFarm ? 'Saving changes...' : 'Save Profile Changes'}</span>
              </button>
            </form>
          </div>

          {/* User Account Details */}
          <div className="dp-card">
            <h3 className="h6 fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <Shield size={18} className="text-primary" />
              <span>User & Credentials</span>
            </h3>

            <div className="mb-3">
              <span className="dp-form-label d-block">Operator Name</span>
              <span className="text-dark fw-semibold">{user?.fullName || '—'}</span>
            </div>

            <div className="mb-3">
              <span className="dp-form-label d-block">Email Address</span>
              <span className="text-dark">{user?.email || '—'}</span>
            </div>

            <div className="pt-3 border-top border-light">
              <button
                type="button"
                className="btn-dp-danger"
                onClick={logout}
              >
                <LogOut size={16} />
                <span>Sign Out of DairyPulse</span>
              </button>
            </div>
          </div>
        </div>

        {/* Backend & Google Apps Script Setup */}
        <div className="col-12 col-lg-5">
          <div className="dp-card">
            <h3 className="h6 fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <Database size={18} className="text-warning" />
              <span>Google Sheets Backend</span>
            </h3>

            <p className="text-muted small mb-3">
              DairyPulse is designed to store all farm data in private Google Sheets tables through a Google Apps Script Web App.
            </p>

            <div className="p-3 mb-3 rounded-2 bg-light border small">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-muted">Current Endpoint:</span>
                <span className="badge bg-success-subtle text-success border border-success-subtle">
                  {apiUrl.startsWith('http') ? 'Live Apps Script' : 'Local Dev Proxy'}
                </span>
              </div>
              <div className="text-break text-muted font-monospace" style={{ fontSize: '0.75rem' }}>
                {apiUrl}
              </div>
            </div>

            {apiSaveMessage && (
              <div className="alert alert-info py-2 small mb-3">
                {apiSaveMessage}
              </div>
            )}

            <form onSubmit={handleSaveApiUrl}>
              <div className="mb-3">
                <label className="dp-form-label" htmlFor="api-url-input">
                  Connect Live Apps Script Web App URL
                </label>
                <input
                  id="api-url-input"
                  type="url"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="form-control font-monospace small"
                  value={apiUrl}
                  onChange={e => setApiUrl(e.target.value)}
                />
                <div className="form-text small text-muted">
                  Leave empty or set to <code>/api</code> to use the local development proxy.
                </div>
              </div>

              <button
                type="submit"
                className="btn-dp-secondary w-100 mb-3"
                disabled={isSavingApi}
              >
                <span>Save API Endpoint</span>
              </button>
            </form>

            <div className="border-top pt-3">
              <div className="fw-semibold small text-dark mb-1">Google Apps Script Source Code</div>
              <p className="text-muted small mb-2">
                The complete Google Apps Script code for your Google Sheets database is generated in <code>google-apps-script/Code.gs</code>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
