import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TopBar } from './components/common/TopBar';
import { SideBar } from './components/common/SideBar';
import { NTROHeader } from './components/common/NTROHeader';

import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CaseList } from './pages/CaseList';
import { CaseDetail } from './pages/CaseDetail';
import { EvidenceIngest } from './pages/EvidenceIngest';
import { EvidenceAnalysis } from './pages/EvidenceAnalysis';
import { ChainOfCustody } from './pages/ChainOfCustody';
import { ReportPreview } from './pages/ReportPreview';
import { AdminPanel } from './pages/AdminPanel';

// Protected route — redirects to dashboard if role is not allowed
const ProtectedRoute = ({ element, allowedRoles }) => {
  const { currentUser } = useAuth();
  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return element;
};

// Main Layout Wrapper
const MainLayout = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-forensic-950 text-slate-200">
      {/* NTRO Top Evidentiary Header Banner */}
      <NTROHeader />

      {/* Main Console Framework */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Forensic Sidebar */}
        <SideBar />

        {/* Right Workspace with TopBar */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <TopBar />
          <main className="flex-1 bg-gradient-to-b from-forensic-950 to-forensic-900">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cases" element={<CaseList />} />
            <Route path="/cases/:id" element={<CaseDetail />} />
            {/* Evidence ingest: Investigator + Admin only */}
            <Route
              path="/cases/:id/ingest"
              element={
                <ProtectedRoute
                  element={<EvidenceIngest />}
                  allowedRoles={['Investigator', 'Admin']}
                />
              }
            />
            <Route path="/cases/:id/evidence/:evidenceId" element={<EvidenceAnalysis />} />
            <Route path="/cases/:id/custody" element={<ChainOfCustody />} />
            <Route path="/cases/:id/report" element={<ReportPreview />} />
            {/* Admin panel: Admin only */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute
                  element={<AdminPanel />}
                  allowedRoles={['Admin']}
                />
              }
            />

            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}
