import { useState, useEffect } from 'react';
import api from '../utils/axios';
import { MdVisibility, MdOutlineEdit, MdOutlineDelete } from 'react-icons/md';
import { Search } from '@mui/icons-material';

const RETURN_REASON_OPTIONS = ['Wrong Medicine', 'Expiry Date'];

export default function PharmacyReturnsRefunds({ showAddForm, setShowAddForm }) {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [methodFilter, setMethodFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [form, setForm] = useState({
    billNumber: '',
    product_id: '',
    quantity: '1',
    date: '',
    medicine: '',
    batch: '',
    expiry: '',
    reason: '',
    refundAmount: '',
    method: '',
    pharmacistNotes: '',
    customerName: '',
    customerContact: ''
  });
  const [billLookupLoading, setBillLookupLoading] = useState(false);
  const [billLookupError, setBillLookupError] = useState('');
  const [billLookupMessage, setBillLookupMessage] = useState('');
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [selectedInvoiceItemKey, setSelectedInvoiceItemKey] = useState('');
  const [editRefund, setEditRefund] = useState(null);
  const [viewRefund, setViewRefund] = useState(null);

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

  useEffect(() => { fetchRefunds(); }, [categoryFilter, methodFilter, reasonFilter]);
  useEffect(() => { fetchCategories(); }, []);
  const formatDateForInput = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  };
  const getItemQuantity = (item) => Number(item?.quantity ?? item?.qty) || 1;
  const getItemUnitPrice = (item) => {
    const price = Number(item?.price ?? item?.retail ?? item?.defaultMRP ?? item?.mrp);
    return Number.isFinite(price) ? price : null;
  };
  const getItemAmount = (item) => {
    const price = getItemUnitPrice(item);
    if (!Number.isFinite(price)) return '';
    return (price * getItemQuantity(item)).toFixed(2);
  };
  const normalizeInvoiceItem = (item, idx) => {
    const medicineName = String(item?.name || '').trim();
    const quantity = getItemQuantity(item);
    const productId = Number(item?.id ?? item?.medicineId);
    return {
      key: String(item?.id ?? item?.medicineId ?? `${medicineName}-${idx}`),
      product_id: Number.isInteger(productId) && productId > 0 ? productId : null,
      medicine: medicineName || `Item ${idx + 1}`,
      quantity,
      batch: item?.batch || item?.barcode || '',
      expiry: formatDateForInput(item?.expiryDate || item?.expiry),
      refundAmount: getItemAmount(item)
    };
  };

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const params = {};
      if (categoryFilter && categoryFilter !== 'all') params.category = categoryFilter;
      if (methodFilter && methodFilter !== 'all') params.method = methodFilter;
      if (reasonFilter && reasonFilter !== 'all') params.reason = reasonFilter;
      const res = await api.get('/pharmacy-returns-refunds', { params });
      const refundData = Array.isArray(res.data)
        ? res.data
        : (Array.isArray(res.data?.data) ? res.data.data : []);
      setRefunds(refundData);
    } catch {
      setRefunds([]);
    } finally {
      setLoading(false);
    }
  };
  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch {
      setCategories([]);
    }
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    if (name === 'billNumber') {
      setBillLookupError('');
      setBillLookupMessage('');
      setInvoiceItems([]);
      setSelectedInvoiceItemKey('');
    }
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // ... previous state ...
  const [medicinesList, setMedicinesList] = useState([]);
  const [customersList, setCustomersList] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // branch_id is automatically added by axios interceptor
        const [medRes, custRes] = await Promise.all([
          api.get('/medicines'),
          api.get('/customers')
        ]);
        const medicineData = Array.isArray(medRes.data)
          ? medRes.data
          : (Array.isArray(medRes.data?.data) ? medRes.data.data : []);
        const customerData = Array.isArray(custRes.data)
          ? custRes.data
          : (Array.isArray(custRes.data?.data) ? custRes.data.data : []);

        setMedicinesList(medicineData);
        setCustomersList(customerData);
      } catch (err) {
        console.error("Failed to fetch data for dropdowns", err);
      }
    };
    fetchData();
  }, []);

  const handleInputChangeSpecial = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updates = { ...prev, [name]: value };
      if (name === 'medicine') {
        const med = medicinesList.find(m => m.name === value);
        if (med) {
          updates.batch = med.batch || med.barcode || '';
          updates.product_id = med.id || '';
        }
      }
      if (name === 'customerName') {
        const cust = customersList.find(c => c.name === value);
        if (cust) {
          updates.customerContact = cust.phone;
        }
      }
      return updates;
    });
  };

  const applyInvoiceItemToForm = (item, sale) => {
    if (!item) return;
    setForm(prev => ({
      ...prev,
      billNumber: sale?.bill_number || prev.billNumber,
      date: formatDateForInput(sale?.date) || prev.date,
      medicine: item.medicine || prev.medicine,
      product_id: item.product_id || '',
      quantity: String(item.quantity || prev.quantity || 1),
      batch: item.batch || prev.batch,
      expiry: item.expiry || prev.expiry,
      refundAmount: item.refundAmount || prev.refundAmount,
      customerName: sale?.customer || prev.customerName,
      customerContact: sale?.customer_phone || prev.customerContact
    }));
  };

  const handleInvoiceItemChange = (e, saleSnapshot = null) => {
    const key = e.target.value;
    setSelectedInvoiceItemKey(key);
    const selectedItem = invoiceItems.find(item => item.key === key);
    if (selectedItem) {
      applyInvoiceItemToForm(selectedItem, saleSnapshot);
    }
  };

  const handleBillLookup = async () => {
    const billNumber = (form.billNumber || '').trim();
    if (!billNumber) {
      setBillLookupError('Bill number is required.');
      setBillLookupMessage('');
      setInvoiceItems([]);
      setSelectedInvoiceItemKey('');
      return;
    }

    setBillLookupLoading(true);
    setBillLookupError('');
    setBillLookupMessage('');

    try {
      const res = await api.get(`/sales-details/bill/${encodeURIComponent(billNumber)}`);
      const sale = res.data?.data || res.data;
      const items = Array.isArray(sale?.items) ? sale.items : [];
      const normalizedItems = items.map((item, idx) => normalizeInvoiceItem(item, idx));
      const firstItem = normalizedItems[0] || null;
      const fallbackRefund = sale?.total !== undefined && sale?.total !== null
        ? String(sale.total)
        : '';

      setInvoiceItems(normalizedItems);
      setSelectedInvoiceItemKey(firstItem?.key || '');

      setForm(prev => ({
        ...prev,
        billNumber: sale?.bill_number || billNumber,
        date: formatDateForInput(sale?.date) || prev.date,
        customerName: sale?.customer || prev.customerName,
        customerContact: sale?.customer_phone || prev.customerContact,
        refundAmount: firstItem?.refundAmount || fallbackRefund || prev.refundAmount
      }));

      if (firstItem) {
        applyInvoiceItemToForm(firstItem, sale);
      }

      if (normalizedItems.length > 1) {
        setBillLookupMessage(`Bill ${billNumber} loaded. Select medicine from dropdown.`);
      } else if (normalizedItems.length === 1) {
        setBillLookupMessage(`Bill ${billNumber} loaded.`);
      } else {
        setBillLookupMessage(`Bill ${billNumber} loaded. No medicine items found.`);
      }
    } catch (err) {
      setBillLookupError(err?.response?.data?.message || 'Bill not found.');
      setBillLookupMessage('');
      setInvoiceItems([]);
      setSelectedInvoiceItemKey('');
    } finally {
      setBillLookupLoading(false);
    }
  };

  const handleAddOrUpdate = async e => {
    e.preventDefault();
    try {
      const branch_id = localStorage.getItem('branch_id');
      if (!branch_id) {
        alert("Branch ID missing"); return;
      }
      const payload = {
        ...form,
        refundAmount: Number(form.refundAmount) || 0,
        quantity: Number(form.quantity) || 1,
        product_id: form.product_id ? Number(form.product_id) : null,
        branch_id: parseInt(branch_id, 10)
      };

      // Sanitize payload: convert empty strings to null
      Object.keys(payload).forEach(key => {
        if (payload[key] === '') {
          payload[key] = null;
        }
      });

      if (editRefund) {
        await api.put(`/pharmacy-returns-refunds/${editRefund.id}`, payload);
      } else {
        await api.post('/pharmacy-returns-refunds', payload);
      }
      setShowAddForm(false);
      setEditRefund(null);
      setForm({
        billNumber: '', product_id: '', quantity: '1', date: '', medicine: '', batch: '', expiry: '', reason: '', refundAmount: '',
        method: '', pharmacistNotes: '', customerName: '', customerContact: ''
      });
      setBillLookupError('');
      setBillLookupMessage('');
      setInvoiceItems([]);
      setSelectedInvoiceItemKey('');
      fetchRefunds();
    } catch {
      alert('Failed to save refund');
    }
  };

  const handleEdit = refund => {
    setEditRefund(refund);
    setShowAddForm(true);
    setBillLookupError('');
    setBillLookupMessage('');
    setInvoiceItems([]);
    setSelectedInvoiceItemKey('');
    setForm({
      billNumber: refund.billNumber || '',
      product_id: refund.product_id || '',
      quantity: String(refund.quantity || 1),
      date: formatDateForInput(refund.date),
      medicine: refund.medicine,
      batch: refund.batch,
      expiry: formatDateForInput(refund.expiry),
      reason: RETURN_REASON_OPTIONS.includes(refund.reason) ? refund.reason : '',
      refundAmount: refund.refundAmount,
      method: refund.method,
      pharmacistNotes: refund.pharmacistNotes,
      customerName: refund.customerName,
      customerContact: refund.customerContact
    });
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this refund?')) return;
    try {
      // Remove branch_id from URL, axios interceptor will add it
      await api.delete(`/pharmacy-returns-refunds/${id}`);
      fetchRefunds();
    } catch {
      alert('Failed to delete');
    }
  };

  const handleView = refund => setViewRefund(refund);

  // Filtered refunds
  const filteredRefunds = refunds.filter(r => {
    const matchesSearch =
      (r.medicine && r.medicine.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.customerName && String(r.customerName).toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;
    const matchesMethod = methodFilter === 'all' || r.method === methodFilter;
    const matchesReason = reasonFilter === 'all' || r.reason === reasonFilter;
    return matchesSearch && matchesCategory && matchesMethod && matchesReason;
  });
  return (
    <div>
      {/* Filter/Search Bar */}
      <div className="bg-white rounded-lg p-3 shadow-[0_2px_6px_rgba(0,0,0,0.1)] mb-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-[#5a6e9a] mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by medicine/customer..."
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
            <label className="block text-xs font-medium text-[#5a6e9a] mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[180px]">
            <label className="block text-xs font-medium text-[#5a6e9a] mb-1">Refund Method</label>
            <select
              value={methodFilter}
              onChange={e => setMethodFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg"
            >
              <option value="all">All Methods</option>
              {[...new Set(refunds.map(r => r.method).filter(Boolean))].map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[180px]">
            <label className="block text-xs font-medium text-[#5a6e9a] mb-1">Reason</label>
            <select
              value={reasonFilter}
              onChange={e => setReasonFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg"
            >
              <option value="all">All Reasons</option>
              {RETURN_REASON_OPTIONS.map(reason => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setMethodFilter('all');
                setReasonFilter('all');
              }}
              className="px-3 py-1.5 bg-white text-[#5a6e9a] rounded-lg text-sm font-medium border border-[#e0e4ed] shadow-[0_2px_4px_rgba(0,0,0,0.05)] hover:bg-gray-50 transition-all duration-200 active:translate-y-px"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>
      {showAddForm && (
        <form onSubmit={handleAddOrUpdate} className="bg-white p-6 rounded-lg shadow-[0_2px_6px_rgba(0,0,0,0.1)] mb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Bill / Invoice Number</label>
              <div className="flex gap-2">
                <input
                  name="billNumber"
                  value={form.billNumber}
                  onChange={handleInputChange}
                  onBlur={handleBillLookup}
                  placeholder="Enter bill number"
                  required
                  className="w-full px-3 py-2 border border-[#e0e4ed] rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleBillLookup}
                  disabled={billLookupLoading || !form.billNumber.trim()}
                  className="px-4 py-2 rounded-lg bg-[#0b27b1] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {billLookupLoading ? 'Loading...' : 'Fetch'}
                </button>
              </div>
              {billLookupError && <div className="mt-1 text-xs text-red-600">{billLookupError}</div>}
              {billLookupMessage && <div className="mt-1 text-xs text-green-700">{billLookupMessage}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" name="date" value={form.date} onChange={handleInputChange} required className="w-full px-3 py-2 border border-[#e0e4ed] rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name</label>
              {invoiceItems.length > 0 ? (
                <select
                  value={selectedInvoiceItemKey}
                  onChange={e => handleInvoiceItemChange(e)}
                  required
                  className="w-full px-3 py-2 border border-[#e0e4ed] rounded-lg"
                >
                  <option value="">Select medicine from invoice</option>
                  {invoiceItems.map(item => (
                    <option key={item.key} value={item.key}>
                      {item.medicine} (Qty: {item.quantity})
                    </option>
                  ))}
                </select>
              ) : (
                <>
                  <input list="medicinesList" name="medicine" value={form.medicine} onChange={handleInputChangeSpecial} placeholder="Medicine Name" required className="w-full px-3 py-2 border border-[#e0e4ed] rounded-lg" />
                  <datalist id="medicinesList">
                    {medicinesList.map(m => <option key={m.id} value={m.name} />)}
                  </datalist>
                </>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                name="quantity"
                value={form.quantity}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-[#e0e4ed] rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
              <input name="batch" value={form.batch} onChange={handleInputChange} placeholder="Batch Number" className="w-full px-3 py-2 border border-[#e0e4ed] rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input type="date" name="expiry" value={form.expiry} onChange={handleInputChange} className="w-full px-3 py-2 border border-[#e0e4ed] rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Return</label>
              <select
                name="reason"
                value={form.reason}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-[#e0e4ed] rounded-lg"
              >
                <option value="">Select Reason</option>
                {RETURN_REASON_OPTIONS.map(reason => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Refund Amount</label>
              <input type="number" name="refundAmount" value={form.refundAmount} onChange={handleInputChange} placeholder="Amount" required className="w-full px-3 py-2 border border-[#e0e4ed] rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Refund Method</label>
              <input name="method" value={form.method} onChange={handleInputChange} placeholder="Cash/Card/etc" required className="w-full px-3 py-2 border border-[#e0e4ed] rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pharmacist Notes</label>
              <input name="pharmacistNotes" value={form.pharmacistNotes} onChange={handleInputChange} placeholder="Notes" className="w-full px-3 py-2 border border-[#e0e4ed] rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input list="customersList" name="customerName" value={form.customerName} onChange={handleInputChangeSpecial} placeholder="Customer Name" required className="w-full px-3 py-2 border border-[#e0e4ed] rounded-lg" />
              <datalist id="customersList">
                {customersList.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Contact</label>
              <input name="customerContact" value={form.customerContact} onChange={handleInputChange} placeholder="Phone/Email" required className="w-full px-3 py-2 border border-[#e0e4ed] rounded-lg" />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <button type="button" onClick={() => { setShowAddForm(false); setEditRefund(null); setBillLookupError(''); setBillLookupMessage(''); setInvoiceItems([]); setSelectedInvoiceItemKey(''); }} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold">Cancel</button>
            <button type="submit" className="bg-[#0b27b1] hover:bg-[#0a1f8f] text-white px-4 py-2 rounded-lg font-semibold">
              {editRefund ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      )}
      <div className="overflow-x-auto rounded-lg shadow-[0_2px_6px_rgba(0,0,0,0.1)] bg-white">
        <table className="min-w-full divide-y divide-[#e0e4ed]" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-[#f8f9fd]">
            <tr>
              <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Date</th>
              <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Bill No</th>
              <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Medicine</th>
              <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Qty</th>
              <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Batch</th>
              <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Expiry</th>
              <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Reason</th>
              <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Refund</th>
              <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Method</th>
              <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Pharmacist Notes</th>
              <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Customer</th>
              <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Contact</th>
              <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#e0e4ed]">
            {loading ? (
              <tr><td colSpan={13} className="text-center py-8 text-[#5a6e9a]">Loading...</td></tr>
            ) : filteredRefunds.length === 0 ? (
              <tr><td colSpan={13} className="text-center py-8 text-[#5a6e9a]">No refunds found.</td></tr>
            ) : filteredRefunds.map(r => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-2 py-2 text-center text-[#2d3748]">{r.date ? r.date.slice(0, 10) : ''}</td>
                <td className="px-2 py-2 text-center text-[#2d3748]">{r.billNumber || '-'}</td>
                <td className="px-2 py-2 text-center text-[#2d3748]">{r.medicine}</td>
                <td className="px-2 py-2 text-center text-[#2d3748]">{r.quantity || 1}</td>
                <td className="px-2 py-2 text-center text-[#2d3748]">{r.batch}</td>
                <td className="px-2 py-2 text-center text-[#2d3748]">{r.expiry ? r.expiry.slice(0, 10) : ''}</td>
                <td className="px-2 py-2 text-center text-[#2d3748]">{r.reason}</td>
                <td className="px-2 py-2 text-center text-[#2d3748]">{r.refundAmount}</td>
                <td className="px-2 py-2 text-center text-[#2d3748]">{r.method}</td>
                <td className="px-2 py-2 text-center text-[#2d3748]">{r.pharmacistNotes}</td>
                <td className="px-2 py-2 text-center text-[#2d3748]">{r.customerName}</td>
                <td className="px-2 py-2 text-center text-[#2d3748]">{r.customerContact}</td>
                <td className="px-2 py-2 whitespace-nowrap text-center text-sm">
                  <div className="flex justify-center items-center space-x-1">
                    {rolePermissions.can_view && (
                      <button
                        onClick={() => handleView(r)}
                        className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-[#f0f4ff] hover:text-[#0b27b1] transition-colors duration-200 shadow-sm"
                        title="View Refund"
                      >
                        <MdVisibility className="w-4 h-4" />
                      </button>
                    )}
                    {rolePermissions.can_edit && (
                      <button
                        onClick={() => handleEdit(r)}
                        className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-[#f0f4ff] hover:text-[#0b27b1] transition-colors duration-200 shadow-sm"
                        title="Edit Refund"
                      >
                        <MdOutlineEdit className="w-4 h-4" />
                      </button>
                    )}
                    {rolePermissions.can_delete && (
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-red-50 hover:text-red-600 transition-colors duration-200 shadow-sm"
                        title="Delete Refund"
                      >
                        <MdOutlineDelete className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {viewRefund && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold mb-2">Refund Details</h2>
            <div>Date: {viewRefund.date ? viewRefund.date.slice(0, 10) : ''}</div>
            <div>Bill No: {viewRefund.billNumber || '-'}</div>
            <div>Medicine: {viewRefund.medicine}</div>
            <div>Quantity: {viewRefund.quantity || 1}</div>
            <div>Batch: {viewRefund.batch}</div>
            <div>Expiry: {viewRefund.expiry ? viewRefund.expiry.slice(0, 10) : ''}</div>
            <div>Reason: {viewRefund.reason}</div>
            <div>Refund Amount: {viewRefund.refundAmount}</div>
            <div>Method: {viewRefund.method}</div>
            <div>Pharmacist Notes: {viewRefund.pharmacistNotes}</div>
            <div>Customer: {viewRefund.customerName}</div>
            <div>Contact: {viewRefund.customerContact}</div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setViewRefund(null)} className="px-4 py-2 bg-[#0b27b1] text-white rounded">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
