import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import api from '../utils/axios';
import { useBranch } from '../context/BranchContext';
import { useNavigate } from 'react-router-dom';

// Modern color palette
const COLORS = {
  primary: '#0ea5e9',
  primaryDark: '#0284c7',
  primaryLight: '#e0f2fe',
  accent: '#6366f1',
  accentLight: '#eef2ff',
  success: '#10b981',
  successLight: '#d1fae5',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  danger: '#ef4444',
  dangerLight: '#fee2e2',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e2e8f0',
  cardBg: '#ffffff',
  pageBg: '#f1f5f9',
};

const CHART_COLORS = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316'];

export default function Dashboard() {
  const navigate = useNavigate();
  const { branches, selectedBranch, setSelectedBranch } = useBranch();
  const [branchId, setBranchId] = useState(() => localStorage.getItem('branch_id') || '1');
  const [loading, setLoading] = useState(true);
  const [branchComparison, setBranchComparison] = useState([]);
  const [branchCompareLoading, setBranchCompareLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState('month'); // 'today' | 'month' | 'year'

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const normalizedRole = String(user?.role || '').toLowerCase().replace(/[\s-]+/g, '_');
  const isSuperAdmin = normalizedRole === 'super_admin' || normalizedRole === 'superadmin' || user?.username === 'superadmin' || user?.is_admin === true || user?.is_admin === 1;

  // Pagination
  const [salesPage, setSalesPage] = useState(0);
  const [expiriesPage, setExpiriesPage] = useState(0);

  // Data states
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [grnBatches, setGrnBatches] = useState([]);
  const [soldQuantities, setSoldQuantities] = useState([]);
  const [purchasedQuantities, setPurchasedQuantities] = useState({});

  // Sync with context if selectedBranch changes externally
  useEffect(() => {
    if (selectedBranch && String(selectedBranch.id) !== String(branchId)) {
      setBranchId(String(selectedBranch.id));
    }
  }, [selectedBranch]);

  useEffect(() => {
    setLoading(true);
    // Use branchId for API calls
    Promise.all([
      api.get('/sales-details', { params: { branch_id: branchId } }),
      api.get('/expenses', { params: { branch_id: branchId } }),
      api.get('/pharmacy-returns-refunds', { params: { branch_id: branchId } }),
      api.get('/medicines', { params: { branch_id: branchId } }),
      api.get('/customers', { params: { branch_id: branchId } }),
      api.get('/grn', { params: { branch_id: branchId } }),
      api.get('/sales-details/sold-quantities', { params: { branch_id: branchId } }),
      api.get('/grn/purchased-quantities', { params: { branch_id: branchId } })
    ]).then(([salesRes, expensesRes, refundsRes, medsRes, custRes, grnRes, soldRes, purchasedRes]) => {
      setSales(Array.isArray(salesRes.data) ? salesRes.data : (salesRes.data.data || []));
      setExpenses(Array.isArray(expensesRes.data.data) ? expensesRes.data.data : Array.isArray(expensesRes.data) ? expensesRes.data : []);
      setRefunds(Array.isArray(refundsRes.data) ? refundsRes.data : (Array.isArray(refundsRes.data?.data) ? refundsRes.data.data : []));
      setMedicines(Array.isArray(medsRes.data.data) ? medsRes.data.data : []);
      setCustomers(Array.isArray(custRes.data.data) ? custRes.data.data : []);
      setGrnBatches(Array.isArray(grnRes.data.data) ? grnRes.data.data : []);
      setSoldQuantities(Array.isArray(soldRes.data.data) ? soldRes.data.data : []);
      const pq = {};
      (purchasedRes.data?.data || []).forEach(row => {
        pq[row.medicine_id] = Number(row.total_purchased) || 0;
      });
      setPurchasedQuantities(pq);
    }).catch(() => {
      setSales([]); setExpenses([]); setMedicines([]); setCustomers([]);
      setRefunds([]); setGrnBatches([]); setSoldQuantities([]); setPurchasedQuantities({});
    }).finally(() => setLoading(false));
  }, [branchId]);

  useEffect(() => { localStorage.setItem('branch_id', branchId); }, [branchId]);

  useEffect(() => {
    if (!isSuperAdmin || !branches || branches.length <= 1) {
      setBranchComparison([]);
      return;
    }
    let cancelled = false;
    const fetchBranchComparison = async () => {
      setBranchCompareLoading(true);
      try {
        const branchList = branches || [];
        const results = await Promise.all(branchList.map(async (b) => {
          try {
            const [salesRes, expensesRes, refundsRes] = await Promise.all([
              api.get('/sales-details', { params: { branch_id: b.id } }),
              api.get('/expenses', { params: { branch_id: b.id } }),
              api.get('/pharmacy-returns-refunds', { params: { branch_id: b.id } })
            ]);
            const salesData = Array.isArray(salesRes.data) ? salesRes.data : (salesRes.data.data || []);
            const expensesData = Array.isArray(expensesRes.data.data) ? expensesRes.data.data : Array.isArray(expensesRes.data) ? expensesRes.data : [];
            const refundsData = Array.isArray(refundsRes.data) ? refundsRes.data : (Array.isArray(refundsRes.data?.data) ? refundsRes.data.data : []);
            const salesFiltered = salesData.filter(s => isWithinRange(s.date));
            const expensesFiltered = expensesData.filter(e => isWithinRange(e.date || e.created_at));
            const refundsFiltered = refundsData.filter(r => isWithinRange(r.date || r.created_at));
            const grossRevenue = salesFiltered.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
            const refundsTotal = refundsFiltered.reduce((sum, r) => sum + (Number(r.refundAmount ?? r.amount) || 0), 0);
            const revenue = grossRevenue - refundsTotal;
            const expensesTotal = expensesFiltered.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
            return {
              id: b.id,
              name: b.name || `Branch ${b.id}`,
              revenue,
              refunds: refundsTotal,
              expenses: expensesTotal,
              profit: revenue - expensesTotal,
              orders: salesFiltered.length
            };
          } catch {
            return {
              id: b.id,
              name: b.name || `Branch ${b.id}`,
              revenue: 0,
              refunds: 0,
              expenses: 0,
              profit: 0,
              orders: 0
            };
          }
        }));
        if (!cancelled) {
          setBranchComparison(results);
        }
      } finally {
        if (!cancelled) setBranchCompareLoading(false);
      }
    };
    fetchBranchComparison();
    return () => { cancelled = true; };
  }, [isSuperAdmin, branches, dateFilter]);

  // --- Date Range Helpers ---
  const parseLocalDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
      const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const [_, y, m, d] = match;
        return new Date(Number(y), Number(m) - 1, Number(d));
      }
    }
    const d = new Date(value);
    return isNaN(d) ? null : d;
  };

  const getDateRange = () => {
    const now = new Date();
    let start;
    let end;
    if (dateFilter === 'today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (dateFilter === 'year') {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else {
      // month (default)
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }
    return { start, end };
  };

  const { start: rangeStart, end: rangeEnd } = getDateRange();
  const isWithinRange = (value) => {
    const d = parseLocalDate(value);
    if (!d) return false;
    return d >= rangeStart && d <= rangeEnd;
  };

  const salesInRange = sales.filter(s => isWithinRange(s.date));
  const expensesInRange = expenses.filter(e => isWithinRange(e.date || e.created_at));
  const refundsInRange = refunds.filter(r => isWithinRange(r.date || r.created_at));
  const grnInRange = grnBatches.filter(b => isWithinRange(b.date));

  const periodLabel = dateFilter === 'today' ? 'Today' : dateFilter === 'year' ? 'This Year' : 'This Month';

  useEffect(() => {
    setSalesPage(0);
  }, [dateFilter, branchId]);

  // --- Aggregates ---
  const grossRevenue = salesInRange.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  const totalRefunds = refundsInRange.reduce((sum, r) => sum + (Number(r.refundAmount ?? r.amount) || 0), 0);
  const totalRevenue = grossRevenue - totalRefunds;
  const totalExpenses = expensesInRange.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const profitOrLoss = totalRevenue - totalExpenses;
  const totalOrders = salesInRange.length;
  const totalCustomers = customers.length;
  const totalMedicines = medicines.length;

  // --- Expiry & Low Stock ---
  function getExpiryDate(obj) {
    const keys = ['expiry_date', 'expiry', 'exp_date', 'exp', 'expiryDate'];
    for (const k of keys) {
      if (!obj) continue;
      const val = obj[k] ?? obj.expiry ?? obj.exp;
      if (!val) continue;
      const d = new Date(val);
      if (!isNaN(d)) return d;
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) return new Date(val.slice(0, 10));
    }
    return null;
  }
  const expiryDaysThreshold = Number(localStorage.getItem('expiry_days_threshold') || 90);
  const lowStockThreshold = Number(localStorage.getItem('low_stock_threshold') || 10);

  const grnItems = grnBatches.flatMap(batch => batch.items || []);
  const now = new Date();
  const expirySoonGrn = grnItems
    .map(item => ({ ...item, expiryDate: getExpiryDate(item), medicine_name: item.medicine_name || item.medicine || item.name || '' }))
    .filter(item => item.expiryDate && !isNaN(item.expiryDate))
    .map(item => ({ ...item, daysToExpiry: Math.ceil((item.expiryDate - now) / (1000 * 60 * 60 * 24)) }))
    .filter(item => item.daysToExpiry <= expiryDaysThreshold && item.daysToExpiry >= 0)
    .sort((a, b) => a.daysToExpiry - b.daysToExpiry)
    .slice(0, 10);

  const medGrnMap = {};
  grnItems.forEach(it => {
    const mid = String(it.medicine_id ?? it.medicine) || String(it.medicine_name || it.name || '');
    if (!medGrnMap[mid]) medGrnMap[mid] = [];
    medGrnMap[mid].push(it);
  });

  const medAggregates = (medicines || []).map(m => {
    const keyById = String(m.id);
    const purchased = purchasedQuantities[m.id] ?? (medGrnMap[keyById]?.reduce((s, b) => s + (Number(b.quantity) || 0), 0) || 0);
    const soldEntry = (soldQuantities || []).find(sq => String(sq.name).toLowerCase() === String(m.name).toLowerCase());
    const totalSold = soldEntry
      ? Number(soldEntry.total_sold || soldEntry.qty || soldEntry.sold || 0)
      : sales.reduce((sum, s) => {
        const items = Array.isArray(s.items) ? s.items : (Array.isArray(s.cart) ? s.cart : []);
        items.forEach(i => { const nm = i.name || i.item_name || i.medicine; if (nm && String(nm).toLowerCase() === String(m.name).toLowerCase()) { sum += Number(i.quantity || i.qty || 0) || 0; } });
        return sum;
      }, 0);
    const computedAvailable = Math.max(0, purchased - totalSold);
    const qtyFromMedicine = Number(m.quantity ?? m.qty ?? m.stock);
    const hasQty = Number.isFinite(qtyFromMedicine);
    // Prefer medicines.quantity when present (inventory source of truth),
    // otherwise fall back to GRN purchased - sold.
    const available = hasQty
      ? (qtyFromMedicine > 0 ? qtyFromMedicine : (computedAvailable > 0 ? computedAvailable : 0))
      : computedAvailable;
    const batches = medGrnMap[keyById] || [];
    const expiries = batches.map(b => getExpiryDate(b)).filter(Boolean).sort((a, b) => a - b);
    const earliestExpiry = expiries[0] || null;
    const daysToEarliest = earliestExpiry ? Math.ceil((earliestExpiry - now) / (1000 * 60 * 60 * 24)) : null;
    return { id: m.id, name: m.name, category: m.category || 'Uncategorized', purchased, totalSold, available, batchesCount: batches.length, earliestExpiry, daysToEarliest };
  });

  const lowStockUpdated = medAggregates.filter(ma => ma.available <= lowStockThreshold).sort((a, b) => a.available - b.available).slice(0, 8);

  // --- Top Selling ---
  const topSelling = (() => {
    const map = {};
    salesInRange.forEach(sale => {
      const items = Array.isArray(sale.items) ? sale.items : (Array.isArray(sale.cart) ? sale.cart : []);
      items.forEach(item => {
        const name = item.name || item.item_name || item.medicine;
        if (!name) return;
        map[name] = (map[name] || 0) + (Number(item.quantity || item.qty || 0) || 0);
      });
    });
    return Object.entries(map).map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty).slice(0, 7);
  })();

  // --- Expiry Distribution ---
  const expiryBuckets = (() => {
    const buckets = { '0-7': 0, '8-30': 0, '31-90': 0 };
    medAggregates.forEach(m => {
      if (m.daysToEarliest === null) return;
      if (m.daysToEarliest <= 7) buckets['0-7']++;
      else if (m.daysToEarliest <= 30) buckets['8-30']++;
      else if (m.daysToEarliest <= 90) buckets['31-90']++;
    });
    return [
      { name: '0-7 days', value: buckets['0-7'], fill: '#ef4444' },
      { name: '8-30 days', value: buckets['8-30'], fill: '#f59e0b' },
      { name: '31-90 days', value: buckets['31-90'], fill: '#10b981' }
    ];
  })();

  // --- Recent ---
  const salesPerPage = 3;
  const totalSalesPages = Math.ceil(salesInRange.length / salesPerPage);
  const recentSales = salesInRange.slice(salesPage * salesPerPage, salesPage * salesPerPage + salesPerPage);

  useEffect(() => {
    if (salesPage > Math.max(0, totalSalesPages - 1)) {
      setSalesPage(0);
    }
  }, [salesPage, totalSalesPages]);

  const expiriesPerPage = 3;
  const totalExpiriesPages = Math.ceil(expirySoonGrn.length / expiriesPerPage);
  const paginatedExpiries = expirySoonGrn.slice(expiriesPage * expiriesPerPage, expiriesPage * expiriesPerPage + expiriesPerPage);

  const recentPurchases = grnInRange.slice(0, 5);
  const recentExpenses = expensesInRange.slice(0, 5);

  // --- Batches by Category ---
  const batchesByCategory = (() => {
    const map = {};
    medAggregates.forEach(m => { map[m.category] = (map[m.category] || 0) + (m.batchesCount || 0); });
    return Object.entries(map).map(([category, value]) => ({ category, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  })();

  // --- Sales trend (Area chart) ---
  const salesTrend = (() => {
    const map = {};
    salesInRange.forEach(s => {
      const date = s.date ? s.date.slice(0, 10) : 'Unknown';
      map[date] = (map[date] || 0) + (Number(s.total) || 0);
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).slice(-7).map(([date, total]) => ({ date: date.slice(5), total }));
  })();

  // --- Summary Cards Config ---
  const summaryCards = [
    { label: 'Total Revenue', value: `LKR ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: '💰', gradient: 'from-sky-500 to-blue-600', lightBg: 'bg-sky-50' },
    { label: 'Total Orders', value: totalOrders, icon: '📦', gradient: 'from-indigo-500 to-purple-600', lightBg: 'bg-indigo-50' },
    { label: profitOrLoss >= 0 ? 'Net Profit' : 'Net Loss', value: `LKR ${Math.abs(profitOrLoss).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: profitOrLoss >= 0 ? '📈' : '📉', gradient: profitOrLoss >= 0 ? 'from-emerald-500 to-teal-600' : 'from-red-500 to-rose-600', lightBg: profitOrLoss >= 0 ? 'bg-emerald-50' : 'bg-red-50' },
    { label: 'Expenses', value: `LKR ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: '💳', gradient: 'from-amber-500 to-orange-600', lightBg: 'bg-amber-50' },
    { label: 'Total Medicines', value: totalMedicines, icon: '💊', gradient: 'from-cyan-500 to-sky-600', lightBg: 'bg-cyan-50' },
    { label: 'Low Stock', value: lowStockUpdated.length, icon: '⚠️', gradient: 'from-rose-500 to-pink-600', lightBg: 'bg-rose-50' },
    { label: 'Expiring Soon', value: expirySoonGrn.length, icon: '⏰', gradient: 'from-violet-500 to-indigo-600', lightBg: 'bg-violet-50' },
    { label: 'Customers', value: totalCustomers, icon: '👥', gradient: 'from-teal-500 to-emerald-600', lightBg: 'bg-teal-50' },
  ];

  if (summaryCards[0]) summaryCards[0].label = 'Net Revenue';
  summaryCards.splice(4, 0, {
    label: 'Returns & Refunds',
    value: `LKR ${totalRefunds.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    icon: '↩️',
    gradient: 'from-rose-500 to-red-600',
    lightBg: 'bg-rose-50'
  });

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-xl shadow-lg border border-slate-200/60">
          <p className="text-xs font-semibold text-slate-700">{label}</p>
          <p className="text-sm font-bold text-sky-600">{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]" style={{ background: COLORS.pageBg }}>
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-sky-200 animate-ping opacity-30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-sky-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          </div>
          <p className="text-slate-500 font-medium text-sm animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full overflow-y-auto" style={{ background: COLORS.pageBg }}>
      <div className="max-w-[1600px] mx-auto px-4 py-4 sm:px-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
            <p className="text-sm text-slate-500 mt-0.5">Welcome back! Here's your pharmacy overview.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              {[
                { id: 'today', label: 'Today' },
                { id: 'month', label: 'Month' },
                { id: 'year', label: 'Year' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setDateFilter(opt.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${dateFilter === opt.id
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow'
                    : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {isSuperAdmin ? (
              <select
                value={branchId}
                onChange={e => {
                  const newId = e.target.value;
                  setBranchId(newId);
                  const branch = branches.find(b => String(b.id) === String(newId));
                  if (branch) setSelectedBranch(branch);
                }}
                className="px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all font-medium text-slate-700"
              >
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} ({branch.code})
                  </option>
                ))}
              </select>
            ) : (
              <div className="px-4 py-2 text-sm bg-slate-100 border border-slate-200 rounded-xl shadow-sm font-medium text-slate-600 cursor-default">
                {branches.find(b => String(b.id) === String(branchId))?.name || 'My Branch'}
              </div>
            )}
            <button
              onClick={() => navigate('/dashboard/reports')}
              className="px-4 py-2 text-sm bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl shadow-md shadow-sky-200/50 hover:shadow-lg hover:shadow-sky-300/50 transition-all font-semibold hover:-translate-y-0.5 active:translate-y-0"
            >
              📊 Reports
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-3 mb-6">
          {summaryCards.map((card, i) => (
            <div
              key={i}
              className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
            >
              {/* Gradient top bar */}
              <div className={`h-1 bg-gradient-to-r ${card.gradient}`}></div>
              <div className="p-3 text-center">
                <div className="text-2xl mb-1">{card.icon}</div>
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider leading-tight">{card.label}</p>
                <p className="text-base font-bold text-slate-800 mt-1 truncate">{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Branch Comparison (Super Admin) */}
        {isSuperAdmin && branches.length > 1 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-4">
            <div className="px-5 pt-4 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <h3 className="text-sm font-semibold text-slate-700">Branch Comparison</h3>
              </div>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Net Revenue vs Expenses</span>
            </div>
            <div className="px-2 pb-3" style={{ height: 260 }}>
              {branchCompareLoading ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">Loading branch data...</div>
              ) : branchComparison.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={branchComparison} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} angle={-20} textAnchor="end" height={50} interval={0} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={50} />
                    <Tooltip />
                    <Bar dataKey="revenue" name="Revenue" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">No branch data</div>
              )}
            </div>
          </div>
        )}

        {/* Row 1: Sales Trend + Top Selling + Expiry Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Sales Trend */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                <h3 className="text-sm font-semibold text-slate-700">Sales Trend</h3>
              </div>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{periodLabel}</span>
            </div>
            <div className="px-2 pb-3" style={{ height: 220 }}>
              {salesTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={salesTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={50} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="total" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#salesGradient)" dot={{ r: 3, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 5, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">No sales data</div>
              )}
            </div>
          </div>

          {/* Top Selling */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
              <h3 className="text-sm font-semibold text-slate-700">Top Selling Medicines</h3>
            </div>
            <div className="px-2 pb-3" style={{ height: 220 }}>
              {topSelling.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={topSelling} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} angle={-35} textAnchor="end" height={50} interval={0} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="qty" radius={[6, 6, 0, 0]}>
                      {topSelling.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">No sales data</div>
              )}
            </div>
          </div>

          {/* Expiry Distribution */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <h3 className="text-sm font-semibold text-slate-700">Expiry Distribution</h3>
            </div>
            <div className="px-4 pb-3 flex items-center gap-4" style={{ height: 220 }}>
              {expiryBuckets.reduce((s, b) => s + b.value, 0) > 0 ? (
                <>
                  <div className="flex-shrink-0" style={{ width: 140, height: 140 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={expiryBuckets} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={62} paddingAngle={3} label={false}>
                          {expiryBuckets.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-3">
                    {expiryBuckets.map((b) => {
                      const total = expiryBuckets.reduce((s, x) => s + x.value, 0);
                      const pct = total ? ((b.value / total) * 100).toFixed(0) : 0;
                      return (
                        <div key={b.name} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: b.fill }}></div>
                          <div>
                            <p className="text-xs font-semibold text-slate-700">{b.name}</p>
                            <p className="text-[10px] text-slate-500">{b.value} items ({pct}%)</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center w-full text-slate-400 text-sm">No expiring items</div>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Low Stock + Batches by Category */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Low Stock Medicines */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500"></div>
              <h3 className="text-sm font-semibold text-slate-700">Low Stock Medicines</h3>
              <span className="ml-auto text-xs font-medium text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">{lowStockUpdated.length} items</span>
            </div>
            <div className="px-4 pb-4">
              {lowStockUpdated.length > 0 ? (
                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                  {lowStockUpdated.map((m, i) => (
                    <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 transition-colors group">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}>
                        {m.name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{m.name}</p>
                        <p className="text-[10px] text-slate-400">{m.category}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${m.available === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {m.available} left
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[180px] text-slate-400 text-sm">
                  <div className="text-center">
                    <span className="text-3xl block mb-2">✅</span>
                    <p>All medicines well stocked</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Batches by Category */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-violet-500"></div>
              <h3 className="text-sm font-semibold text-slate-700">Purchase Batches by Category</h3>
            </div>
            <div className="px-2 pb-3" style={{ height: 260 }}>
              {batchesByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={batchesByCategory} margin={{ top: 10, right: 10, left: 0, bottom: 50 }}>
                    <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#94a3b8' }} angle={-35} textAnchor="end" height={60} interval={0} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {batchesByCategory.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">No batches to display</div>
              )}
            </div>
          </div>
        </div>

        {/* Row 3: Recent Sales + Recent Purchases + Recent Expenses + Reports Snapshot */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Recent Sales */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                <h3 className="text-sm font-semibold text-slate-700">Recent Sales</h3>
              </div>
              {sales.length > salesPerPage && (
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setSalesPage(p => Math.max(0, p - 1))} disabled={salesPage === 0} className="w-6 h-6 rounded-lg flex items-center justify-center text-xs bg-slate-100 text-slate-500 hover:bg-sky-100 hover:text-sky-600 disabled:opacity-30 transition-colors">‹</button>
                  <span className="text-[10px] text-slate-400 font-medium">{salesPage + 1}/{totalSalesPages}</span>
                  <button onClick={() => setSalesPage(p => Math.min(totalSalesPages - 1, p + 1))} disabled={salesPage >= totalSalesPages - 1} className="w-6 h-6 rounded-lg flex items-center justify-center text-xs bg-slate-100 text-slate-500 hover:bg-sky-100 hover:text-sky-600 disabled:opacity-30 transition-colors">›</button>
                </div>
              )}
            </div>
            <div className="px-4 pb-4 space-y-2 max-h-[260px] overflow-y-auto">
              {sales.length === 0 ? (
                <div className="flex items-center justify-center h-[160px] text-slate-400 text-sm">No recent sales</div>
              ) : recentSales.map(s => (
                <div key={s.id} className="p-3 rounded-xl bg-gradient-to-br from-sky-50/60 to-white border border-sky-100/60 hover:border-sky-200 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-sky-600">#{s.id}</span>
                      <span className="text-xs text-slate-600 truncate max-w-[100px]">{s.customer || 'Walk-in'}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700">LKR {Number(s.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">{s.date ? s.date.slice(0, 10) : 'No date'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Purchases */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <h3 className="text-sm font-semibold text-slate-700">Recent Purchases</h3>
            </div>
            <div className="px-4 pb-4 space-y-2 max-h-[260px] overflow-y-auto">
              {recentPurchases.length === 0 ? (
                <div className="flex items-center justify-center h-[160px] text-slate-400 text-sm">No recent purchases</div>
              ) : recentPurchases.map(b => (
                <div key={b.grn_id} className="p-3 rounded-xl bg-gradient-to-br from-emerald-50/60 to-white border border-emerald-100/60 hover:border-emerald-200 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-emerald-600">#{b.grn_id}</span>
                      <span className="text-xs text-slate-600 truncate max-w-[100px]">{b.supplier || 'Unknown'}</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{Array.isArray(b.items) ? b.items.length : 0} items</span>
                  </div>
                  <p className="text-[10px] text-slate-400">{b.date ? b.date.slice(0, 10) : 'No date'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Expenses */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <h3 className="text-sm font-semibold text-slate-700">Recent Expenses</h3>
            </div>
            <div className="px-4 pb-4 space-y-2 max-h-[260px] overflow-y-auto">
              {recentExpenses.length === 0 ? (
                <div className="flex items-center justify-center h-[160px] text-slate-400 text-sm">No recent expenses</div>
              ) : recentExpenses.map(e => (
                <div key={e.id} className="p-3 rounded-xl bg-gradient-to-br from-amber-50/60 to-white border border-amber-100/60 hover:border-amber-200 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-amber-700 truncate max-w-[120px]">{e.expense || 'Expense'}</span>
                    <span className="text-xs font-bold text-slate-700">LKR {Number(e.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">{e.date ? e.date.slice(0, 10) : 'No date'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Reports Snapshot */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                <h3 className="text-sm font-semibold text-slate-700">Upcoming Expiries</h3>
              </div>
              {expirySoonGrn.length > expiriesPerPage && (
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setExpiriesPage(p => Math.max(0, p - 1))} disabled={expiriesPage === 0} className="w-6 h-6 rounded-lg flex items-center justify-center text-xs bg-slate-100 text-slate-500 hover:bg-violet-100 hover:text-violet-600 disabled:opacity-30 transition-colors">‹</button>
                  <span className="text-[10px] text-slate-400 font-medium">{expiriesPage + 1}/{totalExpiriesPages}</span>
                  <button onClick={() => setExpiriesPage(p => Math.min(totalExpiriesPages - 1, p + 1))} disabled={expiriesPage >= totalExpiriesPages - 1} className="w-6 h-6 rounded-lg flex items-center justify-center text-xs bg-slate-100 text-slate-500 hover:bg-violet-100 hover:text-violet-600 disabled:opacity-30 transition-colors">›</button>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="px-4 pb-2">
              <div className="flex gap-2 mb-3">
                <div className="flex-1 p-2 rounded-xl bg-gradient-to-br from-rose-50 to-white border border-rose-100/60 text-center">
                  <p className="text-lg font-bold text-rose-600">{lowStockUpdated.length}</p>
                  <p className="text-[9px] font-medium text-rose-500 uppercase">Low Stock</p>
                </div>
                <div className="flex-1 p-2 rounded-xl bg-gradient-to-br from-amber-50 to-white border border-amber-100/60 text-center">
                  <p className="text-lg font-bold text-amber-600">{expirySoonGrn.length}</p>
                  <p className="text-[9px] font-medium text-amber-500 uppercase">Expiring</p>
                </div>
              </div>
            </div>

            <div className="px-4 pb-4 space-y-1.5 max-h-[160px] overflow-y-auto">
              {expirySoonGrn.length > 0 ? (
                paginatedExpiries.map((it, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50/80 hover:bg-slate-100/80 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: it.daysToExpiry <= 7 ? '#ef4444' : it.daysToExpiry <= 30 ? '#f59e0b' : '#10b981' }}></div>
                      <p className="text-xs text-slate-700 truncate">{it.medicine_name || 'Unknown'}</p>
                    </div>
                    <span className={`text-xs font-bold flex-shrink-0 px-2 py-0.5 rounded-full ${it.daysToExpiry <= 7 ? 'bg-red-100 text-red-700' : it.daysToExpiry <= 30 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {it.daysToExpiry}d
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-[100px] text-slate-400 text-sm">
                  <div className="text-center">
                    <span className="text-2xl block mb-1">🎉</span>
                    <p>No upcoming expiries</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
