import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Button, Select, MenuItem, TextField, CircularProgress, Tabs, Tab,
  Table, TableHead, TableBody, TableRow, TableCell, Divider
} from '@mui/material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Assessment, AttachMoney, PeopleAlt, ReceiptLong } from '@mui/icons-material';
import api from '../utils/axios';
import { useBranch } from '../context/BranchContext';

// Define consistent blue/gray color scheme - only blue, gray, white shades
const HOME_COLORS = {
  main: '#0492c2',
  accent: '#5a6e9a',
  bg: '#f8fbfd',
  card: '#e0e4ed',
  warning: '#0492c2', // Use blue instead of orange
  danger: '#5a6e9a',  // Use gray instead of red
  success: '#0492c2', // Use blue instead of green
  text: '#2d3748'
};

const API_URL = '/api';

// Add PERIODS constant used by the period selector (prevent ReferenceError)
const PERIODS = [
  { label: 'Today', value: 'today' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
  { label: 'Custom', value: 'custom' },
  { label: 'Specific Date', value: 'specific' }
];

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [period, setPeriod] = useState('today');
  const [tab, setTab] = useState(0);
  const { branches } = useBranch();
  const [branchId, setBranchId] = useState(() => localStorage.getItem('branch_id') || '1');

  // Data states (pharmacy-focused)
  const [sales, setSales] = useState([]); // sales details
  const [soldQuantities, setSoldQuantities] = useState([]); // aggregated sold quantities from backend
  const [medicines, setMedicines] = useState([]); // master medicines
  const [expenses, setExpenses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [grnBatches, setGrnBatches] = useState([]);
  const [purchasedQuantities, setPurchasedQuantities] = useState({});
  // Customers UI state (new)
  const [custSearch, setCustSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerHistory, setCustomerHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Stock & Expiry UI state
  const [stockSearch, setStockSearch] = useState('');
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [stockSort, setStockSort] = useState('available_asc'); // available_asc | available_desc | name
  const [expirySearch, setExpirySearch] = useState('');
  const [expiryDaysThreshold, setExpiryDaysThreshold] = useState(90);
  // Sales table filters (real data)
  const [salesSearch, setSalesSearch] = useState('');
  const [salesDateFrom, setSalesDateFrom] = useState('');
  const [salesDateTo, setSalesDateTo] = useState('');
  const [salesCustomer, setSalesCustomer] = useState('');
  const [salesMin, setSalesMin] = useState('');
  const [salesMax, setSalesMax] = useState('');
  // Expenses filters (new)
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseFrom, setExpenseFrom] = useState('');
  const [expenseTo, setExpenseTo] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all');
  const [expenseMethodFilter, setExpenseMethodFilter] = useState('all');

  // Fetch data from backend APIs
  useEffect(() => {
    setLoading(true);
    const range = getPeriodRange();
    const params = { branch_id: branchId, from: range.from, to: range.to };
    Promise.all([
      api.get('/sales-details', { params }),
      api.get('/sales-details/sold-quantities', { params }),
      api.get('/medicines', { params: { branch_id: branchId } }),
      api.get('/expenses', { params }),
      api.get('/customers', { params: { branch_id: branchId } }),
      api.get('/grn', { params: { branch_id: branchId } }),
      api.get('/grn/purchased-quantities', { params: { branch_id: branchId } })
    ]).then(([salesRes, soldRes, medsRes, expRes, custRes, grnRes, purchasedRes]) => {
      const salesArr = Array.isArray(salesRes.data) ? salesRes.data : (salesRes.data.data || []);
      setSales(normalizeSales(salesArr));
      setSoldQuantities(Array.isArray(soldRes.data.data) ? soldRes.data.data : (Array.isArray(soldRes.data) ? soldRes.data : []));
      setMedicines(Array.isArray(medsRes.data.data) ? medsRes.data.data : (Array.isArray(medsRes.data) ? medsRes.data : []));
      setExpenses(Array.isArray(expRes.data.data) ? expRes.data.data : (Array.isArray(expRes.data) ? expRes.data : []));
      setCustomers(Array.isArray(custRes.data.data) ? custRes.data.data : (Array.isArray(custRes.data) ? custRes.data : []));
      setGrnBatches(Array.isArray(grnRes.data.data) ? grnRes.data.data : []);
      // Map purchased quantities by medicine_id
      const pq = {};
      (purchasedRes.data?.data || []).forEach(row => {
        pq[row.medicine_id] = Number(row.total_purchased) || 0;
      });
      setPurchasedQuantities(pq);
    }).catch((err) => {
      // defensive fallback
      console.error('[REPORTS] fetch error', err);
      setSales([]);
      setSoldQuantities([]);
      setMedicines([]);
      setExpenses([]);
      setCustomers([]);
      setGrnBatches([]);
      setPurchasedQuantities({});
    }).finally(() => setLoading(false));
  }, [branchId, period, dateRange]);

  // Update localStorage when branchId changes
  useEffect(() => {
    localStorage.setItem('branch_id', branchId);
  }, [branchId]);

  // --- Sales & Revenue Calculations ---
  // Total Revenue, Orders, Avg Order Value, Best Day
  const totalRevenue = sales.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  const totalOrders = sales.length;
  const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
  const bestDay = (() => {
    const dayMap = {};
    sales.forEach(s => {
      const d = s.date ? s.date.slice(0, 10) : '';
      dayMap[d] = (dayMap[d] || 0) + (Number(s.total) || 0);
    });
    const best = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0];
    return best ? best[0] : '-';
  })();

  // Category-wise sales (using menuItems for correct category name)
  const categoryMap = {};
  sales.forEach(s => {
    const items = s.cart || [];
    items.forEach(item => {
      const name = item.name || item.item_name;
      let qty = Number(item.quantity || item.qty || 1) || 0;
      let price = Number(item.price || item.rate || item.amount || 0) || 0;
      // try lookup medicine to get category
      const med = medicines.find(m => (m.name && String(m.name).toLowerCase() === String(name).toLowerCase()) || String(m.id) === String(item.medicine_id || item.id || ''));
      const category = med ? (med.category || med.category_name || med.categoryId || 'Uncategorized') : (item.category || 'Uncategorized');
      categoryMap[category] = categoryMap[category] || { qty: 0, sales: 0 };
      categoryMap[category].qty += qty;
      categoryMap[category].sales += (price * qty);
    });
  });
  const categorySalesArr = Object.entries(categoryMap).map(([category, v]) => ({ category, value: v.sales || v.qty }));

  // Top selling medicines using soldQuantities if available, else aggregate local sales
  const topSelling = (() => {
    if (soldQuantities && soldQuantities.length > 0) {
      // soldQuantities expected as [{name, total_sold}]
      return soldQuantities
        .map(s => ({ name: s.name, qty: Number(s.total_sold) || 0 }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 10);
    }
    // Aggregate from sales.cart
    const map = {};
    sales.forEach(s => {
      const items = s.cart || [];
      items.forEach(i => {
        const name = i.name || i.item_name || i.medicine || 'Unknown';
        map[name] = (map[name] || 0) + (Number(i.quantity || i.qty || i.qty_sold || 1) || 0);
      });
    });
    return Object.entries(map).map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty).slice(0, 10);
  })();

  // Low-stock detection (support multiple possible field names)
  function getStockValue(m) {
    const keys = ['stock', 'quantity', 'qty', 'available_stock', 'available_qty', 'opening_stock'];
    for (const k of keys) {
      if (m[k] !== undefined && m[k] !== null && m[k] !== '') {
        return Number(m[k]) || 0;
      }
    }
    return null;
  }
  function getReorderLevel(m) {
    const keys = ['reorder_level', 'reorder', 'min_stock', 'minQty'];
    for (const k of keys) {
      if (m[k] !== undefined && m[k] !== null && m[k] !== '') {
        return Number(m[k]) || 0;
      }
    }
    return 10; // default threshold
  }

  // Helper: parse expiry from various fields and formats (used for medicines and GRN items)
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

  // --- Expiry tracking using GRN batches ---
  // Flatten all GRN items for expiry tracking
  const grnItems = grnBatches.flatMap(batch => batch.items || []);
  // Medicines nearing expiry (from GRN, within 90 days)
  const now = new Date();
  const expirySoonGrn = grnItems
    .map(item => ({
      ...item,
      expiryDate: getExpiryDate(item),
      medicine_name: item.medicine_name || item.medicine || item.name || ''
    }))
    .filter(item => item.expiryDate && !isNaN(item.expiryDate))
    .map(item => ({
      ...item,
      daysToExpiry: Math.ceil((item.expiryDate - now) / (1000 * 60 * 60 * 24))
    }))
    .filter(item => item.daysToExpiry <= 90 && item.daysToExpiry >= 0)
    .sort((a, b) => a.daysToExpiry - b.daysToExpiry)
    .slice(0, 10);

  // --- Per-medicine aggregates (purchased, sold, available, earliest/latest expiry, batches) ---
  const medGrnMap = {};
  grnItems.forEach(it => {
    const mid = String(it.medicine_id ?? it.medicine) || String(it.medicine_name || it.name || '');
    if (!medGrnMap[mid]) medGrnMap[mid] = [];
    medGrnMap[mid].push(it);
  });

  const medAggregates = (medicines || []).map(m => {
    const keyById = String(m.id);
    // total purchased: prefer purchasedQuantities map, else sum GRN batch qtys
    const purchased = purchasedQuantities[m.id] ?? (medGrnMap[keyById]?.reduce((s, b) => s + (Number(b.quantity) || 0), 0) || 0);
    // total sold: try soldQuantities (by name) else aggregate from sales
    const soldEntry = (soldQuantities || []).find(sq => String(sq.name).toLowerCase() === String(m.name).toLowerCase());
    const totalSold = soldEntry ? Number(soldEntry.total_sold || soldEntry.qty || soldEntry.sold || 0) : (sales.reduce((sum, s) => {
      (s.cart || []).forEach(i => {
        const nm = i.name || i.item_name || i.medicine;
        if (nm && String(nm).toLowerCase() === String(m.name).toLowerCase()) sum += Number(i.quantity || i.qty || 0) || 0;
      });
      return sum;
    }, 0));
    const available = Math.max(0, purchased - totalSold);
    const batches = medGrnMap[keyById] || [];
    const expiries = batches.map(b => getExpiryDate(b)).filter(Boolean).sort((a, b) => a - b);
    const earliestExpiry = expiries[0] || null;
    const latestExpiry = expiries[expiries.length - 1] || null;
    const daysToEarliest = earliestExpiry ? Math.ceil((earliestExpiry - now) / (1000 * 60 * 60 * 24)) : null;
    return {
      id: m.id,
      name: m.name,
      category: m.category || 'Uncategorized',
      purchased,
      totalSold,
      available,
      reorderLevel: getReorderLevel(m),
      batchesCount: batches.length,
      earliestExpiry,
      latestExpiry,
      daysToEarliest
    };
  });

  // Low stock based on computed available quantity (more reliable than medicine.stock field)
  const lowStockUpdated = medAggregates
    .filter(ma => ma.available <= (ma.reorderLevel ?? 10))
    .sort((a, b) => a.available - b.available);

  // Expiry list by medicine (earliest expiry)
  const expirySoonMeds = medAggregates
    .filter(ma => ma.daysToEarliest !== null && ma.daysToEarliest <= Number(expiryDaysThreshold) && ma.daysToEarliest >= 0)
    .sort((a, b) => a.daysToEarliest - b.daysToEarliest);

  // ---------------- Chart datasets for Stock & Expiry tab ----------------
  const lowStockChartData = lowStockUpdated.slice(0, 10).map(m => ({ name: m.name, available: m.available }));

  const expiryBuckets = (() => {
    const buckets = { '0-7': 0, '8-30': 0, '31-90': 0 };
    medAggregates.forEach(m => {
      if (m.daysToEarliest === null) return;
      if (m.daysToEarliest <= 7) buckets['0-7']++;
      else if (m.daysToEarliest <= 30) buckets['8-30']++;
      else if (m.daysToEarliest <= 90) buckets['31-90']++;
    });
    return [
      { name: '0-7 days', value: buckets['0-7'] },
      { name: '8-30 days', value: buckets['8-30'] },
      { name: '31-90 days', value: buckets['31-90'] }
    ];
  })();

  const batchesByCategory = (() => {
    const map = {};
    medAggregates.forEach(m => {
      map[m.category] = (map[m.category] || 0) + (m.batchesCount || 0);
    });
    return Object.entries(map).map(([category, value]) => ({ category, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  })();
  // -----------------------------------------------------------------------

  // Customer analytics from fetched customers and sales
  const custMap = {};
  sales.forEach(s => {
    const cid = s.customer_id || s.customerId || null;
    const name = s.customer_name || s.customer || 'Walk-in';
    const key = cid || name;
    if (!custMap[key]) custMap[key] = { name, id: cid, orders: 0, spent: 0 };
    custMap[key].orders += 1;
    custMap[key].spent += Number(s.total) || 0;
  });
  const customerAnalytics = Object.values(custMap).sort((a, b) => b.spent - a.spent).slice(0, 10);
  // Fetch purchases for a customer. Strategy:
  // 1) Try customer purchases endpoint when we have a real id.
  // 2) If that returns nothing (or id is missing), fall back to sales-details and filter by customer name.
  async function fetchCustomerPurchases(customerId, customerName = '') {
    setHistoryLoading(true);
    let idToUse = customerId;
    // Resolve id from local customers list when not provided
    if (!idToUse && customerName) {
      const found = (customers || []).find(c => String(c.name || '').toLowerCase() === String(customerName || '').toLowerCase());
      if (found && found.id) idToUse = found.id;
    }

    try {
      // 1) If we have an id, try the dedicated endpoint
      if (idToUse) {
        try {
          const res = await api.get(`/customers/${idToUse}/purchases`, { params: { branch_id: branchId } });
          const raw = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
          if (Array.isArray(raw) && raw.length > 0) {
            const normalized = raw.map(o => {
              const cart = Array.isArray(o.cart) ? o.cart : (Array.isArray(o.items) ? o.items : []);
              const date = o.date ? (typeof o.date === 'string' ? o.date.slice(0, 10) : (new Date(o.date).toISOString().slice(0, 10))) : '';
              return {
                ...o,
                cart,
                date,
                total: Number(o.total ?? o.subtotal ?? 0) || 0,
                paid_amount: Number(o.paid_amount || 0) || 0,
                future_credit: Number(o.future_credit || 0) || 0,
                status: o.status || ''
              };
            });
            setCustomerHistory(normalized);
            return;
          }
          // if endpoint returned empty array, continue to fallback
        } catch (e) {
          // proceed to fallback rather than failing completely
          console.warn('[REPORTS] customer purchases endpoint failed, falling back to sales-details', e);
        }
      }

      // 2) Fallback: query sales-details and filter by customer name (handles orders saved with name only)
      if (customerName) {
        const salesRes = await api.get('/sales-details', { params: { branch_id: branchId } });
        const salesArr = Array.isArray(salesRes.data) ? salesRes.data : (Array.isArray(salesRes.data?.data) ? salesRes.data.data : []);
        const matched = (salesArr || []).filter(s => {
          const nameField = String(s.customer || s.customer_name || '').toLowerCase();
          const q = String(customerName || '').toLowerCase();
          return nameField === q || nameField.includes(q);
        }).map(s => {
          const items = Array.isArray(s.items) ? s.items : (Array.isArray(s.cart) ? s.cart : []);
          const date = s.date ? (typeof s.date === 'string' ? s.date.slice(0, 10) : (new Date(s.date).toISOString().slice(0, 10))) : '';
          return {
            id: s.id,
            cart: items,
            date,
            total: Number(s.total ?? s.subtotal ?? 0) || 0,
            paid_amount: Number(s.paid_amount || s.total || 0) || 0,
            future_credit: Number(s.future_credit || 0) || 0,
            status: s.status || 'completed'
          };
        });
        setCustomerHistory(matched);
        return;
      }

      // nothing found
      setCustomerHistory([]);
    } catch (err) {
      console.error('[REPORTS] fetchCustomerPurchases error', err);
      setCustomerHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  // Filter top customers by search input
  const filteredCustomerAnalytics = (customerAnalytics || []).filter(c => {
    const q = (custSearch || '').trim().toLowerCase();
    if (!q) return true;
    return String(c.name || '').toLowerCase().includes(q);
  });

  // --- ADD: compute totalExpenses, profitOrLoss and chart COLORS (used in JSX) ---
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const profitOrLoss = totalRevenue - totalExpenses;
  // Chart colors - only blue and gray shades
  const COLORS = ['#0492c2', '#5a6e9a', '#e0e4ed', '#8db4e1', '#b6d7ff', '#0492c2'];
  // Chart height (use a single value so we don't enlarge visuals unexpectedly)
  const CHART_HEIGHT = 420;
  // --- end add ---

  // --- Expenses aggregates & filtered list (new) ---
  const filteredExpenses = (expenses || []).filter(e => {
    const q = String(expenseSearch || '').trim().toLowerCase();
    if (q && !(
      String(e.expense || e.category || '').toLowerCase().includes(q) ||
      String(e.paidTo || '').toLowerCase().includes(q)
    )) return false;
    if (expenseCategoryFilter !== 'all' && !(String(e.category || e.expense || '').toLowerCase() === expenseCategoryFilter.toLowerCase())) return false;
    if (expenseMethodFilter !== 'all' && !(String(e.paymentMethod || '').toLowerCase() === expenseMethodFilter.toLowerCase())) return false;
    const d = e.date ? String(e.date).slice(0, 10) : '';
    if (expenseFrom && d && d < expenseFrom) return false;
    if (expenseTo && d && d > expenseTo) return false;
    return true;
  });

  const totalExpensesValue = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const avgExpense = filteredExpenses.length ? (totalExpensesValue / filteredExpenses.length) : 0;
  const largestExpense = filteredExpenses.reduce((m, e) => Math.max(m, Number(e.amount) || 0), 0);
  const pendingBalance = filteredExpenses.reduce((s, e) => s + (e.status && e.status.toLowerCase() === 'pending' ? (Number(e.balance) || 0) : 0), 0);

  const expensesByCategory = Object.entries(
    (filteredExpenses || []).reduce((map, e) => {
      const cat = (e.category || e.expense || 'Other').toString();
      map[cat] = (map[cat] || 0) + (Number(e.amount) || 0);
      return map;
    }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);

  const expenseTrend = aggregateByDate(filteredExpenses); // uses existing helper
  // --- end expenses aggregates ---

  // Compute filteredSales from real sales using the filter controls
  const filteredSales = (sales || []).filter(order => {
    // Normalize searchable strings
    const q = String(salesSearch || '').trim().toLowerCase();
    const cust = String(salesCustomer || '').trim().toLowerCase();
    const d = order.date ? String(order.date).slice(0, 10) : '';

    // Search (order id, customer, or any item name)
    if (q) {
      if (String(order.id || '').toLowerCase().includes(q)) return true;
      if (String(order.customer_name || order.customer || '').toLowerCase().includes(q)) return true;
      const items = Array.isArray(order.cart) ? order.cart : [];
      if (items.some(it => String(it.name || it.item_name || '').toLowerCase().includes(q))) return true;
      return false; // no match for search
    }

    // Customer filter
    if (cust && !String(order.customer_name || order.customer || '').toLowerCase().includes(cust)) return false;

    // Date range filter
    if (salesDateFrom && d && d < salesDateFrom) return false;
    if (salesDateTo && d && d > salesDateTo) return false;

    // Total min/max filter
    const total = Number(order.total) || 0;
    if (salesMin && total < Number(salesMin)) return false;
    if (salesMax && total > Number(salesMax)) return false;

    return true;
  });

  // Helper: format Date to local YYYY-MM-DD
  const formatLocalDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Helper: get date range for selected period
  const getPeriodRange = () => {
    const now = new Date();
    if (period === 'today') {
      const today = formatLocalDate(now);
      return { from: today, to: today };
    }
    if (period === 'month') {
      const first = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1));
      const last = formatLocalDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
      return { from: first, to: last };
    }
    if (period === 'year') {
      const first = formatLocalDate(new Date(now.getFullYear(), 0, 1));
      const last = formatLocalDate(new Date(now.getFullYear(), 11, 31));
      return { from: first, to: last };
    }
    if (period === 'specific') {
      return { from: dateRange.from, to: dateRange.from };
    }
    return dateRange;
  };

  // Normalize sales data from backend to consistent shape
  function normalizeSales(arr) {
    return arr.map(s => ({
      ...s,
      date: s.date ? (typeof s.date === 'string' ? s.date.slice(0, 10) : (new Date(s.date).toISOString().slice(0, 10))) : '',
      cart: Array.isArray(s.items) ? s.items : (Array.isArray(s.cart) ? s.cart : []),
      total: Number(s.total) || Number(s.grand_total) || 0,
      customer_name: s.customer || s.customer_name || s.customerName || ''
    }));
  }

  // Download handlers
  const handleExport = (type, dataType = 'sales') => {
    // Helper to export CSV/Excel for different data types based on active tab
    let headers, rows, filename;

    if (dataType === 'expenses') {
      headers = ['Date', 'Category', 'Amount', 'Payment Method', 'Description'];
      rows = expenses.map(e => [
        e.date ? String(e.date).slice(0, 10) : '-',
        e.expense || e.category || '-',
        e.amount,
        e.paymentMethod || '-',
        e.remark || e.description || '-'
      ]);
      filename = `pharmacy_expenses_${period}_${getPeriodRange().from}_${getPeriodRange().to}`;
    } else if (dataType === 'medicines' || dataType === 'stock') {
      headers = ['ID', 'Name', 'Category', 'Stock', 'Expiry', 'Reorder Level'];
      rows = medicines.map(m => [
        m.id || '-',
        m.name || '-',
        m.category || '-',
        getStockValue(m) ?? '-',
        (getExpiryDate(m) ? getExpiryDate(m).toISOString().slice(0, 10) : '-'),
        getReorderLevel(m) || '-'
      ]);
      filename = `pharmacy_medicines_${period}_${getPeriodRange().from}_${getPeriodRange().to}`;
    } else if (dataType === 'low-stock') {
      headers = ['Name', 'Category', 'Available Stock', 'Reorder Level', 'Status'];
      rows = lowStockUpdated.map(m => [
        m.name || '-',
        m.category || '-',
        getStockValue(m) ?? '-',
        getReorderLevel(m) || '-',
        getStockValue(m) === 0 ? 'Out of Stock' : 'Low Stock'
      ]);
      filename = `pharmacy_low_stock_${period}_${getPeriodRange().from}_${getPeriodRange().to}`;
    } else if (dataType === 'expiry') {
      headers = ['Name', 'Category', 'Expiry Date', 'Days to Expiry', 'Available Stock', 'Status'];
      rows = expirySoonMeds.map(item => [
        item.name || '-',
        item.category || '-',
        item.expiry ? item.expiry.toISOString().slice(0, 10) : '-',
        item.daysToExpiry || '-',
        getStockValue(item) ?? '-',
        item.daysToExpiry <= 7 ? 'Critical' : item.daysToExpiry <= 30 ? 'Warning' : 'Watch'
      ]);
      filename = `pharmacy_expiry_soon_${period}_${getPeriodRange().from}_${getPeriodRange().to}`;
    } else if (dataType === 'top-medicines') {
      headers = ['Medicine Name', 'Quantity Sold', 'Category'];
      rows = topSelling.map(item => [
        item.name || '-',
        item.qty || 0,
        // Try to find category from medicines array
        medicines.find(m => m.name === item.name)?.category || '-'
      ]);
      filename = `pharmacy_top_medicines_${period}_${getPeriodRange().from}_${getPeriodRange().to}`;
    } else if (dataType === 'customers') {
      headers = ['Name', 'Email', 'Phone', 'Total Spent', 'Orders Count', 'Last Order'];
      rows = customerAnalytics.map(c => [
        c.name || '-',
        c.email || '-',
        c.phone || '-',
        `LKR ${Number(c.spent || 0).toLocaleString()}`,
        c.orders || 0,
        c.lastOrder || '-'
      ]);
      filename = `pharmacy_customers_${period}_${getPeriodRange().from}_${getPeriodRange().to}`;
    } else {
      // Default: sales
      headers = ['Order ID', 'Date', 'Customer', 'Total', 'Items'];
      rows = sales.map(order => [
        order.id,
        order.date || '-',
        order.customer_name || '-',
        Number(order.total).toLocaleString(),
        Array.isArray(order.cart) ? order.cart.map(i => `${i.name} x${i.quantity || i.qty || 1}`).join('; ') : '-'
      ]);
      filename = `pharmacy_sales_${period}_${getPeriodRange().from}_${getPeriodRange().to}`;
    }

    if (type === 'csv' || type === 'excel') {
      const csvContent = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.${type === 'excel' ? 'xls' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (type === 'pdf') {
      window.print();
    }
  };

  // Get export button configurations based on active tab
  const getExportButtons = () => {
    switch (tab) {
      case 0: // Sales & Top Medicines
        return [
          { label: 'Export Sales Data', dataType: 'sales' },
          { label: 'Export Top Medicines', dataType: 'top-medicines' }
        ];
      case 1: // Stock & Expiry
        return [
          { label: 'Export All Medicines', dataType: 'medicines' },
          { label: 'Export Low Stock', dataType: 'low-stock' },
          { label: 'Export Expiry Soon', dataType: 'expiry' }
        ];
      case 2: // Expenses
        return [
          { label: 'Export Expenses', dataType: 'expenses' }
        ];
      case 3: // Customers
        return [
          { label: 'Export Customers', dataType: 'customers' }
        ];
      default:
        return [
          { label: 'Export Sales Data', dataType: 'sales' }
        ];
    }
  };

  // Render
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Modern Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#0b27b1] to-[#5a6e9a] rounded-xl flex items-center justify-center shadow-lg">
            <Assessment className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0b27b1]">Pharmacy Reports & Analytics</h1>
            <p className="text-[#5a6e9a] text-sm">Comprehensive insights and data analysis</p>
          </div>
        </div>

        {/* Modern Filter Card */}
        <div className="bg-white rounded-xl shadow-sm border border-[#e0e4ed] p-6">

          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[220px]">
              <label className="block text-sm font-medium text-[#5a6e9a] mb-2">Branch</label>
              <select
                value={branchId}
                onChange={e => setBranchId(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-[#e0e4ed] rounded-lg focus:ring-2 focus:ring-[#0b27b1] focus:border-[#0b27b1] transition-colors"
              >
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} ({branch.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[180px]">
              <label className="block text-sm font-medium text-[#5a6e9a] mb-2">Period</label>
              <select
                value={period}
                onChange={e => setPeriod(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-[#e0e4ed] rounded-lg focus:ring-2 focus:ring-[#0b27b1] focus:border-[#0b27b1] transition-colors"
              >
                {PERIODS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            {(period === 'custom' || period === 'specific') && (
              <>
                <div className="min-w-[180px]">
                  <label className="block text-sm font-medium text-[#5a6e9a] mb-2">{period === 'specific' ? "Date" : "From"}</label>
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={e => setDateRange(r => ({ ...r, from: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm border border-[#e0e4ed] rounded-lg focus:ring-2 focus:ring-[#0b27b1] focus:border-[#0b27b1] transition-colors"
                  />
                </div>
                {period === 'custom' && (
                  <div className="min-w-[180px]">
                    <label className="block text-sm font-medium text-[#5a6e9a] mb-2">To</label>
                    <input
                      type="date"
                      value={dateRange.to}
                      onChange={e => setDateRange(r => ({ ...r, to: e.target.value }))}
                      className="w-full px-4 py-2.5 text-sm border border-[#e0e4ed] rounded-lg focus:ring-2 focus:ring-[#0b27b1] focus:border-[#0b27b1] transition-colors"
                    />
                  </div>
                )}
              </>
            )}
            <div className="flex-1 flex justify-end gap-2 flex-wrap">
              {getExportButtons().map((button, index) => (
                <Button
                  key={index}
                  variant="outlined"
                  size="small"
                  onClick={() => { handleExport('csv', button.dataType); }}
                  sx={{
                    color: '#0492c2',
                    borderColor: '#0492c2',
                    fontSize: '0.8rem',
                    whiteSpace: 'nowrap',
                    '&:hover': { borderColor: '#5a6e9a', backgroundColor: '#f8fbfd' }
                  }}
                >
                  {button.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* End header fragment */}

      {/* Modern Tabs Section - Inventory style */}
      <div className="mb-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 border border-slate-200/60 shadow-lg shadow-slate-200/20">
          <nav className="flex space-x-2">
            {[
              { id: 0, name: 'Sales & Top Medicines' },
              { id: 1, name: 'Stock & Expiry' },
              { id: 2, name: 'Expenses' },
              { id: 3, name: 'Customers' }
            ].map((tabObj) => (
              <button
                key={tabObj.id}
                onClick={() => setTab(tabObj.id)}
                className={`relative px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${tab === tabObj.id
                  ? 'bg-gradient-to-r from-[#0b27b1] to-[#1e40af] text-white shadow-lg shadow-blue-200/50 transform scale-105'
                  : 'text-slate-600 hover:text-[#0b27b1] hover:bg-slate-50/80'
                  }`}
              >
                <span className="relative z-10">{tabObj.name}</span>
                {tab === tabObj.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0b27b1] to-[#1e40af] rounded-xl blur-sm opacity-30"></div>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* 1. Sales & Revenue Reports */}
          {tab === 0 && (
            <div className="space-y-6">
              {/* Modern Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-[#0b27b1] to-[#5a6e9a] rounded-xl p-6 text-white shadow-lg">
                  <div className="text-center">
                    <p className="text-sm opacity-90 mb-2">Total Revenue</p>
                    <h3 className="text-xl font-bold">
                      LKR {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-[#5a6e9a] to-[#0b27b1] rounded-xl p-6 text-white shadow-lg">
                  <div className="text-center">
                    <p className="text-sm opacity-90 mb-2">Total Orders</p>
                    <h3 className="text-xl font-bold">{totalOrders}</h3>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-[#0492c2] to-[#5a6e9a] rounded-xl p-6 text-white shadow-lg">
                  <div className="text-center">
                    <p className="text-sm opacity-90 mb-2">Profit (rev - exp)</p>
                    <h3 className="text-xl font-bold">
                      LKR {Math.abs(profitOrLoss).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                </div>
                <div className="bg-white border border-[#e0e4ed] rounded-xl p-6 shadow-sm">
                  <div className="text-center">
                    <p className="text-sm text-[#5a6e9a] mb-2">Total Expenses</p>
                    <h3 className="text-xl font-bold text-[#0b27b1]">
                      LKR {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                </div>
              </div>
              {/* Modern Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-[#e0e4ed] shadow-sm">
                  <div className="p-6 border-b border-[#e0e4ed]">
                    <h3 className="text-lg font-semibold text-[#0b27b1] text-center">
                      Top Selling Medicines
                    </h3>
                  </div>
                  <div className="p-4" style={{ height: CHART_HEIGHT }}>
                    {topSelling.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topSelling} margin={{ top: 20, right: 20, left: 20, bottom: 80 }}>
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 10 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            interval={0}
                          />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip
                            formatter={(value, name) => [value, name === 'qty' || name === 'quantity' ? 'Quantity Sold' : name]}
                          />
                          <Bar
                            dataKey={Object.keys(topSelling[0]).includes('qty') ? 'qty' : 'quantity'}
                            fill="#0b27b1"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-[#5a6e9a] text-center">No sales data available</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-[#e0e4ed] shadow-sm">
                  <div className="p-6 border-b border-[#e0e4ed]">
                    <h3 className="text-lg font-semibold text-[#0b27b1] text-center">
                      Category-wise Sales Distribution
                    </h3>
                  </div>
                  <div className="p-4" style={{ height: CHART_HEIGHT }}>
                    {categorySalesArr.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categorySalesArr}
                            dataKey="value"
                            nameKey="category"
                            cx="50%"
                            cy="50%"
                            outerRadius="70%"
                            label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(1)}%`}
                            labelLine={false}
                          >
                            {categorySalesArr.map((entry, idx) => (
                              <Cell key={`c-${idx}`} fill={COLORS[idx % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`LKR ${Number(value).toLocaleString()}`, 'Sales']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-[#5a6e9a] text-center">No category data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Modern Sales Table */}
              <div className="bg-white rounded-xl border border-[#e0e4ed] shadow-sm">
                <div className="p-6 border-b border-[#e0e4ed]">
                  <h3 className="text-lg font-semibold text-[#0b27b1]">Sales Table</h3>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHead>
                      <TableRow className="bg-[#f8fbfd]">
                        <TableCell align="center" className="font-semibold text-[#0b27b1]">Order ID</TableCell>
                        <TableCell align="center" className="font-semibold text-[#0b27b1]">Date</TableCell>
                        <TableCell align="center" className="font-semibold text-[#0b27b1]">Customer</TableCell>
                        <TableCell align="center" className="font-semibold text-[#0b27b1]">Items</TableCell>
                        <TableCell align="center" className="font-semibold text-[#0b27b1]">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(filteredSales || []).map(s => (
                        <TableRow key={s.id} className="hover:bg-[#f8fbfd] transition-colors">
                          <TableCell align="center">{s.id}</TableCell>
                          <TableCell align="center">{s.date}</TableCell>
                          <TableCell align="center">{s.customer_name || '-'}</TableCell>
                          <TableCell align="center">{Array.isArray(s.cart) ? s.cart.map(i => `${i.name} x${i.quantity || i.qty || 1}`).join(', ') : '-'}</TableCell>
                          <TableCell align="center" className="font-semibold">LKR {Number(s.total).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
          {/* 2. Stock & Expiry Analysis */}
          {tab === 1 && (
            <div className="space-y-6">
              {/* Stock & Expiry Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-[#e0e4ed] rounded-xl p-6 shadow-sm">
                  <div className="text-center">
                    <p className="text-sm text-[#0b27b1] mb-2">Total Medicines</p>
                    <h3 className="text-xl font-bold text-[#0b27b1]">{medicines.length}</h3>
                  </div>
                </div>
                <div className="bg-white border border-[#e0e4ed] rounded-xl p-6 shadow-sm">
                  <div className="text-center">
                    <p className="text-sm text-[#5a6e9a] mb-2">Low Stock</p>
                    <h3 className="text-xl font-bold text-[#0b27b1]">{lowStockUpdated.length}</h3>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-[#0492c2] to-[#5a6e9a] rounded-xl p-6 text-white shadow-lg">
                  <div className="text-center">
                    <p className="text-sm opacity-90 mb-2">Expiring in {expiryDaysThreshold} days</p>
                    <h3 className="text-xl font-bold">{expirySoonMeds.length}</h3>
                  </div>
                </div>
                <div className="bg-white border border-[#e0e4ed] rounded-xl p-6 shadow-sm">
                  <div className="text-center">
                    <p className="text-sm text-[#0b27b1] mb-2">Total Batches</p>
                    <h3 className="text-xl font-bold text-[#0b27b1]">{grnItems.length}</h3>
                  </div>
                </div>
              </div>

              {/* Modern Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-[#e0e4ed] shadow-sm">
                  <div className="p-6 border-b border-[#e0e4ed]">
                    <h3 className="text-lg font-semibold text-[#0b27b1] text-center">
                      Lowest Available Medicines (Critical Stock)
                    </h3>
                  </div>
                  <div className="p-4" style={{ height: CHART_HEIGHT }}>
                    {lowStockChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={lowStockChartData} margin={{ top: 20, right: 20, left: 120, bottom: 20 }}>
                          <XAxis type="number" tick={{ fontSize: 11 }} />
                          <YAxis
                            dataKey="name"
                            type="category"
                            width={110}
                            tick={{ fontSize: 9 }}
                            interval={0}
                          />
                          <Tooltip formatter={(value) => [value, 'Available Stock']} />
                          <Bar
                            dataKey="available"
                            fill="#0492c2"
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-[#5a6e9a] text-center">No low-stock items to display</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-[#e0e4ed] shadow-sm">
                  <div className="p-6 border-b border-[#e0e4ed]">
                    <h3 className="text-lg font-semibold text-[#0b27b1] text-center">
                      Medicine Expiry Distribution
                    </h3>
                  </div>
                  <div className="p-4" style={{ height: CHART_HEIGHT }}>
                    {expiryBuckets.reduce((s, b) => s + b.value, 0) > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expiryBuckets}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius="70%"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                            labelLine={false}
                          >
                            {expiryBuckets.map((entry, idx) => (
                              <Cell key={`exp-${idx}`} fill={COLORS[idx % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [value, 'Items']} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-[#5a6e9a] text-center">No expiring items in threshold</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Purchase Batches Chart */}
              <div className="bg-white rounded-xl border border-[#e0e4ed] shadow-sm">
                <div className="p-6 border-b border-[#e0e4ed]">
                  <h3 className="text-lg font-semibold text-[#0b27b1] text-center">
                    Purchase Batches by Category
                  </h3>
                </div>
                <div className="p-4" style={{ height: 350 }}>
                  {batchesByCategory.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={batchesByCategory} margin={{ top: 20, right: 20, left: 20, bottom: 80 }}>
                        <XAxis
                          dataKey="category"
                          tick={{ fontSize: 10 }}
                          interval={0}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(value) => [value, 'Batches']} />
                        <Bar
                          dataKey="value"
                          fill="#0b27b1"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-[#5a6e9a] text-center">No batches to display</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Data Tables Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Low Stock Panel */}
                <div className="bg-white rounded-xl border border-[#e0e4ed] shadow-sm">
                  <div className="p-6 border-b border-[#e0e4ed]">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-[#0b27b1]">Low Stock Medicines</h3>
                      <div className="flex gap-2">
                        <input
                          placeholder="Search..."
                          value={stockSearch}
                          onChange={e => setStockSearch(e.target.value)}
                          className="px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg focus:ring-2 focus:ring-[#0b27b1] focus:border-[#0b27b1]"
                        />
                        <select
                          value={stockSort}
                          onChange={e => setStockSort(e.target.value)}
                          className="px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg focus:ring-2 focus:ring-[#0b27b1] focus:border-[#0b27b1]"
                        >
                          <option value="available_asc">Available ↑</option>
                          <option value="available_desc">Available ↓</option>
                          <option value="name">Name</option>
                        </select>
                        <label className="flex items-center gap-2 text-sm text-[#5a6e9a]">
                          <input
                            type="checkbox"
                            checked={showCriticalOnly}
                            onChange={e => setShowCriticalOnly(e.target.checked)}
                            className="text-[#0b27b1] focus:ring-[#0b27b1]"
                          />
                          Critical only
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <Table size="small">
                      <TableHead>
                        <TableRow className="bg-[#f8fbfd]">
                          <TableCell align="center" className="font-semibold text-[#0b27b1]">Name</TableCell>
                          <TableCell align="center" className="font-semibold text-[#0b27b1]">Category</TableCell>
                          <TableCell align="center" className="font-semibold text-[#0b27b1]">Available</TableCell>
                          <TableCell align="center" className="font-semibold text-[#0b27b1]">Reorder</TableCell>
                          <TableCell align="center" className="font-semibold text-[#0b27b1]">Purchased</TableCell>
                          <TableCell align="center" className="font-semibold text-[#0b27b1]">Sold</TableCell>
                          <TableCell align="center" className="font-semibold text-[#0b27b1]">Batches</TableCell>
                          <TableCell align="center" className="font-semibold text-[#0b27b1]">Expiry (Earliest)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {lowStockUpdated
                          .filter(m => (!stockSearch || String(m.name).toLowerCase().includes(stockSearch.toLowerCase())))
                          .filter(m => (!showCriticalOnly || m.available === 0 || m.available <= (m.reorderLevel || 10)))
                          .sort((a, b) => {
                            if (stockSort === 'available_desc') return b.available - a.available;
                            if (stockSort === 'name') return String(a.name).localeCompare(String(b.name));
                            return a.available - b.available;
                          })
                          .map(m => (
                            <TableRow key={m.id || m.name} className="hover:bg-[#f8fbfd] transition-colors">
                              <TableCell align="center">{m.name}</TableCell>
                              <TableCell align="center">{m.category}</TableCell>
                              <TableCell align="center">
                                <strong>{m.available}</strong>
                                {m.available === 0 ? <span className="text-[#5a6e9a] ml-2">Out</span> : null}
                              </TableCell>
                              <TableCell align="center">{m.reorderLevel}</TableCell>
                              <TableCell align="center">{m.purchased}</TableCell>
                              <TableCell align="center">{m.totalSold}</TableCell>
                              <TableCell align="center">{m.batchesCount}</TableCell>
                              <TableCell align="center">{m.earliestExpiry ? new Date(m.earliestExpiry).toISOString().slice(0, 10) : '-'}</TableCell>
                            </TableRow>
                          ))
                        }
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Expiry Panel */}
                <div className="bg-white rounded-xl border border-[#e0e4ed] shadow-sm">
                  <div className="p-6 border-b border-[#e0e4ed]">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-[#0b27b1]">Expiring Medicines</h3>
                      <div className="flex gap-2">
                        <input
                          placeholder="Search..."
                          value={expirySearch}
                          onChange={e => setExpirySearch(e.target.value)}
                          className="px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg focus:ring-2 focus:ring-[#0b27b1] focus:border-[#0b27b1]"
                        />
                        <input
                          type="number"
                          value={expiryDaysThreshold}
                          onChange={e => setExpiryDaysThreshold(e.target.value)}
                          className="w-20 px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg focus:ring-2 focus:ring-[#0b27b1] focus:border-[#0b27b1]"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <Table size="small">
                      <TableHead>
                        <TableRow className="bg-[#f8fbfd]">
                          <TableCell align="center" className="font-semibold text-[#0b27b1]">Name</TableCell>
                          <TableCell align="center" className="font-semibold text-[#0b27b1]">Days to Expiry</TableCell>
                          <TableCell align="center" className="font-semibold text-[#0b27b1]">Earliest Expiry</TableCell>
                          <TableCell align="center" className="font-semibold text-[#0b27b1]">Available</TableCell>
                          <TableCell align="center" className="font-semibold text-[#0b27b1]">Batches</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {expirySoonGrn
                          .filter(item => (!expirySearch || String(item.medicine_name).toLowerCase().includes(expirySearch.toLowerCase())))
                          .filter(item => item.daysToExpiry <= Number(expiryDaysThreshold) && item.daysToExpiry >= 0)
                          .map(item => (
                            <TableRow key={item.id || item.medicine_id || item.medicine_name} className="hover:bg-[#f8fbfd] transition-colors">
                              <TableCell align="center">{item.medicine_name}</TableCell>
                              <TableCell align="center">
                                <strong className={`${item.daysToExpiry <= 7 ? 'text-[#5a6e9a]' :
                                  item.daysToExpiry <= 30 ? 'text-[#0492c2]' :
                                    'text-[#0492c2]'
                                  }`}>
                                  {item.daysToExpiry}
                                </strong>
                              </TableCell>
                              <TableCell align="center">
                                {item.expiryDate ? item.expiryDate.toISOString().slice(0, 10) : '-'}
                              </TableCell>
                              <TableCell align="center">{item.quantity}</TableCell>
                              <TableCell align="center">1</TableCell>
                            </TableRow>
                          ))
                        }
                      </TableBody>
                    </Table>
                  </div>
                  <div className="p-4 bg-[#f8fbfd] rounded-b-xl">
                    <p className="text-sm text-[#5a6e9a]">
                      Tip: Use the Purchase History (GRN) to move batch stock or mark items for promotion/clearance.
                    </p>
                  </div>
                </div>
              </div>              {/* Master Medicines Table */}
              <div className="bg-white rounded-xl border border-[#e0e4ed] shadow-sm">
                <div className="p-6 border-b border-[#e0e4ed]">
                  <h3 className="text-lg font-semibold text-[#0b27b1]">Master Medicines Snapshot</h3>
                </div>
                <div className="overflow-x-auto">
                  <Table size="small">
                    <TableHead>
                      <TableRow className="bg-[#f8fbfd]">
                        <TableCell align="center" className="font-semibold text-[#0b27b1]">ID</TableCell>
                        <TableCell align="center" className="font-semibold text-[#0b27b1]">Name</TableCell>
                        <TableCell align="center" className="font-semibold text-[#0b27b1]">Category</TableCell>
                        <TableCell align="center" className="font-semibold text-[#0b27b1]">Available</TableCell>
                        <TableCell align="center" className="font-semibold text-[#0b27b1]">Latest Expiry</TableCell>
                        <TableCell align="center" className="font-semibold text-[#0b27b1]">Batches</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {medAggregates.map(m => (
                        <TableRow key={m.id || m.name} className="hover:bg-[#f8fbfd] transition-colors">
                          <TableCell align="center">{m.id || '-'}</TableCell>
                          <TableCell align="center">{m.name || '-'}</TableCell>
                          <TableCell align="center">{m.category || '-'}</TableCell>
                          <TableCell align="center">{m.available}</TableCell>
                          <TableCell align="center">{m.latestExpiry ? new Date(m.latestExpiry).toISOString().slice(0, 10) : '-'}</TableCell>
                          <TableCell align="center">{m.batchesCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
          {/* 3. Expenses Analysis */}
          {tab === 2 && (
            <div className="space-y-6">
              {/* Expenses Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-[#0b27b1] to-[#5a6e9a] rounded-xl p-6 text-white shadow-lg">
                  <div className="text-center">
                    <p className="text-sm opacity-90 mb-2">Total Expenses</p>
                    <h3 className="text-xl font-bold">
                      LKR {totalExpensesValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                </div>
                <div className="bg-white border border-[#e0e4ed] rounded-xl p-6 shadow-sm">
                  <div className="text-center">
                    <p className="text-sm text-[#0b27b1] mb-2">Average Expense</p>
                    <h3 className="text-xl font-bold text-[#0b27b1]">
                      LKR {avgExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-[#0492c2] to-[#5a6e9a] rounded-xl p-6 text-white shadow-lg">
                  <div className="text-center">
                    <p className="text-sm opacity-90 mb-2">Largest Expense</p>
                    <h3 className="text-xl font-bold">
                      LKR {largestExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-[#5a6e9a] to-[#8db4e1] rounded-xl p-6 text-white shadow-lg">
                  <div className="text-center">
                    <p className="text-sm opacity-90 mb-2">Pending Balance</p>
                    <h3 className="text-xl font-bold">
                      LKR {pendingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Modern Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-xl border border-[#e0e4ed] shadow-sm">
                  <div className="p-6 border-b border-[#e0e4ed]">
                    <h3 className="text-lg font-semibold text-[#0b27b1] text-center">
                      Expense Trend Over Time
                    </h3>
                  </div>
                  <div className="p-4" style={{ height: CHART_HEIGHT }}>
                    {expenseTrend.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={expenseTrend} margin={{ top: 20, right: 20, left: 20, bottom: 80 }}>
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip formatter={v => [`LKR ${Number(v).toLocaleString()}`, 'Amount']} />
                          <Bar
                            dataKey="value"
                            fill="#0b27b1"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-[#5a6e9a] text-center">No expense trend available</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-[#e0e4ed] shadow-sm">
                  <div className="p-6 border-b border-[#e0e4ed]">
                    <h3 className="text-lg font-semibold text-[#0b27b1] text-center">
                      Expenses by Category Distribution
                    </h3>
                  </div>
                  <div className="p-4" style={{ height: CHART_HEIGHT }}>
                    {expensesByCategory.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={expensesByCategory}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius="70%"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                            labelLine={false}
                          >
                            {expensesByCategory.map((entry, idx) => (
                              <Cell key={`expc-${idx}`} fill={COLORS[idx % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={v => [`LKR ${Number(v).toLocaleString()}`, 'Amount']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-[#5a6e9a] text-center">No category data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Divider sx={{ my: 2 }} />

              {/* Modern Filter Section */}
              <div className="bg-white rounded-xl border border-[#e0e4ed] shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Assessment className="text-[#0b27b1] text-lg" />
                    <h3 className="text-lg font-semibold text-[#0b27b1]">Filter Expenses</h3>
                  </div>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => { handleExport('csv', 'expenses'); }}
                    sx={{
                      backgroundColor: '#0b27b1',
                      color: 'white',
                      '&:hover': { backgroundColor: '#5a6e9a' }
                    }}
                  >
                    Export Expenses CSV
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#5a6e9a] mb-1">Search Expenses</label>
                    <input
                      placeholder="Search description, paid to..."
                      value={expenseSearch}
                      onChange={e => setExpenseSearch(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#e0e4ed] rounded-lg focus:ring-2 focus:ring-[#0b27b1] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#5a6e9a] mb-1">Category</label>
                    <select
                      value={expenseCategoryFilter}
                      onChange={e => setExpenseCategoryFilter(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#e0e4ed] rounded-lg focus:ring-2 focus:ring-[#0b27b1] outline-none"
                    >
                      <option value="all">All Categories</option>
                      {/* Dynamically extract categories from current expenses */}
                      {Array.from(new Set(expenses.map(e => e.category || e.expense || 'Other'))).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#5a6e9a] mb-1">Method</label>
                    <select
                      value={expenseMethodFilter}
                      onChange={e => setExpenseMethodFilter(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#e0e4ed] rounded-lg focus:ring-2 focus:ring-[#0b27b1] outline-none"
                    >
                      <option value="all">All Methods</option>
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => {
                        setExpenseSearch('');
                        setExpenseCategoryFilter('all');
                        setExpenseMethodFilter('all');
                      }}
                      sx={{ color: '#5a6e9a', textTransform: 'none' }}
                    >
                      Reset Local Filters
                    </Button>
                  </div>
                </div>
              </div>

              {/* Modern Expenses Table */}
              <div className="bg-white rounded-xl border border-[#e0e4ed] shadow-sm">
                <div className="p-6 border-b border-[#e0e4ed]">
                  <h3 className="text-lg font-semibold text-[#0b27b1]">Expenses Table</h3>
                </div>
                <div className="overflow-x-auto">
                  <Table size="small">
                    <TableHead>
                      <TableRow className="bg-[#f8fbfd]">
                        <TableCell align="center" className="font-semibold text-[#0b27b1]">Date</TableCell>
                        <TableCell align="center" className="font-semibold text-[#0b27b1]">Expense</TableCell>
                        <TableCell align="center" className="font-semibold text-[#0b27b1]">Paid To</TableCell>
                        <TableCell align="center" className="font-semibold text-[#0b27b1]">Category</TableCell>
                        <TableCell align="center" className="font-semibold text-[#0b27b1]">Method</TableCell>
                        <TableCell align="center" className="font-semibold text-[#0b27b1]">Amount</TableCell>
                        <TableCell align="center" className="font-semibold text-[#0b27b1]">Status</TableCell>
                        <TableCell align="center" className="font-semibold text-[#0b27b1]">Balance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredExpenses.length > 0 ? filteredExpenses.map(e => (
                        <TableRow key={e.id || `${e.date}-${e.amount}`} className="hover:bg-[#f8fbfd] transition-colors">
                          <TableCell align="center">{e.date ? String(e.date).slice(0, 10) : '-'}</TableCell>
                          <TableCell align="center">{e.expense || '-'}</TableCell>
                          <TableCell align="center">{e.paidTo || '-'}</TableCell>
                          <TableCell align="center">{e.category || e.expense || '-'}</TableCell>
                          <TableCell align="center">{e.paymentMethod || '-'}</TableCell>
                          <TableCell align="center" className="font-semibold">LKR {Number(e.amount).toLocaleString()}</TableCell>
                          <TableCell align="center">{e.status || '-'}</TableCell>
                          <TableCell align="center" className="font-semibold">LKR {Number(e.balance || 0).toLocaleString()}</TableCell>
                        </TableRow>
                      )) : (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                            <p className="text-[#5a6e9a]">No expenses found for the selected criteria.</p>
                            <p className="text-xs text-[#5a6e9a] mt-1">Try adjusting the local filters above or the main date period at the top.</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
          {/* 4. Customer Analysis (enhanced) */}
          {tab === 3 && (
            <div className="space-y-6">
              {/* Modern Filter Section */}
              <div className="bg-white rounded-xl border border-[#e0e4ed] shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Assessment className="text-[#0b27b1] text-lg" />
                  <h3 className="text-lg font-semibold text-[#0b27b1]">Search Customers</h3>
                </div>
                <div className="flex flex-wrap gap-3 items-end">
                  <input
                    placeholder="Search customers..."
                    value={custSearch}
                    onChange={e => setCustSearch(e.target.value)}
                    className="px-4 py-2.5 text-sm border border-[#e0e4ed] rounded-lg focus:ring-2 focus:ring-[#0b27b1] focus:border-[#0b27b1] min-w-[220px]"
                  />
                  <Button
                    variant="outlined"
                    onClick={() => { setCustSearch(''); }}
                    sx={{
                      color: '#0b27b1',
                      borderColor: '#0b27b1',
                      '&:hover': { borderColor: '#5a6e9a', backgroundColor: '#f8fbfd' }
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {/* Customer Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white border border-[#e0e4ed] rounded-xl p-6 shadow-sm">
                  <div className="text-center">
                    <p className="text-sm text-[#0b27b1] mb-2">Total Customers</p>
                    <h3 className="text-xl font-bold text-[#0b27b1]">{customers.length}</h3>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-[#0b27b1] to-[#5a6e9a] rounded-xl p-6 text-white shadow-lg">
                  <div className="text-center">
                    <p className="text-sm opacity-90 mb-2">Top Customer (by spend)</p>
                    <h3 className="text-lg font-bold">
                      {customerAnalytics[0] ? `${customerAnalytics[0].name} — LKR ${Number(customerAnalytics[0].spent).toLocaleString()}` : '-'}
                    </h3>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-[#0492c2] to-[#5a6e9a] rounded-xl p-6 text-white shadow-lg">
                  <div className="text-center">
                    <p className="text-sm opacity-90 mb-2">Avg Spend (top 10)</p>
                    <h3 className="text-xl font-bold">
                      LKR {(customerAnalytics.length ? (customerAnalytics.reduce((s, c) => s + Number(c.spent || 0), 0) / customerAnalytics.length) : 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Top Customers Table */}
              <div className="bg-white rounded-xl border border-[#e0e4ed] shadow-sm">
                <div className="p-6 border-b border-[#e0e4ed]">
                  <h3 className="text-lg font-semibold text-[#0b27b1]">Top Customers</h3>
                </div>
                <div className="overflow-x-auto">
                  <Table size="small">
                    <TableHead>
                      <TableRow className="bg-[#f8fbfd]">
                        <TableCell align="center" className="font-semibold text-[#0b27b1]">Customer</TableCell>
                        <TableCell align="center" className="font-semibold text-[#0b27b1]">Orders</TableCell>
                        <TableCell align="center" className="font-semibold text-[#0b27b1]">Total Spent</TableCell>
                        <TableCell align="center" className="font-semibold text-[#0b27b1]">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredCustomerAnalytics.length > 0 ? filteredCustomerAnalytics.map(c => (
                        <TableRow key={c.id || c.name} className="hover:bg-[#f8fbfd] transition-colors">
                          <TableCell align="center">{c.name}</TableCell>
                          <TableCell align="center">{c.orders}</TableCell>
                          <TableCell align="center" className="font-semibold">LKR {Number(c.spent).toLocaleString()}</TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                // Resolve full customer object from customers list (prefer real customer record)
                                const fullCust = (customers || []).find(x => String(x.id) === String(c.id)) || (customers || []).find(x => String(x.name || '').toLowerCase() === String(c.name || '').toLowerCase()) || c;
                                setSelectedCustomer(fullCust);
                                // fetch using id if available, else pass name to helper which will try to resolve
                                fetchCustomerPurchases(fullCust?.id, fullCust?.name || c.name);
                                setShowCustomerModal(true);
                              }}
                              sx={{
                                color: '#0b27b1',
                                borderColor: '#0b27b1',
                                '&:hover': { borderColor: '#5a6e9a', backgroundColor: '#f8fbfd' }
                              }}
                            >
                              View Purchases
                            </Button>
                          </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow><TableCell colSpan={4} align="center">No customers found</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Customer Purchase History Modal */}
              {showCustomerModal && (
                <div className="bg-white rounded-xl border border-[#e0e4ed] shadow-sm">
                  <div className="p-6 border-b border-[#e0e4ed]">
                    <h3 className="text-lg font-semibold text-[#0b27b1]">
                      {selectedCustomer ? selectedCustomer.name : 'Customer'} — Purchase History
                    </h3>
                  </div>
                  <div className="p-6">
                    {historyLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <p className="text-[#5a6e9a]">Loading...</p>
                      </div>
                    ) : customerHistory.length === 0 ? (
                      <div className="flex items-center justify-center py-8">
                        <p className="text-[#5a6e9a]">No purchases found for this customer.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table size="small">
                          <TableHead>
                            <TableRow className="bg-[#f8fbfd]">
                              <TableCell align="center" className="font-semibold text-[#0b27b1]">Order ID</TableCell>
                              <TableCell align="center" className="font-semibold text-[#0b27b1]">Date</TableCell>
                              <TableCell align="center" className="font-semibold text-[#0b27b1]">Items</TableCell>
                              <TableCell align="center" className="font-semibold text-[#0b27b1]">Total</TableCell>
                              <TableCell align="center" className="font-semibold text-[#0b27b1]">Paid</TableCell>
                              <TableCell align="center" className="font-semibold text-[#0b27b1]">Credit</TableCell>
                              <TableCell align="center" className="font-semibold text-[#0b27b1]">Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {customerHistory.map(o => (
                              <TableRow key={o.id || `${o.date}-${o.total}`} className="hover:bg-[#f8fbfd] transition-colors">
                                <TableCell align="center">{o.id}</TableCell>
                                <TableCell align="center">{o.date ? String(o.date).slice(0, 10) : '-'}</TableCell>
                                <TableCell align="center">{Array.isArray(o.cart) ? o.cart.map(i => `${i.name} x${i.quantity || i.qty || 1}`).join('; ') : '-'}</TableCell>
                                <TableCell align="center" className="font-semibold">LKR {Number(o.total || o.subtotal || 0).toLocaleString()}</TableCell>
                                <TableCell align="center">LKR {Number(o.paid_amount || 0).toLocaleString()}</TableCell>
                                <TableCell align="center">LKR {Number(o.future_credit || 0).toLocaleString()}</TableCell>
                                <TableCell align="center">{o.status || '-'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                    <div className="flex justify-end mt-6">
                      <Button
                        onClick={() => { setShowCustomerModal(false); setSelectedCustomer(null); setCustomerHistory([]); }}
                        sx={{ color: '#5a6e9a' }}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ----------------- Utility functions used above ----------------- */

function aggregateByDate(items) {
  const map = {};
  items.forEach(i => {
    const d = i.date ? String(i.date).slice(0, 10) : '-';
    map[d] = (map[d] || 0) + (Number(i.amount || i.total || i.value) || 0);
  });
  return Object.entries(map).map(([date, value]) => ({ date, value }));
}
