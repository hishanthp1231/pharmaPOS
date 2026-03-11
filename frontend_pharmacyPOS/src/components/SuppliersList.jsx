import React, { useState, useEffect } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { Add } from '@mui/icons-material';
import { Search } from '@mui/icons-material';
import api from '../utils/axios';
import { MdVisibility, MdOutlineEdit, MdOutlineDelete } from 'react-icons/md';
import { useBranch } from '../context/BranchContext';

export default function SuppliersList({ showAddEditModal, setShowAddEditModal, editSupplier, setEditSupplier }) {
  const { branches, selectedBranch } = useBranch();
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [emailFilter, setEmailFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [form, setForm] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
    status: 'Active',
    branch_id: selectedBranch?.id || ''
  });
  const [viewSupplier, setViewSupplier] = useState(null);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    fetchSuppliers();
    // eslint-disable-next-line
  }, [selectedBranch, branchFilter]);

  // Set default branch_id when modal opens for new supplier
  useEffect(() => {
    if (showAddEditModal && !editSupplier && selectedBranch) {
      setForm(f => ({ ...f, branch_id: selectedBranch.id }));
    }
  }, [showAddEditModal, editSupplier, selectedBranch]);

  const fetchSuppliers = async () => {
    try {
      // Pass branchFilter to overrides interceptor default if needed
      const res = await api.get('/suppliers', { params: { branch_id: branchFilter } });
      const data = res.data.data || res.data;
      setSuppliers(Array.isArray(data) ? data : []);
      console.log('[SUPPLIERS DEBUG] API response:', res.data);
      console.log('[SUPPLIERS DEBUG] Parsed data:', data);
    } catch (err) {
      setSuppliers([]);
      console.error('[SUPPLIERS DEBUG] Error fetching suppliers:', err);
    }
  };

  const handleAddOrEdit = async () => {
    if (!form.branch_id) {
      alert('Branch ID is required');
      return;
    }
    try {
      if (editSupplier) {
        await api.put(`/suppliers/${editSupplier.id}`, { ...form });
      } else {
        await api.post('/suppliers', { ...form });
      }
      setShowAddEditModal(false);
      setEditSupplier(null);
      setForm({
        name: '', address: '', email: '', phone: '', status: 'Active',
        branch_id: selectedBranch?.id || ''
      });
      // Clear filters after add/edit
      setSearchTerm('');
      setCategoryFilter('all');
      setStatusFilter('all');
      setEmailFilter('');
      setPhoneFilter('');
      setBranchFilter('all');
      fetchSuppliers(); // Ensure fetch after add/edit
    } catch {
      alert('Failed to save supplier');
    }
  };

  const handleEdit = supplier => {
    setEditSupplier(supplier);
    setForm({
      name: supplier.name || '',
      address: supplier.address || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      status: supplier.status || 'Active',
      branch_id: supplier.branch_id || ''
    });
    setShowAddEditModal(true);
  };

  const handleDelete = async id => {
    const target_branch_id = suppliers.find(s => s.id === id)?.branch_id || selectedBranch?.id;
    if (!target_branch_id) {
      alert('Branch ID is required');
      return;
    }
    if (!window.confirm('Delete this supplier?')) return;
    try {
      await api.delete(`/suppliers/${id}`, { params: { branch_id: target_branch_id } });
      fetchSuppliers(); // Ensure fetch after delete
    } catch {
      alert('Failed to delete supplier');
    }
  };

  const handleView = supplier => setViewSupplier(supplier);

  const filteredSuppliers = suppliers.filter(s => {
    const matchesSearch =
      (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.phone && s.phone.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || (s.category === categoryFilter);
    const matchesStatus = statusFilter === 'all' || (s.status && s.status.toLowerCase() === statusFilter.toLowerCase());
    const matchesEmail = !emailFilter || (s.email && s.email.toLowerCase().includes(emailFilter.toLowerCase()));
    const matchesPhone = !phoneFilter || (s.phone && s.phone.toLowerCase().includes(phoneFilter.toLowerCase()));
    return matchesSearch && matchesCategory && matchesStatus && matchesEmail && matchesPhone;
  });

  // Optionally, fetch suppliers when modal closes (if not saving)
  const handleCloseModal = () => {
    setShowAddEditModal(false);
    setEditSupplier(null);
    fetchSuppliers();
  };

  return (
    <div>

      {/* Filter Section - styled like MedicineMaster */}
      <div className="bg-white rounded-lg p-3 shadow-[0_2px_6px_rgba(0,0,0,0.1)] mb-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-[#0b27b1] mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4" style={{ color: '#0b27b1' }} />
              </div>
            </div>
          </div>
          <div className="min-w-[180px]">
            <label className="block text-xs font-medium text-[#0b27b1] mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
            >
              <option value="all">All Categories</option>
              {/* If you have a categories list, map here. Otherwise, keep only 'All' */}
            </select>
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
              <option value="banned">Banned</option>
            </select>
          </div>
          <div className="min-w-[140px]">
            <label className="block text-xs font-medium text-[#0b27b1] mb-1">Branch</label>
            <select
              value={branchFilter}
              onChange={e => setBranchFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg"
            >
              <option value="all">All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
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
          <div className="min-w-[140px]">
            <label className="block text-xs font-medium text-[#0b27b1] mb-1">Phone</label>
            <input
              type="text"
              placeholder="Filter by phone..."
              value={phoneFilter}
              onChange={e => setPhoneFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setStatusFilter('all');
                setEmailFilter('');
                setPhoneFilter('');
                setBranchFilter('all');
              }}
              className="px-3 py-1.5 bg-white text-[#0b27b1] rounded-lg text-sm font-medium border border-[#e0e4ed] shadow-[0_2px_4px_rgba(0,0,0,0.05)] hover:bg-gray-50 transition-all duration-200 active:translate-y-px"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg shadow-[0_2px_6px_rgba(0,0,0,0.1)] bg-white">
        {loading ? (
          <div className="text-center py-8 text-[#5a6e9a]">Loading suppliers...</div>
        ) : (
          <table className="min-w-full divide-y divide-[#e0e4ed]" style={{ tableLayout: 'fixed' }}>
            <thead className="bg-[#f8f9fd]">
              <tr>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase w-1/6">Name</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase w-1/6">Branch</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase w-1/6">Phone</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase w-1/6">Email</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase w-1/6">Address</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase w-10">Status</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#e0e4ed]">
              {filteredSuppliers.length > 0 ? (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-2 py-2 text-center text-[#2d3748]">{supplier.name}</td>
                    <td className="px-2 py-2 text-center text-[#2d3748]">
                      {branches.find(b => String(b.id) === String(supplier.branch_id))?.name || 'Global'}
                    </td>
                    <td className="px-2 py-2 text-center text-[#2d3748]">{supplier.phone}</td>
                    <td className="px-2 py-2 text-center text-[#2d3748]">{supplier.email}</td>
                    <td className="px-2 py-2 text-center text-[#2d3748]">{supplier.address}</td>
                    <td className="px-2 py-2 text-center text-[#2d3748]">{supplier.status}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-center text-sm">
                      <div className="flex justify-center items-center space-x-1">
                        {rolePermissions.can_view && (
                          <button
                            onClick={() => handleView(supplier)}
                            className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-[#f0f4ff] hover:text-[#0b27b1] transition-colors duration-200 shadow-sm"
                            title="View Supplier"
                          >
                            <MdVisibility className="w-4 h-4" />
                          </button>
                        )}
                        {rolePermissions.can_edit && (
                          <button
                            onClick={() => handleEdit(supplier)}
                            className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-[#f0f4ff] hover:text-[#0b27b1] transition-colors duration-200 shadow-sm"
                            title="Edit Supplier"
                          >
                            <MdOutlineEdit className="w-4 h-4" />
                          </button>
                        )}
                        {rolePermissions.can_delete && (
                          <button
                            onClick={() => handleDelete(supplier.id)}
                            className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-red-50 hover:text-red-600 transition-colors duration-200 shadow-sm"
                            title="Delete Supplier"
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
                    No suppliers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      {/* Add/Edit Supplier Modal */}
      <Dialog open={showAddEditModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>{editSupplier ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
          />
          <TextField
            label="Phone"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            required
          />
          <TextField
            label="Email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            type="email"
          />
          <TextField
            label="Address"
            value={form.address}
            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
          />
          <TextField
            label="Status"
            select
            SelectProps={{ native: true }}
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Banned">Banned</option>
          </TextField>
          <TextField
            label="Branch"
            select
            SelectProps={{ native: true }}
            value={form.branch_id}
            onChange={e => setForm(f => ({ ...f, branch_id: e.target.value }))}
            required
          >
            <option value="">Select Branch</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button
            onClick={handleAddOrEdit}
            variant="contained"
            color="primary"
          >
            {editSupplier ? 'Save Changes' : 'Add Supplier'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* View Supplier Modal */}
      <Dialog open={!!viewSupplier} onClose={() => setViewSupplier(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Supplier Details</DialogTitle>
        <DialogContent>
          {viewSupplier && (
            <div>
              <Typography variant="h6" gutterBottom>
                {viewSupplier.name}
              </Typography>
              <Typography variant="body1">
                <strong>Phone:</strong> {viewSupplier.phone || 'N/A'}
              </Typography>
              <Typography variant="body1">
                <strong>Email:</strong> {viewSupplier.email || 'N/A'}
              </Typography>
              <Typography variant="body1">
                <strong>Address:</strong> {viewSupplier.address || 'N/A'}
              </Typography>
              <Typography variant="body1">
                <strong>Status:</strong> {viewSupplier.status}
              </Typography>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewSupplier(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
