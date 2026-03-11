// Utility service to sync customers from orders (call backend endpoint)

import axios from 'axios';
const API_URL = '/api';

// Sync customers table with orders table (insert missing customers from orders)
export const syncCustomersFromOrders = async (branch_id = 1) => {
  try {
    const response = await axios.post(`${API_URL}/customers/sync-from-orders`, { branch_id });
    return response.data;
  } catch (err) {
    throw err;
  }
};
