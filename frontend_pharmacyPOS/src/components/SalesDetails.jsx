import React, { useState, useImperativeHandle, forwardRef, useEffect } from 'react';
import { MdVisibility, MdOutlineEdit, MdOutlineDelete } from 'react-icons/md';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Search } from '@mui/icons-material';
import api from '../utils/axios';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

const SalesDetails = forwardRef((props, ref) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    date: '',
    customer: '',
    items: [{ name: '', quantity: 1 }],
    total: ''
  });
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [medicineOptions, setMedicineOptions] = useState([]); // For MasterMedicine table
  const [viewSale, setViewSale] = useState(null);
  const [editSale, setEditSale] = useState(null);
  // Only keep filters needed for sales: searchTerm, date, customer, item, min, max
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    date: '',
    customer: '',
    item: '',
    min: '',
    max: ''
  });

  // Fetch sales details and item names from stock table
  useEffect(() => {
    fetchSales();
    fetchMedicineOptions();
    // Remove fetchCategories and fetchVariants
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sales-details');
      // Debug: log sales and items structure
      console.log('[SALEDETAILS DEBUG] sales:', res.data);
      res.data.forEach(sale => {
        console.log('[SALEDETAILS DEBUG] sale.items:', sale.items);
      });
      const formatted = res.data.map(sale => ({
        ...sale,
        date: sale.date
          ? typeof sale.date === 'string'
            ? sale.date.slice(0, 10)
            : new Date(sale.date).toISOString().slice(0, 10)
          : '',
        items: Array.isArray(sale.items) ? sale.items : []
      }));
      setSales(formatted);
    } catch (err) {
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch medicines from MasterMedicine table for dropdown
  const fetchMedicineOptions = async () => {
    try {
      const res = await api.get('/medicines');
      // Accept both {data:[]} and [] formats
      const meds = Array.isArray(res.data.data) ? res.data.data : [];
      setMedicineOptions(meds.map(med => ({
        id: med.id,
        name: med.name,
        genericName: med.genericName,
        label: med.name + (med.genericName ? ` (${med.genericName})` : '')
      })));
    } catch (err) {
      setMedicineOptions([]);
    }
  };

  // Add item row in form
  const addItemRow = () => {
    setForm(f => ({
      ...f,
      items: [...f.items, { name: '', quantity: 1 }]
    }));
  };

  // Remove item row in form
  const removeItemRow = (idx) => {
    setForm(f => ({
      ...f,
      items: f.items.filter((_, i) => i !== idx)
    }));
  };

  // Handle form input change
  const handleFormChange = (e, idx = null, field = null) => {
    if (idx !== null && field) {
      // Item row change
      const items = [...form.items];
      items[idx][field] = field === 'quantity' ? Number(e.target.value) : e.target.value;
      setForm(f => ({ ...f, items }));
    } else {
      setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    }
  };

  // View sale handler
  const handleViewSale = (sale) => {
    setViewSale(sale);
  };

  // Edit sale handler
  const handleEditSale = (sale) => {
    setEditSale(sale);
    setShowAddForm(true);
    setForm({
      date: sale.date,
      customer: sale.customer,
      items: sale.items.map(i => ({ name: i.name, quantity: i.quantity })),
      total: sale.total
    });
  };

  // Delete sale handler
  const handleDeleteSale = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sale?')) return;
    try {
      await api.delete(`/sales-details/${id}`);
      setSales(prev => prev.filter(sale => sale.id !== id));
    } catch (err) {
      alert('Failed to delete sale');
    }
  };

  // Handle form submit (add or edit)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editSale) {
        // Call PUT endpoint for update
        await api.put(`/sales-details/${editSale.id}`, {
          date: form.date,
          customer: form.customer,
          items: form.items,
          total: form.total
        });
        setEditSale(null);
        setShowAddForm(false);
        setForm({
          date: '',
          customer: '',
          items: [{ name: '', quantity: 1 }],
          total: ''
        });
        fetchSales();
        return;
      }
      await api.post('/sales-details', {
        date: form.date,
        customer: form.customer,
        items: form.items,
        total: form.total
      });
      setShowAddForm(false);
      setForm({
        date: '',
        customer: '',
        items: [{ name: '', quantity: 1 }],
        total: ''
      });
      fetchSales();
    } catch (err) {
      alert('Failed to add or update sales. Please check your input.');
    }
  };

  // In the add sales form, ensure each item row can select a different medicine from MasterMedicine table
  // and that the same item cannot be selected twice in the same sale

  // Helper to get available options for a dropdown (exclude already selected except current)
  const getAvailableOptions = (idx) => {
    const selectedNames = form.items.map((item, i) => i !== idx ? item.name : null).filter(Boolean);
    return medicineOptions.filter(opt => !selectedNames.includes(opt.name));
  };

  // Filtered sales based on needed filters
  const filteredSales = sales.filter(sale => {
    // Search by customer or item name
    const matchesSearch =
      !searchTerm ||
      (sale.customer && sale.customer.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sale.items && sale.items.some(item => item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchDate = !filters.date || sale.date === filters.date;
    const matchCustomer = !filters.customer || sale.customer.toLowerCase().includes(filters.customer.toLowerCase());
    const matchItem = !filters.item || sale.items.some(item => item.name === filters.item);
    const matchMin = !filters.min || Number(sale.total) >= Number(filters.min);
    const matchMax = !filters.max || Number(sale.total) <= Number(filters.max);

    return matchesSearch && matchDate && matchCustomer && matchItem && matchMin && matchMax;
  });

  // Expose openAddForm method to parent via ref
  useImperativeHandle(ref, () => ({
    openAddForm: () => setShowAddForm(true)
  }));

  return (
    <div>
      {/* Filter Section - only needed filters for sales */}
      <div className="bg-white rounded-lg p-3 shadow-[0_2px_6px_rgba(0,0,0,0.1)] mb-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-[#5a6e9a] mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search sales..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
          <div className="min-w-[120px]">
            <label className="block text-xs font-medium text-[#5a6e9a] mb-1">Date</label>
            <input
              type="date"
              value={filters.date}
              onChange={e => setFilters(f => ({ ...f, date: e.target.value }))}
              className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
            />
          </div>
          <div className="min-w-[120px]">
            <label className="block text-xs font-medium text-[#5a6e9a] mb-1">Customer</label>
            <input
              type="text"
              placeholder="Customer name"
              value={filters.customer}
              onChange={e => setFilters(f => ({ ...f, customer: e.target.value }))}
              className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
            />
          </div>
          <div className="min-w-[120px]">
            <label className="block text-xs font-medium text-[#5a6e9a] mb-1">Item</label>
            <select
              value={filters.item}
              onChange={e => setFilters(f => ({ ...f, item: e.target.value }))}
              className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
            >
              <option value="">All Items</option>
              {medicineOptions.map((med, i) => (
                <option key={i} value={med.name}>{med.name}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[100px]">
            <label className="block text-xs font-medium text-[#5a6e9a] mb-1">Min Total</label>
            <input
              type="number"
              min="0"
              placeholder="Min"
              value={filters.min}
              onChange={e => setFilters(f => ({ ...f, min: e.target.value }))}
              className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
            />
          </div>
          <div className="min-w-[100px]">
            <label className="block text-xs font-medium text-[#5a6e9a] mb-1">Max Total</label>
            <input
              type="number"
              min="0"
              placeholder="Max"
              value={filters.max}
              onChange={e => setFilters(f => ({ ...f, max: e.target.value }))}
              className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setFilters({ date: '', customer: '', item: '', min: '', max: '' });
              }}
              className="px-3 py-1.5 bg-white text-[#5a6e9a] rounded-lg text-sm font-medium border border-[#e0e4ed] shadow-[0_2px_4px_rgba(0,0,0,0.05)] hover:bg-gray-50 transition-all duration-200 active:translate-y-px"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>
      {showAddForm ? (
        <form
          className="p-6 space-y-6 rounded-xl shadow border border-[#b6e0fe] mb-6 relative z-10 bg-white"
          onSubmit={handleFormSubmit}
        >
          <div className="flex flex-wrap items-center justify-between pb-2 border-b border-[#e0eefa] mb-4">
            <h2 className="text-xl font-bold text-[#03648a] flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-r from-[#e4f4fa] to-[#b6e0fe] flex items-center justify-center shadow">
                <PlusIcon className="h-5 w-5 text-[#0492C2]" />
              </div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#0492C2] to-[#b6e0fe]">
                Add Sales
              </span>
            </h2>
            <span className="text-xs font-medium px-2 py-1 bg-gradient-to-r from-white to-[#e4f4fa] text-[#0492C2] rounded-full border border-[#e0eefa]">
              All fields required
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#03648a] mb-1">Date</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleFormChange}
                className="w-full px-4 py-2.5 border rounded-lg border-[#e0eefa] hover:border-[#b6e0fe] focus:ring-2 focus:ring-[#0492C2] focus:border-transparent transition"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#03648a] mb-1">Customer Name</label>
              <input
                type="text"
                name="customer"
                value={form.customer}
                onChange={handleFormChange}
                className="w-full px-4 py-2.5 border rounded-lg border-[#e0eefa] hover:border-[#b6e0fe] focus:ring-2 focus:ring-[#0492C2] focus:border-transparent transition"
                placeholder="Enter customer name"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#03648a] mb-1">Items &amp; Quantity</label>
            <div className="space-y-2">
              {form.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  {/* Use Autocomplete for medicine selection */}
                  <Autocomplete
                    options={getAvailableOptions(idx)}
                    getOptionLabel={option => option.label || option.name}
                    value={medicineOptions.find(opt => opt.name === item.name) || null}
                    onChange={(e, newValue) => {
                      setForm(f => {
                        const items = [...f.items];
                        items[idx].name = newValue ? newValue.name : '';
                        return { ...f, items };
                      });
                    }}
                    renderInput={params => (
                      <TextField
                        {...params}
                        placeholder="Select or type medicine"
                        variant="outlined"
                        size="small"
                        required
                      />
                    )}
                    freeSolo
                    sx={{ minWidth: 180, flex: 1 }}
                  />
                  <input
                    type="number"
                    min={1}
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={e => handleFormChange(e, idx, 'quantity')}
                    className="w-20 px-3 py-2 border border-[#e0eefa] rounded-lg focus:ring-2 focus:ring-[#0492C2] focus:border-transparent"
                    required
                  />
                  {form.items.length > 1 && (
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-700 font-bold px-2"
                      onClick={() => removeItemRow(idx)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              className="flex items-center text-[#0492C2] hover:underline text-sm mt-2"
              onClick={addItemRow}
              disabled={form.items.length >= medicineOptions.length}
            >
              <PlusIcon className="w-4 h-4 mr-1" />
              Add Item
            </button>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#03648a] mb-1">Total Bill</label>
            <input
              type="number"
              name="total"
              value={form.total}
              onChange={handleFormChange}
              className="w-full px-4 py-2.5 border rounded-lg border-[#e0eefa] hover:border-[#b6e0fe] focus:ring-2 focus:ring-[#0492C2] focus:border-transparent transition"
              required
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm shadow hover:bg-gray-300 transition"
              onClick={() => {
                setShowAddForm(false);
                setEditSale(null);
                setForm({
                  date: '',
                  customer: '',
                  items: [{ name: '', quantity: 1 }],
                  total: ''
                });
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-[#0492C2] to-[#b6e0fe] text-white rounded-lg font-semibold text-sm shadow-md hover:from-[#037ba1] hover:to-[#b6e0fe] transition-all duration-200"
            >
              {editSale ? 'Update Sale' : 'Save Sales'}
            </button>
          </div>
        </form>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#e0eefa] bg-white shadow mb-8">
          <table className="min-w-full divide-y divide-[#e0e4ed] text-xs md:text-sm">
            <thead className="bg-[#f8f9fd]">
              <tr>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">SN</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Date</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Customer Name</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Items &amp; Quantity</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Total Bill</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#e0e4ed]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-[#0492C2] font-semibold">
                    Loading...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-gray-400">
                    No sales found.
                  </td>
                </tr>
              ) : (
                filteredSales.map((transaction, idx) => (
                  <tr
                    key={transaction.id}
                    className="hover:bg-gray-50 transition-colors align-middle"
                  >
                    <td className="px-2 py-2 text-center font-bold text-[#0492C2]">{idx + 1}</td>
                    <td className="px-2 py-2 text-center text-[#03648a]">{transaction.date}</td>
                    <td className="px-2 py-2 text-center text-[#03648a]">{transaction.customer}</td>
                    <td className="px-2 py-2 text-center text-[#03648a]">
                      {transaction.items.map((item, i) => (
                        <span
                          key={i}
                          className="bg-[#e4f4fa] text-[#03648a] px-2 py-0.5 rounded-full text-xs mr-1 inline-block mb-0.5"
                        >
                          {item.name} <span className="font-bold">x{item.quantity}</span>
                        </span>
                      ))}
                    </td>
                    <td className="px-2 py-2 text-center text-[#03648a]">
                      LKR {Number(transaction.total).toLocaleString()}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <div className="flex justify-center items-center space-x-1">
                        <button
                          className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-[#f0f4ff] hover:text-[#0b27b1] transition-colors duration-200 shadow-sm"
                          title="View Sale"
                          onClick={() => handleViewSale(transaction)}
                        >
                          <MdVisibility className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-[#f0f4ff] hover:text-[#0b27b1] transition-colors duration-200 shadow-sm"
                          title="Edit Sale"
                          onClick={() => handleEditSale(transaction)}
                        >
                          <MdOutlineEdit className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-red-50 hover:text-red-600 transition-colors duration-200 shadow-sm"
                          title="Delete Sale"
                          onClick={() => handleDeleteSale(transaction.id)}
                        >
                          <MdOutlineDelete className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <style>{`
            .items-table-row {
              border-radius: 18px !important;
              background: #fff !important;
              margin-bottom: 14px !important;
              box-shadow: 0 6px 24px 0 rgba(4,146,194,0.10), 0 1.5px 4px 0 rgba(4,146,194,0.06) !important;
              border: 1.5px solid #e0eefa !important;
              transition: 
                box-shadow 0.25s cubic-bezier(.4,0,.2,1),
                transform 0.25s cubic-bezier(.4,0,.2,1),
                background 0.2s;
          `}</style>
        </div>
      )}

      {/* View Sale Modal */}
      {viewSale && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-[#b6e0fe] p-6 max-w-lg w-full">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-[#0492C2]">Sale Details</h2>
              <button
                onClick={() => setViewSale(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            <div className="space-y-2">
              <div><span className="font-semibold text-[#03648a]">Date:</span> {viewSale.date}</div>
              <div><span className="font-semibold text-[#03648a]">Customer:</span> {viewSale.customer}</div>
              <div>
                <span className="font-semibold text-[#03648a]">Items:</span>
                <ul className="list-disc ml-6">
                  {viewSale.items.map((item, i) => (
                    <li key={i}>{item.name} x{item.quantity}</li>
                  ))}
                </ul>
              </div>
              <div><span className="font-semibold text-[#03648a]">Total:</span> LKR {Number(viewSale.total).toLocaleString()}</div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setViewSale(null)}
                className="px-6 py-2 bg-gradient-to-r from-[#0492C2] to-[#b6e0fe] text-white rounded-lg font-semibold shadow hover:from-[#037ba1] hover:to-[#b6e0fe] transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default SalesDetails;
