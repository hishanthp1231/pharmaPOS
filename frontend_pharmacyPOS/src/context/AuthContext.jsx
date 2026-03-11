import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

// Set the base URL for API requests
const API_URL = '/api/auth';

// Create the auth context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Set up axios defaults
  const setupAxios = useCallback((token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, []);

  // Load user from token
  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setLoading(false);
      return null;
    }

    try {
      setupAxios(token);
      const response = await axios.get(`${API_URL}/me`);
      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      console.error('Error loading user', error);
      localStorage.removeItem('token');
      setupAxios(null);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setupAxios]);

  // Check if user is logged in on initial load
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Login function
  const login = async (username, password) => {
    try {
      setError('');
      const response = await axios.post(`${API_URL}/login`, {
        username,
        password
      });
      
      const { token, user: userData } = response.data;
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      // Set up axios headers
      setupAxios(token);
      
      // Set user in state
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (username, email, password) => {
    try {
      setError('');
      const response = await axios.post(`${API_URL}/register`, {
        username,
        email,
        password
      });
      
      const { token, user: userData } = response.data;
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      // Set up axios headers
      setupAxios(token);
      
      // Set user in state
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setupAxios(null);
    setUser(null);
  };

  // Context value
  const contextValue = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    loadUser
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading ? children : null}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
