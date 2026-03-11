import { useState, useRef, useEffect } from 'react';
import { MdOutlineAttachMoney, MdOutlineEdit, MdOutlineDelete, MdAddCircleOutline, MdVisibility } from 'react-icons/md';
import { Box, Typography, Paper, Button, Chip, MenuItem, Select, Dialog, DialogTitle, DialogContent, DialogActions, TextField, TableContainer, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import api from '../utils/axios';
import { toUploadUrl } from '../config/api';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewExpense, setViewExpense] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editExpenseId, setEditExpenseId] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    expense: '',
    paidTo: '',
    date: '',
    amount: '',
    paymentMethod: '',
    status: 'Paid',
    balance: '',
    remark: ''
  });
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [modalReceiptSrc, setModalReceiptSrc] = useState(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Automate balance calculation
  useEffect(() => {
    if (expenseForm.status === 'Paid') {
      setExpenseForm(prev => ({ ...prev, balance: '0' }));
    } else if (expenseForm.status === 'Pending') {
      setExpenseForm(prev => ({ ...prev, balance: prev.amount }));
    }
  }, [expenseForm.status, expenseForm.amount]);

  const fetchExpenses = async () => {
    try {
      // Do NOT manually add branch_id, axios interceptor will inject it
      const res = await api.get('/expenses');
      const data = res.data.data || res.data;
      setExpenses(Array.isArray(data) ? data : []);
    } catch {
      setExpenses([]);
    }
  };

  // Summary calculations
  const totalPaid = expenses.filter(e => e.status === 'Paid').reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const totalPending = expenses.filter(e => e.status === 'Pending').reduce((sum, e) => sum + (parseFloat(e.balance) || 0), 0);
  const totalExpenses = expenses.length;
  // Color palette
  const blue = '#0b27b1';
  const blueLight = '#e4f4fa';
  const blueDark = '#03648a';
  const gray = '#5a6e9a';
  const grayBg = '#f8fbfd';
  const border = '#e0e4ed';

  // Filtering
  const filtered = expenses.filter(e => {
    const matchesSearch =
      e.expense?.toLowerCase().includes(search.toLowerCase()) ||
      e.paidTo?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || (e.status && e.status.toLowerCase() === statusFilter.toLowerCase());
    const matchesMethod =
      paymentMethodFilter === 'all' || (e.paymentMethod && e.paymentMethod.toLowerCase() === paymentMethodFilter.toLowerCase());
    const matchesDate =
      (!dateRange.start || new Date(e.date) >= new Date(dateRange.start)) &&
      (!dateRange.end || new Date(e.date) <= new Date(dateRange.end));
    return matchesSearch && matchesStatus && matchesMethod && matchesDate;
  });

  // Actions
  const handleViewExpense = (expense) => {
    setViewExpense(expense);
    setShowViewModal(true);
  };

  const handleEditExpense = (expense) => {
    setEditExpenseId(expense.id);
    setExpenseForm({
      expense: expense.expense || '',
      paidTo: expense.paidTo || '',
      date: expense.date ? expense.date.slice(0, 10) : '',
      amount: expense.amount || '',
      paymentMethod: expense.paymentMethod || '',
      status: expense.status || 'Paid',
      balance: expense.balance || '',
      remark: expense.remark || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchExpenses();
    } catch {
      alert('Failed to delete expense');
    }
  };

  const handleReceiptChange = (e) => {
    const file = e.target.files[0];
    setReceiptFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setReceiptPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview(null);
    }
  };

  const handleSaveExpense = async () => {
    try {
      const formData = new FormData();
      Object.entries(expenseForm).forEach(([key, value]) => {
        formData.append(key, value);
      });
      if (receiptFile) {
        formData.append('receipt', receiptFile);
      }
      if (editExpenseId) {
        await api.put(`/expenses/${editExpenseId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/expenses', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setShowAddModal(false);
      setShowEditModal(false);
      setEditExpenseId(null);
      setExpenseForm({
        expense: '',
        paidTo: '',
        date: '',
        amount: '',
        paymentMethod: '',
        status: 'Paid',
        balance: '',
        remark: ''
      });
      setReceiptFile(null);
      setReceiptPreview(null);
      fetchExpenses();
    } catch {
      alert('Failed to save expense');
    }
  };

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url, { method: 'GET' });
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      alert('Failed to download file');
    }
  };

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

  return (
    <Box>
      <Typography variant="h6" color="#0b27b1" fontWeight={600} mb={2}>
        Expenses
      </Typography>
      {/* Summary Section */}
      <Box display="flex" gap={3} mb={2} flexWrap="wrap">
        <Paper sx={{ p: 2, minWidth: 180, textAlign: 'center', background: grayBg, border: `1px solid ${border}` }}>
          <Typography variant="subtitle2" color={blueDark}>Total Paid</Typography>
          <Typography variant="h6" color={blue} fontWeight={700}>₹{totalPaid.toFixed(2)}</Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 180, textAlign: 'center', background: grayBg, border: `1px solid ${border}` }}>
          <Typography variant="subtitle2" color={gray}>Total Pending</Typography>
          <Typography variant="h6" color={gray} fontWeight={700}>₹{totalPending.toFixed(2)}</Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 180, textAlign: 'center', background: grayBg, border: `1px solid ${border}` }}>
          <Typography variant="subtitle2" color={blue}>Expenses</Typography>
          <Typography variant="h6" color={blue} fontWeight={700}>{totalExpenses}</Typography>
        </Paper>
        <Box flex={1} display="flex" alignItems="center" justifyContent="flex-end">
          <Button
            variant="contained"
            color="primary"
            startIcon={<MdOutlineAttachMoney />}
            sx={{ borderRadius: 2 }}
            onClick={() => setShowAddModal(true)}
          >
            Add Expense
          </Button>
        </Box>
      </Box>
      {/* Filters - styled like MedicineMaster */}
      <div className="bg-white rounded-lg p-3 shadow-[0_2px_6px_rgba(0,0,0,0.1)] mb-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-[#0b27b1] mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by expense or paid to..."
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
            </select>
          </div>
          <div className="min-w-[140px]">
            <label className="block text-xs font-medium text-[#0b27b1] mb-1">Payment Method</label>
            <select
              value={paymentMethodFilter}
              onChange={e => setPaymentMethodFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
            >
              <option value="all">All</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Other">Other</option>
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
              <span className="text-[#5a6e9a]">to</span>
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
                setPaymentMethodFilter('all');
                setDateRange({ start: '', end: '' });
              }}
              className="px-3 py-1.5 bg-white text-[#0b27b1] rounded-lg text-sm font-medium border border-[#e0e4ed] shadow-[0_2px_4px_rgba(0,0,0,0.05)] hover:bg-gray-50 transition-all duration-200 active:translate-y-px"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>
      {/* Expenses Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center">Expense</TableCell>
              <TableCell align="center">Paid To</TableCell>
              <TableCell align="center">Date</TableCell>
              <TableCell align="center">Amount</TableCell>
              <TableCell align="center">Payment Method</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Balance</TableCell>
              <TableCell align="center">Remark</TableCell>
              <TableCell align="center">Receipt</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((exp, idx) => (
                <TableRow key={exp.id}>
                  <TableCell align="center">{exp.expense}</TableCell>
                  <TableCell align="center">{exp.paidTo}</TableCell>
                  <TableCell align="center">{exp.date ? new Date(exp.date).toLocaleDateString() : '-'}</TableCell>
                  <TableCell align="center">
                    <Typography fontWeight={700} color="#03648a">
                      ₹{Number(exp.amount).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-[#e4f4fa] text-[#03648a]">
                      {exp.paymentMethod}
                    </span>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={exp.status}
                      variant="outlined"
                      sx={{ fontWeight: 600, color: exp.status === 'Paid' ? blue : gray, borderColor: exp.status === 'Paid' ? blue : gray, background: exp.status === 'Paid' ? blueLight : '#f4f6fa' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography fontWeight={700} color={gray}>
                      ₹{Number(exp.balance || 0).toFixed(2)}
                    </Typography>
                    {exp.status === 'Pending' && exp.balance > 0 && (
                      <Typography variant="caption" color={gray}>
                        Balance to pay
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">{exp.remark}</TableCell>
                  <TableCell align="center">
                    {exp.receipt ? (
                      <>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            setModalReceiptSrc(toUploadUrl(exp.receipt));
                            setShowReceiptModal(true);
                          }}
                          sx={{ p: 0, minWidth: 0 }}
                        >
                          {exp.receipt.endsWith('.pdf') ? (
                            <span style={{ color: '#0b27b1', fontWeight: 600 }}>PDF</span>
                          ) : (
                            <img
                              src={toUploadUrl(exp.receipt)}
                              alt="Receipt"
                              style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 6, border: '1px solid #e0e4ed' }}
                            />
                          )}
                        </Button>
                      </>
                    ) : (
                      <span style={{ color: '#aaa' }}>-</span>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <div className="flex justify-center items-center space-x-1">
                      {rolePermissions.can_view && (
                        <button
                          onClick={() => handleViewExpense(exp)}
                          className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-[#f0f4ff] hover:text-[#0b27b1] transition-colors duration-200 shadow-sm"
                          title="View Expense"
                        >
                          <MdVisibility className="w-4 h-4" />
                        </button>
                      )}
                      {rolePermissions.can_edit && (
                        <button
                          onClick={() => handleEditExpense(exp)}
                          className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-[#f0f4ff] hover:text-[#0b27b1] transition-colors duration-200 shadow-sm"
                          title="Edit Expense"
                        >
                          <MdOutlineEdit className="w-4 h-4" />
                        </button>
                      )}
                      {rolePermissions.can_delete && (
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-red-50 hover:text-red-600 transition-colors duration-200 shadow-sm"
                          title="Delete Expense"
                        >
                          <MdOutlineDelete className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  No expenses found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Add/Edit Expense Modal */}
      <Dialog open={showAddModal || showEditModal} onClose={() => { setShowAddModal(false); setShowEditModal(false); setEditExpenseId(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editExpenseId ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Expense"
            value={expenseForm.expense}
            onChange={e => setExpenseForm(f => ({ ...f, expense: e.target.value }))}
            required
          />
          <TextField
            label="Paid To"
            value={expenseForm.paidTo}
            onChange={e => setExpenseForm(f => ({ ...f, paidTo: e.target.value }))}
            required
          />
          <TextField
            label="Date"
            type="date"
            value={expenseForm.date}
            onChange={e => setExpenseForm(f => ({ ...f, date: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            label="Amount"
            type="number"
            value={expenseForm.amount}
            onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))}
            required
          />
          <TextField
            label="Payment Method"
            select
            SelectProps={{ native: true }}
            value={expenseForm.paymentMethod}
            onChange={e => setExpenseForm(f => ({ ...f, paymentMethod: e.target.value }))}
            required
          >
            <option value="">Select Method</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Other">Other</option>
          </TextField>
          <TextField
            label="Status"
            select
            SelectProps={{ native: true }}
            value={expenseForm.status}
            onChange={e => setExpenseForm(f => ({ ...f, status: e.target.value }))}
            required
          >
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </TextField>
          {expenseForm.status === 'Pending' && (
            <TextField
              label="Balance"
              type="number"
              value={expenseForm.balance}
              onChange={e => setExpenseForm(f => ({ ...f, balance: e.target.value }))}
              required
              helperText="Balance to pay"
            />
          )}
          <TextField
            label="Remark"
            value={expenseForm.remark}
            onChange={e => setExpenseForm(f => ({ ...f, remark: e.target.value }))}
            multiline
            rows={2}
          />
          <Box>
            <label className="block text-sm font-medium text-[#03648a] mb-1">Receipt Upload</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleReceiptChange}
            />
            {receiptPreview && (
              <Box mt={1}>
                {receiptFile?.type === 'application/pdf' ? (
                  <iframe src={receiptPreview} title="Receipt PDF" style={{ width: '100%', height: 120 }} />
                ) : (
                  <img src={receiptPreview} alt="Receipt Preview" style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 8 }} />
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowAddModal(false); setShowEditModal(false); setEditExpenseId(null); }}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveExpense}
          >
            {editExpenseId ? 'Save Changes' : 'Save Expense'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* View Expense Modal */}
      <Dialog open={showViewModal} onClose={() => setShowViewModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Expense Details</DialogTitle>
        <DialogContent>
          {viewExpense && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {viewExpense.expense}
              </Typography>
              <Typography variant="body1">
                <strong>Paid To:</strong> {viewExpense.paidTo}
              </Typography>
              <Typography variant="body1">
                <strong>Date:</strong> {viewExpense.date ? new Date(viewExpense.date).toLocaleDateString() : '-'}
              </Typography>
              <Typography variant="body1">
                <strong>Amount:</strong> ₹{Number(viewExpense.amount).toFixed(2)}
              </Typography>
              <Typography variant="body1">
                <strong>Payment Method:</strong> {viewExpense.paymentMethod}
              </Typography>
              <Typography variant="body1">
                <strong>Status:</strong> {viewExpense.status}
              </Typography>
              <Typography variant="body1">
                <strong>Balance:</strong> ₹{Number(viewExpense.balance || 0).toFixed(2)}
              </Typography>
              <Typography variant="body1">
                <strong>Remark:</strong> {viewExpense.remark}
              </Typography>
              {viewExpense.receipt && (
                <Box mt={2}>
                  <Typography variant="body2" color="#03648a" fontWeight={600}>Receipt:</Typography>
                  {viewExpense.receipt.endsWith('.pdf') ? (
                    <a href={toUploadUrl(viewExpense.receipt)} target="_blank" rel="noopener noreferrer">View PDF</a>
                  ) : (
                    <img src={toUploadUrl(viewExpense.receipt)} alt="Receipt" style={{ width: 120, height: 120, objectFit: 'contain', borderRadius: 8 }} />
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowViewModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      {/* Receipt Modal */}
      <Dialog open={showReceiptModal} onClose={() => setShowReceiptModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Receipt</DialogTitle>
        <DialogContent>
          {modalReceiptSrc && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              {modalReceiptSrc.endsWith('.pdf') ? (
                <>
                  <iframe
                    src={modalReceiptSrc}
                    title="Receipt PDF"
                    style={{ width: '100%', height: '60vh', borderRadius: 8, border: '1px solid #e0e4ed' }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ mt: 2 }}
                    component="span"
                    onClick={() => handleDownload(modalReceiptSrc, 'receipt.pdf')}
                  >
                    Download PDF
                  </Button>
                </>
              ) : (
                <>
                  <img
                    src={modalReceiptSrc}
                    alt="Receipt"
                    style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: 8, border: '1px solid #e0e4ed' }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ mt: 2 }}
                    component="span"
                    onClick={() => handleDownload(modalReceiptSrc, 'receipt.jpg')}
                  >
                    Download Image
                  </Button>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReceiptModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
