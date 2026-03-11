import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Chip, MenuItem, Select, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Autocomplete } from '@mui/material';
import { Payment, CreditCard, AccountBalance, Money } from '@mui/icons-material';
import { MdVisibility, MdOutlineEdit, MdOutlineDelete } from 'react-icons/md';
import api from '../utils/axios';

const statusColors = {
  Paid: 'success',
  Pending: 'warning',
  Failed: 'error',
  Cancelled: 'default',
  Processing: 'info'
};

const methodIcons = {
  cash: <Money sx={{ color: '#22c55e', mr: 0.5 }} />,
  card: <CreditCard sx={{ color: '#0b27b1', mr: 0.5 }} />,
  bank: <AccountBalance sx={{ color: '#0492C2', mr: 0.5 }} />,
  other: <Payment sx={{ color: '#5a6e9a', mr: 0.5 }} />
};

export default function SupplierPayments() {
  const [methodFilter, setMethodFilter] = useState('all');
  // Listen for custom event to open Add Payment modal from parent tab header
  useEffect(() => {
    const handler = () => setShowAddPaymentModal(true);
    window.addEventListener('openAddSupplierPaymentModal', handler);
    return () => window.removeEventListener('openAddSupplierPaymentModal', handler);
  }, []);
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [addPaymentForm, setAddPaymentForm] = useState({
    supplier_name: '',
    supplier_phone: '',
    amount: '',
    total_due: '',
    balance: '',
    method: '',
    date: '',
    status: 'Pending'
  });
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewPayment, setViewPayment] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPaymentForm, setEditPaymentForm] = useState({
    supplier_name: '',
    supplier_phone: '',
    amount: '',
    total_due: '',
    balance: '',
    method: '',
    date: '',
    status: 'Pending'
  });
  const [editPaymentId, setEditPaymentId] = useState(null);
  const [suppliers, setSuppliers] = useState([]);

  const fetchSuppliers = async () => {
    try {
      // branch_id is automatically added by axios interceptor
      const response = await api.get('/suppliers');
      const supplierData = Array.isArray(response.data)
        ? response.data
        : (Array.isArray(response.data?.data) ? response.data.data : []);
      setSuppliers(supplierData);
    } catch (err) {
      console.error('Failed to fetch suppliers', err);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchSuppliers();
  }, []);

  // Automate balance for Add Form
  useEffect(() => {
    const amount = parseFloat(addPaymentForm.amount) || 0;
    const totalDue = parseFloat(addPaymentForm.total_due) || 0;
    setAddPaymentForm(prev => ({ ...prev, balance: (totalDue - amount).toFixed(2) }));
  }, [addPaymentForm.amount, addPaymentForm.total_due]);

  // Automate balance for Edit Form
  useEffect(() => {
    const amount = parseFloat(editPaymentForm.amount) || 0;
    const totalDue = parseFloat(editPaymentForm.total_due) || 0;
    setEditPaymentForm(prev => ({ ...prev, balance: (totalDue - amount).toFixed(2) }));
  }, [editPaymentForm.amount, editPaymentForm.total_due]);

  const fetchPayments = async () => {
    try {
      const res = await api.get('/suppliers/payments');
      const paymentData = Array.isArray(res.data)
        ? res.data
        : (Array.isArray(res.data?.data) ? res.data.data : []);
      setPayments(paymentData);
    } catch {
      setPayments([]);
    }
  };

  // Summary calculations (removed summary card UI)

  // Filtering
  const filtered = payments.filter(p => {
    const matchesSearch =
      p.supplier_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.supplier_phone?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || (p.status && p.status.toLowerCase() === statusFilter.toLowerCase());
    const matchesMethod = methodFilter === 'all' || (p.method && p.method.toLowerCase() === methodFilter);
    const matchesDate =
      (!dateRange.start || new Date(p.date) >= new Date(dateRange.start)) &&
      (!dateRange.end || new Date(p.date) <= new Date(dateRange.end));
    return matchesSearch && matchesStatus && matchesMethod && matchesDate;
  });

  const handleAddPayment = async () => {
    try {
      if (!addPaymentForm.supplier_name?.trim()) {
        alert('Supplier name is required');
        return;
      }
      if (addPaymentForm.amount === '') {
        alert('Amount is required');
        return;
      }
      if (!addPaymentForm.method?.trim()) {
        alert('Payment method is required');
        return;
      }
      if (!addPaymentForm.date) {
        alert('Date is required');
        return;
      }

      const branch_id = Number(localStorage.getItem('branch_id'));
      const amount = Number(addPaymentForm.amount) || 0;
      const totalDue = Number(addPaymentForm.total_due) || 0;
      const payload = {
        ...addPaymentForm,
        amount,
        total_due: totalDue,
        balance: Number(addPaymentForm.balance) || (totalDue - amount),
        branch_id
      };

      await api.post('/suppliers/payments', payload);
      setShowAddPaymentModal(false);
      setAddPaymentForm({
        supplier_name: '',
        supplier_phone: '',
        amount: '',
        total_due: '',
        balance: '',
        method: '',
        date: '',
        status: 'Pending'
      });
      fetchPayments();
    } catch (err) {
      alert('Failed to add payment');
    }
  };

  const handleViewPayment = (payment) => {
    setViewPayment(payment);
    setShowViewModal(true);
  };

  const handleEditPayment = (payment) => {
    setEditPaymentId(payment.id);
    setEditPaymentForm({
      supplier_name: payment.supplier_name || '',
      supplier_phone: payment.supplier_phone || '',
      amount: payment.amount || '',
      total_due: payment.total_due || '',
      balance: payment.balance || '',
      method: payment.method || '',
      date: payment.date ? payment.date.slice(0, 10) : '',
      status: payment.status || 'Pending'
    });
    setShowEditModal(true);
  };

  const handleSaveEditPayment = async () => {
    try {
      if (!editPaymentForm.supplier_name?.trim()) {
        alert('Supplier name is required');
        return;
      }
      if (editPaymentForm.amount === '') {
        alert('Amount is required');
        return;
      }
      if (!editPaymentForm.method?.trim()) {
        alert('Payment method is required');
        return;
      }
      if (!editPaymentForm.date) {
        alert('Date is required');
        return;
      }

      const branch_id = Number(localStorage.getItem('branch_id'));
      const amount = Number(editPaymentForm.amount) || 0;
      const totalDue = Number(editPaymentForm.total_due) || 0;
      const payload = {
        ...editPaymentForm,
        amount,
        total_due: totalDue,
        balance: Number(editPaymentForm.balance) || (totalDue - amount),
        branch_id
      };

      await api.put(`/suppliers/payments/${editPaymentId}`, payload);
      setShowEditModal(false);
      setEditPaymentId(null);
      fetchPayments();
    } catch (err) {
      alert('Failed to update payment');
    }
  };

  const handleDeletePayment = async (id) => {
    if (!window.confirm('Delete this payment?')) return;
    try {
      await api.delete(`/suppliers/payments/${id}`);
      fetchPayments();
    } catch {
      alert('Failed to delete payment');
    }
  };

  // Permission logic: get current user's role permissions
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [rolePermissions, setRolePermissions] = useState({ can_view: false, can_edit: false, can_delete: false });
  const [roles, setRoles] = useState([]);
  useEffect(() => {
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
  }, [user.role_id]);

  return (
    <div>
      {/* The Add Payment button is now expected to be rendered in the parent tab header, not here. */}
      <h2 className="text-xl font-bold text-[#0b27b1] mb-4">Supplier Payments</h2>
      {/* Filters - styled like MedicineMaster */}
      <div className="bg-white rounded-lg p-3 shadow-[0_2px_6px_rgba(0,0,0,0.1)] mb-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-[#0b27b1] mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by supplier name or phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4" style={{ color: '#0b27b1' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              </div>
            </div>
          </div>
          <div className="min-w-[140px]">
            <label className="block text-xs font-medium text-[#0b27b1] mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
            >
              <option value="all">All</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Processing">Processing</option>
            </select>
          </div>
          <div className="min-w-[140px]">
            <label className="block text-xs font-medium text-[#0b27b1] mb-1">Payment Method</label>
            <select
              value={methodFilter}
              onChange={e => setMethodFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg"
            >
              <option value="all">All</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank">Bank</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="min-w-[180px]">
            <label className="block text-xs font-medium text-[#0b27b1] mb-1">Date Range</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={e => setDateRange(r => ({ ...r, start: e.target.value }))}
                className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
              />
              <span className="flex items-center">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={e => setDateRange(r => ({ ...r, end: e.target.value }))}
                className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setMethodFilter('all');
                setDateRange({ start: '', end: '' });
              }}
              className="px-3 py-1.5 bg-white text-[#0b27b1] rounded-lg text-sm font-medium border border-[#e0e4ed] shadow-[0_2px_4px_rgba(0,0,0,0.05)] hover:bg-gray-50 transition-all duration-200 active:translate-y-px"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>
      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-[#e0e4ed] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#e0e4ed]">
            <thead className="bg-[#f8f9fd]">
              <tr>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Supplier</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Date</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Amount Paid</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Total Due</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Balance</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Method</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Status</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#e0e4ed]">
              {filtered.length > 0 ? (
                filtered.map((payment, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-2 py-2 text-center">
                      <div className="font-semibold text-[#0b27b1]">{payment.supplier_name}</div>
                      <div className="text-xs text-[#5a6e9a]">{payment.supplier_phone}</div>
                    </td>
                    <td className="px-2 py-2 text-center">{payment.date ? new Date(payment.date).toLocaleDateString() : '-'}</td>
                    <td className="px-2 py-2 text-center font-semibold text-[#03648a]">₹{Number(payment.amount).toFixed(2)}</td>
                    <td className="px-2 py-2 text-center font-semibold text-[#0b27b1]">₹{Number(payment.total_due || 0).toFixed(2)}</td>
                    <td className="px-2 py-2 text-center font-semibold text-[#0b27b1]">₹{Number(payment.balance || 0).toFixed(2)}</td>
                    <td className="px-2 py-2 text-center">
                      <span className="inline-flex items-center gap-1 text-[#0b27b1] font-medium">
                        {payment.method}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border border-[#e0e4ed] ${payment.status === 'Paid' ? 'bg-[#e4f4fa] text-[#0b27b1]' :
                        payment.status === 'Pending' ? 'bg-white text-[#0b27b1]' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <div className="flex justify-center items-center space-x-1">
                        {rolePermissions.can_view && (
                          <button
                            onClick={() => handleViewPayment(payment)}
                            className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-[#f0f4ff] hover:text-[#0b27b1] transition-colors duration-200 shadow-sm"
                            title="View Payment"
                          >
                            <MdVisibility className="w-4 h-4" />
                          </button>
                        )}
                        {rolePermissions.can_edit && (
                          <button
                            onClick={() => handleEditPayment(payment)}
                            className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-[#f0f4ff] hover:text-[#0b27b1] transition-colors duration-200 shadow-sm"
                            title="Edit Payment"
                          >
                            <MdOutlineEdit className="w-4 h-4" />
                          </button>
                        )}
                        {rolePermissions.can_delete && (
                          <button
                            onClick={() => handleDeletePayment(payment.id)}
                            className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-red-50 hover:text-red-600 transition-colors duration-200 shadow-sm"
                            title="Delete Payment"
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
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">No payments found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Add Payment Modal */}
      <Dialog open={showAddPaymentModal} onClose={() => setShowAddPaymentModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Supplier Payment</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Autocomplete
            options={suppliers}
            getOptionLabel={(option) => option.name || ''}
            value={suppliers.find(s => s.name === addPaymentForm.supplier_name) || null}
            onChange={(event, newValue) => {
              setAddPaymentForm(prev => ({
                ...prev,
                supplier_name: newValue ? newValue.name : '',
                supplier_phone: newValue ? newValue.phone : ''
              }));
            }}
            renderInput={(params) => (
              <TextField {...params} label="Supplier Name" required />
            )}
          />
          <TextField
            label="Supplier Phone"
            value={addPaymentForm.supplier_phone}
            onChange={e => setAddPaymentForm(f => ({ ...f, supplier_phone: e.target.value }))}
          />
          <TextField
            label="Amount Paid"
            type="number"
            value={addPaymentForm.amount}
            onChange={e => setAddPaymentForm(f => ({ ...f, amount: e.target.value }))}
            required
          />
          <TextField
            label="Total Due"
            type="number"
            value={addPaymentForm.total_due}
            onChange={e => setAddPaymentForm(f => ({ ...f, total_due: e.target.value }))}
            required
          />
          <TextField
            label="Balance"
            type="number"
            value={addPaymentForm.balance}
            onChange={e => setAddPaymentForm(f => ({ ...f, balance: e.target.value }))}
            required
            helperText="Balance = Total Due - Amount Paid"
          />
          <TextField
            label="Method"
            value={addPaymentForm.method}
            onChange={e => setAddPaymentForm(f => ({ ...f, method: e.target.value }))}
            required
          />
          <TextField
            label="Date"
            type="date"
            value={addPaymentForm.date}
            onChange={e => setAddPaymentForm(f => ({ ...f, date: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            label="Status"
            select
            SelectProps={{ native: true }}
            value={addPaymentForm.status}
            onChange={e => setAddPaymentForm(f => ({ ...f, status: e.target.value }))}
          >
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Failed">Failed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Processing">Processing</option>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddPaymentModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddPayment}
          >
            Save Payment
          </Button>
        </DialogActions>
      </Dialog>
      {/* View Payment Modal */}
      <Dialog open={showViewModal} onClose={() => setShowViewModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>View Supplier Payment</DialogTitle>
        <DialogContent>
          {viewPayment && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {viewPayment.supplier_name}
              </Typography>
              <Typography variant="body1">
                <strong>Phone:</strong> {viewPayment.supplier_phone || 'N/A'}
              </Typography>
              <Typography variant="body1">
                <strong>Date:</strong> {viewPayment.date ? new Date(viewPayment.date).toLocaleDateString() : '-'}
              </Typography>
              <Typography variant="body1">
                <strong>Amount Paid:</strong> ₹{Number(viewPayment.amount).toFixed(2)}
              </Typography>
              <Typography variant="body1">
                <strong>Total Due:</strong> ₹{Number(viewPayment.total_due || 0).toFixed(2)}
              </Typography>
              <Typography variant="body1">
                <strong>Balance:</strong> ₹{Number(viewPayment.balance || 0).toFixed(2)}
              </Typography>
              <Typography variant="body1">
                <strong>Method:</strong> {viewPayment.method}
              </Typography>
              <Typography variant="body1">
                <strong>Status:</strong> {viewPayment.status}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowViewModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      {/* Edit Payment Modal */}
      <Dialog open={showEditModal} onClose={() => setShowEditModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Supplier Payment</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Autocomplete
            options={suppliers}
            getOptionLabel={(option) => option.name || ''}
            value={suppliers.find(s => s.name === editPaymentForm.supplier_name) || null}
            onChange={(event, newValue) => {
              setEditPaymentForm(prev => ({
                ...prev,
                supplier_name: newValue ? newValue.name : '',
                supplier_phone: newValue ? newValue.phone : ''
              }));
            }}
            renderInput={(params) => (
              <TextField {...params} label="Supplier Name" required />
            )}
          />
          <TextField
            label="Supplier Phone"
            value={editPaymentForm.supplier_phone}
            onChange={e => setEditPaymentForm(f => ({ ...f, supplier_phone: e.target.value }))}
          />
          <TextField
            label="Amount Paid"
            type="number"
            value={editPaymentForm.amount}
            onChange={e => setEditPaymentForm(f => ({ ...f, amount: e.target.value }))}
            required
          />
          <TextField
            label="Total Due"
            type="number"
            value={editPaymentForm.total_due}
            onChange={e => setEditPaymentForm(f => ({ ...f, total_due: e.target.value }))}
            required
          />
          <TextField
            label="Balance"
            type="number"
            value={editPaymentForm.balance}
            onChange={e => setEditPaymentForm(f => ({ ...f, balance: e.target.value }))}
            required
            helperText="Balance = Total Due - Amount Paid"
          />
          <TextField
            label="Method"
            value={editPaymentForm.method}
            onChange={e => setEditPaymentForm(f => ({ ...f, method: e.target.value }))}
            required
          />
          <TextField
            label="Date"
            type="date"
            value={editPaymentForm.date}
            onChange={e => setEditPaymentForm(f => ({ ...f, date: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            label="Status"
            select
            SelectProps={{ native: true }}
            value={editPaymentForm.status}
            onChange={e => setEditPaymentForm(f => ({ ...f, status: e.target.value }))}
          >
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Failed">Failed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Processing">Processing</option>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveEditPayment}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
