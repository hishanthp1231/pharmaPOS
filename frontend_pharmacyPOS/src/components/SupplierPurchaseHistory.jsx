import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import api from '../utils/axios';

export default function SupplierPurchaseHistory() {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState('');
  const [invoiceFilter, setInvoiceFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/grn');
      const batches = res.data.data || [];
      setHistory(batches);
    } catch {
      setHistory([]);
    }
  };

  // Group purchases by supplier
  const supplierMap = {};
  history.forEach(batch => {
    const key = batch.supplier || 'Unknown';
    if (!supplierMap[key]) supplierMap[key] = [];
    supplierMap[key].push(batch);
  });

  // Filter suppliers by search, invoice, and date
  const filteredSuppliers = Object.entries(supplierMap).filter(([supplier, purchases]) => {
    const matchesSupplier = supplier.toLowerCase().includes(search.toLowerCase());
    const matchesInvoice = !invoiceFilter || purchases.some(p => (p.invoice || '').toLowerCase().includes(invoiceFilter.toLowerCase()));
    const matchesDate = !dateFilter || purchases.some(p => p.date && p.date.slice(0, 10) === dateFilter);
    return matchesSupplier && matchesInvoice && matchesDate;
  });

  function SupplierCard({ supplier, purchases }) {
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
            {supplier}
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
              {purchases.map((purchase, idx) => (
                <Paper
                  key={purchase.grn_id}
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
                    GRN #{purchase.grn_id}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <b>Date:</b> {purchase.date ? new Date(purchase.date).toLocaleDateString() : '-'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    <b>Invoice:</b> {purchase.invoice || '-'}
                  </Typography>
                  <Typography variant="body2" color="#03648a">
                    <b>Items:</b>
                  </Typography>
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {Array.isArray(purchase.items) && purchase.items.length > 0 ? (
                      purchase.items.map((item, idx) => (
                        <li key={idx}>
                          {item.medicine_name} <b>x{item.quantity}</b> (MRP: ₹{Number(item.mrp).toFixed(2)})
                          {item.expiry && <span style={{ color: '#f87171', marginLeft: 8 }}>Expiry: {item.expiry}</span>}
                        </li>
                      ))
                    ) : (
                      <li>-</li>
                    )}
                  </ul>
                  <Typography variant="body2" color="#03648a" sx={{ mt: 1 }}>
                    <b>Batch Total:</b> ₹{purchase.items.reduce((sum, r) => sum + ((parseFloat(r.quantity) || 0) * (parseFloat(r.mrp) || 0)), 0).toFixed(2)}
                  </Typography>
                </Paper>
              ))}
            </Box>
          )}
        </Box>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="h6" color="#0b27b1" fontWeight={600} mb={2}>
        Supplier Purchase History
      </Typography>
      {/* Filters - styled like MedicineMaster */}
      <div className="bg-white rounded-lg p-3 shadow-[0_2px_6px_rgba(0,0,0,0.1)] mb-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-[#0b27b1] mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by supplier name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4" style={{ color: '#0b27b1' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              </div>
            </div>
          </div>
          <div className="min-w-[180px]">
            <label className="block text-xs font-medium text-[#0b27b1] mb-1">Invoice</label>
            <input
              type="text"
              placeholder="Filter by invoice..."
              value={invoiceFilter}
              onChange={e => setInvoiceFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg"
            />
          </div>
          <div className="min-w-[140px]">
            <label className="block text-xs font-medium text-[#0b27b1] mb-1">Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { setSearch(''); setInvoiceFilter(''); setDateFilter(''); }}
              className="px-3 py-1.5 bg-white text-[#0b27b1] rounded-lg text-sm font-medium border border-[#e0e4ed] shadow-[0_2px_4px_rgba(0,0,0,0.05)] hover:bg-gray-50 transition-all duration-200 active:translate-y-px"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>
      <Box display="flex" flexWrap="wrap" gap={3}>
        {filteredSuppliers.length === 0 ? (
          <Box width="100%" textAlign="center" py={4} color="#5a6e9a">
            No purchase history
          </Box>
        ) : (
          filteredSuppliers.map(([supplier, purchases], idx) => (
            <SupplierCard key={supplier} supplier={supplier} purchases={purchases} />
          ))
        )}
      </Box>
    </Box>
  );
}
