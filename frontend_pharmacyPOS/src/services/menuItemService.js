import api from '../utils/axios';

// Debug: Log all axios requests (for development)
api.interceptors.request.use(request => {
  console.log('[AXIOS REQUEST]', request.method?.toUpperCase(), request.url, request.data || request.params);
  return request;
});

api.interceptors.response.use(
  response => {
    console.log('[AXIOS RESPONSE]', response.config.url, response.status, response.data);
    return response;
  },
  error => {
    console.error('[AXIOS ERROR]', error.config?.url, error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Helper function to get auth headers
const getAuthHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
  'Content-Type': 'application/json'
});

// Get all inventory items for a branch
export const getMenuItems = async (branchId, categoryId = null) => {
  const params = { branch_id: branchId };
  if (categoryId) params.category_id = categoryId;
  const response = await api.get('/inventory/items', { params });
  return response.data;
};

// Get a single inventory item by ID
export const getMenuItem = async (id, branchId) => {
  try {
    const response = await api.get(`/inventory/items/${id}`, {
      params: { branch_id: branchId }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    throw error;
  }
};

// Create a new inventory item
export const createMenuItem = async (formData) => {
  try {
    const response = await api.post('/inventory/items', formData);
    return response.data;
  } catch (error) {
    console.error('Error creating inventory item:', error);
    throw error;
  }
};

// Update an existing inventory item
export const updateMenuItem = async (id, formData) => {
  try {
    const response = await api.put(`/inventory/items/${id}`, formData);
    return response.data;
  } catch (error) {
    console.error('Error updating inventory item:', error);
    throw error;
  }
};

// Delete an inventory item
export const deleteMenuItem = async (id, branchId) => {
  try {
    const response = await api.delete(`/inventory/items/${id}`, {
      data: { branch_id: branchId }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    throw error;
  }
};

// Get all categories for a branch
export const getCategories = async (branchId) => {
  try {
    console.log(`[getCategories] Fetching categories for branch: ${branchId}`);
    
    if (!branchId) {
      console.warn('[getCategories] No branchId provided');
      return [];
    }

    const response = await api.get(`/inventory/categories`, {
      params: { branch_id: branchId },
      headers: getAuthHeaders()
    });
    
    console.log('[getCategories] Response:', response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error('[getCategories] Error:', error?.response?.data || error.message);
    throw error;
  }
};

// Add new category
export const createCategory = async (categoryData) => {
  try {
    console.log('[createCategory] Creating category:', categoryData);
    
    if (!categoryData.name || !categoryData.name.trim()) {
      throw new Error('Category name is required');
    }
    
    if (!categoryData.branch_id) {
      throw new Error('Branch ID is required');
    }

    const response = await api.post('/inventory/categories', categoryData, {
      headers: getAuthHeaders()
    });
    
    console.log('[createCategory] Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('[createCategory] Error:', error?.response?.data || error.message);
    throw error;
  }
};

// Delete category
export const deleteCategory = async (categoryId, branchId) => {
  try {
    console.log(`[deleteCategory] Deleting category ${categoryId} for branch ${branchId}`);
    
    if (!categoryId || !branchId) {
      throw new Error('Category ID and Branch ID are required');
    }

    const response = await api.delete(`/inventory/categories/${categoryId}`, {
      headers: getAuthHeaders(),
      data: { branch_id: branchId }
    });
    
    console.log('[deleteCategory] Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('[deleteCategory] Error:', error?.response?.data || error.message);
    throw error;
  }
};

// Get all variant types with options for a branch
export const getVariantTypes = async (branchId) => {
  try {
    console.log(`[getVariantTypes] Fetching variant types for branch: ${branchId}`);
    
    if (!branchId) {
      console.warn('[getVariantTypes] No branchId provided');
      return [];
    }
    
    const response = await api.get('/inventory/variant-types', {
      params: { branch_id: branchId },
      headers: getAuthHeaders()
    });
    
    console.log('[getVariantTypes] Response:', response.data);
    
    // Handle different response structures
    const data = response.data.data || response.data;
    
    // Ensure we return an array
    if (!Array.isArray(data)) {
      console.warn('[getVariantTypes] Response is not an array:', data);
      return [];
    }
    
    console.log(`[getVariantTypes] Successfully fetched ${data.length} variant types`);
    return data;
  } catch (error) {
    console.error('[getVariantTypes] Error:', error?.response?.data || error.message);
    // Return empty array on error to prevent app crashes
    return [];
  }
};

// Add new variant type with options
export const createVariantType = async (data) => {
  try {
    console.log('[createVariantType] Creating variant type:', data);
    
    // Validation
    if (!data.name || !data.name.trim()) {
      throw new Error('Variant type name is required');
    }
    
    if (!data.branch_id) {
      throw new Error('Branch ID is required');
    }
    
    if (!Array.isArray(data.options) || data.options.length === 0) {
      throw new Error('At least one option is required');
    }
    
    // Validate options
    const validOptions = data.options.filter(opt => opt.name && opt.name.trim());
    if (validOptions.length === 0) {
      throw new Error('At least one valid option with a name is required');
    }
    
    // Clean up the data
    const cleanData = {
      name: data.name.trim(),
      branch_id: data.branch_id,
      options: validOptions.map(opt => ({
        name: opt.name.trim(),
        price_adjustment: parseFloat(opt.price_adjustment) || 0
      }))
    };
    
    console.log('[createVariantType] Cleaned data:', cleanData);
    
    const response = await api.post('/inventory/variant-types', cleanData, {
      headers: getAuthHeaders()
    });
    
    console.log('[createVariantType] Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('[createVariantType] Error:', error?.response?.data || error.message);
    
    // Provide user-friendly error messages
    if (error.response?.status === 409) {
      throw new Error('A variant type with this name already exists for this branch');
    } else if (error.response?.status === 400) {
      throw new Error(error.response.data?.message || 'Invalid data provided');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    }
    
    throw error;
  }
};

// Add new variant option to existing variant type
export const createVariantOption = async (data) => {
  try {
    console.log('[createVariantOption] Creating variant option:', data);
    
    // Validation
    if (!data.variant_type) {
      throw new Error('Variant type is required');
    }
    
    if (!data.option_name || !data.option_name.trim()) {
      throw new Error('Option name is required');
    }
    
    if (!data.branch_id) {
      throw new Error('Branch ID is required');
    }
    
    // Clean up the data
    const cleanData = {
      variant_type: data.variant_type,
      option_name: data.option_name.trim(),
      price_adjustment: parseFloat(data.price_adjustment) || 0,
      branch_id: data.branch_id
    };
    
    console.log('[createVariantOption] Cleaned data:', cleanData);
    
    const response = await api.post(`/inventory/variants`, cleanData, {
      headers: getAuthHeaders()
    });
    
    console.log('[createVariantOption] Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('[createVariantOption] Error:', error?.response?.data || error.message);
    
    // Provide user-friendly error messages
    if (error.response?.status === 404) {
      throw new Error('Variant type not found');
    } else if (error.response?.status === 409) {
      throw new Error('An option with this name already exists for this variant type');
    } else if (error.response?.status === 400) {
      throw new Error(error.response.data?.message || 'Invalid data provided');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    }
    
    throw error;
  }
};

// Get options for a specific variant type
export const getVariantOptions = async (branchId, variantType) => {
  try {
    console.log(`[getVariantOptions] Fetching options for variant type: ${variantType}, branch: ${branchId}`);
    
    if (!branchId || !variantType) {
      console.warn('[getVariantOptions] Missing branchId or variantType');
      return [];
    }
    
    const response = await api.get(`/inventory/variants`, {
      params: { 
        branch_id: branchId,
        variant_type: variantType 
      },
      headers: getAuthHeaders()
    });
    
    console.log('[getVariantOptions] Response:', response.data);
    
    const data = response.data.data || response.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('[getVariantOptions] Error:', error?.response?.data || error.message);
    return [];
  }
};
