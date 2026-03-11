
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import { MdAdd, MdOutlineEdit, MdOutlineDelete, MdVisibility } from 'react-icons/md';
import { Search } from '@mui/icons-material';

export default function Discounts() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editDiscount, setEditDiscount] = useState(null);
  const [viewDiscount, setViewDiscount] = useState(null);
  const [form, setForm] = useState({
    name: '',
    type: 'percentage',
    value: '',
    items: [''],
    startDate: '',
    endDate: '',
    status: 'Active'
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const navigate = useNavigate();

  // Fetch discounts and summary counts
  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/discounts');
      setDiscounts(res.data || []);
    } catch (err) {
      alert('Failed to fetch discounts');
    }
    setLoading(false);
  };

  // Derived summary counts
  const totalActive = discounts.filter(d => d.status === 'Active').length;
  const totalInactive = discounts.filter(d => d.status === 'Inactive').length;
  const totalDiscounts = discounts.length;

  // Filtering logic
  const filtered = discounts.filter(d => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (Array.isArray(d.items) ? d.items.join(',').toLowerCase().includes(search.toLowerCase()) : false);
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    const matchesType = typeFilter === 'all' || d.type === typeFilter;
    const matchesStart = !dateRange.start || (d.startDate && d.startDate >= dateRange.start);
    const matchesEnd = !dateRange.end || (d.endDate && d.endDate <= dateRange.end);
    return matchesSearch && matchesStatus && matchesType && matchesStart && matchesEnd;
  });

  // Handlers

  // --- Render ---
  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 min-h-screen">
      <div className="w-full max-w-7xl mx-auto pt-0 px-6 pb-6">
        {/* Back Button */}
        <button
          className="mb-4 px-5 py-2 bg-white/80 border border-slate-200 rounded-xl shadow hover:bg-slate-100 text-[#0b27b1] font-semibold transition-all duration-200"
          onClick={() => navigate('/dashboard/home')}
        >
          ← Back
        </button>
        {/* Summary Section */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-[180px] bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/60 shadow-lg shadow-slate-200/20 text-center">
            <div className="text-xs font-semibold text-[#0492C2] mb-1">Active Discounts</div>
            <div className="text-2xl font-bold text-[#0492C2]">{totalActive}</div>
          </div>
          <div className="flex-1 min-w-[180px] bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/60 shadow-lg shadow-slate-200/20 text-center">
            <div className="text-xs font-semibold text-[#f87171] mb-1">Inactive Discounts</div>
            <div className="text-2xl font-bold text-[#f87171]">{totalInactive}</div>
          </div>
          <div className="flex-1 min-w-[180px] bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/60 shadow-lg shadow-slate-200/20 text-center">
            <div className="text-xs font-semibold text-[#0b27b1] mb-1">Total Discounts</div>
            <div className="text-2xl font-bold text-[#0b27b1]">{totalDiscounts}</div>
          </div>
          <div className="flex items-center justify-end flex-1 min-w-[220px]">
            <button
              className="group relative px-6 py-3 bg-gradient-to-r from-[#0b27b1] to-[#1e40af] text-white rounded-xl font-semibold shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-200/60 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center"
              onClick={() => {
                setShowForm(true);
                setEditDiscount(null);
                setForm({
                  name: '',
                  type: 'percentage',
                  value: '',
                  items: [''],
                  startDate: '',
                  endDate: '',
                  status: 'Active'
                });
              }}
            >
              <MdAdd className="text-lg mr-2" />
              <span>Add Discount</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#083093] to-[#0b27b1] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
            </button>
          </div>
        </div>
        {/* Filters */}
        <div className="bg-white rounded-lg p-3 shadow-[0_2px_6px_rgba(0,0,0,0.1)] mb-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-[#5a6e9a] mb-1">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search discounts..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
            <div className="min-w-[140px]">
              <label className="block text-xs font-medium text-[#5a6e9a] mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
              >
                <option value="all">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
            <div className="min-w-[140px]">
              <label className="block text-xs font-medium text-[#5a6e9a] mb-1">Type</label>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
              >
                <option value="all">All</option>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>
            <div className="min-w-[180px]">
              <label className="block text-xs font-medium text-[#5a6e9a] mb-1">Date Range</label>
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
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setDateRange({ start: '', end: '' });
                }}
                className="px-3 py-1.5 bg-white text-[#5a6e9a] rounded-lg text-sm font-medium border border-[#e0e4ed] shadow-[0_2px_4px_rgba(0,0,0,0.05)] hover:bg-gray-50 transition-all duration-200 active:translate-y-px"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
        {/* Discounts Table */}
        <div className="overflow-x-auto rounded-lg border border-[#e0eefa] bg-white shadow mb-8">
          <table className="min-w-full divide-y divide-[#e0e4ed] text-xs md:text-sm">
            <thead className="bg-[#f8f9fd]">
              <tr>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Name</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Type</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Value</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Items</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Start Date</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">End Date</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Status</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#e0e4ed]">
              {filtered.length > 0 ? (
                filtered.map((d, idx) => (
                  <tr key={d.id || idx} className="hover:bg-gray-50 transition-colors align-middle">
                    <td className="px-2 py-2 text-center">{d.name}</td>
                    <td className="px-2 py-2 text-center">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${d.type === 'percentage' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'}`}>{d.type === 'percentage' ? 'Percentage' : 'Fixed'}</span>
                    </td>
                    <td className="px-2 py-2 text-center">{d.type === 'percentage' ? `${d.value}%` : `₹${Number(d.value).toFixed(2)}`}</td>
                    <td className="px-2 py-2 text-center">{
                      Array.isArray(d.items)
                        ? d.items.join(', ')
                        : typeof d.items === 'string' && d.items.trim().startsWith('[')
                          ? (() => { try { return JSON.parse(d.items).join(', '); } catch { return d.items; } })()
                          : d.items || ''
                    }</td>
                    <td className="px-2 py-2 text-center">{d.startDate ? new Date(d.startDate).toLocaleDateString() : '-'}</td>
                    <td className="px-2 py-2 text-center">{d.endDate ? new Date(d.endDate).toLocaleDateString() : '-'}</td>
                    <td className="px-2 py-2 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold
                          ${d.status === 'Active'
                            ? 'bg-[#e4f4fa] text-[#0492C2]'
                            : d.status === 'Inactive'
                              ? 'bg-[#f8fafc] text-[#b6e0fe]'
                              : 'bg-slate-200 text-slate-600'}
                        `}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <div className="flex justify-center items-center space-x-1">
                        <button
                          className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-[#f0f4ff] hover:text-[#0b27b1] transition-colors duration-200 shadow-sm"
                          title="View Discount"
                          onClick={() => handleView(d.id)}
                        >
                          <MdVisibility className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-[#f0f4ff] hover:text-[#0b27b1] transition-colors duration-200 shadow-sm"
                          title="Edit Discount"
                          onClick={() => handleEdit(d)}
                        >
                          <MdOutlineEdit className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-red-50 hover:text-red-600 transition-colors duration-200 shadow-sm"
                          title="Delete Discount"
                          onClick={() => handleDelete(d.id)}
                        >
                          <MdOutlineDelete className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400">No discounts found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Add/Edit Discount Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <form className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative" onSubmit={handleSubmit}>
              <button type="button" className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 text-xl" onClick={() => { setShowForm(false); setEditDiscount(null); }}>&times;</button>
              <h2 className="text-xl font-bold mb-4 text-[#0b27b1]">{editDiscount ? 'Edit Discount' : 'Add Discount'}</h2>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Discount Name</label>
                <input name="name" value={form.name} onChange={handleFormChange} required className="w-full border border-slate-200 rounded-lg px-3 py-2" />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Type</label>
                <select name="type" value={form.type} onChange={handleFormChange} required className="w-full border border-slate-200 rounded-lg px-3 py-2">
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Value</label>
                <input name="value" type="number" value={form.value} onChange={handleFormChange} required className="w-full border border-slate-200 rounded-lg px-3 py-2" />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Items (multiple allowed)</label>
                <div className="flex flex-col gap-2">
                  {(form.items || []).map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input value={item} onChange={e => handleItemsChange(idx, e.target.value)} placeholder="Item name or code" required className="flex-1 border border-slate-200 rounded-lg px-3 py-2" />
                      {form.items.length > 1 && (
                        <button type="button" className="text-red-500 text-lg px-2" onClick={() => removeItemRow(idx)}>&times;</button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="text-blue-600 text-sm mt-1" onClick={addItemRow}>+ Add Item</button>
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input name="startDate" type="date" value={form.startDate} onChange={handleFormChange} required className="w-full border border-slate-200 rounded-lg px-3 py-2" />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input name="endDate" type="date" value={form.endDate} onChange={handleFormChange} required className="w-full border border-slate-200 rounded-lg px-3 py-2" />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">Status</label>
                <select name="status" value={form.status} onChange={handleFormChange} required className="w-full border border-slate-200 rounded-lg px-3 py-2">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold" onClick={() => { setShowForm(false); setEditDiscount(null); }}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#0b27b1] to-[#1e40af] text-white font-semibold shadow hover:shadow-lg transition-all">{editDiscount ? 'Update Discount' : 'Add Discount'}</button>
              </div>
            </form>
          </div>
        )}
        {/* View Discount Modal */}
        {viewDiscount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative">
              <button type="button" className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 text-xl" onClick={() => setViewDiscount(null)}>&times;</button>
              <h2 className="text-xl font-bold mb-4 text-[#0b27b1]">Discount Details</h2>
              <div className="mb-2"><span className="font-semibold">Name:</span> {viewDiscount.name}</div>
              <div className="mb-2"><span className="font-semibold">Type:</span> {viewDiscount.type === 'percentage' ? 'Percentage' : 'Fixed'}</div>
              <div className="mb-2"><span className="font-semibold">Value:</span> {viewDiscount.type === 'percentage' ? `${viewDiscount.value}%` : `₹${viewDiscount.value}`}</div>
              <div className="mb-2"><span className="font-semibold">Items:</span> {(viewDiscount.items || []).join(', ')}</div>
              <div className="mb-2"><span className="font-semibold">Start Date:</span> {viewDiscount.startDate ? new Date(viewDiscount.startDate).toLocaleDateString() : '-'}</div>
              <div className="mb-2"><span className="font-semibold">End Date:</span> {viewDiscount.endDate ? new Date(viewDiscount.endDate).toLocaleDateString() : '-'}</div>
              <div className="mb-2"><span className="font-semibold">Status:</span> {viewDiscount.status}</div>
              <div className="flex justify-end mt-4">
                <button className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-semibold" onClick={() => setViewDiscount(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  // Handle form input change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  // Handle change for items array
  const handleItemsChange = (idx, value) => {
    setForm(f => ({
      ...f,
      items: f.items.map((item, i) => i === idx ? value : item)
    }));
  };

  // Add item row
  const addItemRow = () => {
    setForm(f => ({
      ...f,
      items: [...(f.items || []), '']
    }));
  };

  // Remove item row
  const removeItemRow = (idx) => {
    setForm(f => ({
      ...f,
      items: f.items.filter((_, i) => i !== idx)
    }));
  };

  // Add or update discount
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        // Only send items, remove item
        items: JSON.stringify(form.items.filter(i => i && i.trim() !== ''))
      };
      if (editDiscount) {
        await api.put(`/discounts/${editDiscount.id}`, payload);
      } else {
        await api.post('/discounts', payload);
      }
      setShowForm(false);
      setEditDiscount(null);
      setForm({
        name: '',
        type: 'percentage',
        value: '',
        items: [''],
        startDate: '',
        endDate: '',
        status: 'Active'
      });
      fetchDiscounts();
    } catch (err) {
      alert('Failed to save discount');
    }
  };

  // View discount (fetch latest from backend)
  const handleView = async (id) => {
    try {
      const res = await api.get(`/discounts/${id}`);
      setViewDiscount({
        ...res.data,
        items: typeof res.data.items === 'string' ? JSON.parse(res.data.items) : (res.data.items || [])
      });
    } catch (err) {
      alert('Failed to fetch discount details');
    }
  };

  // Edit discount (ensure date fields are yyyy-MM-dd)
  const handleEdit = (discount) => {
    setEditDiscount(discount);
    setShowForm(true);
    setForm({
      name: discount.name,
      type: discount.type,
      value: discount.value,
      items: Array.isArray(discount.items) && discount.items.length > 0 ? discount.items : [''],
      startDate: discount.startDate ? discount.startDate.slice(0, 10) : '',
      endDate: discount.endDate ? discount.endDate.slice(0, 10) : '',
      status: discount.status
    });
  };

  // Delete discount
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this discount?')) return;
    try {
      await api.delete(`/discounts/${id}`);
      fetchDiscounts();
    } catch (err) {
      alert('Failed to delete discount');
    }
  };

  return (
    <Box>
      {/* Back Button */}
      <Button
        variant="outlined"
        color="primary"
        sx={{ mb: 2 }}
        onClick={() => navigate('/dashboard/home')}
      >
        ← Back
      </Button>

      {/* Summary Section */}
      <Box display="flex" gap={3} mb={2} flexWrap="wrap">
        <Paper sx={{ p: 2, minWidth: 180, textAlign: 'center', background: '#f8fbfd', border: '1px solid #e0e4ed' }}>
          <Typography variant="subtitle2" color="#03648a">Active Discounts</Typography>
          <Typography variant="h6" color="#22c55e" fontWeight={700}>{totalActive}</Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 180, textAlign: 'center', background: '#f8fbfd', border: '1px solid #e0e4ed' }}>
          <Typography variant="subtitle2" color="#f87171">Inactive Discounts</Typography>
          <Typography variant="h6" color="#f87171" fontWeight={700}>{totalInactive}</Typography>
        </Paper>
        <Paper sx={{ p: 2, minWidth: 180, textAlign: 'center', background: '#f8fbfd', border: '1px solid #e0e4ed' }}>
          <Typography variant="subtitle2" color="#0b27b1">Total Discounts</Typography>
          <Typography variant="h6" color="#0b27b1" fontWeight={700}>{totalDiscounts}</Typography>
        </Paper>
        <Box flex={1} display="flex" alignItems="center" justifyContent="flex-end">
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlusIcon />}
            sx={{ borderRadius: 2 }}
            onClick={() => {
              setShowForm(true);
              setEditDiscount(null);
              setForm({
                name: '',
                type: 'percentage',
                value: '',
                items: [''],
                startDate: '',
                endDate: '',
                status: 'Active'
              });
            }}
          >
            Add Discount
          </Button>
        </Box>
      </Box>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-medium text-[#0b27b1] mb-1">Search</label>
          <input
            type="text"
            placeholder="Search by name or item..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-3 pr-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
          />
        </div>
        <div className="min-w-[140px]">
          <label className="block text-xs font-medium text-[#0b27b1] mb-1">Status</label>
          <Select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            size="small"
            fullWidth
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
            <MenuItem value="Expired">Expired</MenuItem>
          </Select>
        </div>
        <div className="min-w-[140px]">
          <label className="block text-xs font-medium text-[#0b27b1] mb-1">Type</label>
          <Select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            size="small"
            fullWidth
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="percentage">Percentage</MenuItem>
            <MenuItem value="fixed">Fixed</MenuItem>
          </Select>
        </div>
        <div className="min-w-[180px]">
          <label className="block text-xs font-medium text-[#0b27b1] mb-1">Date Range</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={e => setDateRange(r => ({ ...r, start: e.target.value }))}
              className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
            />
            <span className="flex items-center">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={e => setDateRange(r => ({ ...r, end: e.target.value }))}
              className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
            />
          </div>
        </div>
      </div>
      {/* Discounts Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((d, idx) => (
                <TableRow key={d.id || idx}>
                  <TableCell>{d.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={d.type === 'percentage' ? 'Percentage' : 'Fixed'}
                      color={d.type === 'percentage' ? 'primary' : 'secondary'}
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    {d.type === 'percentage' ? `${d.value}%` : `₹${Number(d.value).toFixed(2)}`}
                  </TableCell>
                  <TableCell>{(d.items || []).join(', ')}</TableCell>
                  <TableCell>{d.startDate ? new Date(d.startDate).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{d.endDate ? new Date(d.endDate).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={d.status}
                      color={d.status === 'Active' ? 'success' : d.status === 'Inactive' ? 'warning' : 'default'}
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center items-center space-x-1">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleView(d.id)}
                        sx={{ p: 0, minWidth: 0 }}
                        title="View"
                      >
                        <VisibilityIcon fontSize="small" />
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleEdit(d)}
                        sx={{ p: 0, minWidth: 0 }}
                        title="Edit"
                      >
                        <EditIcon fontSize="small" />
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        onClick={() => handleDelete(d.id)}
                        sx={{ p: 0, minWidth: 0 }}
                        title="Delete"
                      >
                        <DeleteIcon fontSize="small" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No discounts found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Add/Edit Discount Modal */}
      <Dialog open={showForm} onClose={() => { setShowForm(false); setEditDiscount(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>{editDiscount ? 'Edit Discount' : 'Add Discount'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Discount Name"
            name="name"
            value={form.name}
            onChange={handleFormChange}
            required
          />
          <TextField
            label="Type"
            name="type"
            select
            SelectProps={{ native: true }}
            value={form.type}
            onChange={handleFormChange}
            required
          >
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed Amount</option>
          </TextField>
          <TextField
            label="Value"
            name="value"
            type="number"
            value={form.value}
            onChange={handleFormChange}
            required
          />
          <Box>
            <label className="block text-sm font-medium text-[#03648a] mb-1">Items (multiple allowed)</label>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {(form.items || []).map((item, idx) => (
                <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    value={item}
                    onChange={e => handleItemsChange(idx, e.target.value)}
                    placeholder="Item name or code"
                    required
                    sx={{ flex: 1 }}
                  />
                  {form.items.length > 1 && (
                    <Button
                      type="button"
                      color="error"
                      onClick={() => removeItemRow(idx)}
                      sx={{ minWidth: 0, p: 0.5 }}
                    >
                      ×
                    </Button>
                  )}
                </Box>
              ))}
              <Button
                type="button"
                onClick={addItemRow}
                sx={{ mt: 1, minWidth: 0, fontSize: 13 }}
              >
                + Add Item
              </Button>
            </Box>
          </Box>
          <TextField
            label="Start Date"
            name="startDate"
            type="date"
            value={form.startDate}
            onChange={handleFormChange}
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            label="End Date"
            name="endDate"
            type="date"
            value={form.endDate}
            onChange={handleFormChange}
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            label="Status"
            name="status"
            select
            SelectProps={{ native: true }}
            value={form.status}
            onChange={handleFormChange}
            required
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Expired">Expired</option>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowForm(false); setEditDiscount(null); }}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
          >
            {editDiscount ? 'Update Discount' : 'Add Discount'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* View Discount Modal */}
      <Dialog open={!!viewDiscount} onClose={() => setViewDiscount(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Discount Details</DialogTitle>
        <DialogContent>
          {viewDiscount && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {viewDiscount.name}
              </Typography>
              <Typography variant="body1">
                <strong>Type:</strong> {viewDiscount.type === 'percentage' ? 'Percentage' : 'Fixed'}
              </Typography>
              <Typography variant="body1">
                <strong>Value:</strong> {viewDiscount.type === 'percentage' ? `${viewDiscount.value}%` : `₹${viewDiscount.value}`}
              </Typography>
              <Typography variant="body1">
                <strong>Items:</strong> {(viewDiscount.items || []).join(', ')}
              </Typography>
              <Typography variant="body1">
                <strong>Start Date:</strong> {viewDiscount.startDate ? new Date(viewDiscount.startDate).toLocaleDateString() : '-'}
              </Typography>
              <Typography variant="body1">
                <strong>End Date:</strong> {viewDiscount.endDate ? new Date(viewDiscount.endDate).toLocaleDateString() : '-'}
              </Typography>
              <Typography variant="body1">
                <strong>Status:</strong> {viewDiscount.status}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDiscount(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
