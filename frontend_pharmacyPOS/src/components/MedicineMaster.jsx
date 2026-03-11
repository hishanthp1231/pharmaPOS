import React, { useState, useEffect } from 'react';
import { MdVisibility, MdOutlineEdit, MdOutlineDelete } from 'react-icons/md';
import { Search } from '@mui/icons-material';
import JsBarcode from 'jsbarcode';
import api from '../utils/axios'; // <-- Import shared axios instance

// API endpoints
const API_URL = '/medicines'; // <-- Fix: use relative path for axios baseURL
const CATEGORY_URL = '/categories'; // <-- Fix: use relative path for axios baseURL
const VARIANT_URL = '/variants/types'; // <-- Fix: use relative path for axios baseURL

// Helper: pad medicine id to 8 digits
const generateBarcodeNumber = (id) => String(id).padStart(8, '0');

// Helper: generate barcode image as dataURL
const generateBarcode = (barcodeValue) => {
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, barcodeValue, {
    format: 'CODE128',
    displayValue: false,
    width: 2,
    height: 30,
    margin: 0
  });
  return canvas.toDataURL('image/png');
};

export default function MedicineMaster({ showFilter, showForm, setShowForm }) {
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [variants, setVariants] = useState([]);
  const [formMode, setFormMode] = useState('add'); // 'add' | 'edit' | 'view'
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    genericName: '',
    category: '',
    defaultMRP: '',
    image: '',
    previewImage: '',
    expiryDate: '',
    quantity: '', // Add quantity
    supplier: '', // Add supplier
    variants: [] // always an array
  });
  const [suppliersList, setSuppliersList] = useState([]); // Add suppliers list state
  const [loading, setLoading] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryLoading, setCategoryLoading] = useState(false);

  // Add Variant Type Modal
  const [showAddVariantTypeModal, setShowAddVariantTypeModal] = useState(false);
  const [newVariantTypeName, setNewVariantTypeName] = useState('');
  const [newVariantOptions, setNewVariantOptions] = useState([{ name: '', price_adjustment: '' }]);
  const [variantTypeLoading, setVariantTypeLoading] = useState(false);

  // Add Variant Option Modal
  const [showAddVariantOptionModal, setShowAddVariantOptionModal] = useState(false);
  const [selectedVariantTypeId, setSelectedVariantTypeId] = useState('');
  const [newVariantOptionName, setNewVariantOptionName] = useState('');
  const [newVariantOptionPrice, setNewVariantOptionPrice] = useState('');
  const [variantOptionLoading, setVariantOptionLoading] = useState(false);

  // Error message state
  const [errorMsg, setErrorMsg] = useState('');

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [variantFilter, setVariantFilter] = useState('all');

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

  // Fetch medicines, categories, variants from backend
  useEffect(() => {
    fetchMedicines();
    // eslint-disable-next-line
  }, [categoryFilter]); // <-- add categoryFilter as a dependency

  useEffect(() => {
    fetchCategories();
    fetchSuppliers(); // Fetch suppliers
  }, []);

  const fetchSuppliers = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const branch_id = user.branch_id || user.branchId || localStorage.getItem('branch_id');
    api.get(`/suppliers`, { params: { branch_id } })
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.data) ? res.data.data : []);
        if (data.length > 0) {
          setSuppliersList(data);
        } else {
          // Fallback: fetch all suppliers if branch filter returned empty
          api.get('/suppliers')
            .then(res2 => {
              const data2 = Array.isArray(res2.data) ? res2.data : (Array.isArray(res2.data?.data) ? res2.data.data : []);
              setSuppliersList(data2);
            })
            .catch(() => setSuppliersList([]));
        }
      })
      .catch(err => {
        console.error('Error fetching suppliers:', err);
        setSuppliersList([]);
      });
  };

  useEffect(() => {
    // Ensure branch_id is set in localStorage
    if (!localStorage.getItem('branch_id')) {
      localStorage.setItem('branch_id', '1');
      console.log('[DEBUG] Set default branch_id to 1');
    }
    fetchVariants();
  }, []);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      // branch_id is automatically added by axios interceptor
      // Send categoryFilter as param if not 'all'
      const params = {};
      if (categoryFilter && categoryFilter !== 'all') {
        params.category = categoryFilter;
      }
      const res = await api.get(API_URL, { params });
      const data = res.data;
      setMedicines(data.data || []);
    } catch (err) {
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      console.log('[DEBUG] Fetching categories...');
      console.log('[DEBUG] branch_id from localStorage:', localStorage.getItem('branch_id'));
      // branch_id is automatically added by axios interceptor
      const res = await api.get(CATEGORY_URL);
      const data = res.data;
      console.log('[DEBUG] Categories response:', data);
      setCategories(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      console.error('Error response:', err.response?.data);
      setCategories([]);
    }
  };

  const fetchVariants = async () => {
    try {
      // branch_id is automatically added by axios interceptor
      const res = await api.get(VARIANT_URL);
      const data = res.data;
      setVariants(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Error fetching variants:', err);
      setVariants([]);
    }
  };

  // Fetch variant options for a specific variant type
  const fetchVariantOptions = async (variantTypeId) => {
    try {
      // branch_id is automatically added by axios interceptor
      const res = await api.get('/variants', {
        params: { variant_type: variantTypeId }
      });
      const data = res.data;
      return Array.isArray(data) ? data : data.data || [];
    } catch (err) {
      console.error('Error fetching variant options:', err);
      return [];
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle variants selection
  const handleVariantTypeChange = async (idx, typeId) => {
    const typeObj = variants.find(v => String(v.id) === String(typeId));
    const updated = [...formData.variants];
    updated[idx] = {
      typeId,
      typeName: typeObj ? typeObj.name : '',
      options: [],
      availableOptions: [] // Store fetched options for this type
    };

    // Fetch options for this variant type
    if (typeId) {
      const options = await fetchVariantOptions(typeId);
      updated[idx].availableOptions = options;
    }

    setFormData(prev => ({ ...prev, variants: updated }));
  };

  const handleVariantOptionChange = (vIdx, oIdx, optionId) => {
    const variantType = formData.variants[vIdx];
    const optionObj = variantType.availableOptions?.find(o => String(o.id) === String(optionId)) || null;
    const updated = [...formData.variants];
    updated[vIdx].options[oIdx] = {
      optionId,
      optionName: optionObj ? optionObj.name : '',
      price_adjustment: optionObj ? optionObj.price_adjustment : 0,
      custom_price_adjustment: updated[vIdx].options[oIdx]?.custom_price_adjustment || ''
    };
    setFormData(prev => ({ ...prev, variants: updated }));
  };

  // Handle custom price adjustment for variant options
  const handleVariantPriceAdjustmentChange = (vIdx, oIdx, value) => {
    const updated = [...formData.variants];
    updated[vIdx].options[oIdx] = {
      ...updated[vIdx].options[oIdx],
      custom_price_adjustment: value
    };
    setFormData(prev => ({ ...prev, variants: updated }));
  };

  const addVariantType = () => setFormData(prev => ({
    ...prev,
    variants: [...prev.variants, { typeId: '', typeName: '', options: [], availableOptions: [] }]
  }));

  const removeVariantType = (idx) => setFormData(prev => ({
    ...prev,
    variants: prev.variants.filter((_, i) => i !== idx)
  }));

  const addVariantOption = (vIdx) => {
    const updated = [...formData.variants];
    updated[vIdx].options.push({
      optionId: '',
      optionName: '',
      price_adjustment: 0,
      custom_price_adjustment: ''
    });
    setFormData(prev => ({ ...prev, variants: updated }));
  };

  const removeVariantOption = (vIdx, oIdx) => {
    const updated = [...formData.variants];
    updated[vIdx].options = updated[vIdx].options.filter((_, i) => i !== oIdx);
    setFormData(prev => ({ ...prev, variants: updated }));
  };

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file,
        previewImage: URL.createObjectURL(file)
      }));
    }
  };

  // Open form for add/edit/view
  const openForm = (mode, med = null) => {
    setFormMode(mode);
    setShowForm(true);
    if (mode === 'add') {
      setFormData({
        id: null,
        name: '',
        genericName: '',
        category: '',
        defaultMRP: '',
        image: '',
        previewImage: '',
        expiryDate: '',
        quantity: '',
        supplier: '',
        variants: []
      });
    } else if (med) {
      // Build enhanced variants array
      const rawVariants = Array.isArray(med.variants)
        ? med.variants
        : (typeof med.variants === 'string' && med.variants)
          ? (() => { try { const arr = JSON.parse(med.variants); return Array.isArray(arr) ? arr : []; } catch { return []; } })()
          : [];
      setFormData({
        id: med.id,
        name: med.name,
        genericName: med.genericName,
        category: med.category,
        // Ensure defaultMRP is a number or empty string for input
        defaultMRP: typeof med.defaultMRP === 'number' && !isNaN(med.defaultMRP)
          ? med.defaultMRP
          : (med.defaultMRP ? parseFloat(med.defaultMRP) : ''),
        // Preserve image URL for preview, but do not set as File
        image: '', // keep empty so file input does not get a File object
        previewImage: med.image, // show the existing image as preview
        expiryDate: med.expiryDate || '',
        quantity: med.quantity || '',
        supplier: med.suppliers || '',
        // Ensure variants is always an array
        variants: rawVariants
      });
    }
  };

  // Save (add or update) medicine
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const variantsArr = Array.isArray(formData.variants) ? formData.variants : [];
    const form = new FormData();
    form.append('name', formData.name || '');
    form.append('genericName', formData.genericName || '');
    form.append('category', formData.category || '');
    form.append('defaultMRP', parseFloat(formData.defaultMRP) || 0);
    form.append('expiryDate', formData.expiryDate || '');
    form.append('quantity', parseInt(formData.quantity) || 0); // Append quantity
    form.append('suppliers', formData.supplier || ''); // Append supplier

    // Debug: Log image details
    console.log('Image debug:', {
      'formData.image': formData.image,
      'formData.previewImage': formData.previewImage,
      'image instanceof File': formData.image instanceof File,
      'image type': typeof formData.image
    });

    // If image is a File object, append it; otherwise, append the existing image URL/filename if present
    if (formData.image instanceof File) {
      form.append('image', formData.image);
      console.log('Appending image file:', formData.image.name);
    } else if (formData.previewImage && typeof formData.previewImage === 'string' && formData.previewImage !== '') {
      // Send the filename (not the full URL) if editing and no new file selected
      // Extract filename from URL if needed
      const match = formData.previewImage.match(/\/uploads\/medicines\/([^/?#]+)/);
      if (match && match[1]) {
        form.append('image', match[1]);
        console.log('Appending existing image filename:', match[1]);
      }
    }

    form.append('variants', JSON.stringify(
      variantsArr
        .filter(v => v && v.typeId)
        .map(v => ({
          typeId: v.typeId,
          typeName: v.typeName,
          options: Array.isArray(v.options) ? v.options
            .filter(o => o && o.optionId)
            .map(o => ({
              optionId: o.optionId,
              optionName: o.optionName,
              price_adjustment: o.price_adjustment || 0,
              custom_price_adjustment: parseFloat(o.custom_price_adjustment) || null
            })) : []
        }))
    ));

    // Debug: Log all form data entries
    console.log('FormData entries:');
    for (let [key, value] of form.entries()) {
      console.log(key, ':', value);
    }

    try {
      let resp;
      if (formMode === 'add') {
        console.log('Sending POST request for new medicine');
        resp = await api.post(API_URL, form); // branch_id sent by interceptor
      } else if (formMode === 'edit' && formData.id) {
        console.log('Sending PUT request for medicine ID:', formData.id);
        resp = await api.put(`${API_URL}/${formData.id}`, form); // branch_id sent by interceptor
      }
      if (!resp || !resp.data) {
        setErrorMsg('Failed to save medicine');
        setLoading(false);
        return;
      }
      console.log('Medicine saved successfully:', resp.data);
      await fetchMedicines();
      setShowForm(false);
    } catch (err) {
      console.error('Error saving medicine:', err);
      setErrorMsg('Failed to save medicine: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Delete medicine
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this medicine?')) return;
    setLoading(true);
    try {
      await api.delete(`${API_URL}/${id}`);
      await fetchMedicines();
    } catch (err) {
      console.error('Error deleting medicine:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add new category handler
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setCategoryLoading(true);
    try {
      await api.post(CATEGORY_URL, { name: newCategoryName.trim() });
      setShowAddCategoryModal(false);
      setNewCategoryName('');
      await fetchCategories();
    } catch (err) {
      console.error('Error adding category:', err);
    } finally {
      setCategoryLoading(false);
    }
  };

  // Add new variant type handler
  const handleAddVariantType = async (e) => {
    e.preventDefault();
    if (!newVariantTypeName.trim()) return;
    const validOptions = newVariantOptions.filter(opt => opt.name && opt.name.trim());
    if (validOptions.length === 0) {
      alert('Please add at least one option');
      return;
    }
    setVariantTypeLoading(true);
    try {
      await api.post(VARIANT_URL, {
        name: newVariantTypeName.trim(),
        options: validOptions.map(opt => ({
          name: opt.name.trim(),
          price_adjustment: parseFloat(opt.price_adjustment) || 0
        }))
      });
      setShowAddVariantTypeModal(false);
      setNewVariantTypeName('');
      setNewVariantOptions([{ name: '', price_adjustment: '' }]);
      await fetchVariants();
    } catch (err) {
      // handle error
    } finally {
      setVariantTypeLoading(false);
    }
  };

  // Add new variant option handler
  const handleAddVariantOption = async (e) => {
    e.preventDefault();
    if (!selectedVariantTypeId || !newVariantOptionName.trim()) return;
    setVariantOptionLoading(true);
    try {
      await api.post('/variants', {
        variant_type: selectedVariantTypeId,
        option_name: newVariantOptionName.trim(),
        price_adjustment: parseFloat(newVariantOptionPrice) || 0
      });
      setShowAddVariantOptionModal(false);
      setSelectedVariantTypeId('');
      setNewVariantOptionName('');
      setNewVariantOptionPrice('');
      await fetchVariants();
    } catch (err) {
      // handle error
    } finally {
      setVariantOptionLoading(false);
    }
  };

  // Edit medicine
  const handleEditMedicine = async (med) => {
    setFormMode('edit');
    setShowForm(true);

    // Parse variants from medicine data
    let variantsArr = [];
    if (Array.isArray(med.variants)) {
      variantsArr = med.variants;
    } else if (typeof med.variants === 'string' && med.variants) {
      try {
        const parsed = JSON.parse(med.variants);
        variantsArr = Array.isArray(parsed) ? parsed : [];
      } catch {
        variantsArr = [];
      }
    }

    // Load available options for each variant type
    const enhancedVariants = await Promise.all(
      variantsArr.map(async (variant) => {
        if (variant.typeId) {
          const availableOptions = await fetchVariantOptions(variant.typeId);
          return {
            ...variant,
            availableOptions
          };
        }
        return variant;
      })
    );

    setFormData({
      id: med.id,
      name: med.name,
      genericName: med.genericName,
      category: med.category,
      defaultMRP: typeof med.defaultMRP === 'number' && !isNaN(med.defaultMRP)
        ? med.defaultMRP
        : (med.defaultMRP ? parseFloat(med.defaultMRP) : ''),
      // Preserve image URL for preview, but do not set as File
      image: '', // keep empty so file input does not get a File object
      previewImage: med.image, // show the existing image as preview
      expiryDate: med.expiryDate || '', // Set expiryDate
      quantity: med.quantity || '', // Set quantity
      supplier: med.suppliers || '', // Set supplier
      variants: enhancedVariants
    });
  };

  // View medicine
  const handleViewMedicine = async (med) => {
    setFormMode('view');
    setShowForm(true);

    // Parse variants from medicine data
    let variantsArr = [];
    if (Array.isArray(med.variants)) {
      variantsArr = med.variants;
    } else if (typeof med.variants === 'string' && med.variants) {
      try {
        const parsed = JSON.parse(med.variants);
        variantsArr = Array.isArray(parsed) ? parsed : [];
      } catch {
        variantsArr = [];
      }
    }

    // Load available options for each variant type
    const enhancedVariants = await Promise.all(
      variantsArr.map(async (variant) => {
        if (variant.typeId) {
          const availableOptions = await fetchVariantOptions(variant.typeId);
          return {
            ...variant,
            availableOptions
          };
        }
        return variant;
      })
    );

    setFormData({
      id: med.id,
      name: med.name,
      genericName: med.genericName,
      category: med.category,
      defaultMRP: med.defaultMRP,
      image: med.image,
      previewImage: med.image,
      expiryDate: med.expiryDate || '', // Set expiryDate
      quantity: med.quantity || '', // Set quantity
      supplier: med.suppliers || '', // Set supplier
      variants: enhancedVariants
    });
  };

  // Delete medicine (permanent)
  const handleDeleteMedicine = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this medicine?')) return;
    setLoading(true);
    try {
      await api.delete(`${API_URL}/${id}`); // branch_id sent by interceptor
      await fetchMedicines();
    } catch (err) {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  // Compute filtered medicines
  const filteredMedicines = medicines.filter(med => {
    // Search by name or genericName
    const matchesSearch =
      (med.name && med.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (med.genericName && med.genericName.toLowerCase().includes(searchTerm.toLowerCase()));
    // Filter by category
    const matchesCategory = categoryFilter === 'all' || med.category === categoryFilter;
    // Filter by variant type
    const matchesVariant = variantFilter === 'all' ||
      (Array.isArray(med.variants) && med.variants.some(v => String(v.typeId) === String(variantFilter)));
    return matchesSearch && matchesCategory && matchesVariant;
  });

  return (
    <div>
      {/* Filter Section */}
      {showFilter && (
        <div className="bg-white rounded-lg p-3 shadow-[0_2px_6px_rgba(0,0,0,0.1)] mb-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-[#5a6e9a] mb-1">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search medicines..."
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
              <label className="block text-xs font-medium text-[#5a6e9a] mb-1">Variant Type</label>
              <select
                value={variantFilter}
                onChange={e => setVariantFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-[#e0e4ed] rounded-lg shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-1px_-1px_2px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/50"
              >
                <option value="all">All Variant Types</option>
                {variants.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setVariantFilter('all');
                }}
                className="px-3 py-1.5 bg-white text-[#5a6e9a] rounded-lg text-sm font-medium border border-[#e0e4ed] shadow-[0_2px_4px_rgba(0,0,0,0.05)] hover:bg-gray-50 transition-all duration-200 active:translate-y-px"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Add/Edit/View Medicine Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-start justify-center z-[100] p-4 overflow-y-auto">
          <div className="relative bg-white rounded-[24px] text-[#333] shadow-[0_0_60px_5px_rgba(0,0,0,0.4)] w-full max-w-4xl my-8 
                          after:content-[''] after:absolute after:right-[-10px] after:bottom-[18px]
                          after:w-0 after:h-0 after:border-l-[0] after:border-r-[10px] after:border-b-[10px]
                          after:border-l-transparent after:border-r-transparent after:border-b-[#1a044e]">
            {/* Accent bar */}
            <div className="absolute top-0 left-0 w-full h-3 rounded-t-[24px] bg-gradient-to-r from-[#0f0092] via-[#5a6e9a] to-[#1a044e]" />
            <div className="flex justify-between items-center px-8 pt-10 pb-5 border-b border-[#e0e4ed] relative">
              <h3 className="text-center w-full text-[25px] font-extrabold tracking-[4px] leading-[32px] text-[#1a044e] drop-shadow-sm">
                {formMode === 'add' && 'ADD MEDICINE'}
                {formMode === 'edit' && 'EDIT MEDICINE'}
                {formMode === 'view' && 'VIEW MEDICINE'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="absolute top-6 right-8 text-gray-400 hover:text-[#0f0092] text-[28px] font-bold transition-all duration-200"
                style={{ lineHeight: '1' }}
                title="Close"
              >
                ×
              </button>
            </div>

            {/* Scrollable form content */}
            <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
              <form onSubmit={handleSave} className="relative px-8 pt-8 pb-24 space-y-7 bg-[#f8f9fd]">
                {errorMsg && (
                  <div className="text-red-600 text-sm mb-2">{errorMsg}</div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-semibold text-[#4a5568] mb-3">Medicine Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name ?? ''}
                      onChange={handleChange}
                      required
                      disabled={formMode === 'view'}
                      className="w-full bg-white py-3 px-4 border-0 border-b-2 border-b-[#d4d4d4] rounded-t focus:outline-none focus:border-b-[#0f0092] focus:bg-[#f0f4ff] transition-all duration-200 font-sans"
                      placeholder="e.g. Paracetamol"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#4a5568] mb-3">Generic Name</label>
                    <input
                      type="text"
                      name="genericName"
                      value={formData.genericName ?? ''}
                      onChange={handleChange}
                      disabled={formMode === 'view'}
                      className="w-full bg-white py-3 px-4 border-0 border-b-2 border-b-[#d4d4d4] rounded-t focus:outline-none focus:border-b-[#0f0092] focus:bg-[#f0f4ff] transition-all duration-200 font-sans"
                      placeholder="e.g. Acetaminophen"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-[#4a5568] flex items-center mb-3">
                      Category
                      {formMode !== 'view' && (
                        <button
                          type="button"
                          onClick={() => setShowAddCategoryModal(true)}
                          className="ml-2 text-xs text-[#0b27b1] hover:underline"
                          title="Add new category"
                        >
                          + Add Category
                        </button>
                      )}
                    </label>
                    <select
                      name="category"
                      value={formData.category ?? ''}
                      onChange={handleChange}
                      disabled={formMode === 'view'}
                      className="w-full bg-white py-3 px-4 border-0 border-b-2 border-b-[#d4d4d4] rounded-t focus:outline-none focus:border-b-[#0f0092] focus:bg-[#f0f4ff] transition-all duration-200 font-sans"
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#4a5568] mb-3">Default MRP</label>
                    <input
                      type="number"
                      name="defaultMRP"
                      value={formData.defaultMRP ?? ''}
                      onChange={handleChange}
                      disabled={formMode === 'view'}
                      className="w-full bg-white py-3 px-4 border-0 border-b-2 border-b-[#d4d4d4] rounded-t focus:outline-none focus:border-b-[#0f0092] focus:bg-[#f0f4ff] transition-all duration-200 font-sans"
                      placeholder="e.g. 120.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  {/* Quantity Field */}
                  <div>
                    <label className="block text-sm font-semibold text-[#4a5568] mb-3">Quantity</label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity ?? ''}
                      onChange={handleChange}
                      disabled={formMode === 'view'}
                      className="w-full bg-white py-3 px-4 border-0 border-b-2 border-b-[#d4d4d4] rounded-t focus:outline-none focus:border-b-[#0f0092] focus:bg-[#f0f4ff] transition-all duration-200 font-sans"
                      placeholder="e.g. 100"
                      min="0"
                    />
                  </div>
                  {/* Supplier Field */}
                  <div>
                    <label className="block text-sm font-semibold text-[#4a5568] mb-3">Supplier</label>
                    <div className="relative">
                      <select
                        name="supplier"
                        value={formData.supplier ?? ''}
                        onChange={handleChange}
                        disabled={formMode === 'view'}
                        className="w-full bg-white py-3 px-4 border-0 border-b-2 border-b-[#d4d4d4] rounded-t focus:outline-none focus:border-b-[#0f0092] focus:bg-[#f0f4ff] transition-all duration-200 font-sans appearance-none"
                      >
                        <option value="">Select Supplier</option>
                        {suppliersList.map(supp => (
                          <option key={supp.id} value={supp.name}>{supp.name}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#4a5568] mb-3">Expiry Date</label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={formData.expiryDate ?? ''}
                      onChange={handleChange}
                      disabled={formMode === 'view'}
                      className="w-full bg-white py-3 px-4 border-0 border-b-2 border-b-[#d4d4d4] rounded-t focus:outline-none focus:border-b-[#0f0092] focus:bg-[#f0f4ff] transition-all duration-200 font-sans"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-[#4a5568] mb-3">Medicine Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={formMode === 'view'}
                      className="w-full bg-white py-3 px-4 border-0 border-b-2 border-b-[#d4d4d4] rounded-t focus:outline-none focus:border-b-[#0f0092] focus:bg-[#f0f4ff] transition-all duration-200 font-sans"
                    />
                    {/* Show preview if available */}
                    {formData.previewImage && (
                      <img
                        src={formData.previewImage}
                        alt="Preview"
                        className="mt-4 h-24 w-24 object-cover rounded-lg border shadow"
                        onError={e => { e.target.src = ''; }}
                      />
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-semibold text-[#4a5568] flex items-center mb-3">
                      Variants
                      {formMode !== 'view' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setShowAddVariantTypeModal(true)}
                            className="ml-2 text-xs text-[#0b27b1] hover:underline"
                            title="Add new variant type"
                          >
                            + Add Variant Type
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddVariantOptionModal(true)}
                            className="ml-2 text-xs text-[#0b27b1] hover:underline"
                            title="Add new variant option"
                          >
                            + Add Option
                          </button>
                        </>
                      )}
                    </label>
                    {/* Dropdown for selecting variant types and options */}
                    {Array.isArray(formData.variants) && formData.variants.length > 0 && formData.variants.map((variant, vIdx) => (
                      <div key={vIdx} className="mb-4 p-3 bg-white rounded-lg border shadow-sm">
                        <div className="flex gap-2 items-center mb-2">
                          <select
                            value={variant.typeId}
                            onChange={e => handleVariantTypeChange(vIdx, e.target.value)}
                            disabled={formMode === 'view'}
                            className="w-full bg-[#f8f9fd] py-2 px-3 border-0 border-b-2 border-b-[#d4d4d4] rounded-t focus:outline-none focus:border-b-[#0f0092] focus:bg-[#f0f4ff] transition-all duration-200 font-sans"
                          >
                            <option value="">Select Variant Type</option>
                            {variants.map(v => (
                              <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                          </select>
                          {formMode !== 'view' && (
                            <button
                              type="button"
                              onClick={() => removeVariantType(vIdx)}
                              className="text-red-500 hover:text-red-700 font-bold text-lg"
                              disabled={formData.variants.length <= 1}
                            >
                              ×
                            </button>
                          )}
                        </div>
                        <div className="space-y-2">
                          {variant.typeId && variant.options && variant.options.map((opt, oIdx) => (
                            <div key={oIdx} className="flex gap-2 items-center">
                              <div className="flex-1">
                                <select
                                  value={opt.optionId}
                                  onChange={e => handleVariantOptionChange(vIdx, oIdx, e.target.value)}
                                  disabled={formMode === 'view'}
                                  className="w-full bg-[#f8f9fd] py-2 px-3 border-0 border-b-2 border-b-[#d4d4d4] rounded-t focus:outline-none focus:border-b-[#0f0092] focus:bg-[#f0f4ff] transition-all duration-200 font-sans"
                                >
                                  <option value="">Select Option</option>
                                  {(variant.availableOptions || []).map(o => (
                                    <option key={o.id} value={o.id}>
                                      {o.name} {o.price_adjustment ? `(Base: +LKR ${o.price_adjustment})` : ''}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="w-32">
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="Custom +/-"
                                  value={opt.custom_price_adjustment || ''}
                                  onChange={e => handleVariantPriceAdjustmentChange(vIdx, oIdx, e.target.value)}
                                  disabled={formMode === 'view'}
                                  className="w-full bg-[#f8f9fd] py-2 px-3 border-0 border-b-2 border-b-[#d4d4d4] rounded-t focus:outline-none focus:border-b-[#0f0092] focus:bg-[#f0f4ff] transition-all duration-200 font-sans text-sm"
                                  title="Custom price adjustment for this medicine (overrides base price adjustment)"
                                />
                              </div>
                              {formMode !== 'view' && (
                                <button
                                  type="button"
                                  onClick={() => removeVariantOption(vIdx, oIdx)}
                                  className="text-red-500 hover:text-red-700 font-bold text-lg"
                                  disabled={variant.options.length <= 1}
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}
                          {formMode !== 'view' && variant.typeId && (
                            <button
                              type="button"
                              onClick={() => addVariantOption(vIdx)}
                              className="text-xs text-[#0b27b1] hover:underline"
                            >
                              + Add Option
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {formMode !== 'view' && (
                      <button
                        type="button"
                        onClick={addVariantType}
                        className="text-xs text-[#0b27b1] hover:underline"
                      >
                        + Add Variant Type
                      </button>
                    )}
                  </div>
                </div>

                {/* Buttons - moved inside form and made non-absolute */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-[#e0e4ed]">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="inline-block cursor-pointer px-8 py-3 text-white text-[12px] font-bold tracking-[3px]
                             rounded-[30px] bg-[#5a6e9a] transition-all duration-200 ease-in-out
                             shadow-[-5px_6px_20px_0px_rgba(26,26,26,0.4)]
                             hover:bg-[#4a5568] hover:shadow-[-5px_6px_20px_0px_rgba(88,88,88,0.569)]"
                  >
                    CANCEL
                  </button>
                  {formMode !== 'view' && (
                    <button
                      type="submit"
                      className="inline-block cursor-pointer px-8 py-3 text-white text-[12px] font-bold tracking-[3px]
                               rounded-[30px] bg-[#0f0092] transition-all duration-200 ease-in-out
                               shadow-[-5px_6px_20px_0px_rgba(26,26,26,0.4)]
                               hover:bg-[#07013d] hover:shadow-[-5px_6px_20px_0px_rgba(88,88,88,0.569)]"
                      disabled={loading}
                    >
                      {loading ? 'SAVING...' : 'SAVE'}
                    </button>
                  )}
                </div>
              </form>
            </div>
            {/* Rounded bottom for the modal */}
            <div className="h-6 bg-[#f8f9fd] rounded-b-[24px]"></div>
          </div>
        </div>
      )}
      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[120] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex justify-between items-center p-4 border-b border-[#e0e4ed]">
              <h3 className="text-lg font-semibold text-[#2d3748]">Add Category</h3>
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddCategory} className="p-6 space-y-6">
              <input
                type="text"
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Category name"
                required
                disabled={categoryLoading}
              />
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 border rounded-lg text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                  disabled={categoryLoading}
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add Variant Type Modal */}
      {showAddVariantTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[130] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex justify-between items-center p-4 border-b border-[#e0e4ed]">
              <h3 className="text-lg font-semibold text-[#2d3748]">Add Variant Type</h3>
              <button
                onClick={() => setShowAddVariantTypeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddVariantType} className="p-6 space-y-6">
              <input
                type="text"
                value={newVariantTypeName}
                onChange={e => setNewVariantTypeName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Variant type name"
                required
                disabled={variantTypeLoading}
              />
              <label className="block text-xs font-medium text-[#4a5568] mb-1">Options</label>
              {newVariantOptions.map((opt, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={opt.name}
                    onChange={e => {
                      const updated = [...newVariantOptions];
                      updated[idx].name = e.target.value;
                      setNewVariantOptions(updated);
                    }}
                    className="w-1/2 px-3 py-2 border rounded-lg"
                    placeholder="Option name"
                    required
                  />
                  <input
                    type="number"
                    value={opt.price_adjustment}
                    onChange={e => {
                      const updated = [...newVariantOptions];
                      updated[idx].price_adjustment = e.target.value;
                      setNewVariantOptions(updated);
                    }}
                    className="w-1/3 px-3 py-2 border rounded-lg"
                    placeholder="Price adjustment"
                  />
                  <button
                    type="button"
                    onClick={() => setNewVariantOptions(newVariantOptions.filter((_, i) => i !== idx))}
                    className="text-red-500 hover:text-red-700"
                    disabled={newVariantOptions.length <= 1}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setNewVariantOptions([...newVariantOptions, { name: '', price_adjustment: '' }])}
                className="text-xs text-[#0b27b1] hover:underline flex items-center"
              >
                + Add Option
              </button>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddVariantTypeModal(false)}
                  className="px-4 py-2 border rounded-lg text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                  disabled={variantTypeLoading}
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add Variant Option Modal */}
      {showAddVariantOptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[140] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex justify-between items-center p-4 border-b border-[#e0e4ed]">
              <h3 className="text-lg font-semibold text-[#2d3748]">Add Variant Option</h3>
              <button
                onClick={() => setShowAddVariantOptionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddVariantOption} className="p-6 space-y-6">
              <select
                value={selectedVariantTypeId}
                onChange={e => setSelectedVariantTypeId(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg mb-2"
                required
                disabled={variantOptionLoading}
              >
                <option value="">Select Variant Type</option>
                {variants.map(vt => (
                  <option key={vt.id} value={vt.id}>{vt.name}</option>
                ))}
              </select>
              <input
                type="text"
                value={newVariantOptionName}
                onChange={e => setNewVariantOptionName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Option name"
                required
                disabled={variantOptionLoading}
              />
              <input
                type="number"
                value={newVariantOptionPrice}
                onChange={e => setNewVariantOptionPrice(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Price adjustment (optional)"
                disabled={variantOptionLoading}
              />
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddVariantOptionModal(false)}
                  className="px-4 py-2 border rounded-lg text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                  disabled={variantOptionLoading}
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Medicine Table */}
      <div className="bg-white rounded-lg shadow-sm border border-[#e0e4ed] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#e0e4ed]">
            <thead className="bg-[#f8f9fd]">
              <tr>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Image</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Name</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Generic Name</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Category</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Default MRP</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Quantity</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Variants</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Barcode</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#e0e4ed]">
              {filteredMedicines.map((med, idx) => (
                <tr key={med.id || idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-2 py-2 text-center">
                    {med.image ? (
                      <img
                        src={med.image}
                        alt={med.name}
                        className="h-12 w-12 object-cover rounded border"
                        onError={e => { e.target.src = ''; }}
                      />
                    ) : (
                      <span className="text-gray-400 text-xs">No image</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-center text-[#2d3748]">{med.name}</td>
                  <td className="px-2 py-2 text-center text-[#5a6e9a]">{med.genericName || <span className="text-gray-400">-</span>}</td>
                  <td className="px-2 py-2 text-center text-[#03648a]">{med.category}</td>
                  <td className="px-2 py-2 text-center text-[#2d3748]">
                    {typeof med.defaultMRP === 'number' && !isNaN(med.defaultMRP)
                      ? `LKR ${med.defaultMRP.toFixed(2)}`
                      : '-'}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${(med.quantity || 0) > 10
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : (med.quantity || 0) > 0
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-red-50 text-red-600 border border-red-200'
                      }`}>
                      {med.quantity || 0}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-center">
                    {/* Variants column: show fetched variants for this medicine */}
                    {Array.isArray(med.variants) && med.variants.length > 0 ? (
                      <ul className="text-xs">
                        {med.variants.map((v, vi) => {
                          // Find the variant type name from fetched variants if missing
                          const typeName =
                            v.typeName ||
                            (variants.find(variant => String(variant.id) === String(v.typeId))?.name || '');
                          return (
                            <li key={vi}>
                              <span className="font-semibold">{typeName}:</span>{' '}
                              {v.options && v.options.length > 0
                                ? v.options.map((opt, oi) => {
                                  // Find the option name from fetched variants if missing
                                  const optionName =
                                    opt.optionName ||
                                    (
                                      variants
                                        .find(variant => String(variant.id) === String(v.typeId))
                                        ?.options
                                        ?.find(o => String(o.id) === String(opt.optionId))
                                        ?.name || ''
                                    );
                                  return (
                                    <span key={oi} className="ml-1 px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                                      {optionName}
                                    </span>
                                  );
                                })
                                : <span className="ml-1 text-gray-400">No options</span>
                              }
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <span className="text-gray-400 text-xs">No variants</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-center">
                    {/* Show only barcode value, no image */}
                    <div className="text-xs text-gray-500 text-center mt-1">
                      {med.barcode || generateBarcodeNumber(med.id)}
                    </div>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-center text-sm">
                    <div className="flex justify-center items-center space-x-1">
                      {rolePermissions.can_view && (
                        <button
                          onClick={() => handleViewMedicine(med)}
                          className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-[#f0f4ff] hover:text-[#0b27b1] transition-colors duration-200 shadow-sm"
                          title="View Medicine"
                        >
                          <MdVisibility className="w-4 h-4" />
                        </button>
                      )}
                      {rolePermissions.can_edit && (
                        <button
                          onClick={() => handleEditMedicine(med)}
                          className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-[#f0f4ff] hover:text-[#0b27b1] transition-colors duration-200 shadow-sm"
                          title="Edit Medicine"
                        >
                          <MdOutlineEdit className="w-4 h-4" />
                        </button>
                      )}
                      {rolePermissions.can_delete && (
                        <button
                          onClick={() => handleDeleteMedicine(med.id)}
                          className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-red-50 hover:text-red-600 transition-colors duration-200 shadow-sm"
                          title="Delete Medicine"
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
      </div>
    </div>
  );
}

