import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import { UserGroupIcon, UserIcon, BuildingStorefrontIcon, CurrencyDollarIcon, BellIcon, CloudIcon } from '@heroicons/react/24/outline';
import { Settings as SettingsIcon } from '@mui/icons-material';
import api from '../utils/axios';
import BranchManager from '../components/BranchManager';
import BranchSelector from '../components/BranchSelector';
import UserManagement from '../components/UserManagement';
import BranchUserManagement from '../components/BranchUserManagement';
import BillSettings from '../components/BillSettings';
import { useStore } from '../context/StoreContext';
import { useBranch } from '../context/BranchContext';
import { getBranches, addBranch } from '../services/branchService';
import { MdVisibility, MdOutlineEdit, MdDelete } from 'react-icons/md';
import { toUploadUrl } from '../config/api';


const HOME_COLORS = {
  main: '#0492c2',
  accent: '#0b27b1',
  bg: '#f8fbff',
  card: '#e4f4fa',
  warning: '#fbbf24',
  danger: '#f87171',
  success: '#22c55e',
  text: '#2d3748'
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    email: '',
    businessType: '',
    logo: null,
    logoPreview: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fileInputRef = useRef();
  const { storeInfo, updateStoreInfo } = useStore();
  const { branches, selectedBranch, setSelectedBranch, loading: branchesLoading, error: branchesError } = useBranch();
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Admin'
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');

  // Local branch state for dropdown and management
  const [localBranches, setLocalBranches] = useState([]);
  const [localBranchesLoading, setLocalBranchesLoading] = useState(false);
  const [localBranchesError, setLocalBranchesError] = useState('');

  // Branch creation form state
  const [branchForm, setBranchForm] = useState({
    name: '',
    code: '',
    address: '',
    tel: '',
    manager: '',
    active: true
  });
  const [branchFormError, setBranchFormError] = useState('');
  const [branchSubmitting, setBranchSubmitting] = useState(false);
  const [showBranchForm, setShowBranchForm] = useState(false);

  // Modal states for view/edit/delete
  const [viewBranch, setViewBranch] = useState(null);
  const [editBranch, setEditBranch] = useState(null);
  const [deleteBranchId, setDeleteBranchId] = useState(null);

  // Edit branch form state
  const [editBranchForm, setEditBranchForm] = useState({
    name: '',
    code: '',
    address: '',
    tel: '',
    manager: '',
    active: true
  });
  const [editBranchError, setEditBranchError] = useState('');
  const [editBranchSubmitting, setEditBranchSubmitting] = useState(false);

  // Initialize form data when storeInfo is available
  useEffect(() => {
    if (storeInfo) {
      setFormData({
        name: storeInfo.name || '',
        code: storeInfo.code || '',
        email: storeInfo.email || '',
        businessType: storeInfo.businessType || '',
        logo: null,
        logoPreview: storeInfo.logo || null,
      });
      setLoading(false);
    }
  }, [storeInfo]);

  // Fetch profile settings from backend
  useEffect(() => {
    if (activeTab === 'profile') {
      setProfileLoading(true);
      axios.get('/api/profile')
        .then(res => {
          const data = res.data.data || {};
          setProfileForm({
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            role: data.role || 'Admin'
          });
        })
        .catch(() => setProfileError('Failed to load profile'))
        .finally(() => setProfileLoading(false));
    }
  }, [activeTab]);

  // Fetch branches from backend
  const fetchBranches = async () => {
    setLocalBranchesLoading(true);
    setLocalBranchesError('');
    try {
      const branchArr = await getBranches();
      setLocalBranches(branchArr);
      if ((!selectedBranch || !selectedBranch.id) && branchArr.length > 0) {
        setSelectedBranch(branchArr[0]);
      }
    } catch (err) {
      setLocalBranches([]);
      setLocalBranchesError('Failed to fetch branches');
    } finally {
      setLocalBranchesLoading(false);
    }
  };

  const handleStoreInfoChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          logo: file,
          logoPreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoRemove = () => {
    setFormData(prev => ({
      ...prev,
      logo: null,
      logoPreview: null
    }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Store Info update handler (already correct, just ensure endpoint is /api/store)
  const handleSaveStoreInfo = async (e) => {
    e.preventDefault();
    setError('');
    // Validate required fields before sending to backend
    if (!formData.name || !formData.code || !formData.email || !formData.businessType) {
      setError('All fields are required (Store Name, Code, Email, Business Type)');
      return;
    }
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('code', formData.code);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('businessType', formData.businessType);
      if (formData.logo) {
        formDataToSend.append('logo', formData.logo);
      }
      // Debug: log payload
      console.log('Store info payload:', {
        name: formData.name,
        code: formData.code,
        email: formData.email,
        businessType: formData.businessType,
        logo: formData.logo
      });

      const response = await axios.post('/api/store', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Debug: log backend response
      console.log('Backend response:', response.data);

      if (response.data.success && response.data.store) {
        updateStoreInfo(response.data.store);
        setFormData(prev => ({
          ...prev,
          logoPreview: response.data.store.logo ? toUploadUrl(response.data.store.logo) : prev.logoPreview
        }));
      }
    } catch (err) {
      console.error('Error updating store info:', err);
      setError(err.response?.data?.error || 'Failed to update store information');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');
    try {
      await axios.put('/api/profile', profileForm);
      // Optionally show success toast
    } catch (err) {
      setProfileError('Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  // Add branch
  const handleBranchFormSubmit = async (e) => {
    e.preventDefault();
    setBranchFormError('');
    if (!branchForm.name || !branchForm.code || !branchForm.address || !branchForm.tel || !branchForm.manager) {
      setBranchFormError('All fields are required');
      return;
    }
    setBranchSubmitting(true);
    try {
      const branchPayload = {
        ...branchForm,
        active: !!branchForm.active // ensure boolean
      };
      const res = await addBranch(branchPayload);
      if (res && res.success) {
        setBranchForm({
          name: '',
          code: '',
          address: '',
          tel: '',
          manager: '',
          active: true
        });
        await fetchBranches();
      } else {
        setBranchFormError(res?.error || 'Failed to add branch');
      }
    } catch (err) {
      setBranchFormError('Failed to add branch');
    } finally {
      setBranchSubmitting(false);
    }
  };

  // Local state for admin detection
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleChecked, setRoleChecked] = useState(false);

  // Get logged-in user
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const normalizedRole = String(user?.role || '').toLowerCase().replace(/[\s-]+/g, '_');
  const isSuperAdmin = normalizedRole === 'super_admin' || normalizedRole === 'superadmin' || user?.username === 'superadmin' || user?.is_admin === true || user?.is_admin === 1;
  const isBranchAdmin = normalizedRole === 'branch_admin';
  const rawUserBranchId = user.branch_id ?? user.branchId;
  const userBranchId = Array.isArray(rawUserBranchId) ? rawUserBranchId[0] : rawUserBranchId;
  const normalizeActive = (value) => value === 1 || value === true || value === '1' || value === 'true';

  // Fetch role info from roles table and set isAdmin
  useEffect(() => {
    async function fetchRole() {
      if (isSuperAdmin) {
        setIsAdmin(true);
        setRoleChecked(true);
        return;
      }
      if (!user.role_id) {
        setIsAdmin(false);
        setRoleChecked(true);
        return;
      }
      try {
        const res = await api.get(`/user-management/roles/${user.role_id}`);
        const role = res.data?.data;
        setIsAdmin(role?.is_admin === 1 || role?.is_admin === true);
      } catch {
        setIsAdmin(false);
      } finally {
        setRoleChecked(true);
      }
    }
    fetchRole();
  }, [user.role_id, isSuperAdmin]);

  // Ensure selectedBranch is set to user's branch for non-admins
  useEffect(() => {
    if (roleChecked && !isAdmin && userBranchId && localBranches.length > 0) {
      const branch = localBranches.find(b => String(b.id) === String(userBranchId));
      if (branch) setSelectedBranch(branch);
    }
  }, [roleChecked, isAdmin, userBranchId, localBranches, setSelectedBranch]);

  // Branch dropdown change handler (only for admin)
  const handleBranchSelect = (e) => {
    if (!isAdmin) return; // Non-admin users cannot change branch
    const branch = localBranches.find(b => String(b.id) === e.target.value);
    setSelectedBranch(branch || null);
  };

  // Handle view branch
  const handleViewBranch = (branch) => setViewBranch(branch);

  // Handle edit branch
  const handleEditBranch = (branch) => {
    setEditBranch(branch);
    setEditBranchForm({
      name: branch.name || '',
      code: branch.code || '',
      address: branch.address || '',
      tel: branch.tel || branch.contact || '',
      manager: branch.manager || '',
      active: normalizeActive(branch.active)
    });
    setEditBranchError('');
  };
  const handleEditBranchSubmit = async (e) => {
    e.preventDefault();
    setEditBranchError('');
    setEditBranchSubmitting(true);
    try {
      const payload = { ...editBranchForm, active: !!editBranchForm.active };
      const res = await api.put(`/branches/${editBranch.id}`, payload);
      if (res.data.success) {
        setEditBranch(null);
        await fetchBranches();
      } else {
        setEditBranchError(res.data.error || 'Failed to update branch');
      }
    } catch (err) {
      setEditBranchError('Failed to update branch');
    } finally {
      setEditBranchSubmitting(false);
    }
  };

  // Handle delete branch
  const handleDeleteBranch = async () => {
    if (!deleteBranchId) return;
    try {
      const res = await api.delete(`/branches/${deleteBranchId}`);
      if (res.data.success) {
        setDeleteBranchId(null);
        await fetchBranches();
      }
    } catch (err) {
      // Optionally show error
      setDeleteBranchId(null);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const selectedBranchActive = selectedBranch ? normalizeActive(selectedBranch.active) : false;

  // Tabs for settings sections
  const settingsTabs = [
    { id: 'profile', label: 'Profile', icon: <UserIcon className="w-5 h-5 mr-2" /> },
    { id: 'store', label: 'Store Settings', icon: <BuildingStorefrontIcon className="w-5 h-5 mr-2" /> },
    { id: 'users', label: 'User Management', icon: <UserGroupIcon className="w-5 h-5 mr-2" /> },
    { id: 'billing', label: 'Billing', icon: <CurrencyDollarIcon className="w-5 h-5 mr-2" /> },
    { id: 'notifications', label: 'Notifications', icon: <BellIcon className="w-5 h-5 mr-2" /> },
    { id: 'backup', label: 'Backup', icon: <CloudIcon className="w-5 h-5 mr-2" /> },
  ];

  // Find current tab index for Tabs component
  const tabIndex = settingsTabs.findIndex(t => t.id === activeTab);

  // Add expiry threshold state
  const [expiryDaysThreshold, setExpiryDaysThreshold] = useState(() => {
    // Default to 90 if not set
    const val = localStorage.getItem('expiry_days_threshold');
    return val ? Number(val) : 90;
  });
  // Add low stock threshold state
  const [lowStockThreshold, setLowStockThreshold] = useState(() => {
    const val = localStorage.getItem('low_stock_threshold');
    return val ? Number(val) : 10;
  });

  useEffect(() => {
    localStorage.setItem('expiry_days_threshold', expiryDaysThreshold);
  }, [expiryDaysThreshold]);
  useEffect(() => {
    localStorage.setItem('low_stock_threshold', lowStockThreshold);
  }, [lowStockThreshold]);

  const handleCreateBackup = async () => {
    try {
      const response = await axios({
        url: '/api/backup/create',
        method: 'GET',
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup-${new Date().toISOString()}.sql`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Backup failed:', err);
      alert('Failed to create backup');
    }
  };

  const handleRestoreBackup = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('backupFile', file);

    try {
      setLoading(true);
      await axios.post('/api/backup/restore', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Database restored successfully');
    } catch (err) {
      console.error('Restore failed:', err);
      alert('Failed to restore database');
    } finally {
      setLoading(false);
    }
  };

  const [lowStockAlerts, setLowStockAlerts] = useState(() => {
    return localStorage.getItem('low_stock_alerts_enabled') === 'true';
  });

  const handleSendTestNotification = async () => {
    try {
      const userPhone = profileForm.phone;
      if (!userPhone) {
        alert('Please enter a phone number in your profile first');
        return;
      }
      if (!userPhone.startsWith('+')) {
        alert('Please enter your phone number in international format (e.g., +94712345678) in the Profile tab and Save Changes.');
        return;
      }
      await axios.post('/api/send-notification', {
        to: userPhone,
        message: 'This is a test notification from Pharama POS.',
        type: 'SMS'
      });
      alert('Test notification sent successfully!');
    } catch (err) {
      console.error('Test notification failed:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to send test notification';
      alert(`Failed to send test notification: ${errorMsg}`);
    }
  };

  useEffect(() => {
    localStorage.setItem('low_stock_alerts_enabled', lowStockAlerts);
  }, [lowStockAlerts]);

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      <div className="w-full max-w-16xl mx-auto pt-0 px-6 pb-6">
        {/* Modern Tabs Navigation */}
        <div className="mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 border border-slate-200/60 shadow-lg shadow-slate-200/20">
            <div className="flex justify-between items-center">
              <nav className="flex space-x-2">
                {settingsTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center ${activeTab === tab.id
                      ? 'bg-gradient-to-r from-[#0b27b1] to-[#1e40af] text-white shadow-lg shadow-blue-200/50 transform scale-105'
                      : 'text-slate-600 hover:text-[#0b27b1] hover:bg-slate-50/80'
                      }`}
                  >
                    {tab.icon}
                    <span className="relative z-10">{tab.label}</span>
                    {activeTab === tab.id && (
                      <div className="absolute inset-0 bg-gradient-to-r from-[#0b27b1] to-[#1e40af] rounded-xl blur-sm opacity-30"></div>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
        {/* Tab Content */}
        <div className="space-y-6">
          {loading && (
            <div className="p-8 text-center text-slate-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#0b27b1]"></div>
            </div>
          )}
          {error && (
            <div className="p-4 text-center text-red-600 bg-red-50 rounded-xl border border-red-200">
              {error}
            </div>
          )}
          {!loading && !error && (
            <>
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/60 shadow-lg shadow-slate-200/20">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Profile Settings</h2>
                  <form onSubmit={handleProfileSave} className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#0b27b1] mb-2">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={profileForm.name}
                        onChange={handleProfileChange}
                        placeholder="Enter your full name"
                        className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/20 focus:border-[#0b27b1] transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#0b27b1] mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={profileForm.email}
                        onChange={handleProfileChange}
                        placeholder="Enter your email"
                        className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/20 focus:border-[#0b27b1] transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#0b27b1] mb-2">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={profileForm.phone}
                        onChange={handleProfileChange}
                        placeholder="Enter your phone number"
                        className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/20 focus:border-[#0b27b1] transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#0b27b1] mb-2">Role</label>
                      <select
                        name="role"
                        value={profileForm.role}
                        onChange={handleProfileChange}
                        className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/20 focus:border-[#0b27b1] transition-all duration-200"
                      >
                        <option>Admin</option>
                        <option>Manager</option>
                        <option>Cashier</option>
                      </select>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button
                        type="button"
                        className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-semibold shadow hover:bg-slate-300 transition-all duration-200"
                        onClick={() => {
                          setProfileForm({
                            name: '',
                            email: '',
                            phone: '',
                            role: 'Admin'
                          });
                        }}
                        disabled={profileLoading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-[#0b27b1] to-[#1e40af] text-white rounded-xl font-semibold shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-200/60 transition-all duration-300 transform hover:scale-105 active:scale-95"
                        disabled={profileLoading}
                      >
                        {profileLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'store' && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/60 shadow-lg shadow-slate-200/20">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Store Settings</h2>
                  <form onSubmit={handleSaveStoreInfo} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-[#0b27b1] mb-2">Store Name</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleStoreInfoChange}
                          placeholder="Enter store name"
                          className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/20 focus:border-[#0b27b1] transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[#0b27b1] mb-2">Store Code</label>
                        <input
                          type="text"
                          name="code"
                          value={formData.code}
                          onChange={handleStoreInfoChange}
                          placeholder="Enter store code"
                          className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/20 focus:border-[#0b27b1] transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[#0b27b1] mb-2">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleStoreInfoChange}
                          placeholder="Enter email address"
                          className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/20 focus:border-[#0b27b1] transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-[#0b27b1] mb-2">Business Type</label>
                        <select
                          name="businessType"
                          value={formData.businessType}
                          onChange={handleStoreInfoChange}
                          className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/20 focus:border-[#0b27b1] transition-all duration-200"
                        >
                          <option value="">Select Business Type</option>
                          <option>Retail</option>
                          <option>Restaurant</option>
                          <option>Wholesale</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#0b27b1] mb-2">Logo Upload</label>
                      <div className="flex items-center gap-4">
                        <input
                          type="file"
                          accept="image/*"
                          className="flex-1 px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/20 focus:border-[#0b27b1] transition-all duration-200"
                          ref={fileInputRef}
                          onChange={handleLogoChange}
                        />
                        {formData.logoPreview && (
                          <div className="relative">
                            <img
                              src={formData.logoPreview}
                              alt="Logo Preview"
                              className="w-16 h-16 object-cover rounded-xl border border-slate-200"
                            />
                            <button
                              type="button"
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                              onClick={handleLogoRemove}
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Toggle for Add New Branch - smaller and right aligned */}
                    <div className="flex items-center justify-between mt-2 mb-2">
                      <span className="text-sm font-semibold text-[#0b27b1]">Add New Branch</span>
                      <label className="relative flex items-center h-[32px] w-[60px] rounded-[16px] bg-white cursor-pointer shadow-[inset_0_0_3px_2px_rgba(255,255,255,1),inset_0_0_10px_1px_rgba(0,0,0,0.2),5px_10px_15px_rgba(0,0,0,0.08),inset_0_0_0_2px_rgba(0,0,0,0.2)] transition-transform duration-400 ml-2">
                        <input
                          type="checkbox"
                          id="branchFormToggle"
                          className="hidden peer"
                          checked={showBranchForm}
                          onChange={() => setShowBranchForm(v => !v)}
                        />
                        <span
                          className={`absolute left-[5px] h-[22px] w-[22px] rounded-full shadow-[0_1px_1px_rgba(0,0,0,0.2),5px_5px_5px_rgba(0,0,0,0.2)] transition-all duration-400
                      bg-[linear-gradient(130deg,#757272_10%,#ffffff_11%,#726f6f_62%)]
                      peer-checked:left-[33px]
                      ${showBranchForm ? 'bg-[#0b27b1]' : ''}
                    `}
                        ></span>
                      </label>
                    </div>
                    {/* Debug: Show toggle state */}
                    {/* <div className="mb-2 text-xs text-gray-500">Toggle state: {showBranchForm ? 'ON' : 'OFF'}</div> */}
                    {/* Add New Branch Form (shown only if toggle is ON) */}
                    {showBranchForm && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mt-2 mb-2 p-2 bg-gray-50 rounded-lg border border-[#e0e4ed]">
                        {/* Branch Name */}
                        <div>
                          <label className="block text-xs font-semibold text-[#0b27b1] mb-1">Branch Name</label>
                          <input
                            type="text"
                            name="name"
                            value={branchForm.name}
                            onChange={e => setBranchForm(f => ({ ...f, name: e.target.value }))}
                            className="w-full bg-white border border-[#d4d4d4] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#0d095e] transition"
                            required
                          />
                        </div>
                        {/* Branch Code */}
                        <div>
                          <label className="block text-xs font-semibold text-[#0b27b1] mb-1">Branch Code</label>
                          <input
                            type="text"
                            name="code"
                            value={branchForm.code}
                            onChange={e => setBranchForm(f => ({ ...f, code: e.target.value }))}
                            className="w-full bg-white border border-[#d4d4d4] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#0d095e] transition"
                            required
                          />
                        </div>
                        {/* Address */}
                        <div>
                          <label className="block text-xs font-semibold text-[#0b27b1] mb-1">Address</label>
                          <input
                            type="text"
                            name="address"
                            value={branchForm.address}
                            onChange={e => setBranchForm(f => ({ ...f, address: e.target.value }))}
                            className="w-full bg-white border border-[#d4d4d4] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#0d095e] transition"
                            required
                          />
                        </div>
                        {/* Telephone */}
                        <div>
                          <label className="block text-xs font-semibold text-[#0b27b1] mb-1">Telephone</label>
                          <input
                            type="text"
                            name="tel"
                            value={branchForm.tel}
                            onChange={e => setBranchForm(f => ({ ...f, tel: e.target.value }))}
                            className="w-full bg-white border border-[#d4d4d4] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#0d095e] transition"
                            required
                          />
                        </div>
                        {/* Manager */}
                        <div>
                          <label className="block text-xs font-semibold text-[#0b27b1] mb-1">Manager</label>
                          <input
                            type="text"
                            name="manager"
                            value={branchForm.manager}
                            onChange={e => setBranchForm(f => ({ ...f, manager: e.target.value }))}
                            className="w-full bg-white border border-[#d4d4d4] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#0d095e] transition"
                            required
                          />
                        </div>
                        {/* Active Branch */}
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="checkbox"
                            name="active"
                            checked={branchForm.active}
                            onChange={e => setBranchForm(f => ({ ...f, active: e.target.checked }))}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                          <label className="block text-xs font-medium text-gray-700">Active Branch</label>
                        </div>
                        {/* Error and Buttons */}
                        {branchFormError && (
                          <div className="text-red-600 text-xs mt-2 col-span-2">{branchFormError}</div>
                        )}
                        <div className="flex justify-end gap-2 pt-2 col-span-2">
                          <button
                            type="button"
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold shadow hover:bg-gray-300 transition text-xs"
                            onClick={() => setBranchForm({
                              name: '',
                              code: '',
                              address: '',
                              tel: '',
                              manager: '',
                              active: true
                            })}
                            disabled={branchSubmitting}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="px-6 py-2 bg-[#0f0092] text-white rounded-lg font-semibold shadow hover:bg-[#07013d] transition text-xs"
                            disabled={branchSubmitting}
                            onClick={handleBranchFormSubmit}
                          >
                            {branchSubmitting ? 'Saving...' : 'Add Branch'}
                          </button>
                        </div>
                      </div>
                    )}
                    {/* Branch Selection Dropdown - styled */}
                    <div className="mt-2 mb-2 p-2 bg-gray-50 rounded-lg border border-[#e0e4ed]">
                      <h3 className="text-md font-medium text-gray-900 mb-2">Branch Management</h3>
                      <div className="mb-2">
                        <label className="block text-xs font-semibold text-gray-800 mb-1">
                          Current Branch
                        </label>
                        <select
                          className="w-full bg-white border border-[#d4d4d4] rounded px-3 py-2 text-sm shadow focus:outline-none focus:border-[#0d095e] transition"
                          value={
                            // For non-admin, always set to user's branch_id
                            !isAdmin && userBranchId
                              ? String(userBranchId)
                              : selectedBranch?.id || ''
                          }
                          onChange={handleBranchSelect}
                          disabled={localBranchesLoading || localBranches.length === 0 || !isAdmin}
                        >
                          <option value="">Select Branch</option>
                          {localBranches.map(branch => (
                            <option key={branch.id} value={branch.id}>
                              {branch.name} ({branch.code})
                            </option>
                          ))}
                        </select>
                        {/* Show current branch info */}
                        {selectedBranch && (
                          <div className="mt-1 text-xs text-gray-600">
                            <p>Branch Code: {selectedBranch.code}</p>
                            <p>Address: {selectedBranch.address}</p>
                            <p>Contact: {selectedBranch.tel || selectedBranch.contact || '-'}</p>
                            <p>Manager: {selectedBranch.manager || '-'}</p>
                            <p>Status:
                              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${selectedBranchActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                                }`}>
                                {selectedBranchActive ? 'Active' : 'Inactive'}
                              </span>
                            </p>
                          </div>
                        )}
                        {localBranchesError && (
                          <div className="text-red-600 text-xs mt-1">{localBranchesError}</div>
                        )}
                        {!localBranchesError && localBranches.length === 0 && !localBranchesLoading && (
                          <div className="text-gray-600 text-xs mt-1">No branches found</div>
                        )}
                      </div>
                    </div>
                    {/* Manage All Branches Table - styled */}
                    <div className="mt-2 mb-2 p-2 bg-gray-50 rounded-lg border border-[#e0e4ed]">
                      <h4 className="text-md font-medium text-gray-900 mb-2">Manage All Branches</h4>
                      <div className="overflow-x-auto">
                        <Table className="standardized-table" style={{ tableLayout: 'fixed' }}>
                          <colgroup>
                            <col style={{ width: '80px' }} />
                            <col style={{ width: '180px' }} />
                            <col style={{ width: '120px' }} />
                            <col style={{ width: '120px' }} />
                            <col style={{ width: '120px' }} />
                            <col style={{ width: '120px' }} />
                            <col style={{ width: '120px' }} />
                            <col style={{ width: '140px' }} />
                          </colgroup>
                          <TableHead>
                            <TableRow>
                              <TableCell className="text-center text-xs font-semibold">ID</TableCell>
                              <TableCell className="text-center text-xs font-semibold">Name</TableCell>
                              <TableCell className="text-center text-xs font-semibold">Code</TableCell>
                              <TableCell className="text-center text-xs font-semibold">Address</TableCell>
                              <TableCell className="text-center text-xs font-semibold">Tel</TableCell>
                              <TableCell className="text-center text-xs font-semibold">Manager</TableCell>
                              <TableCell className="text-center text-xs font-semibold">Status</TableCell>
                              <TableCell className="text-center text-xs font-semibold">Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody className="bg-white divide-y divide-[#e0e4ed]">
                            {localBranches.length > 0 ? (
                              localBranches.map(branch => (
                                <TableRow key={branch.id} className="hover:bg-[#f8fbff] transition-colors duration-150">
                                  <TableCell className="px-2 py-2 whitespace-nowrap text-xs font-medium text-[#2d3748] text-center">
                                    {branch.id}
                                  </TableCell>
                                  <TableCell className="px-2 py-2 whitespace-nowrap text-xs text-[#2d3748] text-center">
                                    {branch.name}
                                  </TableCell>
                                  <TableCell className="px-2 py-2 whitespace-nowrap text-xs text-[#2d3748] text-center">
                                    {branch.code}
                                  </TableCell>
                                  <TableCell className="px-2 py-2 whitespace-nowrap text-xs text-[#2d3748] text-center">
                                    {branch.address}
                                  </TableCell>
                                  <TableCell className="px-2 py-2 whitespace-nowrap text-xs text-[#2d3748] text-center">
                                    {branch.tel || branch.contact || '-'}
                                  </TableCell>
                                  <TableCell className="px-2 py-2 whitespace-nowrap text-xs text-[#2d3748] text-center">
                                    {branch.manager || '-'}
                                  </TableCell>
                                  <TableCell className="px-2 py-2 whitespace-nowrap text-center">
                                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${normalizeActive(branch.active)
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800'
                                      }`}>
                                      {normalizeActive(branch.active) ? 'Active' : 'Inactive'}
                                    </span>
                                  </TableCell>
                                  <TableCell className="px-2 py-2 whitespace-nowrap text-center">
                                    <div className="flex justify-center items-center space-x-1">
                                      <button
                                        onClick={() => handleViewBranch(branch)}
                                        className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-[#f0f4ff] hover:text-[#0b27b1] transition-colors duration-200 shadow-sm"
                                        title="View Branch"
                                      >
                                        <MdVisibility className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleEditBranch(branch)}
                                        className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-[#f0f4ff] hover:text-[#0b27b1] transition-colors duration-200 shadow-sm"
                                        title="Edit Branch"
                                      >
                                        <MdOutlineEdit className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => setDeleteBranchId(branch.id)}
                                        className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-red-50 hover:text-red-600 transition-colors duration-200 shadow-sm"
                                        title="Delete Branch"
                                      >
                                        <MdDelete className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={8} className="text-center text-gray-600 py-4 text-xs">
                                  Add a new branch to get started
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    <div className="flex gap-4 pt-6">
                      <button
                        type="button"
                        className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-semibold shadow hover:bg-slate-300 transition-all duration-200"
                        onClick={() => {
                          if (storeInfo) {
                            setFormData({
                              name: storeInfo.name || '',
                              code: storeInfo.code || '',
                              email: storeInfo.email || '',
                              businessType: storeInfo.businessType || '',
                              logo: null,
                              logoPreview: storeInfo.logo || null,
                            });
                          }
                        }}
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-[#0b27b1] to-[#1e40af] text-white rounded-xl font-semibold shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-200/60 transition-all duration-300 transform hover:scale-105 active:scale-95"
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* User Management Tab */}
              {activeTab === 'users' && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/60 shadow-lg shadow-slate-200/20">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">User Management</h2>
                  {isSuperAdmin ? (
                    <UserManagement />
                  ) : isBranchAdmin ? (
                    userBranchId ? (
                      <BranchUserManagement branchId={userBranchId} currentUserRole={user.role} />
                    ) : (
                      <div className="text-center text-sm text-slate-500">
                        Branch ID not found for this account. Please log out and log in again.
                      </div>
                    )
                  ) : (
                    <div className="text-center text-sm text-slate-500">
                      You do not have access to user management.
                    </div>
                  )}
                </div>
              )}

              {/* Billing Tab */}
              {activeTab === 'billing' && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/60 shadow-lg shadow-slate-200/20">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Billing Settings</h2>
                  <BillSettings />
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/60 shadow-lg shadow-slate-200/20">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Notification Settings</h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-6 bg-slate-50/50 border border-slate-200 rounded-xl">
                      <div>
                        <h3 className="font-semibold text-slate-800">Low Stock Alerts</h3>
                        <p className="text-sm text-slate-600">Get notified when items are running low</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={lowStockAlerts}
                          onChange={(e) => setLowStockAlerts(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0b27b1]"></div>
                      </label>
                    </div>

                    <div className="p-6 bg-slate-50/50 border border-slate-200 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-800">Test Notification</h3>
                          <p className="text-sm text-slate-600">Send a test SMS to your registered phone number</p>
                        </div>
                        <button
                          onClick={handleSendTestNotification}
                          className="px-6 py-2 bg-white border border-[#0b27b1] text-[#0b27b1] rounded-xl font-semibold shadow hover:bg-slate-50 transition-all duration-200">
                          Send Test
                        </button>
                      </div>
                    </div>

                    {/* Expiry threshold setting */}
                    <div className="p-6 bg-slate-50/50 border border-slate-200 rounded-xl">
                      <h3 className="font-semibold text-slate-800 mb-4">Expiry Alert Settings</h3>
                      <div className="flex items-center gap-4">
                        <label className="block text-sm font-medium text-[#0b27b1]">
                          Show expiry alerts for medicines expiring in next
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={expiryDaysThreshold}
                          onChange={e => setExpiryDaysThreshold(Number(e.target.value))}
                          className="w-20 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/20 focus:border-[#0b27b1] transition-all duration-200"
                        />
                        <span className="text-sm font-medium text-[#0b27b1]">days</span>
                      </div>
                    </div>

                    {/* Low stock threshold setting */}
                    <div className="p-6 bg-slate-50/50 border border-slate-200 rounded-xl">
                      <h3 className="font-semibold text-slate-800 mb-4">Low Stock Alert Settings</h3>
                      <div className="flex items-center gap-4">
                        <label className="block text-sm font-medium text-[#0b27b1]">
                          Show low stock alerts for medicines with quantity less than
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={1000}
                          value={lowStockThreshold}
                          onChange={e => setLowStockThreshold(Number(e.target.value))}
                          className="w-20 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/20 focus:border-[#0b27b1] transition-all duration-200"
                        />
                        <span className="text-sm font-medium text-[#0b27b1]">units</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Backup Tab */}
              {activeTab === 'backup' && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/60 shadow-lg shadow-slate-200/20">
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Backup & Restore</h2>
                  <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-800">Last Backup</h3>
                        <p className="text-sm text-slate-600">July 5, 2023 at 11:59 PM</p>
                      </div>
                      <button
                        onClick={handleCreateBackup}
                        className="px-6 py-3 bg-gradient-to-r from-[#0b27b1] to-[#1e40af] text-white rounded-xl font-semibold shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-200/60 transition-all duration-300 transform hover:scale-105 active:scale-95">
                        Create Backup Now
                      </button>
                    </div>
                    <div className="mt-6">
                      <h3 className="font-semibold text-slate-800 mb-4">Restore from Backup</h3>
                      <div className="flex items-center space-x-4">
                        <input
                          type="file"
                          accept=".sql"
                          onChange={handleRestoreBackup}
                          className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/20 focus:border-[#0b27b1] transition-all duration-200
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-[#0b27b1] file:text-white
                        hover:file:bg-[#083093]"
                        />
                        <button className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-semibold shadow hover:bg-slate-300 transition-all duration-200">
                          Restore
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* View Branch Modal */}
        {viewBranch && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Branch Details</h3>
              <div className="space-y-2 text-sm">
                <div><strong>Name:</strong> {viewBranch.name}</div>
                <div><strong>Code:</strong> {viewBranch.code}</div>
                <div><strong>Address:</strong> {viewBranch.address}</div>
                <div><strong>Telephone:</strong> {viewBranch.tel || viewBranch.contact || '-'}</div>
                <div><strong>Manager:</strong> {viewBranch.manager || '-'}</div>
                <div>
                  <strong>Status:</strong>
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${normalizeActive(viewBranch.active) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {normalizeActive(viewBranch.active) ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold shadow hover:bg-gray-300 transition text-xs"
                  onClick={() => setViewBranch(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Branch Modal */}
        {editBranch && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Edit Branch</h3>
              <form onSubmit={handleEditBranchSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Branch Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editBranchForm.name}
                    onChange={e => setEditBranchForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Branch Code</label>
                  <input
                    type="text"
                    name="code"
                    value={editBranchForm.code}
                    onChange={e => setEditBranchForm(f => ({ ...f, code: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={editBranchForm.address}
                    onChange={e => setEditBranchForm(f => ({ ...f, address: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Telephone</label>
                  <input
                    type="text"
                    name="tel"
                    value={editBranchForm.tel}
                    onChange={e => setEditBranchForm(f => ({ ...f, tel: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Manager</label>
                  <input
                    type="text"
                    name="manager"
                    value={editBranchForm.manager}
                    onChange={e => setEditBranchForm(f => ({ ...f, manager: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    required
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    name="active"
                    checked={editBranchForm.active}
                    onChange={e => setEditBranchForm(f => ({ ...f, active: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label className="block text-xs font-medium text-gray-700">Active Branch</label>
                </div>
                {editBranchError && (
                  <div className="text-red-600 text-xs mt-2">{editBranchError}</div>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold shadow hover:bg-gray-300 transition text-xs"
                    onClick={() => setEditBranch(null)}
                    disabled={editBranchSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#0f0092] text-white rounded-lg font-semibold shadow hover:bg-[#07013d] transition text-xs"
                    disabled={editBranchSubmitting}
                  >
                    {editBranchSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Branch Modal */}
        {deleteBranchId && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
              <h3 className="text-lg font-semibold mb-4 text-red-600">Delete Branch</h3>
              <p className="text-sm mb-4">Are you sure you want to delete this branch? This action cannot be undone.</p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold shadow hover:bg-gray-300 transition text-xs"
                  onClick={() => setDeleteBranchId(null)}
                >
                  Cancel
                </button>
                <button
                  className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold shadow hover:bg-red-700 transition text-xs"
                  onClick={handleDeleteBranch}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
