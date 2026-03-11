import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search } from '@mui/icons-material';
import { Box, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { Add } from '@mui/icons-material';
import api from '../utils/axios';
import { MdVisibility, MdOutlineEdit, MdOutlineDelete } from 'react-icons/md';
import PharmacyPayInTerms from '../components/PharmacyPayInTerms';
import PharmacyReturnsRefunds from '../components/PharmacyReturnsRefunds';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dobFilter, setDobFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    address: '',
    dob: '',
    email: '',
    whatsapp: false,
    viber: false,
    paid: '',
    due: '',
    credit: '',
    status: 'Active'
  });
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewCustomer, setViewCustomer] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [allPurchaseHistory, setAllPurchaseHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('customers'); // add new tabs
  const [allHistorySearch, setAllHistorySearch] = useState('');
  const [allHistoryStatus, setAllHistoryStatus] = useState('all');
  const [allHistoryDate, setAllHistoryDate] = useState('');
  const [showPharmacyTermsForm, setShowPharmacyTermsForm] = useState(false);
  const [showPharmacyRefundForm, setShowPharmacyRefundForm] = useState(false);

  // Permission state
  const [canView, setCanView] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  // Permission logic: get current user's role permissions
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const normalizedRole = String(user?.role || '').toLowerCase().replace(/[\s-]+/g, '_');
  const isSuperAdmin = normalizedRole === 'super_admin' || normalizedRole === 'superadmin' || user?.username === 'superadmin' || user?.is_admin === true || user?.is_admin === 1;
  const [rolePermissions, setRolePermissions] = useState(() => ({
    can_view: isSuperAdmin,
    can_edit: isSuperAdmin,
    can_delete: isSuperAdmin
  }));
  const [roles, setRoles] = useState([]);
  useEffect(() => {
    if (isSuperAdmin) {
      setRolePermissions({ can_view: true, can_edit: true, can_delete: true });
      return;
    }
    api.get('/user-management/roles').then(res => {
      const allRoles = res.data.data || [];
      setRoles(allRoles);
      const role = allRoles.find(r => String(r.id) === String(user.role_id));
      if (role) {
        setRolePermissions({
          can_view: !!role.can_view || !!role.is_admin,
          can_edit: !!role.can_edit || !!role.is_admin,
          can_delete: !!role.can_delete || !!role.is_admin
        });
      }
    });
  }, [user.role_id, isSuperAdmin]);

  // Fetch all customers
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      // Do NOT set branch_id here, axios interceptor will inject it from localStorage
      const res = await api.get('/customers');
      const data = res.data.data || res.data;
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      setCustomers([]);
    }
  };

  // Fetch purchase history for selected customer (ensure correct branch_id and customerId)
  const fetchPurchaseHistory = async (customerId) => {
    try {
      if (!customerId) {
        setPurchaseHistory([]);
        return;
      }
      // Do NOT set branch_id here, axios interceptor will inject it from localStorage
      const res = await api.get(`/customers/${customerId}/purchases`);
      // Debug: log response
      console.log('[fetchPurchaseHistory] Response:', res.data);
      setPurchaseHistory(res.data.data || []);
    } catch (err) {
      setPurchaseHistory([]);
    }
  };

  // Fetch all purchase history for all customers in branch
  const fetchAllPurchaseHistory = async () => {
    try {
      const salesRes = await api.get(`/sales-details`);
      const sales = Array.isArray(salesRes.data) ? salesRes.data : [];
      // Debug: log sales and items structure
      console.log('[CUSTOMERS DEBUG] sales:', sales);
      sales.forEach(sale => {
        console.log('[CUSTOMERS DEBUG] sale.items:', sale.items);
      });
      const mappedSales = sales.map(sale => ({
        id: sale.id,
        customer_id: sale.customer_id || '', // If available
        customer_name: sale.customer,
        customer_phone: sale.customer_phone || '',
        date: sale.date,
        status: 'completed',
        total: sale.total,
        paid_amount: sale.total,
        future_credit: 0,
        items: Array.isArray(sale.items) ? sale.items : []
      }));
      setAllPurchaseHistory(mappedSales);
    } catch (err) {
      setAllPurchaseHistory([]);
    }
  };

  // Open edit modal and prefill form
  const handleEditCustomer = (customer) => {
    setSelectedCustomer(customer);
    setEditForm({
      name: customer.name || '',
      phone: customer.phone || '',
      address: customer.address || '',
      dob: customer.dob
        ? typeof customer.dob === 'string'
          ? customer.dob.slice(0, 10)
          : customer.dob instanceof Date
            ? customer.dob.toISOString().slice(0, 10)
            : ''
        : '',
      email: customer.email || '',
      whatsapp: !!customer.whatsapp,
      viber: !!customer.viber,
      paid: customer.paid || '',
      due: customer.due || '',
      credit: customer.credit || '',
      status: customer.status || 'Active'
    });
    fetchPurchaseHistory(customer.id); // <-- fetch before showing modal/tab
    setShowEditModal(true);
  };

  // Open purchase history tab and fetch history
  const handleShowHistory = (customer) => {
    setSelectedCustomer(customer);
    setActiveTab('history');
    fetchPurchaseHistory(customer.id);
  };

  // When switching to history tab, fetch purchase history if not already loaded
  useEffect(() => {
    if (activeTab === 'history' && selectedCustomer) {
      fetchPurchaseHistory(selectedCustomer.id);
    }
    // eslint-disable-next-line
  }, [activeTab, selectedCustomer]);

  // Save edited customer details
  const handleSaveCustomer = async () => {
    try {
      // Explicitly include branch_id in payload
      const branch_id = localStorage.getItem('branch_id');
      await api.put(`/customers/${selectedCustomer.id}`, {
        ...editForm,
        whatsapp: !!editForm.whatsapp,
        viber: !!editForm.viber,
        paid: editForm.paid ? Number(editForm.paid) : 0,
        due: editForm.due ? Number(editForm.due) : 0,
        credit: editForm.credit ? Number(editForm.credit) : 0,
        branch_id
      });
      setShowEditModal(false);
      fetchCustomers();
    } catch (err) {
      // Handle error
    }
  };

  // Handle Add New button click
  const handleAddNew = () => {
    setSelectedCustomer(null);
    setEditForm({
      name: '',
      phone: '',
      address: '',
      dob: '',
      email: '',
      whatsapp: false,
      viber: false,
      paid: '',
      due: '',
      credit: '',
      status: 'Active'
    });
    setShowEditModal(true);
  };

  // Add new customer
  const handleAddCustomer = async () => {
    try {
      // Explicitly include branch_id in payload
      const branch_id = localStorage.getItem('branch_id');
      await api.post('/customers', {
        ...editForm,
        whatsapp: !!editForm.whatsapp,
        viber: !!editForm.viber,
        paid: editForm.paid ? Number(editForm.paid) : 0,
        due: editForm.due ? Number(editForm.due) : 0,
        credit: editForm.credit ? Number(editForm.credit) : 0,
        branch_id
      });
      setShowEditModal(false);
      fetchCustomers();
    } catch (err) {
      // Handle error
      console.error('Error adding customer:', err);
    }
  };

  // View customer details (fetch latest from backend)
  const handleViewCustomer = async (customer) => {
    try {
      const res = await api.get(`/customers/${customer.id}`);
      // Use res.data.data for full details
      setViewCustomer(res.data.data || customer);
      setShowViewModal(true);
      // Optionally fetch purchase history if needed
      // const historyRes = await api.get(`/customers/${customer.id}/purchases`);
      // setPurchaseHistory(historyRes.data.data || []);
    } catch {
      setViewCustomer(customer);
      setShowViewModal(true);
    }
  };

  // Edit from view popup
  const handleEditFromView = () => {
    setShowViewModal(false);
    setSelectedCustomer(viewCustomer);
    setEditForm({
      name: viewCustomer.name || '',
      phone: viewCustomer.phone || '',
      address: viewCustomer.address || '',
      dob: viewCustomer.dob
        ? typeof viewCustomer.dob === 'string'
          ? viewCustomer.dob.slice(0, 10)
          : viewCustomer.dob instanceof Date
            ? viewCustomer.dob.toISOString().slice(0, 10)
            : ''
        : '',
      email: viewCustomer.email || '',
      whatsapp: !!viewCustomer.whatsapp,
      viber: !!viewCustomer.viber,
      paid: viewCustomer.paid || '',
      due: viewCustomer.due || '',
      credit: viewCustomer.credit || '',
      status: viewCustomer.status || 'Active'
    });
    setShowEditModal(true);
  };

  // Delete from view popup
  const handleDeleteFromView = async () => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await api.delete(`/customers/${viewCustomer.id}`);
        setShowViewModal(false);
        fetchCustomers();
      } catch {
        alert('Failed to delete customer');
      }
    }
  };

  // Delete customer
  const handleDeleteCustomer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await api.delete(`/customers/${id}`);
      fetchCustomers();
    } catch (err) {
      alert('Failed to delete customer');
    }
  };

  // Filter customers by search term and filters
  const filteredCustomers = customers.filter(c => {
    const matchesSearch =
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (c.status && c.status.toLowerCase() === statusFilter);
    const matchesDob = !dobFilter || (c.dob && c.dob.slice(0, 10) === dobFilter);
    const matchesEmail = !emailFilter || (c.email && c.email.toLowerCase().includes(emailFilter.toLowerCase()));
    return matchesSearch && matchesStatus && matchesDob && matchesEmail;
  });

  // Filter for All Purchase History tab
  const filteredAllPurchaseHistory = allPurchaseHistory.filter(order => {
    const matchesSearch =
      order.customer_name?.toLowerCase().includes(allHistorySearch.toLowerCase()) ||
      order.customer_phone?.toLowerCase().includes(allHistorySearch.toLowerCase());
    const matchesStatus =
      allHistoryStatus === 'all' || order.status === allHistoryStatus;
    const matchesDate =
      !allHistoryDate || (order.date && new Date(order.date).toISOString().slice(0, 10) === allHistoryDate);
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Tab UI
  return (
    <Box sx={{ minHeight: '100%', py: 3 }}>
      <div className="page-container">
        {/* Tabs for Customers / Purchase History / Pharmacy Pay in Terms / Pharmacy Returns & Refunds */}
        <div className="mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 border border-slate-200/60 shadow-lg shadow-slate-200/20">
            <div className="flex justify-between items-center">
              <nav className="flex space-x-2">
                {[
                  { id: 'customers', name: 'Customers' },
                  { id: 'history', name: 'All Purchase History' },
                  { id: 'pharmacyTerms', name: 'Pharmacy Pay in Terms' },
                  { id: 'pharmacyRefunds', name: 'Pharmacy Returns & Refunds' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      if (tab.id === 'history') {
                        setActiveTab('history');
                        fetchAllPurchaseHistory();
                      } else {
                        setActiveTab(tab.id);
                      }
                    }}
                    className={`relative px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === tab.id
                        ? 'bg-gradient-to-r from-[#0b27b1] to-[#1e40af] text-white shadow-lg shadow-blue-200/50 transform scale-105'
                        : 'text-slate-600 hover:text-[#0b27b1] hover:bg-slate-50/80'
                      }`}
                  >
                    <span className="relative z-10">{tab.name}</span>
                    {activeTab === tab.id && (
                      <div className="absolute inset-0 bg-gradient-to-r from-[#0b27b1] to-[#1e40af] rounded-xl blur-sm opacity-30"></div>
                    )}
                  </button>
                ))}
              </nav>
              {/* Add Button for each tab, styled and positioned as in MedicineMaster */}
              {activeTab === 'customers' && (
                <button
                  onClick={() => { setShowEditModal(true); setSelectedCustomer(null); setEditForm({ name: '', phone: '', address: '', dob: '', email: '', whatsapp: false, viber: false, paid: '', due: '', credit: '', status: 'Active' }); }}
                  className="group relative px-6 py-3 bg-gradient-to-r from-[#0b27b1] to-[#1e40af] text-white rounded-xl font-semibold shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-200/60 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center ml-4"
                >
                  <span className="text-lg mr-2">+</span>
                  <span>Add Customer</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#083093] to-[#0b27b1] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                </button>
              )}
              {activeTab === 'pharmacyTerms' && (
                <button
                  onClick={() => setShowPharmacyTermsForm(true)}
                  className="group relative px-6 py-3 bg-gradient-to-r from-[#0b27b1] to-[#1e40af] text-white rounded-xl font-semibold shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-200/60 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center ml-4"
                >
                  <span className="text-lg mr-2">+</span>
                  <span>Add Pay in Terms</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#083093] to-[#0b27b1] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                </button>
              )}
              {activeTab === 'pharmacyRefunds' && (
                <button
                  onClick={() => setShowPharmacyRefundForm(true)}
                  className="group relative px-6 py-3 bg-gradient-to-r from-[#0b27b1] to-[#1e40af] text-white rounded-xl font-semibold shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-200/60 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center ml-4"
                >
                  <span className="text-lg mr-2">+</span>
                  <span>Add Refund</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#083093] to-[#0b27b1] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Customers Table */}
        {activeTab === 'customers' && (
          <>
            <div className="flex flex-col gap-4 mb-6">

              {/* Card-style search/filter section */}
              <div className="bg-white rounded-lg p-3 shadow-[0_2px_6px_rgba(0,0,0,0.1)]">
                <div className="flex flex-wrap items-end gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium text-[#0b27b1] mb-1">Search</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search customers..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4" style={{ color: '#0b27b1' }} />
                      </div>
                    </div>
                  </div>
                  <div className="min-w-[140px]">
                    <label className="block text-xs font-medium text-[#0b27b1] mb-1">Status</label>
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg"
                    >
                      <option value="all">All</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                  <div className="min-w-[140px]">
                    <label className="block text-xs font-medium text-[#0b27b1] mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={dobFilter}
                      onChange={e => setDobFilter(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg"
                    />
                  </div>
                  <div className="min-w-[180px]">
                    <label className="block text-xs font-medium text-[#0b27b1] mb-1">Email</label>
                    <input
                      type="text"
                      placeholder="Filter by email..."
                      value={emailFilter}
                      onChange={e => setEmailFilter(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                        setDobFilter('');
                        setEmailFilter('');
                      }}
                      className="px-3 py-1.5 bg-white text-[#5a6e9a] rounded-lg text-sm font-medium border border-[#e0e4ed] shadow-[0_2px_4px_rgba(0,0,0,0.05)] hover:bg-gray-50 transition-all duration-200 active:translate-y-px"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {/* Customers Table styled like Orders Table */}
            <div className="overflow-x-auto rounded-lg shadow-[0_2px_6px_rgba(0,0,0,0.1)] bg-white">
              <table className="standardized-table" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '180px' }} />
                  <col style={{ width: '140px' }} />
                  <col style={{ width: '200px' }} />
                  <col style={{ width: '120px' }} />
                  <col style={{ width: '220px' }} />
                  <col style={{ width: '140px' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Date of Birth</th>
                    <th>Email</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#e0e4ed]">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-[#f8fbff] transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#2d3748]">{customer.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2d3748]">{customer.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2d3748]">{customer.address}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2d3748]">{customer.dob}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2d3748]">{customer.email}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-center text-sm">
                          <div className="flex justify-center items-center space-x-1">
                            {rolePermissions.can_view && (
                              <button
                                onClick={() => handleViewCustomer(customer)}
                                className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-[#f0f4ff] hover:text-[#0b27b1] transition-colors duration-200 shadow-sm"
                                title="View Customer"
                              >
                                <MdVisibility className="w-4 h-4" />
                              </button>
                            )}
                            {rolePermissions.can_edit && (
                              <button
                                onClick={() => handleEditCustomer(customer)}
                                className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-[#f0f4ff] hover:text-[#0b27b1] transition-colors duration-200 shadow-sm"
                                title="Edit Customer"
                              >
                                <MdOutlineEdit className="w-4 h-4" />
                              </button>
                            )}
                            {rolePermissions.can_delete && (
                              <button
                                onClick={() => handleDeleteCustomer(customer.id)}
                                className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-red-50 hover:text-red-600 transition-colors duration-200 shadow-sm"
                                title="Delete Customer"
                              >
                                <MdOutlineDelete className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-[#5a6e9a]">
                        No customers found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
        {/* All Purchase History Tab */}
        {activeTab === 'history' && (
          <Box>

            {/* Card-style search/filter section for All Purchase History */}
            <div className="bg-white rounded-lg p-3 shadow-[0_2px_6px_rgba(0,0,0,0.1)] mb-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-[#0b27b1] mb-1">Search</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by name or phone..."
                      value={allHistorySearch}
                      onChange={e => setAllHistorySearch(e.target.value)}
                      className="w-full pl-10 pr-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4" style={{ color: '#0b27b1' }} />
                    </div>
                  </div>
                </div>
                <div className="min-w-[120px]">
                  <label className="block text-xs font-medium text-[#0b27b1] mb-1">Status</label>
                  <select
                    value={allHistoryStatus}
                    onChange={e => setAllHistoryStatus(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="inprogress">In Progress</option>
                    <option value="active">Active</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="removed">Removed</option>
                  </select>
                </div>
                <div className="min-w-[140px]">
                  <label className="block text-xs font-medium text-[#0b27b1] mb-1">Date</label>
                  <input
                    type="date"
                    value={allHistoryDate}
                    onChange={e => setAllHistoryDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
                  />
                </div>
              </div>
            </div>
            <Box display="flex" flexWrap="wrap" gap={3}>
              {/* Group purchases by customer id/name/phone */}
              {(() => {
                // Group orders by customer id (or phone if id not present)
                const customerMap = {};
                filteredAllPurchaseHistory.forEach(purchase => {
                  const key = purchase.customer_id || purchase.customer_phone || purchase.customer_name || 'unknown';
                  if (!customerMap[key]) customerMap[key] = [];
                  customerMap[key].push(purchase);
                });
                const customerCards = Object.entries(customerMap);
                if (customerCards.length === 0) {
                  return (
                    <Box width="100%" textAlign="center" py={4} color="#5a6e9a">
                      No purchase history
                    </Box>
                  );
                }
                // Card for each customer
                function CustomerCard({ customer, purchases }) {
                  const [showPurchases, setShowPurchases] = useState(false);
                  return (
                    <Paper
                      elevation={4}
                      sx={{
                        minWidth: 320,
                        maxWidth: 400,
                        p: 2.5,
                        mb: 2,
                        borderRadius: 3,
                        boxShadow: '0 4px 16px rgba(11,39,177,0.08)',
                        background: '#f8fbfd',
                        border: '1px solid #e0e4ed',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5
                      }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Typography variant="subtitle2" fontWeight={700} color="#0b27b1">
                          {customer.customer_name || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="#0492C2">
                          {customer.customer_phone ? `📞 ${customer.customer_phone}` : ''}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        <b>Total Purchases:</b> {purchases.length}
                      </Typography>
                      <Box mt={1} mb={1}>
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{ mb: 1, borderRadius: 2, color: "#0b27b1", borderColor: "#0b27b1" }}
                          onClick={() => setShowPurchases(v => !v)}
                        >
                          {showPurchases ? "Hide Purchases" : "View Purchases"}
                        </Button>
                        {showPurchases && (
                          <Box sx={{
                            display: 'flex',
                            overflowX: 'auto',
                            gap: 2,
                            py: 1,
                            px: 1,
                            background: '#f8fbfd',
                            borderRadius: 2,
                            border: '1px solid #e0e4ed'
                          }}>
                            {purchases.map(purchase => (
                              <Paper
                                key={purchase.id}
                                elevation={2}
                                sx={{
                                  minWidth: 220,
                                  maxWidth: 260,
                                  p: 2,
                                  borderRadius: 2,
                                  boxShadow: '0 2px 8px rgba(11,39,177,0.05)',
                                  background: '#fff',
                                  border: '1px solid #e0e4ed',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 0.5,
                                  mr: 2
                                }}
                              >
                                <Typography variant="subtitle2" color="#0b27b1" fontWeight={700}>
                                  Purchase #{purchase.id}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  <b>Date:</b> {purchase.date ? new Date(purchase.date).toLocaleDateString() : '-'}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  <b>Status:</b> <span style={{
                                    color: purchase.status === 'completed' ? '#0b27b1' : purchase.status === 'pending' ? '#5a6e9a' : '#2d3748',
                                    fontWeight: 600
                                  }}>{purchase.status}</span>
                                </Typography>
                                <Typography variant="body2" color="#03648a">
                                  <b>Total:</b> {purchase.total !== undefined ? `₹${Number(purchase.total).toFixed(2)}` : '-'}
                                </Typography>
                                <Typography variant="body2" color="#03648a">
                                  <b>Paid:</b> {purchase.paid_amount !== undefined ? `₹${Number(purchase.paid_amount).toFixed(2)}` : '-'}
                                </Typography>
                                <Typography variant="body2" color="#03648a">
                                  <b>Credit:</b> {purchase.future_credit !== undefined ? `₹${Number(purchase.future_credit).toFixed(2)}` : '-'}
                                </Typography>
                                {/* Show purchased items and quantities */}
                                <Typography variant="body2" color="#03648a" sx={{ mt: 1 }}>
                                  <b>Items:</b>
                                </Typography>
                                <ul style={{ margin: 0, paddingLeft: 16 }}>
                                  {Array.isArray(purchase.items) && purchase.items.length > 0 ? (
                                    purchase.items.map((item, idx) => (
                                      <li key={idx}>
                                        {item.name} <b>x{item.quantity}</b>
                                      </li>
                                    ))
                                  ) : (
                                    <li>-</li>
                                  )}
                                </ul>
                              </Paper>
                            ))}
                          </Box>
                        )}
                      </Box>
                    </Paper>
                  );
                }
                return customerCards.map(([key, purchases]) => {
                  const customer = purchases[0];
                  return <CustomerCard key={key} customer={customer} purchases={purchases} />;
                });
              })()}
            </Box>
          </Box>
        )}
        {/* Pharmacy Pay in Terms Tab */}
        {activeTab === 'pharmacyTerms' && (
          <PharmacyPayInTerms showAddForm={showPharmacyTermsForm} setShowAddForm={setShowPharmacyTermsForm} />
        )}
        {/* Pharmacy Returns & Refunds Tab */}
        {activeTab === 'pharmacyRefunds' && (
          <PharmacyReturnsRefunds showAddForm={showPharmacyRefundForm} setShowAddForm={setShowPharmacyRefundForm} />
        )}
        {/* Edit/Add Customer Modal */}
        <Dialog open={showEditModal} onClose={() => setShowEditModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{selectedCustomer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              value={editForm.name}
              onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
              required
            />
            <TextField
              label="Phone"
              value={editForm.phone}
              onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
              required
            />
            <Box display="flex" gap={2}>
              <label>
                <input
                  type="checkbox"
                  checked={editForm.whatsapp}
                  onChange={e => setEditForm(f => ({ ...f, whatsapp: e.target.checked }))}
                /> WhatsApp
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={editForm.viber}
                  onChange={e => setEditForm(f => ({ ...f, viber: e.target.checked }))}
                /> Viber
              </label>
            </Box>
            <TextField
              label="Address"
              value={editForm.address}
              onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
            />
            <TextField
              label="Date of Birth"
              type="date"
              value={editForm.dob}
              onChange={e => setEditForm(f => ({ ...f, dob: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Email"
              value={editForm.email}
              onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
              type="email"
            />
            <TextField
              label="Paid"
              type="number"
              value={editForm.paid}
              onChange={e => setEditForm(f => ({ ...f, paid: e.target.value }))}
            />
            <TextField
              label="Due"
              type="number"
              value={editForm.due}
              onChange={e => setEditForm(f => ({ ...f, due: e.target.value }))}
            />
            <TextField
              label="Credit"
              type="number"
              value={editForm.credit}
              onChange={e => setEditForm(f => ({ ...f, credit: e.target.value }))}
            />
            <TextField
              label="Status"
              select
              SelectProps={{ native: true }}
              value={editForm.status}
              onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Banned">Banned</option>
            </TextField>
            {selectedCustomer && (
              <div className="mt-4">
                <Typography variant="subtitle1" color="#03648a" fontWeight={600}>
                  Purchase History
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Order ID</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Subtotal</TableCell>
                      <TableCell>Discount</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Paid</TableCell>
                      <TableCell>Credit</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {purchaseHistory.length > 0 ? (
                      purchaseHistory.map(order => (
                        <TableRow key={order.id}>
                          <TableCell>{order.id}</TableCell>
                          <TableCell>{order.date ? new Date(order.date).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>{order.status}</TableCell>
                          <TableCell>
                            {order.subtotal !== undefined ? `₹${Number(order.subtotal).toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell>
                            {order.discount
                              ? (() => {
                                let discountVal = '';
                                if (typeof order.discount === 'string') {
                                  try {
                                    const d = JSON.parse(order.discount);
                                    discountVal = d.amount !== undefined ? `₹${Number(d.amount).toFixed(2)}` : '';
                                  } catch {
                                    discountVal = order.discount;
                                  }
                                } else if (order.discount?.amount !== undefined) {
                                  discountVal = `₹${Number(order.discount.amount).toFixed(2)}`;
                                }
                                return discountVal || '-';
                              })()
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            {order.total !== undefined ? `₹${Number(order.total).toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell>
                            {order.paid_amount !== undefined ? `₹${Number(order.paid_amount).toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell>
                            {order.future_credit !== undefined ? `₹${Number(order.future_credit).toFixed(2)}` : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          No purchase history
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button
              onClick={selectedCustomer ? handleSaveCustomer : handleAddCustomer}
              variant="contained"
              color="primary"
            >
              {selectedCustomer ? 'Save Changes' : 'Add Customer'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Customer Modal */}
        <Dialog
          open={showViewModal}
          onClose={() => setShowViewModal(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Customer Details</DialogTitle>
          <DialogContent>
            {viewCustomer && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {viewCustomer.name}
                </Typography>
                <Typography variant="body1">
                  <strong>Phone:</strong> {viewCustomer.phone || 'N/A'}
                  {viewCustomer.whatsapp && <span style={{ marginLeft: 8, color: '#22c55e' }}>WhatsApp</span>}
                  {viewCustomer.viber && <span style={{ marginLeft: 8, color: '#0492C2' }}>Viber</span>}
                </Typography>
                <Typography variant="body1">
                  <strong>Email:</strong> {viewCustomer.email || 'N/A'}
                </Typography>
                <Typography variant="body1">
                  <strong>Address:</strong> {viewCustomer.address || 'N/A'}
                </Typography>
                <Typography variant="body1">
                  <strong>Date of Birth:</strong> {viewCustomer.dob || 'N/A'}
                </Typography>
                <Typography variant="body1">
                  <strong>Paid:</strong> {viewCustomer.paid ? `LKR ${Number(viewCustomer.paid).toLocaleString()}` : '-'}
                </Typography>
                <Typography variant="body1">
                  <strong>Due:</strong> {viewCustomer.due ? `LKR ${Number(viewCustomer.due).toLocaleString()}` : '-'}
                </Typography>
                <Typography variant="body1">
                  <strong>Credit:</strong> {viewCustomer.credit ? `LKR ${Number(viewCustomer.credit).toLocaleString()}` : '-'}
                </Typography>
                <Typography variant="body1">
                  <strong>Status:</strong> {viewCustomer.status}
                </Typography>
                <Typography variant="body1">
                  <strong>Created At:</strong> {viewCustomer.created_at ? new Date(viewCustomer.created_at).toLocaleString() : '-'}
                </Typography>
                {/* Purchases */}
                <Typography variant="body1" sx={{ mt: 2 }}>
                  <strong>Purchases:</strong>
                </Typography>
                <ul>
                  {Array.isArray(viewCustomer.purchases) && viewCustomer.purchases.length > 0 ? (
                    viewCustomer.purchases.map((p, i) => (
                      <li key={i}>{p.date} - {p.item} x{p.quantity}</li>
                    ))
                  ) : (
                    <li>-</li>
                  )}
                </ul>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleEditFromView} color="primary">Edit</Button>
            <Button onClick={handleDeleteFromView} color="error">Delete</Button>
            <Button onClick={() => setShowViewModal(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </div>
    </Box>
  );
}
