import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Toaster } from 'react-hot-toast';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './Dashboard';
import { ExtinguisherManagement } from './pages/ExtinguisherManagement';
import { InspectionManagement } from './pages/InspectionManagement';
import { Reports } from './pages/Reports';
import { UserManagement } from './components/admin/UserManagement';

// Layout
import { MainLayout } from './components/layout/MainLayout';

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && (user as any).role !== 'Admin') return <Navigate to="/" />;
  return <MainLayout>{children}</MainLayout>;
};

const App = () => {
  const { user } = useAuth();

  return (
    <>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          {!user ? (
            <>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </>
          ) : (
            <>
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/extinguishers" element={<ProtectedRoute><ExtinguisherManagement /></ProtectedRoute>} />
              <Route path="/inspections" element={<ProtectedRoute><InspectionManagement /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute adminOnly><UserManagement /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          )}
        </Routes>
      </Router>
    </>
  );
};

export default App;
