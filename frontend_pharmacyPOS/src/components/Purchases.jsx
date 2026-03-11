import React, { useState, useEffect } from 'react';
import {
  Paper, Box, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { Add, Search, Delete, Save, Close } from '@mui/icons-material';
import { MdVisibility, MdOutlineEdit, MdOutlineDelete } from 'react-icons/md';
import api from '../utils/axios';

const API_GRN = '/grn';
const API_MEDICINES = '/medicines';

export default function Purchases({ showAddModal, setShowAddModal }) {
  const [medicines, setMedicines] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [batchHeader, setBatchHeader] = useState({
    supplier: '',
    invoice: '',
    purchaseDate: ''
  });
  const [medicineForm, setMedicineForm] = useState({
    medicineId: '',
    quantity: '',
    unit: '',
    mrp: '',
    retail: '',
    wholesale: '',
    expiry: ''
  });
  const [batchItems, setBatchItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [lastGrnId, setLastGrnId] = useState(0);
  const [currentGrnId, setCurrentGrnId] = useState(1);
  const [viewBatch, setViewBatch] = useState(null);
  const [editBatch, setEditBatch] = useState(null);
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    api.get(API_MEDICINES)
      .then(res => setMedicines(res.data.data || []))
      .catch(err => {
        console.error('Error fetching medicines:', err);
        setMedicines([]);
      });
  }, []);

  // If you have branch_id from context or localStorage, get it here:
  const branchId = localStorage.getItem('branch_id') || 1;

  // Fetch GRN batches
  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const res = await api.get(API_GRN);
        const data = res.data;
        setPurchases(data.data || []);
        const all = data.data || [];
        const maxId = all.reduce((max, row) => Math.max(max, row.grn_id || 0), 0);
        setLastGrnId(maxId);
        setCurrentGrnId(maxId + 1);
      } catch (err) {
        console.error('Error fetching GRN purchases:', err);
        setPurchases([]);
        setLastGrnId(0);
        setCurrentGrnId(1);
      }
    };
    fetchPurchases();
  }, [showAddModal, lastGrnId]);

  // Add medicine row to batch
  const handleAddMedicineRow = () => {
    if (!medicineForm.medicineId || !medicineForm.quantity || !medicineForm.mrp || !medicineForm.unit) {
      alert('Please fill all required medicine fields');
      return;
    }
    setBatchItems([
      ...batchItems,
      {
        ...medicineForm,
        medicine: medicines.find(m => String(m.id) === String(medicineForm.medicineId)),
        quantity: parseFloat(medicineForm.quantity),
        unit: medicineForm.unit,
        mrp: parseFloat(medicineForm.mrp),
        retail: medicineForm.retail ? parseFloat(medicineForm.retail) : '',
        wholesale: medicineForm.wholesale ? parseFloat(medicineForm.wholesale) : '',
      }
    ]);
    setMedicineForm({ medicineId: '', quantity: '', unit: '', mrp: '', retail: '', wholesale: '', expiry: '' });
  };

  // Remove medicine row
  const handleRemoveMedicineRow = (idx) => {
    setBatchItems(batchItems.filter((_, i) => i !== idx));
  };

  // Calculate row total and batch total
  const rowTotal = (row) => (parseFloat(row.quantity) || 0) * (parseFloat(row.mrp) || 0);
  const batchTotal = batchItems.reduce((sum, row) => sum + rowTotal(row), 0);

  // Save batch (all rows as one GRN)
  const handleSaveBatch = async () => {
    if (!batchHeader.supplier || !batchHeader.purchaseDate) {
      alert('Please fill all batch header fields');
      return;
    }
    if (batchItems.length === 0) {
      alert('Please add at least one medicine');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        date: batchHeader.purchaseDate,
        supplier: batchHeader.supplier,
        invoice: batchHeader.invoice,
        items: batchItems.map(row => ({
          medicineId: row.medicineId,
          quantity: row.quantity,
          unit: row.unit,
          mrp: row.mrp,
          retail: row.retail,
          wholesale: row.wholesale,
          expiry: row.expiry,
          total: (parseFloat(row.quantity) || 0) * (parseFloat(row.mrp) || 0)
        })),
      };
      let result;
      // Debug: log which method is being used and grn_id
      console.log('handleSaveBatch:', { editBatch, payload });
      if (typeof editBatch === 'number' && editBatch > 0) {
        console.log('Sending PUT for grn_id:', editBatch);
        result = await api.put(`${API_GRN}/${editBatch}`, payload);
      } else {
        console.log('Sending POST for new GRN');
        result = await api.post(API_GRN, payload);
      }

      setLastGrnId(result.data.grnId);
      setShowAddModal(false);
      setBatchHeader({ supplier: '', invoice: '', purchaseDate: '' });
      setBatchItems([]);
      if (!editBatch && result.data.grnId) {
        setCurrentGrnId(result.data.grnId + 1);
      }
      setEditBatch(null);
    } catch (err) {
      console.error('Error saving GRN:', err);
      alert('Failed to save GRN: ' + (err.response?.data?.message || err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // View batch (shows all items for a batch)
  const handleViewBatch = (batch) => {
    setViewBatch(batch);
  };

  // Delete GRN (delete all items with same grn_id)
  const handleDeleteBatch = async (grn_id) => {
    if (!grn_id || isNaN(grn_id)) {
      alert('Invalid GRN ID');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this GRN batch?')) return;
    try {
      await api.delete(`${API_GRN}/${grn_id}`);
      setPurchases(purchases.filter(p => p.grn_id !== grn_id));
    } catch (err) {
      console.error('Error deleting GRN:', err);
      alert('Failed to delete GRN: ' + (err.response?.data?.message || err.message || 'Unknown error'));
    }
  };

  // Edit batch (prefill modal with all items for a batch)
  const handleEditBatch = (batch) => {
    setEditBatch(Number(batch.grn_id)); // Ensure editBatch is a number
    setShowAddModal(true);
    setBatchHeader({
      supplier: batch.supplier,
      invoice: batch.invoice || '',
      purchaseDate: batch.date ? batch.date.slice(0, 10) : ''
    });
    setBatchItems(batch.items.map(r => ({
      medicineId: r.medicine_id,
      quantity: r.quantity,
      unit: r.unit,
      mrp: r.mrp,
      retail: r.retail,
      wholesale: r.wholesale,
      expiry: r.expiry,
      medicine: { name: r.medicine_name }
    })));
    setCurrentGrnId(batch.grn_id);
  };

  // Edit individual item in the preview table
  const handleEditItem = (index) => {
    setEditingItemIndex(index);
    const item = { ...batchItems[index] };

    // Format expiry date for date input (YYYY-MM-DD)
    if (item.expiry) {
      try {
        const date = new Date(item.expiry);
        if (!isNaN(date.getTime())) {
          item.expiry = date.toISOString().split('T')[0];
        }
      } catch (error) {
        console.warn('Invalid date format for expiry:', item.expiry);
        // Keep the original value if parsing fails
      }
    }

    setEditingItem(item);
  };

  // Cancel editing individual item
  const handleCancelEditItem = () => {
    setEditingItemIndex(null);
    setEditingItem(null);
  };

  // Save edited item
  const handleSaveEditItem = () => {
    if (editingItemIndex !== null && editingItem) {
      const updatedItems = [...batchItems];
      updatedItems[editingItemIndex] = { ...editingItem };
      setBatchItems(updatedItems);
      setEditingItemIndex(null);
      setEditingItem(null);
    }
  };

  // Handle editing item field changes
  const handleEditItemChange = (field, value) => {
    if (editingItem) {
      setEditingItem(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Reset editing state when modal closes
  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingItemIndex(null);
    setEditingItem(null);
  };

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  // Get unique suppliers for dropdown
  const suppliers = Array.from(new Set(purchases.map(p => p.supplier).filter(Boolean)));

  // Helper to check expired status
  const isExpired = (batch) => {
    const today = new Date();
    return batch.items.some(item => {
      if (!item.expiry) return false;
      const expiryDate = new Date(item.expiry);
      return expiryDate < today;
    });
  };

  // Filtered purchases
  const filteredPurchases = purchases.filter(batch => {
    // Search by supplier, invoice, medicine name
    const matchesSearch =
      !searchTerm ||
      (batch.supplier && batch.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (batch.invoice && batch.invoice.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (batch.items && batch.items.some(item =>
        item.medicine_name && item.medicine_name.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    // Supplier filter
    const matchesSupplier = supplierFilter === 'all' || batch.supplier === supplierFilter;
    // Status filter
    const expired = isExpired(batch);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && !expired) ||
      (statusFilter === 'expired' && expired);
    // Date range filter
    const batchDate = batch.date ? batch.date.slice(0, 10) : '';
    const matchesDate =
      (!dateRange.startDate || batchDate >= dateRange.startDate) &&
      (!dateRange.endDate || batchDate <= dateRange.endDate);

    return matchesSearch && matchesSupplier && matchesStatus && matchesDate;
  });

  // --- Permission logic: get current user's role permissions ---
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
  // --- End of permission logic ---

  // --- UI ---
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow">
      {/* Filter Section */}
      <div className="bg-white rounded-lg p-3 shadow-[0_2px_6px_rgba(0,0,0,0.1)] mb-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-[#5a6e9a] mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search purchases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4" style={{ color: '#0b27b1' }} />
              </div>
            </div>
          </div>
          <div className="min-w-[180px]">
            <label className="block text-xs font-medium text-[#5a6e9a] mb-1">Supplier</label>
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
            >
              <option value="all">All Suppliers</option>
              {suppliers.map(supplier => (
                <option key={supplier} value={supplier}>{supplier}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[180px]">
            <label className="block text-xs font-medium text-[#5a6e9a] mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-[#5a6e9a] mb-1">Date Range</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
              />
              <span className="flex items-center">to</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setSupplierFilter('all');
                setStatusFilter('all');
                setDateRange({ startDate: '', endDate: '' });
              }}
              className="px-3 py-1.5 bg-white text-[#5a6e9a] rounded-lg text-sm font-medium border border-[#e0e4ed] shadow-[0_2px_4px_rgba(0,0,0,0.05)] hover:bg-gray-50 transition-all duration-200 active:translate-y-px"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>
      {/* Purchases Table */}
      <div className="bg-white rounded-lg shadow-sm border border-[#e0e4ed] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#e0e4ed]">
            <thead className="bg-[#f8f9fd]">
              <tr>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">GRN ID</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Supplier</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Invoice</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Purchase Date</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Total</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#e0e4ed]">
              {filteredPurchases.length > 0 ? (
                filteredPurchases.map((batch, idx) => {
                  const total = batch.items.reduce((sum, r) => sum + ((parseFloat(r.quantity) || 0) * (parseFloat(r.mrp) || 0)), 0);
                  return (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-2 py-2 text-center">{batch.grn_id}</td>
                      <td className="px-2 py-2 text-center">{batch.supplier}</td>
                      <td className="px-2 py-2 text-center">{batch.invoice || '-'}</td>
                      <td className="px-2 py-2 text-center">{batch.date ? new Date(batch.date).toLocaleDateString() : '-'}</td>
                      <td className="px-2 py-2 text-center">LKR {total.toFixed(2)}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-center text-sm">
                        <div className="flex justify-center items-center space-x-1">
                          {rolePermissions.can_view && (
                            <button
                              onClick={() => handleViewBatch(batch)}
                              className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-[#f0f4ff] hover:text-[#0b27b1] transition-colors duration-200 shadow-sm"
                              title="View GRN"
                            >
                              <MdVisibility className="w-4 h-4" />
                            </button>
                          )}
                          {rolePermissions.can_edit && (
                            <button
                              onClick={() => handleEditBatch(batch)}
                              className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-[#f0f4ff] hover:text-[#0b27b1] transition-colors duration-200 shadow-sm"
                              title="Edit GRN"
                            >
                              <MdOutlineEdit className="w-4 h-4" />
                            </button>
                          )}
                          {rolePermissions.can_delete && (
                            <button
                              onClick={() => handleDeleteBatch(batch.grn_id)}
                              className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-red-50 hover:text-red-600 transition-colors duration-200 shadow-sm"
                              title="Delete GRN"
                            >
                              <MdOutlineDelete className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No GRN batches found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit GRN Modal */}
      <Dialog open={showAddModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>
          {editBatch ? `Edit GRN (ID: ${currentGrnId})` : `Add GRN (ID: ${currentGrnId})`}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Batch Header */}
            <Box display="flex" gap={2} flexWrap="wrap">
              <TextField
                name="supplier"
                label="Supplier"
                value={batchHeader.supplier}
                onChange={e => setBatchHeader(h => ({ ...h, supplier: e.target.value }))}
                required
              />
              <TextField
                name="invoice"
                label="Invoice Number"
                value={batchHeader.invoice}
                onChange={e => setBatchHeader(h => ({ ...h, invoice: e.target.value }))}
              />
              <TextField
                name="purchaseDate"
                label="Purchase Date"
                type="date"
                value={batchHeader.purchaseDate}
                onChange={e => setBatchHeader(h => ({ ...h, purchaseDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                required
              />

            </Box>
            {/* Medicine Add Form */}
            <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel id="medicine-dropdown-label">Medicine</InputLabel>
                <Select
                  labelId="medicine-dropdown-label"
                  value={medicineForm.medicineId}
                  label="Medicine"
                  onChange={e => setMedicineForm(f => ({ ...f, medicineId: e.target.value }))}
                  displayEmpty
                  sx={{ mb: 1 }}
                >
                  <MenuItem value="">
                    <em>Select Medicine</em>
                  </MenuItem>
                  {medicines.map((med, idx) => (
                    <MenuItem key={med.id} value={med.id}>{med.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                name="quantity"
                label="Quantity"
                type="number"
                value={medicineForm.quantity}
                onChange={e => setMedicineForm(f => ({ ...f, quantity: e.target.value }))}
                required
              />
              <TextField
                name="unit"
                label="Unit"
                value={medicineForm.unit}
                onChange={e => setMedicineForm(f => ({ ...f, unit: e.target.value }))}
                placeholder="e.g. tablet, bottle, ml, pcs"
                required
              />
              <TextField
                name="mrp"
                label="MRP"
                type="number"
                value={medicineForm.mrp}
                onChange={e => setMedicineForm(f => ({ ...f, mrp: e.target.value }))}
                required
                helperText={medicineForm.unit ? `Enter price per ${medicineForm.unit}` : 'Enter price per unit'}
              />
              <TextField
                name="retail"
                label="Retail Price"
                type="number"
                value={medicineForm.retail}
                onChange={e => setMedicineForm(f => ({ ...f, retail: e.target.value }))}
                helperText={medicineForm.unit ? `Enter price per ${medicineForm.unit}` : 'Enter price per unit'}
              />
              <TextField
                name="wholesale"
                label="Wholesale Price"
                type="number"
                value={medicineForm.wholesale}
                onChange={e => setMedicineForm(f => ({ ...f, wholesale: e.target.value }))}
                helperText={medicineForm.unit ? `Enter price per ${medicineForm.unit}` : 'Enter price per unit'}
              />
              <TextField
                name="expiry"
                label="Expiry Date"
                type="date"
                value={medicineForm.expiry}
                onChange={e => setMedicineForm(f => ({ ...f, expiry: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
              <Button
                variant="contained"
                color="primary"
                startIcon={<Add />}
                onClick={handleAddMedicineRow}
                sx={{ height: 40, mt: 1 }}
              >
                Add Medicine
              </Button>
            </Box>
            {/* Table of added medicines */}
            {batchItems.length > 0 && (
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell className="text-center">GRN ID</TableCell>
                      <TableCell className="text-center">Medicine</TableCell>
                      <TableCell className="text-center">Quantity</TableCell>
                      <TableCell className="text-center">Unit</TableCell>
                      <TableCell className="text-center">MRP</TableCell>
                      <TableCell className="text-center">Retail</TableCell>
                      <TableCell className="text-center">Wholesale</TableCell>
                      <TableCell className="text-center">Expiry</TableCell>
                      <TableCell className="text-center">Total</TableCell>
                      <TableCell className="text-center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {batchItems.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-center">{currentGrnId}</TableCell>
                        <TableCell className="text-center">{row.medicine?.name || ''}</TableCell>

                        {/* Quantity - Editable */}
                        <TableCell className="text-center">
                          {editingItemIndex === idx ? (
                            <TextField
                              type="number"
                              value={editingItem?.quantity || ''}
                              onChange={(e) => handleEditItemChange('quantity', e.target.value)}
                              size="small"
                              sx={{ width: '80px' }}
                            />
                          ) : (
                            row.quantity
                          )}
                        </TableCell>

                        {/* Unit - Editable */}
                        <TableCell className="text-center">
                          {editingItemIndex === idx ? (
                            <TextField
                              value={editingItem?.unit || ''}
                              onChange={(e) => handleEditItemChange('unit', e.target.value)}
                              size="small"
                              sx={{ width: '80px' }}
                            />
                          ) : (
                            row.unit
                          )}
                        </TableCell>

                        {/* MRP - Editable */}
                        <TableCell className="text-center">
                          {editingItemIndex === idx ? (
                            <TextField
                              type="number"
                              value={editingItem?.mrp || ''}
                              onChange={(e) => handleEditItemChange('mrp', e.target.value)}
                              size="small"
                              sx={{ width: '100px' }}
                              placeholder="MRP"
                            />
                          ) : (
                            row.mrp ? `LKR ${Number(row.mrp).toFixed(2)} / ${row.unit}` : ''
                          )}
                        </TableCell>

                        {/* Retail - Editable */}
                        <TableCell className="text-center">
                          {editingItemIndex === idx ? (
                            <TextField
                              type="number"
                              value={editingItem?.retail || ''}
                              onChange={(e) => handleEditItemChange('retail', e.target.value)}
                              size="small"
                              sx={{ width: '100px' }}
                              placeholder="Retail"
                            />
                          ) : (
                            row.retail ? `LKR ${Number(row.retail).toFixed(2)} / ${row.unit}` : '-'
                          )}
                        </TableCell>

                        {/* Wholesale - Editable */}
                        <TableCell className="text-center">
                          {editingItemIndex === idx ? (
                            <TextField
                              type="number"
                              value={editingItem?.wholesale || ''}
                              onChange={(e) => handleEditItemChange('wholesale', e.target.value)}
                              size="small"
                              sx={{ width: '100px' }}
                              placeholder="Wholesale"
                            />
                          ) : (
                            row.wholesale ? `LKR ${Number(row.wholesale).toFixed(2)} / ${row.unit}` : '-'
                          )}
                        </TableCell>

                        {/* Expiry - Editable */}
                        <TableCell className="text-center">
                          {editingItemIndex === idx ? (
                            <TextField
                              type="date"
                              value={editingItem?.expiry || ''}
                              onChange={(e) => handleEditItemChange('expiry', e.target.value)}
                              size="small"
                              InputLabelProps={{ shrink: true }}
                            />
                          ) : (
                            row.expiry ? (
                              new Date(row.expiry).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })
                            ) : '-'
                          )}
                        </TableCell>

                        <TableCell className="text-center">
                          {editingItemIndex === idx ?
                            `LKR ${((editingItem?.quantity || 0) * (editingItem?.mrp || 0)).toFixed(2)}` :
                            `LKR ${rowTotal(row).toFixed(2)}`
                          }
                        </TableCell>

                        {/* Actions - Edit/Save/Cancel and Delete */}
                        <TableCell className="text-center">
                          {editingItemIndex === idx ? (
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                              <IconButton onClick={handleSaveEditItem} color="primary" size="small" title="Save">
                                <Save />
                              </IconButton>
                              <IconButton onClick={handleCancelEditItem} color="secondary" size="small" title="Cancel">
                                <Close />
                              </IconButton>
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                              <IconButton onClick={() => handleEditItem(idx)} color="primary" size="small" title="Edit">
                                <MdOutlineEdit />
                              </IconButton>
                              <IconButton onClick={() => handleRemoveMedicineRow(idx)} color="error" size="small" title="Delete">
                                <Delete />
                              </IconButton>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={8} align="right" sx={{ fontWeight: 'bold' }}>Batch Total:</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{`LKR ${batchTotal.toFixed(2)}`}</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button onClick={handleSaveBatch} variant="contained" color="primary" disabled={saving || batchItems.length === 0}>
            {saving ? 'Saving...' : (editBatch ? 'Update GRN' : 'Save GRN')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View GRN Modal */}
      <Dialog open={!!viewBatch} onClose={() => setViewBatch(null)} maxWidth="md" fullWidth>
        <DialogTitle>View GRN (ID: {viewBatch?.id})</DialogTitle>
        <DialogContent>
          {viewBatch && (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell className="text-center">Medicine</TableCell>
                    <TableCell className="text-center">Quantity</TableCell>
                    <TableCell className="text-center">MRP</TableCell>
                    <TableCell className="text-center">Retail</TableCell>
                    <TableCell className="text-center">Wholesale</TableCell>
                    <TableCell className="text-center">Expiry</TableCell>
                    <TableCell className="text-center">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {viewBatch.items.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-center">{row.medicine_name}</TableCell>
                      <TableCell className="text-center">{row.quantity}</TableCell>
                      <TableCell className="text-center">{row.mrp ? `LKR ${Number(row.mrp).toFixed(2)}` : ''}</TableCell>
                      <TableCell className="text-center">{row.retail ? `LKR ${Number(row.retail).toFixed(2)}` : '-'}</TableCell>
                      <TableCell className="text-center">{row.wholesale ? `LKR ${Number(row.wholesale).toFixed(2)}` : '-'}</TableCell>
                      <TableCell className="text-center">{row.expiry || '-'}</TableCell>
                      <TableCell className="text-center">{`LKR ${(parseFloat(row.quantity) * parseFloat(row.mrp)).toFixed(2)}`}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={6} align="right" sx={{ fontWeight: 'bold' }}>Batch Total:</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      {`LKR ${viewBatch.items.reduce((sum, r) => sum + ((parseFloat(r.quantity) || 0) * (parseFloat(r.mrp) || 0)), 0).toFixed(2)}`}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewBatch(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
