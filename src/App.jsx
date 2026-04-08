import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ToastProvider } from './components/Toast';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GCDetail from './pages/GCDetail';
import SubDetail from './pages/SubDetail';
import Subcontractors from './pages/Subcontractors';
import AddSubcontractor from './pages/AddSubcontractor';
import CertificateUpload from './pages/CertificateUpload';
import Certificates from './pages/Certificates';
import EmailLog from './pages/EmailLog';
import AgentPortal from './pages/AgentPortal';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

function ConsultantRoute({ children }) {
  const { isAuthenticated, isConsultant } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isConsultant) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <ToastProvider>
            <Routes>
              {/* Public routes */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />

              {/* Agent portal — no auth required */}
              <Route path="/verify/:token" element={<AgentPortal />} />

              {/* Protected routes with layout */}
              <Route
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/gc/:gcId" element={<GCDetail />} />
                <Route path="/sub/:subId" element={<SubDetail />} />
                <Route path="/sub/:subId/upload-cert" element={<CertificateUpload />} />
                <Route path="/subcontractors" element={<Subcontractors />} />
                <Route path="/subcontractors/add" element={<AddSubcontractor />} />
                <Route path="/certificates" element={<Certificates />} />
                <Route
                  path="/email-log"
                  element={
                    <ConsultantRoute>
                      <EmailLog />
                    </ConsultantRoute>
                  }
                />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </ToastProvider>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
