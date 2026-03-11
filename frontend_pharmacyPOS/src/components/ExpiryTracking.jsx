import React, { useEffect, useState } from 'react';
import { Search } from '@mui/icons-material';
import { toApiUrl } from '../config/api';

const API_GRN = toApiUrl('/grn');
const API_MEDICINES = toApiUrl('/medicines');

function getStatus(expiry, quantity) {
  if (!expiry) return 'Active';
  const today = new Date();
  const expDate = new Date(expiry);
  if (expDate < today) return 'Expired';
  const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
  if (diffDays <= 60) return quantity > 0 ? 'Near Expiry' : 'Expired';
  return 'Active';
}

function getAlert(status, quantity) {
  if (status === 'Expired') return 'Expired';
  if (status === 'Near Expiry') return quantity > 0 ? 'Expiry Soon' : 'Expired';
  if (quantity === 0) return 'Out of Stock';
  return '';
}

export default function ExpiryTracking({ showFilter }) {
  const [batches, setBatches] = useState([]);
  const [medicines, setMedicines] = useState([]);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    fetch(API_MEDICINES)
      .then(res => res.json())
      .then(data => setMedicines(data.data || []))
      .catch(() => setMedicines([]));
  }, []);

  useEffect(() => {
    fetch(API_GRN)
      .then(res => res.json())
      .then(data => {
        const today = new Date();
        // Flatten all batch items
        const allItems = [];
        (data.data || []).forEach(batch => {
          (batch.items || []).forEach(item => {
            allItems.push({
              ...item,
              batchNo: batch.grn_id,
              supplier: batch.supplier,
              invoice: batch.invoice,
              date: batch.date,
            });
          });
        });
        // Group by batchNo + medicine_id + expiry
        const batchMap = {};
        allItems.forEach(item => {
          const key = `${item.batchNo}_${item.medicine_id}_${item.expiry || ''}`;
          if (!batchMap[key]) {
            batchMap[key] = {
              batchNo: item.batchNo,
              medicineId: item.medicine_id,
              medicine: item.medicine_name,
              expiry: item.expiry,
              items: [],
              supplier: item.supplier,
              invoice: item.invoice,
              date: item.date,
            };
          }
          batchMap[key].items.push(item);
        });
        // Calculate quantity up to today for each batch
        const batchArr = Object.values(batchMap).map(b => {
          const quantity = b.items
            .filter(i => !i.expiry || new Date(i.expiry) >= today)
            .reduce((sum, i) => sum + (parseFloat(i.quantity) || 0), 0);
          const status = getStatus(b.expiry, quantity);
          const alert = getAlert(status, quantity);
          return {
            batchNo: b.batchNo,
            medicine: b.medicine,
            expiry: b.expiry,
            quantity,
            status,
            alert,
            supplier: b.supplier,
            invoice: b.invoice,
            date: b.date,
          };
        });
        setBatches(batchArr);
      })
      .catch(() => setBatches([]));
  }, [medicines]);

  // Unique suppliers for dropdown
  const suppliers = Array.from(new Set(batches.map(b => b.supplier).filter(Boolean)));

  // Filtered batches
  const filteredBatches = batches.filter(b => {
    // Search by medicine, batchNo, supplier, invoice
    const matchesSearch =
      !searchTerm ||
      (b.medicine && b.medicine.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.batchNo && String(b.batchNo).includes(searchTerm)) ||
      (b.supplier && b.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.invoice && b.invoice.toLowerCase().includes(searchTerm.toLowerCase()));
    // Status filter
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && b.status === 'Active') ||
      (statusFilter === 'expired' && b.status === 'Expired') ||
      (statusFilter === 'near' && b.status === 'Near Expiry');
    // Supplier filter
    const matchesSupplier = supplierFilter === 'all' || b.supplier === supplierFilter;
    // Date range filter (purchase date)
    const batchDate = b.date ? b.date.slice(0, 10) : '';
    const matchesDate =
      (!dateRange.startDate || batchDate >= dateRange.startDate) &&
      (!dateRange.endDate || batchDate <= dateRange.endDate);

    return matchesSearch && matchesStatus && matchesSupplier && matchesDate;
  });

  return (
    <div>
      {/* Filter Section */}
      <div className="bg-white rounded-lg p-3 shadow-[0_2px_6px_rgba(0,0,0,0.1)] mb-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-[#5a6e9a] mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search expiry..."
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
              onChange={e => setSupplierFilter(e.target.value)}
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
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="near">Near Expiry</option>
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
                setStatusFilter('all');
                setSupplierFilter('all');
                setDateRange({ startDate: '', endDate: '' });
              }}
              className="px-3 py-1.5 bg-white text-[#5a6e9a] rounded-lg text-sm font-medium border border-[#e0e4ed] shadow-[0_2px_4px_rgba(0,0,0,0.05)] hover:bg-gray-50 transition-all duration-200 active:translate-y-px"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>
      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-[#e0e4ed] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#e0e4ed]">
            <thead className="bg-[#f8f9fd]">
              <tr>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Batch No</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Medicine</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Expiry Date</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Quantity</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Status</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Alert</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Supplier</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Invoice</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Purchase Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#e0e4ed]">
              {filteredBatches.length > 0 ? filteredBatches.map((b, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-2 py-2 text-center">{b.batchNo}</td>
                  <td className="px-2 py-2 text-center">{b.medicine}</td>
                  <td className="px-2 py-2 text-center">{b.expiry ? new Date(b.expiry).toLocaleDateString() : '-'}</td>
                  <td className="px-2 py-2 text-center">{b.quantity}</td>
                  <td className="px-2 py-2 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${b.status === 'Expired' ? 'bg-[#e4f4fa] text-[#0b27b1]'
                        : b.status === 'Near Expiry' ? 'bg-[#f0f4ff] text-[#5a6e9a]'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-center">
                    {b.alert && (
                      <span className="px-2 py-1 rounded-full text-xs bg-[#e4f4fa] text-[#03648a]">{b.alert}</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-center">{b.supplier}</td>
                  <td className="px-2 py-2 text-center">{b.invoice || '-'}</td>
                  <td className="px-2 py-2 text-center">{b.date ? new Date(b.date).toLocaleDateString() : '-'}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">No batch data found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

