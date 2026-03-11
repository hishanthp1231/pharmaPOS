import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './styles/tables.css';
import './styles/layout.css';
import Layout from './components/Layout';
import Home from './pages/Home';
import Tables from './pages/Tables';
import Customers from './pages/Customers';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Suppliers from './pages/Suppliers';
import { POSProvider } from './context/POSContext';
import { BranchProvider } from './context/BranchContext';
import { StoreProvider } from './context/StoreContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import BranchAdminDashboard from './pages/BranchAdminDashboard';
import api from './utils/axios';

// Inventory Management
import Inventory from './pages/Inventory';

import Orders from './pages/Orders';
import Sales from './pages/Sales'; // Use static import instead of React.lazy
import Discounts from './pages/Discounts'; // <-- Add this import

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#0b27b1',
      contrastText: '#fff',
    },
    secondary: {
      main: '#0492C2',
      contrastText: '#fff',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
    divider: '#e2e8f0',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(11, 39, 177, 0.15)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 4px 12px rgba(11, 39, 177, 0.25)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e2e8f0',
          borderRadius: 12,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e2e8f0',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: '#f8fafc',
          color: '#1e293b',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#94a3b8',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#0b27b1',
            borderWidth: 1,
          },
        },
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
  },
});

// Helper: check if user can access a page by name
const normalizePageName = (pageName) => (pageName === 'Sales' ? 'Add Sales' : pageName);

const canAccessPage = (pageName) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const targetPage = normalizePageName(pageName);

  if (!user.role && !user.role_id) return false;

  if (user.role === 'super_admin') return true;

  const rolePermissions = {
    branch_admin: ['Dashboard', 'Home', 'Inventory', 'Suppliers', 'Customers', 'Expenses', 'Reports', 'Settings', 'Add Sales'],
    branch_user: ['Dashboard', 'Home', 'Sales', 'Customers', 'Inventory']
  };

  const allowed = rolePermissions[user.role] || [];
  if (allowed.includes(targetPage) || allowed.includes(pageName)) return true;

  if (user.role_id) {
    try {
      const raw = localStorage.getItem('roles');
      const roles = raw ? JSON.parse(raw) : [];
      const role = roles.find(r => String(r.id) === String(user.role_id));
      if (role?.is_admin === 1 || role?.is_admin === true) return true;
      const pagesRaw = Array.isArray(role?.pages) ? role.pages : JSON.parse(role?.pages || '[]');
      const pages = pagesRaw.map(p => (p === 'Sales' ? 'Add Sales' : p));
      return pages.includes(targetPage) || pages.includes(pageName);
    } catch {
      return false;
    }
  }

  return false;
};

// Ensure roles are always loaded into localStorage and refreshed on app load
// Removed role fetching as we use static ENUM roles now
/*
(function ensureRolesLoaded() {
  fetch('/api/user-management/roles')
    .then(res => res.json())
    .then(data => {
      if (data && data.data) {
        localStorage.setItem('roles', JSON.stringify(data.data));
      }
    });
})();
*/

// Temporarily disable authentication
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('user');
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

const AppContent = () => {
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user?.role_id) return;
    api.get('/user-management/roles')
      .then(res => {
        const roles = res.data?.data || [];
        localStorage.setItem('roles', JSON.stringify(roles));
      })
      .catch(() => { /* ignore */ });
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <POSProvider>
        <BranchProvider>
          <StoreProvider>
            <AuthProvider>
              <Router>
                <Routes>
                  {/* Login page at "/" */}
                  <Route path="/" element={<Login />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  {/* Protected dashboard layout */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Layout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Dashboard />} />
                    <Route path="home" element={<Home />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="inventory" element={<Inventory />} />
                    <Route path="customers" element={<Customers />} />
                    <Route path="suppliers" element={<Suppliers />} />
                    <Route path="expenses" element={<Expenses />} />
                    <Route path="tables" element={<Tables />} />
                    <Route path="sales" element={canAccessPage('Add Sales') ? <Sales /> : <Navigate to="/dashboard" replace />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="sales" element={canAccessPage('Add Sales') ? <Sales /> : <Navigate to="/dashboard" replace />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="discounts" element={<Discounts />} />
                  </Route>
                  {/* Admin Dashboards */}
                  <Route path="/super-admin-dashboard" element={
                    <ProtectedRoute>
                      <Layout>
                        <SuperAdminDashboard />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  <Route path="/branch-admin-dashboard" element={
                    <ProtectedRoute>
                      <Layout>
                        <BranchAdminDashboard />
                      </Layout>
                    </ProtectedRoute>
                  } />
                  {/* Catch all other routes */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Router>
            </AuthProvider>
          </StoreProvider>
        </BranchProvider>
      </POSProvider>
    </ThemeProvider>
  );
};

export default AppContent;
