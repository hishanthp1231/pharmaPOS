import api from '../utils/axios';

// Get all branches
export const getBranches = async () => {
  const res = await api.get('/branches');
  if (Array.isArray(res.data)) return res.data;
  if (res.data?.success && Array.isArray(res.data.branches)) return res.data.branches;
  if (res.data?.success && Array.isArray(res.data.data)) return res.data.data;
  if (Array.isArray(res.data?.branches)) return res.data.branches;
  if (Array.isArray(res.data?.data)) return res.data.data;
  return [];
};

// Add a branch
export const addBranch = async (branch) => {
  const res = await api.post('/branches', branch);
  return res.data;
};

// Toggle branch status
export const toggleBranch = async (id, active) => {
  const res = await api.patch(`/branches/${id}/toggle`, { active });
  return res.data;
};

// Update an existing branch
export const updateBranch = async (id, branchData) => {
  const response = await api.put(`/branches/${id}`, branchData);
  return response.data;
};

// Delete a branch
export const deleteBranch = async (id) => {
  const response = await api.delete(`/branches/${id}`);
  return response.data;
};
