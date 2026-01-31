import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppLayout } from './components/layout';
import {
  LoginPage,
  DashboardPage,
  UsersPage,
  ReportsPage,
  GamesPage,
  ScoresPage,
  TournamentsPage,
  RewardsPage,
  FinancialPage,
  AuditLogPage,
  SettingsPage,
  CommunicationPage,
  SupportPage,
} from './pages';

import './i18n';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/scores" element={<ScoresPage />} />
            <Route path="/tournaments" element={<TournamentsPage />} />
            <Route path="/rewards" element={<RewardsPage />} />
            <Route path="/financial" element={<FinancialPage />} />
            <Route path="/audit-log" element={<AuditLogPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/communication" element={<CommunicationPage />} />
            <Route path="/support" element={<SupportPage />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
