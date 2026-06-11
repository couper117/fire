import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Toaster } from 'react-hot-toast';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './Dashboard';
import { ExtinguisherPage } from './ExtinguisherPage';

// Layout
import { MainLayout } from './components/layout/MainLayout';

// Protected Route
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return user ? <MainLayout>{children}</MainLayout> : <Navigate to="/login" />;
};

const App = () => {
  const { user } = useAuth();

  return (
    <>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          {/* Public Routes */}
          {!user ? (
            <>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </>
          ) : (
            <>
              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/extinguishers"
                element={
                  <ProtectedRoute>
                    <ExtinguisherPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          )}
        </Routes>
      </Router>
    </>
  );
};

export default App;
