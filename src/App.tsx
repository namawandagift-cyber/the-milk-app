import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, PageId } from './components/common/Sidebar';
import { MobileNav } from './components/common/MobileNav';
import { Header } from './components/common/Header';
import { Toast } from './components/common/Toast';

// Pages
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { FarmSetupPage } from './pages/FarmSetupPage';
import { DashboardPage } from './pages/DashboardPage';
import { MilkPage } from './pages/MilkPage';
import { CowsPage } from './pages/CowsPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { SalesPage } from './pages/SalesPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

// Modals
import { RecordMilkModal } from './components/modals/RecordMilkModal';
import { AddCowModal } from './components/modals/AddCowModal';
import { AddExpenseModal } from './components/modals/AddExpenseModal';
import { RecordSaleModal } from './components/modals/RecordSaleModal';
import { AddBuyerModal } from './components/modals/AddBuyerModal';

import { MilkRecord, Cow, Expense, Sale, Buyer } from './types';
import { api } from './services/api';
import { Droplets } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, isLoading, farm, refreshFarm } = useAuth();

  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');

  // Shared Buyers state
  const [buyers, setBuyers] = useState<Buyer[]>([]);

  // Modal States
  const [milkModalOpen, setMilkModalOpen] = useState(false);
  const [editingMilkRecord, setEditingMilkRecord] = useState<MilkRecord | null>(null);

  const [cowModalOpen, setCowModalOpen] = useState(false);
  const [editingCow, setEditingCow] = useState<Cow | null>(null);

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const [buyerModalOpen, setBuyerModalOpen] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState<Buyer | null>(null);

  // Global Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Key to force refresh dependent views on data updates
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => {
    setRefreshKey(k => k + 1);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
  };

  const loadBuyers = async () => {
    try {
      const res = await api.getBuyers();
      if (res.success && res.data) {
        setBuyers(res.data);
      }
    } catch (e) {
      console.error('Failed to load buyers:', e);
    }
  };

  useEffect(() => {
    if (isAuthenticated && farm) {
      loadBuyers();
    }
  }, [isAuthenticated, farm, refreshKey]);

  // Loading Screen
  if (isLoading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-white">
        <div
          className="rounded-3 d-flex align-items-center justify-content-center mb-3 shadow-sm"
          style={{ width: 54, height: 54, backgroundColor: 'var(--dp-forest)' }}
        >
          <Droplets size={30} className="text-white animate-pulse" />
        </div>
        <div className="fw-bold text-dark fs-5 mb-1" style={{ letterSpacing: '-0.02em' }}>
          DAIRYPULSE
        </div>
        <div className="text-muted small">Loading farm records...</div>
      </div>
    );
  }

  // Not Authenticated -> Login or Signup
  if (!isAuthenticated) {
    if (authView === 'signup') {
      return <SignupPage onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onSwitchToSignup={() => setAuthView('signup')} />;
  }

  // Authenticated but no farm setup yet -> Farm Onboarding
  if (!farm) {
    return <FarmSetupPage onSetupComplete={refreshFarm} />;
  }

  // Authenticated with Farm -> Main Application
  return (
    <div className="d-flex min-vh-100" style={{ backgroundColor: 'var(--dp-bg)' }}>
      {/* Desktop Sticky Sidebar */}
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />

      {/* Main Content Area */}
      <div className="flex-grow-1 d-flex flex-column min-vh-100 overflow-x-hidden dp-main-content">
        <Header onRecordMilkClick={() => {
          setEditingMilkRecord(null);
          setMilkModalOpen(true);
        }} />

        <main className="flex-grow-1">
          {currentPage === 'dashboard' && (
            <DashboardPage
              key={refreshKey}
              onNavigate={setCurrentPage}
              onOpenRecordMilk={() => {
                setEditingMilkRecord(null);
                setMilkModalOpen(true);
              }}
              onOpenAddCow={() => {
                setEditingCow(null);
                setCowModalOpen(true);
              }}
              onOpenAddExpense={() => {
                setEditingExpense(null);
                setExpenseModalOpen(true);
              }}
              onOpenRecordSale={() => {
                setEditingSale(null);
                setSaleModalOpen(true);
              }}
            />
          )}

          {currentPage === 'milk' && (
            <MilkPage
              key={refreshKey}
              onOpenRecordMilk={rec => {
                setEditingMilkRecord(rec || null);
                setMilkModalOpen(true);
              }}
              onRecordDeleted={() => {
                showToast('Milk record deleted.');
                triggerRefresh();
              }}
            />
          )}

          {currentPage === 'cows' && (
            <CowsPage
              key={refreshKey}
              onOpenAddCow={cow => {
                setEditingCow(cow || null);
                setCowModalOpen(true);
              }}
              onCowUpdated={() => {
                showToast('Herd updated.');
                triggerRefresh();
              }}
            />
          )}

          {currentPage === 'expenses' && (
            <ExpensesPage
              key={refreshKey}
              onOpenAddExpense={exp => {
                setEditingExpense(exp || null);
                setExpenseModalOpen(true);
              }}
              onExpenseUpdated={() => {
                showToast('Expenses updated.');
                triggerRefresh();
              }}
            />
          )}

          {currentPage === 'sales' && (
            <SalesPage
              key={refreshKey}
              buyers={buyers}
              onOpenRecordSale={sale => {
                setEditingSale(sale || null);
                setSaleModalOpen(true);
              }}
              onOpenAddBuyer={buyer => {
                setEditingBuyer(buyer || null);
                setBuyerModalOpen(true);
              }}
              onDataUpdated={() => {
                showToast('Sales data updated.');
                triggerRefresh();
              }}
            />
          )}

          {currentPage === 'reports' && <ReportsPage key={refreshKey} />}

          {currentPage === 'settings' && <SettingsPage />}
        </main>

        {/* Mobile Fixed Bottom Navigation */}
        <MobileNav currentPage={currentPage} onNavigate={setCurrentPage} />
      </div>

      {/* Global Modals */}
      <RecordMilkModal
        isOpen={milkModalOpen}
        onClose={() => {
          setMilkModalOpen(false);
          setEditingMilkRecord(null);
        }}
        editRecord={editingMilkRecord}
        onSuccess={(msg) => {
          showToast(msg);
          triggerRefresh();
        }}
      />

      <AddCowModal
        isOpen={cowModalOpen}
        onClose={() => {
          setCowModalOpen(false);
          setEditingCow(null);
        }}
        editCow={editingCow}
        onSuccess={(msg) => {
          showToast(msg);
          triggerRefresh();
        }}
      />

      <AddExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => {
          setExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        editExpense={editingExpense}
        onSuccess={(msg) => {
          showToast(msg);
          triggerRefresh();
        }}
      />

      <RecordSaleModal
        isOpen={saleModalOpen}
        onClose={() => {
          setSaleModalOpen(false);
          setEditingSale(null);
        }}
        editSale={editingSale}
        buyers={buyers}
        onOpenAddBuyer={() => {
          setEditingBuyer(null);
          setBuyerModalOpen(true);
        }}
        onSuccess={(msg) => {
          showToast(msg);
          triggerRefresh();
        }}
      />

      <AddBuyerModal
        isOpen={buyerModalOpen}
        onClose={() => {
          setBuyerModalOpen(false);
          setEditingBuyer(null);
        }}
        editBuyer={editingBuyer}
        onSuccess={(msg) => {
          showToast(msg);
          triggerRefresh();
        }}
      />

      {/* Global Toast */}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
