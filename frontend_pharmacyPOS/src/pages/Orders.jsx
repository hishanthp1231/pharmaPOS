import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, ToggleButtonGroup, ToggleButton, Grid, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, InputAdornment, MenuItem, Select, FormControl
} from '@mui/material';
import { Add, Remove, Search } from '@mui/icons-material';
import api from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import { PencilIcon, TrashIcon, EyeIcon, PlusIcon } from '@heroicons/react/24/outline';
 

export default function Orders() {
  const [activeTab, setActiveTab] = useState('orders');
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [numPersons, setNumPersons] = useState(1);
  const [orderType, setOrderType] = useState('dine-in');
  const [tables, setTables] = useState([]);
  const [showTableModal, setShowTableModal] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [orders, setOrders] = useState([]);
  const [viewOrder, setViewOrder] = useState(null);
  const [viewOrderCart, setViewOrderCart] = useState([]);
  const [editOrder, setEditOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [branchId] = useState(1);
  const navigate = useNavigate();

  // Permission state
  const [canView, setCanView] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  // Fetch orders when Orders tab is active
  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      const res = await api.get(`/orders`, { params: { branch_id: branchId } });
      setOrders(res.data.data || []);
    } catch (err) {
      setOrders([]);
      console.error('Error fetching orders:', err);
    }
  };

  // Fetch tables when Tables tab is active
  useEffect(() => {
    if (activeTab === 'tables') fetchTables();
  }, [activeTab]);

  const fetchTables = async () => {
    try {
      // Always send branch_id as a param
      const res = await api.get(`/tables`, { params: { branch_id: branchId } });
      setTables(res.data.data || []);
    } catch (err) {
      setTables([]);
      console.error('Error fetching tables:', err);
    }
  };

  const handleCreateOrder = () => {
    const order = {
      date: orderDate,
      customerName,
      customerPhone,
      numPersons,
      orderType,
      branchId: 1 // Default branch ID
    };
    setShowModal(false);
    console.log('[Orders] Creating order:', order);
    if (orderType === 'dine-in') {
      console.log('[Orders] Navigating to /tables with order:', order);
      navigate('/tables', { state: { order } });
    } else {
      console.log('[Orders] Navigating to /home with order:', order);
      navigate('/home', { state: { order } });
    }
  };

  const handleCreateTable = async () => {
    try {
      await api.post(`/tables`, { name: newTableName.trim(), branch_id: 1 });
      setShowTableModal(false);
      setNewTableName('');
      fetchTables();
    } catch (err) {
      alert('Failed to create table');
    }
  };

  const getStatusColor = (status) => {
    if (status === 'available') return '#4ade80';
    if (status === 'booked') return '#f87171';
    if (status === 'reserved') return '#fbbf24';
    return '#e5e7eb';
  };

  // Filtered orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      order.customer_phone?.toLowerCase().includes(search.toLowerCase()) ||
      (order.table_id && String(order.table_id).includes(search)) ||
      (order.id && String(order.id).includes(search));
    const matchesType = filterType === 'all' || order.order_type === filterType;
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // View order handler (open modal)
  const handleViewOrder = async (order) => {
    setViewOrder(order);
    try {
      // Fetch latest order details (including cart) from backend
      const res = await api.get(`/orders`, { params: { branch_id: branchId } });
      const found = (res.data.data || []).find(o => o.id === order.id);
      let cart = [];
      if (found && found.cart) {
        if (typeof found.cart === 'string') {
          try {
            cart = JSON.parse(found.cart);
          } catch {
            cart = [];
          }
        } else if (Array.isArray(found.cart)) {
          cart = found.cart;
        }
      }
      setViewOrderCart(cart);
    } catch (err) {
      setViewOrderCart([]);
    }
  };

  // Edit order handler (open modal)
  const handleEditOrder = (order) => {
    setEditOrder(order);
    setShowModal(true);
    setCustomerName(order.customer_name || order.customerName || '');
    setCustomerPhone(order.customer_phone || order.customerPhone || '');
    setNumPersons(order.num_persons || order.numPersons || 1);
    setOrderDate(order.date ? order.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setOrderType(order.order_type || order.orderType || 'dine-in');
  };

  // Update order handler (submit modal)
  const handleUpdateOrder = async () => {
    if (!editOrder) return;
    try {
      await api.put(`/orders/${editOrder.id}`, {
        customer_name: customerName,
        customer_phone: customerPhone,
        num_persons: numPersons,
        order_type: orderType,
        date: orderDate,
        branch_id: branchId
      });
      setShowModal(false);
      setEditOrder(null);
      fetchOrders();
    } catch (err) {
      alert('Failed to update order');
    }
  };

  // Delete order handler
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      await api.delete(`orders/${orderId}`);
      fetchOrders();
    } catch (err) {
      alert('Failed to delete order');
    }
  };

  // Update order status handler
  const handleStatusChange = async (order, newStatus) => {
    try {
      await api.patch(`/orders/${order.id}/status`, {
        status: newStatus,
        branch_id: branchId
      });
      fetchOrders();
    } catch (err) {
      alert('Failed to update order status');
    }
  };

  // Add logic to show table status based on latest order for each table
  const getTableStatus = (table, orders) => {
    const tableOrders = orders.filter(o => o.table_id === table.id);
    if (tableOrders.length === 0) return 'available';
    tableOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const latestOrder = tableOrders[0];
    if (!latestOrder) return 'available';
    if (['pending', 'inprogress', 'active'].includes(latestOrder.status)) return 'booked';
    if (['completed', 'cancelled', 'removed'].includes(latestOrder.status)) return 'available';
    return 'available';
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const normalizedRole = String(user?.role || '').toLowerCase().replace(/[\s-]+/g, '_');
    const isSuperAdmin = normalizedRole === 'super_admin' || normalizedRole === 'superadmin' || user?.username === 'superadmin' || user?.is_admin === true || user?.is_admin === 1;
    if (isSuperAdmin) {
      setCanView(true);
      setCanEdit(true);
      setCanDelete(true);
      return;
    }
    if (user.role_id) {
      api.get(`/user-management/roles/${user.role_id}`)
        .then(res => {
          const role = res.data.data;
          setCanView(role?.can_view === 1 || role?.can_view === true);
          setCanEdit(role?.can_edit === 1 || role?.can_edit === true);
          setCanDelete(role?.can_delete === 1 || role?.can_delete === true);
        })
        .catch(() => {
          setCanView(false);
          setCanEdit(false);
          setCanDelete(false);
        });
    } else {
      setCanView(false);
      setCanEdit(false);
      setCanDelete(false);
    }
  }, []);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4 }}>
      {/* Remove Paper background container */}
      <div>
        {/* Heading styled like IngredientsSection */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-[140px] h-[36px] flex items-center justify-center rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.1)]">
              <div className="w-[130px] h-[30px] flex items-center justify-center rounded-full bg-white border border-[#d0d7f2] text-[#0b27b1] text-[15px] font-semibold -mt-0.5 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8)]">
                Orders
              </div>
            </div>
          </div>
          {activeTab === 'orders' && (
            <button
              className="px-4 py-1.5 rounded-xl bg-gradient-to-br from-[#0492c2] via-[#107cd1] to-[#0b27b1] text-white shadow-[inset_0_6px_10px_rgba(0,0,0,0.7),0_6px_10px_#0b27b1] border border-white/20 text-sm font-medium hover:brightness-110 transition-all duration-300 active:translate-y-px flex items-center gap-1"
              onClick={() => setShowModal(true)}
            >
              <PlusIcon className="w-4 h-4" />
              Add New Order
            </button>
          )}
          {activeTab === 'tables' && (
            <button
              className="px-4 py-1.5 rounded-xl bg-gradient-to-br from-[#0492c2] via-[#107cd1] to-[#0b27b1] text-white shadow-[inset_0_6px_10px_rgba(0,0,0,0.7),0_6px_10px_#0b27b1] border border-white/20 text-sm font-medium hover:brightness-110 transition-all duration-300 active:translate-y-px flex items-center gap-1"
              onClick={() => setShowTableModal(true)}
            >
              <PlusIcon className="w-4 h-4" />
              Add Table
            </button>
          )}
        </div>
        {/* Tabs styled like IngredientsSection */}
        <div className="mt-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('orders')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab('tables')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'tables'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Tables
            </button>
          </nav>
        </div>
        {/* Search and filter section styled like IngredientsSection */}
        {activeTab === 'orders' && (
          <div>
            {/* Search and Filter styled like IngredientsTable */}
            <div className="bg-white rounded-lg p-3 shadow-[0_2px_6px_rgba(0,0,0,0.1)] mb-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-[#5a6e9a] mb-1">Search</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search orders..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full pl-10 pr-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      {/* Use a search icon here if you have one, else use a placeholder */}
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="min-w-[180px]">
                  <label className="block text-xs font-medium text-[#5a6e9a] mb-1">Type</label>
                  <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
                  >
                    <option value="all">All Types</option>
                    <option value="dine-in">Dine In</option>
                    <option value="takeaway">Take Away</option>
                  </select>
                </div>
                <div className="min-w-[180px]">
                  <label className="block text-xs font-medium text-[#5a6e9a] mb-1">Status</label>
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setFilterType('all');
                      setFilterStatus('all');
                      // setDateRange({ startDate: '', endDate: '' }); // if using dateRange
                    }}
                    className="px-3 py-1.5 bg-white text-[#5a6e9a] rounded-lg text-sm font-medium border border-[#e0e4ed] shadow-[0_2px_4px_rgba(0,0,0,0.05)] hover:bg-gray-50 transition-all duration-200 active:translate-y-px"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
            {/* Orders Table styled like IngredientsSection */}
            {activeTab === 'orders' && (
              <div className="overflow-x-auto rounded-lg shadow-[0_2px_6px_rgba(0,0,0,0.1)] bg-white">
                <table className="standardized-table" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '80px' }} />
                    <col style={{ width: '120px' }} />
                    <col style={{ width: '180px' }} />
                    <col style={{ width: '140px' }} />
                    <col style={{ width: '80px' }} />
                    <col style={{ width: '100px' }} />
                    <col style={{ width: '80px' }} />
                    <col style={{ width: '140px' }} />
                    <col style={{ width: '120px' }} />
                    <col style={{ width: '140px' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Customer Name</th>
                      <th>Phone</th>
                      <th>Persons</th>
                      <th>Type</th>
                      <th>Table</th>
                      <th>Status</th>
                      <th>Total</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#e0e4ed]">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-8 text-[#5a6e9a]">
                          No orders found
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map(order => (
                        <tr key={order.id} className="hover:bg-[#f8fbff] transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#2d3748]">{order.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2d3748]">
                            {order.date ? new Date(order.date).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2d3748]">{order.customer_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2d3748]">{order.customer_phone}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2d3748]">{order.num_persons}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2d3748]" style={{ textTransform: 'capitalize' }}>{order.order_type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2d3748]">{order.table_id || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2d3748]" style={{ textTransform: 'capitalize' }}>
                            <select
                              value={order.status}
                              onChange={e => handleStatusChange(order, e.target.value)}
                              className="border rounded px-2 py-1 text-xs"
                              style={{ minWidth: 90, background: '#e4f4fa', color: '#03648a', fontWeight: 600 }}
                            >
                              <option value="pending">Pending</option>
                              <option value="inprogress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="removed">Removed</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2d3748] font-medium">
                            {order.total !== undefined ? `₹${Number(order.total).toFixed(2)}` : '-'}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-center text-sm">
                            <div className="flex justify-center items-center space-x-1">
                              {canView && (
                                <button
                                  className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-[#f0f4ff] hover:text-[#0b27b1] transition-colors duration-200 shadow-sm"
                                  onClick={() => handleViewOrder(order)}
                                  title="View Order"
                                >
                                  <EyeIcon className="w-4 h-4" />
                                </button>
                              )}
                              {canEdit && (
                                <button
                                  className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-[#f0f4ff] hover:text-[#0b27b1] transition-colors duration-200 shadow-sm"
                                  onClick={() => handleEditOrder(order)}
                                  title="Edit Order"
                                >
                                  <PencilIcon className="w-4 h-4" />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-red-50 hover:text-red-600 transition-colors duration-200 shadow-sm"
                                  onClick={() => handleDeleteOrder(order.id)}
                                  title="Delete Order"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {/* Tables tab styled like IngredientsSection */}
        {activeTab === 'tables' && (
          <div>
            <h2 className="text-lg font-semibold text-[#03648a] mb-3">Tables Status</h2>
            <div className="flex flex-wrap gap-6">
              {tables.map(table => {
                const status = getTableStatus(table, orders);
                const latestOrder = orders
                  .filter(o => o.table_id === table.id)
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
                return (
                  <div
                    key={table.id}
                    className="min-w-[180px] p-6 rounded-xl flex flex-col justify-between"
                    style={{
                      background: "#f8fbff",
                      boxShadow: "inset 0 2px 8px #d0d7f2, 0 2px 8px #e0eefa",
                      border: `2px solid ${status === 'available' ? '#22c55e' : status === 'booked' ? '#ef4444' : '#b6e0fe'}`,
                      opacity: status === 'available' ? 1 : 0.7,
                      cursor: status === 'available' ? 'pointer' : 'not-allowed',
                      marginBottom: '1rem',
                      transition: 'box-shadow 0.2s, border 0.2s'
                    }}
                    title={status === 'available' ? 'Available' : 'Booked'}
                  >
                    <div>
                      <div className="font-bold text-[#0b27b1] text-[1.1rem] mb-2">{table.name}</div>
                      <div className="text-[0.95rem] text-[#444] mb-2">
                        Status: <b style={{
                          color: status === 'available'
                            ? '#22c55e'
                            : status === 'booked'
                              ? '#ef4444'
                              : '#03648a'
                        }}>
                          {status}
                        </b>
                      </div>
                      {latestOrder && (
                        <div className="text-[0.9rem] text-[#03648a] mb-2 font-semibold">
                          {status === 'booked'
                            ? `Order #${latestOrder.id} (${latestOrder.status})`
                            : 'No active order'}
                        </div>
                      )}
                      {status !== 'available' && !latestOrder && (
                        <div className="text-[0.9rem] text-[#888] mb-2">
                          Reserved
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {/* Show Select button only if navigated from add order form */}
                      {location.state?.order && (
                        <button
                          className={`px-3 py-1.5 text-xs rounded-lg font-bold transition
                            ${status === 'available'
                              ? 'bg-[#e4f4fa] text-[#0492C2] shadow hover:shadow-lg hover:brightness-105'
                              : 'bg-[#f8fbff] text-[#b6e0fe] cursor-not-allowed'
                            }`}
                          disabled={status !== 'available'}
                          onClick={() => {
                            if (status === 'available') {
                              // Table select logic: create order and navigate to /home
                              // ...existing select logic...
                            }
                          }}
                        >
                          Select
                        </button>
                      )}
                      <button
                        className="px-3 py-1.5 text-xs rounded-lg font-bold bg-[#f8fbff] text-[#03648a] border border-[#e0eefa] hover:bg-[#e4f4fa] transition"
                        disabled={status === 'available'}
                        onClick={() => handleChangeTableStatus(table, 'available')}
                      >
                        Mark Available
                      </button>
                      <button
                        className="px-3 py-1.5 text-xs rounded-lg font-bold bg-[#f8fbff] text-[#03648a] border border-[#e0eefa] hover:bg-[#e4f4fa] transition"
                        disabled={status === 'booked'}
                        onClick={() => handleChangeTableStatus(table, 'booked')}
                      >
                        Mark Booked
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add Order Modal */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add New Order</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Order Date"
            type="date"
            value={orderDate}
            onChange={e => setOrderDate(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            label="Customer Name"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            required
          />
          <TextField
            label="Phone Number"
            value={customerPhone}
            onChange={e => setCustomerPhone(e.target.value)}
            type="tel"
          />
          <TextField
            label="Number of Persons"
            type="number"
            value={numPersons}
            onChange={e => setNumPersons(Math.max(1, parseInt(e.target.value) || 1))}
            inputProps={{ min: 1 }}
          />
          <ToggleButtonGroup
            color="primary"
            value={orderType}
            exclusive
            onChange={(e, newType) => newType && setOrderType(newType)}
            sx={{ mt: 1 }}
            fullWidth
          >
            <ToggleButton value="dine-in">Dine In</ToggleButton>
            <ToggleButton value="takeaway">Take Away</ToggleButton>
          </ToggleButtonGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateOrder}
            disabled={!customerName || numPersons < 1}
          >
            Create Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Table Modal */}
      <Dialog open={showTableModal} onClose={() => setShowTableModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Table</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Table Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newTableName}
            onChange={e => setNewTableName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTableModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateTable}
            disabled={!newTableName.trim()}
          >
            Create Table
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Order Modal (with cart details) */}
      {viewOrder && (
        <Dialog open={!!viewOrder} onClose={() => { setViewOrder(null); setViewOrderCart([]); }} maxWidth="sm" fullWidth>
          <DialogTitle>Order Details</DialogTitle>
          <DialogContent>
            <div>
              <div><b>Order ID:</b> {viewOrder.id}</div>
              <div><b>Date:</b> {viewOrder.date}</div>
              <div><b>Customer:</b> {viewOrder.customer_name}</div>
              <div><b>Phone:</b> {viewOrder.customer_phone}</div>
              <div><b>Persons:</b> {viewOrder.num_persons}</div>
              <div><b>Type:</b> {viewOrder.order_type}</div>
              <div><b>Status:</b> {viewOrder.status}</div>
              <div><b>Total:</b> {viewOrder.total}</div>
              {/* Cart details */}
              <div style={{ marginTop: 16 }}>
                <b>Cart Items:</b>
                {viewOrderCart.length === 0 ? (
                  <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>No items in cart</div>
                ) : (
                  <table style={{ width: '100%', fontSize: 13, marginTop: 4 }}>
                    <thead>
                      <tr>
                        <th align="left">#</th>
                        <th align="left">Item</th>
                        <th align="center">Qty</th>
                        <th align="right">Price</th>
                        <th align="right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewOrderCart.map((item, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>{item.name}</td>
                          <td align="center">{item.qty}</td>
                          <td align="right">{item.price}</td>
                          <td align="right">{(item.price * item.qty).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setViewOrder(null); setViewOrderCart([]); }}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
      <style>{`
        .min-w-[180px] { min-width: 180px; }
        .p-6 { padding: 1.5rem; }
        .rounded-xl { border-radius: 1rem; }
        .font-bold { font-weight: 700; }
        .text-[#0b27b1] { color: #0b27b1; }
        .text-[#03648a] { color: #03648a; }
        .bg-[#e4f4fa] { background: #e4f4fa; }
        .bg-[#f8fbff] { background: #f8fbff; }
        .shadow-[0_2px_6px_rgba(0,0,0,0.08)] { box-shadow: 0 2px 6px rgba(0,0,0,0.08); }
        .hover\\:bg-[#f8fbff]:hover { background: #f8fbff; }
        .transition-colors { transition: background 0.2s; }
        .flex { display: flex; }
        .items-center { align-items: center; }
        .justify-between { justify-content: space-between; }
        .gap-2 { gap: 0.5rem; }
        .gap-3 { gap: 0.75rem; }
        .gap-6 { gap: 1.5rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .mb-4 { margin-bottom: 1rem; }
        .mb-3 { margin-bottom: 0.75rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .text-lg { font-size: 1.125rem; }
        .text-[1.1rem] { font-size: 1.1rem; }
        .text-[0.95rem] { font-size: 0.95rem; }
        .text-[0.9rem] { font-size: 0.9rem; }
        .text-[15px] { font-size: 15px; }
      `}</style>
    </Box>
  );
}

