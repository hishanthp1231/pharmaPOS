import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../utils/axios';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Building } from 'lucide-react';
import Logo from '../components/Logo';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const branchList = Array.isArray(branches) ? branches : [];

  useEffect(() => {
    // Fetch branches
    const fetchBranches = async () => {
      try {
        const res = await axios.get('/api/branches');
        const payload = res.data;
        const contentType = String(res.headers?.['content-type'] || '').toLowerCase();
        if (typeof payload === 'string' || contentType.includes('text/html')) {
          throw new Error('API_ROUTE_NOT_CONFIGURED');
        }
        const normalizedBranches = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.branches)
            ? payload.branches
            : Array.isArray(payload?.data)
              ? payload.data
              : [];
        setBranches(normalizedBranches);
      } catch (err) {
        console.error('Failed to fetch branches', err);
        if (err?.message === 'API_ROUTE_NOT_CONFIGURED') {
          setLoginError('Backend API is not connected. /api is serving the frontend app instead of backend routes.');
          setBranches([]);
          return;
        }
        // Set default branches if fetch fails
        setBranches([
          { id: 1, name: 'Colombo Main Branch' },
          { id: 2, name: 'Kandy Branch' },
          { id: 3, name: 'Galle branch' },
          { id: 4, name: 'Batticaloa Branch' }
        ]);
      }
    };
    fetchBranches();

    return () => setLoginError('');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    if (!username.trim() || !password) {
      setLoginError('Please enter both username and password');
      return;
    }

    if (!selectedBranch && username !== 'superadmin') {
      setLoginError('Please select a branch');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', {
        username,
        password,
        branchId: selectedBranch
      });
      const contentType = String(res.headers?.['content-type'] || '').toLowerCase();
      if (typeof res.data === 'string' || contentType.includes('text/html')) {
        setLoginError('Backend API is not connected. /api/auth/login is returning the frontend page.');
        return;
      }
      if (res.data.success && res.data.user) {
        const userData = res.data.user;
        // Store user data with branch info
        localStorage.setItem('user', JSON.stringify(userData));
        // Store branch_id from user's branch_id or selectedBranch
        const branchId = userData.branchId || selectedBranch || 1;
        localStorage.setItem('branch_id', branchId);
        localStorage.setItem('branch_name', userData.branchName || '');
        localStorage.setItem('token', res.data.token);
        
        // If user has a role_id, preload roles for permissions
        if (userData.role_id) {
          api.get('/user-management/roles')
            .then(roleRes => {
              const roles = roleRes.data?.data || [];
              localStorage.setItem('roles', JSON.stringify(roles));
            })
            .catch(() => { /* ignore */ });
        }

        // Dispatch event for context listeners
        window.dispatchEvent(new Event('login_success'));

        console.log('Login successful:', { user: userData, branchId });

        // Redirect based on role
        if (userData.role === 'super_admin') {
          navigate('/dashboard');
        } else if (userData.role === 'branch_admin') {
          navigate('/branch-admin-dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        setLoginError(res.data.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      const contentType = String(err?.response?.headers?.['content-type'] || '').toLowerCase();
      if (contentType.includes('text/html')) {
        setLoginError('Backend API is not connected. /api/auth/login is returning the frontend page.');
      } else {
      setLoginError(err.response?.data?.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <style>{`
        .login-container {
          min-height: 100vh;
          background: linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-middle) 50%, var(--gradient-end) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          overflow: hidden;
          transition: background 0.3s ease;
        }

        .login-container::before {
          content: '';
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(4, 146, 194, 0.15) 0%, transparent 70%);
          top: -200px;
          left: -200px;
          animation: float 20s ease-in-out infinite;
        }

        .login-container::after {
          content: '';
          position: absolute;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(91, 66, 243, 0.15) 0%, transparent 70%);
          bottom: -150px;
          right: -150px;
          animation: float 15s ease-in-out infinite reverse;
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          33% {
            transform: translate(30px, -30px) rotate(120deg);
          }
          66% {
            transform: translate(-20px, 20px) rotate(240deg);
          }
        }



        .login-card {
          background: var(--card-bg);
          backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
          border-radius: 24px;
          padding: 48px 40px;
          width: 100%;
          max-width: 450px;
          box-shadow: 0 20px 60px var(--shadow);
          position: relative;
          z-index: 1;
          animation: slideUp 0.6s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .login-header {
          text-align: center;
          margin-bottom: 36px;
        }

        .login-title {
          font-size: 32px;
          font-weight: 700;
          color: var(--text-color);
          margin-top: 24px;
          margin-bottom: 8px;
          background: linear-gradient(135deg, var(--primary-blue) 0%, var(--secondary-purple) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .login-subtitle {
          color: #1e293b;
          font-size: 15px;
          font-weight: 500;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          color: #000000;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #475569;
          pointer-events: none;
          z-index: 1;
        }

        .password-toggle {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.3s ease;
          z-index: 1;
        }

        .password-toggle:hover {
          color: var(--primary-blue);
        }

        .login-input {
          width: 100%;
          padding: 14px 48px 14px 48px;
          border: 2px solid var(--border-color);
          border-radius: 12px;
          font-size: 15px;
          color: #000000;
          background: var(--input-bg);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          outline: none;
        }
        
        select.login-input {
            appearance: none;
            cursor: pointer;
        }

        .login-input::placeholder {
          color: #475569;
          opacity: 1;
        }

        .login-input:focus {
          border-color: var(--primary-blue);
          box-shadow: 0 0 0 4px rgba(4, 146, 194, 0.8);
          background: var(--background);
        }

        .login-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-alert {
          margin-bottom: 20px;
          padding: 12px 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          color: #dc2626;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          animation: shake 0.5s ease-in-out;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }

        .forgot-password-link {
          text-align: right;
          margin-top: 12px;
          margin-bottom: 24px;
        }

        .forgot-password-link a {
          color: var(--primary-blue);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
          display: inline-block;
        }

        .forgot-password-link a:hover {
          color: var(--secondary-purple);
          transform: translateX(2px);
        }

        .login-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, var(--primary-blue) 0%, var(--secondary-purple) 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(4, 146, 194, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(4, 146, 194, 0.4);
        }

        .login-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading-spinner {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .divider {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 24px 0;
          color: #1e293b;
          font-size: 14px;
          font-weight: 500;
        }

        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          border-bottom: 2px solid var(--border-color);
        }

        .divider span {
          padding: 0 12px;
        }

        .signup-link {
          text-align: center;
          color: #1e293b;
          font-size: 15px;
          font-weight: 500;
        }

        .signup-link a {
          color: var(--primary-blue);
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .signup-link a:hover {
          color: var(--secondary-purple);
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 36px 28px;
          }

          .login-title {
            font-size: 28px;
          }

          .login-container::before,
          .login-container::after {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .login-card,
          .error-alert,
          .login-container::before,
          .login-container::after {
            animation: none !important;
          }
        }
      `}</style>
      <div className="login-card">
        <div className="login-header">
          <Logo size="medium" />
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Sign in to your account to continue</p>
        </div>

        {loginError && (
          <div className="error-alert">
            <AlertCircle size={18} />
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label htmlFor="branch" className="form-label">Branch</label>
            <div className="input-wrapper">
              <Building className="input-icon" size={20} />
              <select
                className="login-input"
                id="branch"
                name="branch"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                disabled={loading}
              >
                <option value="">Select Branch</option>
                {branchList.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="username" className="form-label">Username</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={20} />
              <input
                className="login-input"
                type="text"
                id="username"
                name="username"
                placeholder="Enter your username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={20} />
              <input
                className="login-input"
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="forgot-password-link">
            <a href="/forgot-password">Forgot Password?</a>
          </div>

          <button
            className="login-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                <span>Signing in...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>

          <div className="divider">
            <span>or</span>
          </div>

          <div className="signup-link">
            Don't have an account? <a href="/signup">Sign Up</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
