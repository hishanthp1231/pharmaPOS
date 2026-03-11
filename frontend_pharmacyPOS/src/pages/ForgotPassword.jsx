import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import Logo from '../components/Logo';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      // In production, you would call your backend API here
      // Example: await axios.post('/api/forgot-password', { email });
    }, 1500);
  };

  return (
    <div className="forgot-password-container">
      <style>{`
        .forgot-password-container {
          min-height: 100vh;
          background: linear-gradient(135deg, var(--gradient-start) 0%, var(--gradient-middle) 50%, var(--gradient-end) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          transition: background 0.3s ease;
        }



        .forgot-password-card {
          background: var(--card-bg);
          backdrop-filter: blur(20px);
          border: 1px solid var(--glass-border);
          border-radius: 24px;
          padding: 40px;
          width: 100%;
          max-width: 450px;
          box-shadow: 0 20px 60px var(--shadow);
          animation: slideUp 0.6s ease-out;
          position: relative;
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

        .forgot-password-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .forgot-password-title {
          font-size: 28px;
          font-weight: 700;
          color: var(--text-color);
          margin-top: 20px;
          margin-bottom: 12px;
          background: linear-gradient(135deg, var(--primary-blue) 0%, var(--secondary-purple) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .forgot-password-subtitle {
          color: #1e293b;
          font-size: 15px;
          line-height: 1.5;
          font-weight: 500;
        }

        .form-group {
          margin-bottom: 24px;
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

        .forgot-password-input {
          width: 100%;
          padding: 14px 16px 14px 48px;
          border: 2px solid var(--border-color);
          border-radius: 12px;
          font-size: 15px;
          color: #000000;
          background: var(--input-bg);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          outline: none;
        }

        .forgot-password-input::placeholder {
          color: #475569;
          opacity: 1;
        }

        .forgot-password-input:focus {
          border-color: var(--primary-blue);
          box-shadow: 0 0 0 4px rgba(4, 146, 194, 0.1);
          background: var(--background);
        }

        .forgot-password-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-message {
          margin-top: 12px;
          padding: 12px 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          color: #dc2626;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .success-message {
          margin-top: 12px;
          padding: 16px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 12px;
          color: #059669;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          animation: slideUp 0.3s ease-out;
        }

        .submit-btn {
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
          margin-top: 8px;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(4, 146, 194, 0.4);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .back-to-login {
          margin-top: 24px;
          text-align: center;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--primary-blue);
          text-decoration: none;
          font-size: 15px;
          font-weight: 500;
          transition: all 0.3s ease;
          padding: 8px 16px;
          border-radius: 8px;
        }

        .back-link:hover {
          background: rgba(4, 146, 194, 0.1);
          gap: 12px;
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

        @media (max-width: 480px) {
          .forgot-password-card {
            padding: 30px 24px;
          }

          .forgot-password-title {
            font-size: 24px;
          }
        }
      `}</style>



      <div className="forgot-password-card">
        <div className="forgot-password-header">
          <Logo size="small" />
          <h1 className="forgot-password-title">Forgot Password?</h1>
          <p className="forgot-password-subtitle">
            Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={20} />
                <input
                  type="email"
                  id="email"
                  className="forgot-password-input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              </div>
              {error && (
                <div className="error-message">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  <span style={{ marginLeft: '8px' }}>Sending...</span>
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        ) : (
          <div className="success-message">
            <CheckCircle size={24} />
            <div>
              <strong>Email sent successfully!</strong>
              <br />
              Check your inbox for password reset instructions.
            </div>
          </div>
        )}

        <div className="back-to-login">
          <a href="/" className="back-link">
            <ArrowLeft size={18} />
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
