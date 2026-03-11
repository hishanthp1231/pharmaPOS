import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/axios';

const BranchContext = createContext();

export function BranchProvider({ children }) {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // User state from localStorage
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  const [isAdmin, setIsAdmin] = useState(false);

  // Sync user from localStorage (login/logout, cross-tab)
  useEffect(() => {
    const handleAuthChange = () => {
      const updatedUser = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(updatedUser);
    };
    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('login_success', handleAuthChange);
    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('login_success', handleAuthChange);
    };
  }, []);

  // Determine user branch and normalized role
  const rawUserBranchId = user.branch_id ?? user.branchId;
  const userBranchId = Array.isArray(rawUserBranchId) ? rawUserBranchId[0] : rawUserBranchId;
  const normalizedRole = String(user?.role || '').toLowerCase().replace(/[\s-]+/g, '_');

  // Determine admin status
  useEffect(() => {
    if (
      normalizedRole === 'super_admin' ||
      normalizedRole === 'superadmin' ||
      normalizedRole === 'branch_admin' ||
      user.username === 'superadmin' ||
      user?.is_admin === true ||
      user?.is_admin === 1
    ) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [user, normalizedRole]);

  // Fetch all branches
  const fetchBranches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/branches');
      const payload = response.data;
      const branchesData = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.branches)
        ? payload.branches
        : Array.isArray(payload?.data)
        ? payload.data
        : [];

      setBranches(branchesData);

      // Set selectedBranch automatically
      if (!selectedBranch && branchesData.length > 0) {
        if (!isAdmin && userBranchId) {
          // Non-admin: force assigned branch
          const branch = branchesData.find(b => String(b.id) === String(userBranchId));
          if (branch) {
            setSelectedBranch(branch);
            localStorage.setItem('branch_id', branch.id);
          } else {
            setSelectedBranch(branchesData[0]);
          }
        } else if (isAdmin) {
          // Admin: optional default first branch
          const localBranchId = localStorage.getItem('branch_id');
          const branch =
            branchesData.find(b => String(b.id) === String(localBranchId)) || branchesData[0];
          setSelectedBranch(branch);
        }
      }

      return branchesData;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch branches');
      setBranches([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, isAdmin, userBranchId]);

  // Add / update / delete / toggle branch
  const addBranch = async (branchData) => {
    try {
      const res = await api.post('/branches', branchData);
      await fetchBranches();
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to add branch' };
    }
  };

  const updateBranch = async (id, branchData) => {
    try {
      const res = await api.put(`/branches/${id}`, branchData);
      await fetchBranches();
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to update branch' };
    }
  };

  const deleteBranch = async (id) => {
    try {
      const res = await api.delete(`/branches/${id}`);
      await fetchBranches();
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to delete branch' };
    }
  };

  const toggleBranchStatus = async (id, currentStatus) => {
    try {
      const res = await api.patch(`/branches/${id}/status`, { active: !currentStatus });
      await fetchBranches();
      return { success: true, data: res.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to toggle branch' };
    }
  };

  const refreshBranches = async () => {
    return fetchBranches();
  };

  // Set selected branch
  const handleSetSelectedBranch = (branch) => {
    setSelectedBranch(branch);
    if (branch?.id) {
      localStorage.setItem('branch_id', branch.id);
      window.dispatchEvent(new Event('branch_id_changed'));
    }
  };

  // Sync selectedBranch with localStorage and cross-tab
  useEffect(() => {
    const syncBranch = () => {
      const branchId = localStorage.getItem('branch_id');
      if (branchId && branches.length > 0) {
        const branch = branches.find(b => String(b.id) === branchId);
        if (branch) setSelectedBranch(branch);
      }
    };
    window.addEventListener('branch_id_changed', syncBranch);
    return () => window.removeEventListener('branch_id_changed', syncBranch);
  }, [branches]);

  // Load branches on mount
  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  // Debug logs
  useEffect(() => {
    console.log('[BRANCH CONTEXT] user:', user, 'isAdmin:', isAdmin);
    console.log('[BRANCH CONTEXT] selectedBranch:', selectedBranch);
    console.log('[BRANCH CONTEXT] localStorage.branch_id:', localStorage.getItem('branch_id'));
  }, [user, selectedBranch, isAdmin]);

  return (
    <BranchContext.Provider
      value={{
        branches,
        selectedBranch,
        loading,
        error,
        isAdmin,
        setSelectedBranch: handleSetSelectedBranch,
        addBranch,
        updateBranch,
        deleteBranch,
        toggleBranchStatus,
        refreshBranches,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) throw new Error('useBranch must be used within a BranchProvider');
  return context;
}
