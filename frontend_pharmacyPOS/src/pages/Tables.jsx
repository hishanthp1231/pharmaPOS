import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Grid, Button } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Tables() {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order || {};
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const branchId = order.branchId || 1;
    // Fetch tables and orders for branch
    axios.get('/api/tables', { params: { branch_id: branchId } })
      .then(res => setTables(res.data.data || []))
      .catch(() => setTables([]));
    axios.get('/api/orders', { params: { branch_id: branchId } })
      .then(res => setOrders(res.data.data || []))
      .catch(() => setOrders([]));
  }, [order.branchId]);

  // Determine table status based on latest order for each table
  const getTableStatus = (table) => {
    // Find the latest order for this table
    const tableOrders = orders.filter(o => o.table_id === table.id);
    if (tableOrders.length === 0) return 'available';
    // Sort by created_at descending
    tableOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const latestOrder = tableOrders[0];
    if (!latestOrder) return 'available';
    if (['pending', 'inprogress', 'active'].includes(latestOrder.status)) return 'booked';
    if (latestOrder.status === 'completed' || latestOrder.status === 'cancelled' || latestOrder.status === 'removed') return 'available';
    return 'available';
  };

  // Change table status manually (for admin/staff)
  const handleChangeTableStatus = async (table, newStatus) => {
    try {
      await axios.put(`/api/tables/${table.id}/status`, {
        status: newStatus,
        branch_id: order.branch_id || order.branchId || 1
      });
      // Refresh tables and orders
      const branchId = order.branchId || 1;
      const tablesRes = await axios.get('/api/tables', { params: { branch_id: branchId } });
      setTables(tablesRes.data.data || []);
      const ordersRes = await axios.get('/api/orders', { params: { branch_id: branchId } });
      setOrders(ordersRes.data.data || []);
    } catch (err) {
      alert('Failed to change table status');
    }
  };

  const handleSelectTable = async (table) => {
    if (getTableStatus(table) === 'available') {
      try {
        const payload = {
          customer_name: order.customer_name || order.customerName || '',
          customer_phone: order.customer_phone || order.customerPhone || '',
          num_persons: order.num_persons || order.numPersons || 1,
          order_type: order.order_type || order.orderType || 'dine-in',
          branch_id: order.branch_id || order.branchId || 1,
          table_id: table.id,
          date: order.date || new Date().toISOString().slice(0, 10),
          status: 'pending',
          cart: [],
          payment_method: null,
          subtotal: 0,
          discount: null,
          tax: null,
          total: 0,
          paid_amount: 0,
          future_credit: 0
        };
        const res = await axios.post('/api/orders', payload);
        const orderId = res.data.order_id;
        const orderRes = await axios.get(`/api/orders/${orderId}`, { params: { branch_id: payload.branch_id } });
        const createdOrder = orderRes.data.data;
        if (createdOrder) {
          localStorage.setItem('last_order', JSON.stringify(createdOrder));
          localStorage.setItem('last_order_id', createdOrder.id || createdOrder.order_id);
          navigate('/home', { state: { order: { ...createdOrder, tableId: table.id, table_id: table.id }, table } });
        } else {
          alert('Order created but not found. Please try again.');
        }
      } catch (err) {
        alert('Failed to create order');
      }
    }
  };

  // Table status color logic
  const getStatusColor = (status) => {
    if (status === 'available') return '#4ade80';
    if (status === 'booked') return '#f87171';
    if (status === 'reserved') return '#fbbf24';
    return '#e5e7eb';
  };

  // Table style
  const tableBoxStyle = (status) => ({
    p: 3,
    borderRadius: 2,
    boxShadow: 4,
    background: getStatusColor(status),
    cursor: status === 'available' ? 'pointer' : 'not-allowed',
    opacity: status === 'available' ? 1 : 0.7,
    border: `2px solid ${status === 'available' ? '#4ade80' : status === 'booked' ? '#f87171' : '#fbbf24'}`,
    transition: 'box-shadow 0.2s, border 0.2s',
    '&:hover': status === 'available' ? { boxShadow: 8, border: '2px solid #03648a' } : {}
  });

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4 }}>
      <Paper elevation={4} sx={{ p: 4, mb: 4, borderRadius: 4 }}>
        <Typography variant="h4" fontWeight={600} mb={3} color="#03648a">
          Select Table
        </Typography>
        <Grid container spacing={3}>
          {tables.map(table => {
            const status = getTableStatus(table);
            return (
              <Grid item xs={12} sm={6} md={4} key={table.id}>
                <Box
                  sx={tableBoxStyle(status)}
                  onClick={() => handleSelectTable(table)}
                >
                  <Typography variant="h6" fontWeight={700} color="#0b27b1">{table.name}</Typography>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Status: <b style={{ textTransform: 'capitalize', color: status === 'available' ? '#22c55e' : status === 'booked' ? '#ef4444' : '#fbbf24' }}>{status}</b>
                  </Typography>
                  {status !== 'available' && (
                    <Box mt={1}>
                      <Typography variant="body2" color="text.secondary">
                        {status === 'booked' ? 'Currently in use' : 'Reserved'}
                      </Typography>
                    </Box>
                  )}
                  {status === 'available' && (
                    <Button
                      variant="contained"
                      color="primary"
                      sx={{ mt: 2, fontWeight: 600, boxShadow: 2, borderRadius: 2 }}
                      fullWidth
                    >
                      Select Table
                    </Button>
                  )}
                  {/* Admin/staff: Change table status manually */}
                  <Box mt={2} display="flex" gap={1}>
                    <Button
                      variant="outlined"
                      color="success"
                      size="small"
                      sx={{ fontSize: 12, borderRadius: 2 }}
                      onClick={e => { e.stopPropagation(); handleChangeTableStatus(table, 'available'); }}
                      disabled={status === 'available'}
                    >
                      Mark Available
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      sx={{ fontSize: 12, borderRadius: 2 }}
                      onClick={e => { e.stopPropagation(); handleChangeTableStatus(table, 'booked'); }}
                      disabled={status === 'booked'}
                    >
                      Mark Booked
                    </Button>
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Paper>
    </Box>
  );
}
