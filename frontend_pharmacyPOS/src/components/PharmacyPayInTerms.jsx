import { useState, useEffect } from 'react';
import { MdVisibility, MdOutlineEdit, MdOutlineDelete } from 'react-icons/md';
import { Search } from '@mui/icons-material';
import api from '../utils/axios';

export default function PharmacyPayInTerms({ showAddForm, setShowAddForm }) {
  const [customers, setCustomers] = useState([]);
  const [medicinesList, setMedicinesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [paymentCycleFilter, setPaymentCycleFilter] = useState('all');
  const [termDurationFilter, setTermDurationFilter] = useState('all');
  const [form, setForm] = useState({
    name: '',
    contact: '',
    prescriptionId: '',
    medicineBatch: '',
    expiryDate: '',
    pharmacistNotes: '',
    creditLimit: '',
    termDuration: '',
    paymentCycle: '',
    invoiceDate: '',
    dueDate: ''
  });
  const [editCustomer, setEditCustomer] = useState(null);
  const [viewCustomer, setViewCustomer] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);

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

  useEffect(() => { fetchCustomers(); }, [categoryFilter, paymentCycleFilter, termDurationFilter]);
  useEffect(() => { fetchCategories(); }, []);
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (categoryFilter && categoryFilter !== 'all') params.category = categoryFilter;
      if (paymentCycleFilter && paymentCycleFilter !== 'all') params.paymentCycle = paymentCycleFilter;
      if (termDurationFilter && termDurationFilter !== 'all') params.termDuration = termDurationFilter;
      const res = await api.get('/pharmacy-pay-in-terms', { params });
      const termsData = Array.isArray(res.data)
        ? res.data
        : (Array.isArray(res.data?.data) ? res.data.data : []);
      setCustomers(termsData);
    } catch {
      setCustomers([]);
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
    setForm(prev => ({ ...prev, [name]: value }));
  };


  const [customersList, setCustomersList] = useState([]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        // branch_id is automatically added by axios interceptor
        const [customersRes, medicinesRes] = await Promise.all([
          api.get('/customers'),
          api.get('/medicines')
        ]);

        const customerData = Array.isArray(customersRes.data)
          ? customersRes.data
          : (Array.isArray(customersRes.data?.data) ? customersRes.data.data : []);
        const medicineData = Array.isArray(medicinesRes.data)
          ? medicinesRes.data
          : (Array.isArray(medicinesRes.data?.data) ? medicinesRes.data.data : []);

        setCustomersList(customerData);
        setMedicinesList(medicineData);
      } catch (err) {
        console.error('Failed to fetch dropdown data', err);
      }
    };
    fetchDropdownData();
  }, []);

  const handleCreateCustomerChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updates = { ...prev, [name]: value };
      // Auto-fill contact if name matches a customer
      if (name === 'name') {
        const customer = customersList.find(c => c.name === value);
        if (customer) {
          updates.contact = customer.phone;
        }
      }
      return updates;
    });
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
        branch_id: parseInt(branch_id, 10)
      };

      // Sanitize payload: convert empty strings to null, especially for dates
      Object.keys(payload).forEach(key => {
        if (payload[key] === '') {
          payload[key] = null;
        }
      });

      console.log('Sending PayInTerms Payload:', payload);

      if (editCustomer) {
        await api.put(`/pharmacy-pay-in-terms/${editCustomer.id}`, payload);
      } else {
        await api.post('/pharmacy-pay-in-terms', payload);
      }
      setShowAddForm(false);
      setEditCustomer(null);
      setForm({
        name: '', contact: '', prescriptionId: '', medicineBatch: '', expiryDate: '',
        pharmacistNotes: '', creditLimit: '', termDuration: '', paymentCycle: '',
        invoiceDate: '', dueDate: ''
      });
      fetchCustomers();
    } catch (err) {
      console.error(err);
      alert('Failed to save customer: ' + (err.response?.data?.error || err.message));
    }
  };

  // ... (render part)
  // Inside the form render:
  // Replace the name input:
  /*
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input list="customersList" name="name" value={form.name} onChange={handleCreateCustomerChange} placeholder="Customer Name" required className="..."/>
              <datalist id="customersList">
                {customersList.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
            </div>
  */


  const handleEdit = customer => {
    setEditCustomer(customer);
    setShowAddForm(true);
    setForm({
      name: customer.name,
      contact: customer.contact,
      prescriptionId: customer.prescriptionId,
      medicineBatch: customer.medicineBatch,
      expiryDate: customer.expiryDate ? customer.expiryDate.slice(0, 10) : '', // Fix: ensure date format
      pharmacistNotes: customer.pharmacistNotes,
      creditLimit: customer.creditLimit,
      termDuration: customer.termDuration,
      paymentCycle: customer.paymentCycle,
      invoiceDate: customer.invoiceDate ? customer.invoiceDate.slice(0, 10) : '', // Fix: ensure date format
      dueDate: customer.dueDate ? customer.dueDate.slice(0, 10) : '' // Fix: ensure date format
    });
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this customer?')) return;
    try {
      await api.delete(`/pharmacy-pay-in-terms/${id}`);
      fetchCustomers();
    } catch {
      alert('Failed to delete');
    }
  };

  const handleView = async customer => {
    setViewCustomer(customer);
    try {
      const res = await api.get(`/pharmacy-pay-in-terms/${customer.id}/payments`);
      setPaymentHistory(res.data);
    } catch {
      setPaymentHistory([]);
    }
  };

  // Filtered customers
  const filteredCustomers = customers.filter(c => {
    const matchesSearch =
      (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.contact && String(c.contact).toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    const matchesPaymentCycle = paymentCycleFilter === 'all' || c.paymentCycle === paymentCycleFilter;
    const matchesTermDuration = termDurationFilter === 'all' || c.termDuration === termDurationFilter;
    return matchesSearch && matchesCategory && matchesPaymentCycle && matchesTermDuration;
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
                placeholder="Search by name/contact..."
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
            <label className="block text-xs font-medium text-[#5a6e9a] mb-1">Payment Cycle</label>
            <select
              value={paymentCycleFilter}
              onChange={e => setPaymentCycleFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg"
            >
              <option value="all">All Cycles</option>
              {[...new Set(customers.map(c => c.paymentCycle).filter(Boolean))].map(cycle => (
                <option key={cycle} value={cycle}>{cycle}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[180px]">
            <label className="block text-xs font-medium text-[#5a6e9a] mb-1">Term Duration</label>
            <select
              value={termDurationFilter}
              onChange={e => setTermDurationFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg"
            >
              <option value="all">All Durations</option>
              {[...new Set(customers.map(c => c.termDuration).filter(Boolean))].map(term => (
                <option key={term} value={term}>{term}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setPaymentCycleFilter('all');
                setTermDurationFilter('all');
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input list="customersList" name="name" value={form.name} onChange={handleCreateCustomerChange} placeholder="Customer Name" required className="w-full px-3 py-2 border border-[#e0e4ed] rounded-lg" />
              <datalist id="customersList">
                {customersList.map(c => <option key={c.id} value={c.name} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <input name="contact" value={form.contact} onChange={handleInputChange} placeholder="Contact" required className="w-full px-3 py-2 border border-[#e0e4ed] rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prescription ID</label>
              <input name="prescriptionId" value={form.prescriptionId} onChange={handleInputChange} placeholder="Prescription ID" className="w-full px-3 py-2 border border-[#e0e4ed] rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Batch</label>
              <input
                list="medicinesList"
                name="medicineBatch"
                value={form.medicineBatch}
                onChange={handleInputChange}
                placeholder="Select Medicine Name"
                className="w-full px-3 py-2 border border-[#e0e4ed] rounded-lg"
              />
              <datalist id="medicinesList">
                {medicinesList.map(m => <option key={m.id} value={m.name} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input type="date" name="expiryDate" value={form.expiryDate} onChange={handleInputChange} className="w-full px-3 py-2 border border-[#e0e4ed] rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pharmacist Notes</label>
              <input name="pharmacistNotes" value={form.pharmacistNotes} onChange={handleInputChange} placeholder="Pharmacist Notes" className="w-full px-3 py-2 border border-[#e0e4ed] rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit</label>
              <input type="number" name="creditLimit" value={form.creditLimit} onChange={handleInputChange} placeholder="Credit Limit" required className="w-full px-3 py-2 border border-[#e0e4ed] rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Term Duration</label>
              <input name="termDuration" value={form.termDuration} onChange={handleInputChange} placeholder="e.g. 30 Days" required className="w-full px-3 py-2 border border-[#e0e4ed] rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Cycle</label>
              <input name="paymentCycle" value={form.paymentCycle} onChange={handleInputChange} placeholder="e.g. Monthly" required className="w-full px-3 py-2 border border-[#e0e4ed] rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
              <input type="date" name="invoiceDate" value={form.invoiceDate} onChange={handleInputChange} required className="w-full px-3 py-2 border border-[#e0e4ed] rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input type="date" name="dueDate" value={form.dueDate} onChange={handleInputChange} required className="w-full px-3 py-2 border border-[#e0e4ed] rounded-lg" />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <button type="button" onClick={() => { setShowAddForm(false); setEditCustomer(null); }} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold">Cancel</button>
            <button type="submit" className="bg-[#0b27b1] hover:bg-[#0a1f8f] text-white px-4 py-2 rounded-lg font-semibold">
              {editCustomer ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      )}
      <div className="overflow-x-auto rounded-lg shadow-[0_2px_6px_rgba(0,0,0,0.1)] bg-white">
        <table className="min-w-full divide-y divide-[#e0e4ed]" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-[#f8f9fd]">
            <tr>
              <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Name</th>
              <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Contact</th>
              <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Prescription</th>
              <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Batch</th>
              <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Expiry</th>
              <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Credit Limit</th>
              <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Term</th>
              <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Cycle</th>
              <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Invoice</th>
              <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Due</th>
              <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#e0e4ed]">
            {loading ? (
              <tr><td colSpan={11} className="text-center py-8 text-[#5a6e9a]">Loading...</td></tr>
            ) : filteredCustomers.length === 0 ? (
              <tr><td colSpan={11} className="text-center py-8 text-[#5a6e9a]">No customers found.</td></tr>
            ) : filteredCustomers.map(customer => (
              <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-2 py-2 text-center text-[#2d3748]">{customer.name}</td>
                <td className="px-2 py-2 text-center text-[#2d3748]">{customer.contact}</td>
                <td className="px-2 py-2 text-center text-[#2d3748]">{customer.prescriptionId}</td>
                <td className="px-2 py-2 text-center text-[#2d3748]">{customer.medicineBatch}</td>
                <td className="px-2 py-2 text-center text-[#2d3748]">{customer.expiryDate ? customer.expiryDate.slice(0, 10) : ''}</td>
                <td className="px-2 py-2 text-center text-[#2d3748]">{customer.creditLimit}</td>
                <td className="px-2 py-2 text-center text-[#2d3748]">{customer.termDuration}</td>
                <td className="px-2 py-2 text-center text-[#2d3748]">{customer.paymentCycle}</td>
                <td className="px-2 py-2 text-center text-[#2d3748]">{customer.invoiceDate ? customer.invoiceDate.slice(0, 10) : ''}</td>
                <td className="px-2 py-2 text-center text-[#2d3748]">{customer.dueDate ? customer.dueDate.slice(0, 10) : ''}</td>
                <td className="px-2 py-2 whitespace-nowrap text-center text-sm">
                  <div className="flex justify-center items-center space-x-1">
                    {rolePermissions.can_view && (
                      <button
                        onClick={() => handleView(customer)}
                        className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-[#f0f4ff] hover:text-[#0b27b1] transition-colors duration-200 shadow-sm"
                        title="View Customer"
                      >
                        <MdVisibility className="w-4 h-4" />
                      </button>
                    )}
                    {rolePermissions.can_edit && (
                      <button
                        onClick={() => handleEdit(customer)}
                        className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-[#f0f4ff] hover:text-[#0b27b1] transition-colors duration-200 shadow-sm"
                        title="Edit Customer"
                      >
                        <MdOutlineEdit className="w-4 h-4" />
                      </button>
                    )}
                    {rolePermissions.can_delete && (
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-red-50 hover:text-red-600 transition-colors duration-200 shadow-sm"
                        title="Delete Customer"
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
      {viewCustomer && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold mb-2">{viewCustomer.name} - Details</h2>
            <div className="mb-2">Prescription: {viewCustomer.prescriptionId}</div>
            <div className="mb-2">Medicine Batch: {viewCustomer.medicineBatch}</div>
            <div className="mb-2">Expiry: {viewCustomer.expiryDate ? viewCustomer.expiryDate.slice(0, 10) : ''}</div>
            <div className="mb-2">Pharmacist Notes: {viewCustomer.pharmacistNotes}</div>
            <div className="mb-2">Credit Limit: {viewCustomer.creditLimit}</div>
            <div className="mb-2">Term Duration: {viewCustomer.termDuration}</div>
            <div className="mb-2">Payment Cycle: {viewCustomer.paymentCycle}</div>
            <div className="mb-2">Invoice Date: {viewCustomer.invoiceDate ? viewCustomer.invoiceDate.slice(0, 10) : ''}</div>
            <div className="mb-2">Due Date: {viewCustomer.dueDate ? viewCustomer.dueDate.slice(0, 10) : ''}</div>
            <h3 className="mt-4 mb-2 font-semibold">Payment History</h3>
            <ul>
              {paymentHistory.length === 0 ? (
                <li>No payments found.</li>
              ) : paymentHistory.map(ph => (
                <li key={ph.id}>{ph.date}: {ph.amount} ({ph.notes})</li>
              ))}
            </ul>
            <div className="flex justify-end mt-4">
              <button onClick={() => setViewCustomer(null)} className="px-4 py-2 bg-blue-600 text-white rounded">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// All requests use api (axios instance) which injects branch_id automatically
