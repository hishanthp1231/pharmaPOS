import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BillDetails from '../components/BillDetails.jsx';
import { MagnifyingGlassIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { usePOS } from '../context/POSContext';
import { useBranch } from '../context/BranchContext';
import SalesDetails from '../components/SalesDetails.jsx';
import api from '../utils/axios';
import axios from 'axios';
import JsBarcode from 'jsbarcode';
import { toast } from 'react-toastify';
 
function Home() {
  const [selectedCategory, setSelectedCategory] = useState('All Medicines');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedItemForVariants, setSelectedItemForVariants] = useState(null);
  const [tempSelectedVariants, setTempSelectedVariants] = useState({});
  const [quantities, setQuantities] = useState({});
  const [categories, setCategories] = useState([{ id: 'all', name: 'All Medicines' }]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loadingInventoryItems, setLoadingInventoryItems] = useState(true);
  const [inventoryItemsError, setInventoryItemsError] = useState(null);
  // Track reserved quantities for items in cart
  const [reserved, setReserved] = useState({});
  const [selectedVariants, setSelectedVariants] = useState({}); // { [itemId]: { [variantType]: optionObj } }
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const { isSidebarCollapsed } = usePOS();
  const { selectedBranch } = useBranch();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [table, setTable] = useState(null);
  const [purchasedQuantities, setPurchasedQuantities] = useState({});
  const [soldQuantities, setSoldQuantities] = useState({});
  const [latestRetailPrices, setLatestRetailPrices] = useState({});
  const [popupVariants, setPopupVariants] = useState([]);
  const [heldCarts, setHeldCarts] = useState([]);

  // Initialize a pharmacy order for immediate billing
  const initializePharmacyOrder = () => {
    const branchId = selectedBranch?.id || 1;
    const newOrder = {
      id: Date.now(), // Temporary ID for new order
      order_id: Date.now(),
      status: 'pending',
      branch_id: branchId,
      order_type: 'pharmacy',
      customer_name: '',
      customer_phone: '',
      payment_method: 'cash',
      discount_amount: 0,
      discount_percentage: 0,
      tax_amount: 0,
      subtotal: 0,
      total: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return newOrder;
  };

  useEffect(() => {
    console.log('[Home] Navigation state:', location.state);
  }, [location.state]);

  // Save order id to localStorage after navigation
  useEffect(() => {
    if (location.state?.order?.id || location.state?.order?.order_id) {
      const oid = location.state.order.id || location.state.order.order_id;
      localStorage.setItem('last_order_id', oid);
      setOrder(location.state.order);
    }
    if (location.state?.table) setTable(location.state.table);
  }, [location.state]);

  // On mount or navigation, always try to restore order from navigation state, localStorage, or backend
  useEffect(() => {
    let didSet = false;
    // 1. From navigation state (always prefer this if present)
    if (location.state?.order && (location.state.order.id || location.state.order.order_id)) {
      setOrder(location.state.order);
      localStorage.setItem('last_order', JSON.stringify(location.state.order));
      localStorage.setItem('last_order_id', location.state.order.id || location.state.order.order_id);
      didSet = true;
      console.log('[Home] Restored order from location.state:', location.state.order);
    }
    if (location.state?.table) setTable(location.state.table);

    // 2. From localStorage (if not set above)
    if (!didSet) {
      const lastOrderStr = localStorage.getItem('last_order');
      if (lastOrderStr) {
        try {
          const lastOrder = JSON.parse(lastOrderStr);
          if (lastOrder && (lastOrder.id || lastOrder.order_id)) {
            setOrder(lastOrder);
            didSet = true;
            console.log('[Home] Restored order from localStorage:', lastOrder);
          }
        } catch (err) {
          console.warn('[Home] Failed to parse last_order from localStorage');
        }
      }
    }

    // 3. From backend (if not set above)
    if (!didSet) {
      const lastOrderId = localStorage.getItem('last_order_id');
      if (lastOrderId) {
        const fetchOrderById = async () => {
          try {
            const branchId = selectedBranch?.id || 1;
            // Use direct GET /api/orders/:id?branch_id=... for latest order
            const res = await api.get(`/orders/${lastOrderId}`, { params: { branch_id: branchId } });
            if (res.data?.data) {
              setOrder(res.data.data);
              localStorage.setItem('last_order', JSON.stringify(res.data.data));
              localStorage.setItem('last_order_id', res.data.data.id || res.data.data.order_id);
              console.log('[Home] Restored order from backend by id:', res.data.data);
            }
          } catch (err) {
            console.error('[Home] Failed to fetch order by id', err);
          }
        };
        fetchOrderById();
      } else {
        // 4. No existing order found - Create new pharmacy order for immediate billing
        const newPharmacyOrder = initializePharmacyOrder();
        setOrder(newPharmacyOrder);
        localStorage.setItem('last_order', JSON.stringify(newPharmacyOrder));
        localStorage.setItem('last_order_id', newPharmacyOrder.id.toString());
        console.log('[Home] Created new pharmacy order for immediate billing:', newPharmacyOrder);
      }
    }
  }, [location.state, selectedBranch]);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const getHeldCartsKey = () => {
    const branchId = selectedBranch?.id || localStorage.getItem('branch_id') || 1;
    return `held_carts_${branchId}`;
  };

  const persistHeldCarts = (next) => {
    setHeldCarts(next);
    try {
      localStorage.setItem(getHeldCartsKey(), JSON.stringify(next));
    } catch (err) {
      console.warn('[Home] Failed to persist held carts', err);
    }
  };

  useEffect(() => {
    const key = getHeldCartsKey();
    try {
      const stored = JSON.parse(localStorage.getItem(key) || '[]');
      setHeldCarts(Array.isArray(stored) ? stored : []);
    } catch {
      setHeldCarts([]);
    }
  }, [selectedBranch]);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        // Fetch categories for current branch
        const branchId = selectedBranch?.id || localStorage.getItem('branch_id') || 1;
        const response = await api.get('/categories', { params: { branch_id: branchId } });
        const data = response.data?.data || [];
        if (Array.isArray(data) && data.length && data[0].name) {
          setCategories([{ id: 'all', name: 'All Medicines' }, ...data]);
          setCategoriesError(null);
        } else {
          setCategories([{ id: 'all', name: 'All Medicines' }]);
          setCategoriesError('No categories found');
        }
      } catch (err) {
        setCategories([{ id: 'all', name: 'All Medicines' }]);
        setCategoriesError('Could not load categories');
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, [selectedBranch]);

  useEffect(() => {
    async function fetchInventoryItems() {
      try {
        setLoadingInventoryItems(true);
        setInventoryItemsError(null);
        // Fetch medicines for current branch and category
        const branchId = selectedBranch?.id || localStorage.getItem('branch_id') || 1;
        const params = { branch_id: branchId };
        if (selectedCategory && selectedCategory !== 'All Medicines') {
          params.category = selectedCategory;
        }
        const res = await api.get('/medicines', { params });
        const items = Array.isArray(res.data.data) ? res.data.data : [];
        setInventoryItems(items);
      } catch (err) {
        setInventoryItemsError('Could not load medicines');
        setInventoryItems([]);
      } finally {
        setLoadingInventoryItems(false);
      }
    }
    fetchInventoryItems();
  }, [selectedBranch, selectedCategory]);

  // Fetch purchased and sold quantities for today
  useEffect(() => {
    const branchId = selectedBranch?.id || localStorage.getItem('branch_id') || 1;
    const fetchQuantities = async () => {
      try {
        // Purchased: key by medicine_id
        const purchasedRes = await api.get('/grn/purchased-quantities', { params: { branch_id: branchId } });
        const purchased = {};
        (purchasedRes.data?.data || []).forEach(row => {
          purchased[row.medicine_id] = Number(row.total_purchased) || 0;
        });
        setPurchasedQuantities(purchased);

        // Sold: key by medicine name
        const soldRes = await api.get('/sales-details/sold-quantities', { params: { branch_id: branchId } });
        const sold = {};
        (soldRes.data?.data || []).forEach(row => {
          sold[row.name] = Number(row.total_sold) || 0;
        });
        setSoldQuantities(sold);
      } catch (err) {
        setPurchasedQuantities({});
        setSoldQuantities({});
      }
    };
    fetchQuantities();
  }, [selectedBranch]);

  // Fetch latest retail price for each item from GRN
  useEffect(() => {
    const branchId = selectedBranch?.id || localStorage.getItem('branch_id') || 1;
    const fetchLatestRetailPrices = async () => {
      try {
        console.log('[DEBUG] Fetching retail prices for branch:', branchId);

        // Try the original API first
        try {
          const res = await api.get('/medicines/retail-prices/latest', {
            params: { branch_id: branchId }
          });
          const retailPricesData = res.data?.data || {};
          console.log('[DEBUG] Retail prices API response:', retailPricesData);

          const latest = {};
          Object.keys(retailPricesData).forEach(medicineId => {
            const priceValue = retailPricesData[medicineId].lkr_value;
            latest[medicineId] = priceValue;
            console.log(`[DEBUG] Medicine ${medicineId}: ${priceValue}`);
          });
          console.log('[DEBUG] Final MedicineId -> Retail Price mapping:', latest);
          setLatestRetailPrices(latest);
          return; // Success, exit early
        } catch (apiError) {
          console.log('[DEBUG] Retail prices API failed, trying GRN direct approach:', apiError.message);
        }

        // Fallback: Get prices directly from GRN data
        const grnRes = await api.get('/grn', { params: { branch_id: branchId } });
        const grnBatches = grnRes.data?.data || [];

        console.log('[DEBUG] Using GRN data fallback, found', grnBatches.length, 'batches');

        // Process GRN data to extract latest retail prices
        const priceMap = {};
        const dateMap = {}; // Track latest date for each medicine

        grnBatches.forEach(batch => {
          (batch.items || []).forEach(item => {
            const medicineId = item.medicine_id;
            const itemDate = new Date(item.date || batch.date);
            const currentDate = dateMap[medicineId];

            // Only use this item if it's newer than what we have
            if (!currentDate || itemDate >= currentDate) {
              const price = item.retail || item.mrp || 0;
              if (price > 0) {
                priceMap[medicineId] = Number(price);
                dateMap[medicineId] = itemDate;
                console.log(`[DEBUG] GRN Fallback - Medicine ${medicineId}: ${price} (from ${item.retail ? 'retail' : 'mrp'})`);
              }
            }
          });
        });

        console.log('[DEBUG] GRN Fallback - Final price mapping:', priceMap);
        setLatestRetailPrices(priceMap);

      } catch (err) {
        setLatestRetailPrices({});
        console.error('[DEBUG] Error fetching retail prices:', err);
      }
    };
    fetchLatestRetailPrices();
  }, [selectedBranch]);

  const handleQuantityChange = (itemId, delta) => {
    setQuantities((prev) => {
      const newQty = Math.max(1, (prev[itemId] || 1) + delta);
      return { ...prev, [itemId]: newQty };
    });
  };

  const handleAddToCart = (item) => {
    const qty = quantities[item.id] || 1;
    const totalPrice = getTotalPrice(item);
    const itemWithVariantPrice = {
      ...item,
      basePrice: Number(item.price) || 0,
      variantPrice: totalPrice - (getLatestRetailPrice(item) || Number(item.price) || 0),
      price: totalPrice,
      selectedVariants: selectedVariants[item.id] || {}
    };

    setCart((prev) => {
      // Check if the same item with the same variants already exists in cart
      const existingIdx = prev.findIndex(ci => {
        if (ci.id !== item.id) return false;

        // Compare selected variants
        const currentVariantKeys = Object.keys(selectedVariants[item.id] || {}).sort();
        const existingVariantKeys = Object.keys(ci.selectedVariants || {}).sort();

        // If variant counts differ, they're different items
        if (currentVariantKeys.length !== existingVariantKeys.length) return false;

        // Check if all variant types and options match
        return currentVariantKeys.every(key =>
          existingVariantKeys.includes(key) &&
          ci.selectedVariants[key]?.name === selectedVariants[item.id]?.[key]?.name
        );
      });

      if (existingIdx !== -1) {
        // Item with same variants already in cart, increment qty
        return prev.map((ci, i) =>
          i === existingIdx
            ? { ...ci, qty: ci.qty + qty }
            : ci
        );
      } else {
        // New item or new variant combination, add to cart
        return [...prev, { ...itemWithVariantPrice, qty }];
      }
    });

    // Update reserved
    setReserved(prev => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + qty
    }));
    setQuantities((q) => ({ ...q, [item.id]: 1 }));
  };

  const handleRemoveFromCart = (idx) => {
    setCart(cart => {
      const item = cart[idx];
      if (item) {
        setReserved(prev => ({
          ...prev,
          [item.id]: Math.max(0, (prev[item.id] || 0) - item.qty)
        }));
      }
      return cart.filter((_, i) => i !== idx);
    });
  };

  // Alias for handleRemoveFromCart to maintain backward compatibility
  const handleRemoveItem = handleRemoveFromCart;

  const handleIncreaseQty = (idx) => {
    setCart(cart => cart.map((item, i) =>
      i === idx ? { ...item, qty: item.qty + 1 } : item
    ));
    setReserved(prev => {
      const item = cart[idx];
      if (item) {
        return { ...prev, [item.id]: (prev[item.id] || 0) + 1 };
      }
      return prev;
    });
  };

  const handleDecreaseQty = (idx) => {
    setCart(cart => cart.map((item, i) =>
      i === idx && item.qty > 1 ? { ...item, qty: item.qty - 1 } : item
    ));
    setReserved(prev => {
      const item = cart[idx];
      if (item && item.qty > 1) {
        return { ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1) };
      }
      return prev;
    });
  };

  const rebuildReservedFromCart = (nextCart) => {
    const map = {};
    (nextCart || []).forEach(item => {
      const qty = Number(item.qty || item.quantity || 0);
      if (!Number.isFinite(qty)) return;
      map[item.id] = (map[item.id] || 0) + qty;
    });
    setReserved(map);
  };

  const handleHoldCart = (details = {}) => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    const name = (details.customerName ?? customerName).trim() || 'Walk-in Customer';
    const phone = (details.customerPhone ?? customerPhone).trim();
    const hold = {
      id: Date.now(),
      customerName: name,
      customerPhone: phone,
      cart: [...cart],
      createdAt: new Date().toISOString()
    };
    const next = [hold, ...heldCarts].slice(0, 20);
    persistHeldCarts(next);
    setCart([]);
    setReserved({});
    setCustomerName('');
    setCustomerPhone('');
    toast.success(`Cart held for ${name}`);
  };

  const handleResumeCart = (holdId) => {
    const hold = heldCarts.find(h => h.id === holdId);
    if (!hold) return;
    const nextCart = Array.isArray(hold.cart) ? hold.cart : [];
    setCart(nextCart);
    rebuildReservedFromCart(nextCart);
    setCustomerName(hold.customerName || '');
    setCustomerPhone(hold.customerPhone || '');
    const next = heldCarts.filter(h => h.id !== holdId);
    persistHeldCarts(next);
    toast.info(`Resumed cart for ${hold.customerName || 'customer'}`);
  };

  const handleDeleteHeldCart = (holdId) => {
    const next = heldCarts.filter(h => h.id !== holdId);
    persistHeldCarts(next);
    toast.info('Held cart removed');
  };

  // Cancel billing: restore reserved quantities and reset to fresh pharmacy order
  const handleCancel = () => {
    setCart([]);
    setReserved({});
    setCustomerName('');
    setCustomerPhone('');
    // Reset to a fresh pharmacy order instead of null
    const freshOrder = initializePharmacyOrder();
    setOrder(freshOrder);
    localStorage.setItem('last_order', JSON.stringify(freshOrder));
    localStorage.setItem('last_order_id', freshOrder.id.toString());
    console.log('[Home] Reset to fresh pharmacy order after cancel:', freshOrder);
  };

  // Filter inventory items based on search term only (category is now handled by backend)
  const filteredItems = inventoryItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.genericName && item.genericName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Helper: get available count minus reserved
  const getDisplayAvailable = (item) => {
    return Math.max(0, (item.available || 0) - (reserved[item.id] || 0));
  };

  // Calculate total price for an inventory item with selected variants
  const getTotalPrice = (item, tempVariants = null) => {
    // Use latest retail price from GRN if available
    const lkrValue = getLatestRetailPrice(item);
    let total = lkrValue !== null && lkrValue > 0 ? Number(lkrValue) : Number(item.price) || 0;
    // Add variant prices
    const selected = tempVariants || selectedVariants[item.id] || {};
    if (item.variants && Array.isArray(item.variants)) {
      item.variants.forEach(variant => {
        const selectedOption = selected[variant.type];
        if (selectedOption) {
          const priceToAdd = selectedOption.custom_price_adjustment !== null && selectedOption.custom_price_adjustment !== undefined
            ? Number(selectedOption.custom_price_adjustment)
            : selectedOption.price_adjustment !== null && selectedOption.price_adjustment !== undefined
              ? Number(selectedOption.price_adjustment)
              : Number(selectedOption.price) || 0;
          total += priceToAdd;
        }
      });
    }
    return total;
  };

  // Helper: get latest retail price for an item by medicineId
  const getLatestRetailPrice = (item) => {
    const price = latestRetailPrices[item.id];
    return price !== undefined ? price : null;
  };

  // Debug function to check GRN data directly
  const debugGRNData = async () => {
    try {
      const branchId = selectedBranch?.id || 1;
      console.log('[DEBUG] Fetching GRN data for debugging...');
      const res = await api.get('/grn', { params: { branch_id: branchId } });
      console.log('[DEBUG] Raw GRN data:', res.data?.data);

      // Examine the items in each GRN batch for retail prices
      console.log('[DEBUG] Detailed GRN items analysis:');
      (res.data?.data || []).forEach((batch, batchIndex) => {
        console.log(`[DEBUG] Batch ${batchIndex + 1} (grn_id: ${batch.grn_id}, date: ${batch.date}):`);
        (batch.items || []).forEach((item, itemIndex) => {
          console.log(`  Item ${itemIndex + 1}:`, {
            medicine_id: item.medicine_id,
            medicine_name: item.medicine_name,
            retail: item.retail,
            mrp: item.mrp,
            wholesale: item.wholesale,
            quantity: item.quantity,
            date: item.date
          });
        });
      });

      // Also check what medicine data we have
      const medicinesRes = await api.get('/medicines', { params: { branch_id: branchId } });
      console.log('[DEBUG] Available medicines:', medicinesRes.data?.data?.slice(0, 5)); // First 5 medicines

      // Test the retail prices API directly
      console.log('[DEBUG] Testing retail prices API...');
      const retailRes = await api.get('/medicines/retail-prices/latest', { params: { branch_id: branchId } });
      console.log('[DEBUG] Retail prices API raw response:', retailRes.data);

    } catch (err) {
      console.error('[DEBUG] Error fetching GRN data:', err);
    }
  };

  // Handle variant option selection
  const handleVariantOptionChange = (itemId, variantType, option) => {
    setSelectedVariants(prev => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {}),
        [variantType]: option
      }
    }));
  };

  // Open variant selection modal and fetch latest variants for the item
  const openVariantModal = async (item) => {
    setSelectedItemForVariants(item);
    setTempSelectedVariants(JSON.parse(JSON.stringify(selectedVariants[item.id] || {})));
    try {
      // Fetch latest variants for this medicine
      const res = await api.get(`/medicines/${item.id}`);
      const med = res.data?.data;
      setPopupVariants(Array.isArray(med?.variants) ? med.variants : []);
    } catch {
      setPopupVariants(Array.isArray(item.variants) ? item.variants : []);
    }
  };

  // Save variant selections
  const saveVariantSelections = () => {
    if (selectedItemForVariants) {
      setSelectedVariants(prev => ({
        ...prev,
        [selectedItemForVariants.id]: { ...tempSelectedVariants }
      }));
      setSelectedItemForVariants(null);
    }
  };

  // Get selected variant names for display
  const getSelectedVariantNames = (itemId) => {
    const variants = selectedVariants[itemId];
    if (!variants) return [];
    return Object.entries(variants).map(([type, option]) => (
      `${type}: ${option.name}${option.price > 0 ? ` (+LKR ${Number(option.price).toFixed(2)})` : ''}`
    ));
  };

  // Save order to localStorage whenever it changes
  useEffect(() => {
    if (order && (order.id || order.order_id)) {
      localStorage.setItem('last_order', JSON.stringify(order));
      localStorage.setItem('last_order_id', order.id || order.order_id);
      console.log('[Home] Saved order to localStorage:', order);
    }
  }, [order]);

  // Listen for changes in BillDetails (order update) and always update localStorage with the latest order
  const handleCheckout = async (updatedOrder) => {
    // updatedOrder is the latest order object after billing (orderData from BillDetails)
    console.log('[Home] handleCheckout triggered with:', updatedOrder);
    if (!updatedOrder) {
      console.error('[Home] handleCheckout called with null/undefined order!');
      return;
    }

    try {
      // Prepare payload for backend
      // Format date manually to ensure local time is preserved and format is correct (YYYY-MM-DD for DATE column)
      const now = new Date();
      const formattedDate = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0');

      const payload = {
        date: formattedDate,
        customer: updatedOrder.customerName || 'Walk-in Customer',
        customer_phone: updatedOrder.customerPhone || '',
        bill_number: updatedOrder.id || null,
        // Map cart to items and rename qty key to quantity for backend consistency
        items: (updatedOrder.cart || []).map(item => ({
          ...item,
          quantity: item.qty || item.quantity || 1
        })),
        total: updatedOrder.total,
        branch_id: selectedBranch?.id || 1
      };

      console.log('[Home] Sending payload to /sales-details:', payload);

      // Save to database
      const response = await api.post('/sales-details', payload);
      console.log('[Home] Backend response:', response);

      if (response.data) {
        console.log('[Home] Order saved successfully:', response.data);
        toast.success('Sale successfully recorded in database!');

        // Clear cart and reset for next customer after a short delay (allows receipt to show)
        setTimeout(() => {
          setCart([]);
          setReserved({});
          const newOrder = initializePharmacyOrder();
          setOrder(newOrder);
          localStorage.setItem('last_order', JSON.stringify(newOrder));
          localStorage.setItem('last_order_id', (newOrder.id || newOrder.order_id).toString());
          console.log('[Home] Created new pharmacy order for next customer:', newOrder);

          // Re-fetch inventory to reflect updated stock quantities
          const refetchInventory = async () => {
            try {
              const params = { branch_id: selectedBranch?.id || 1 };
              if (selectedCategory && selectedCategory !== 'All Medicines') {
                params.category = selectedCategory;
              }
              const res = await api.get('/medicines', { params });
              const items = Array.isArray(res.data.data) ? res.data.data : [];
              setInventoryItems(items);
              console.log('[Home] Inventory re-fetched after sale. Updated stock levels.');
            } catch (err) {
              console.error('[Home] Failed to re-fetch inventory:', err);
            }
          };
          refetchInventory();
        }, 2000); // 2 second delay to let the receipt show

        return true; // Indicate success
      }
      return false;
    } catch (error) {
      console.error('[Home] Error saving sale:', error);
      if (error.response) {
        console.error('[Home] Backend error details:', error.response.data);
      }
      toast.error('Failed to save sale to database. Please check connection.');
      setOrder(updatedOrder);
      return false; // Indicate failure
    }
  };

  // Render loading state
  if (loadingInventoryItems) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Render error state
  if (inventoryItemsError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{inventoryItemsError}</p>
      </div>
    );
  }

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

  // Helper: get available quantity for an item (purchased - sold)
  const getAvailableQuantity = (item) => {
    const purchased = purchasedQuantities[item.id] || 0;
    const sold = soldQuantities[item.name] || 0;
    return Math.max(0, purchased - sold);
  };

  return (
    <div className="w-full h-full flex bg-slate-50/50">
      {/* Main Content Area - Inventory & Selection */}
      <div className="w-[62%] min-w-0 flex flex-col h-full overflow-hidden border-r border-slate-200 shadow-sm relative z-0">
        {/* Header Section - Fixed */}
        <div className="flex-none p-4 bg-white border-b border-slate-100 shadow-sm">
          <div className="flex justify-between items-center gap-4">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-xl">
              <div className="flex items-center w-full bg-slate-50 border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-sky-300 focus-within:shadow-md focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all duration-300 px-4 py-2 gap-3">
                <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search medicines by name or generic..."
                  className="w-full bg-transparent text-slate-700 placeholder-slate-400 text-sm font-medium outline-none border-none focus:ring-0 py-0.5"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center transition-colors"
                  >
                    <XMarkIcon className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="h-full">
            {/* Categories Tabs Section */}
            <div className="relative flex-none py-1.5 bg-white/90">
              <div className="relative flex items-center px-2">
                {/* Left Scroll Button */}
                <button
                  className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white border border-[#0492c2]/30 hover:bg-[#0492c2]/5 text-[#0492c2] shadow-sm mr-1 transition-all duration-200"
                  onClick={(e) => {
                    const container = e.currentTarget.closest('.categories-container').querySelector('.categories-scroll');
                    container.scrollBy({ left: -150, behavior: 'smooth' });
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>

                {/* Categories Container */}
                <div className="flex-1 overflow-hidden">
                  <div
                    className="flex space-x-1.5 pb-1 overflow-x-auto scrollbar-hide categories-scroll"
                  >
                    {loadingCategories ? (
                      <div className="px-4 py-2 text-sm text-[#94aefe]">Loading categories...</div>
                    ) : categoriesError ? (
                      <div className="px-4 py-2 text-sm text-red-400">{categoriesError}</div>
                    ) : (
                      <div className="flex space-x-1.5 categories-container">
                        {categories.map((category) => (
                          <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.name)}
                            className={`min-w-max px-4 py-1.5 text-xs font-semibold transition-all duration-200 whitespace-nowrap rounded-full ${selectedCategory === category.name
                              ? 'bg-gradient-to-b from-blue-100 to-blue-50 text-blue-700 shadow-inner border border-blue-200/80'
                              : 'bg-white text-slate-600 hover:bg-blue-50 border border-blue-100 hover:border-blue-200/80 shadow-sm hover:text-blue-600'
                              }`}
                          >
                            {category.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Scroll Button */}
                <button
                  className="ml-1.5 flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white border border-[#0492c2]/30 hover:bg-[#0492c2]/5 text-[#0492c2] shadow-sm transition-all duration-200"
                  onClick={(e) => {
                    const container = e.currentTarget.closest('.categories-container').querySelector('.categories-scroll');
                    container.scrollBy({ left: 150, behavior: 'smooth' });
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>

              {/* Fade effects for both edges */}
              <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white to-transparent pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white to-transparent pointer-events-none" />
            </div>

            {/* Custom scrollbar hide utility */}
            <style jsx global>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
              .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
            `}</style>

            <div
              className={`
                grid
                ${isSidebarCollapsed ? 'grid-cols-4' : 'grid-cols-3'}
                gap-4
                animate-menu-pop
                px-4 py-2 pb-8
              `}
            >
              {loadingInventoryItems ? (
                <div className="col-span-full text-center py-20 flex flex-col items-center">
                  <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-slate-400 font-medium">Loading Inventory...</p>
                </div>
              ) : inventoryItemsError ? (
                <div className="col-span-full text-center py-20">
                  <p className="text-red-400 font-semibold">{inventoryItemsError}</p>
                </div>
              ) : filteredItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="group relative bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-sky-200 hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full"
                >
                  {/* Stock Badge */}
                  <div className={`absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm ${(item.quantity || 0) > 10
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    : (item.quantity || 0) > 0
                      ? 'bg-amber-50 text-amber-600 border border-amber-100'
                      : 'bg-red-50 text-red-500 border border-red-100'
                    }`}>
                    {(item.quantity || 0) > 0 ? `${item.quantity} in stock` : 'Out of stock'}
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex flex-col flex-1">
                    {/* Header: Image + Name */}
                    <div className="flex gap-4 mb-4">
                      <div className="w-16 h-16 flex-shrink-0 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shadow-inner group-hover:scale-105 transition-transform duration-300">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://placehold.co/64?text=MED';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-slate-800 leading-tight line-clamp-2 mb-1 group-hover:text-sky-700 transition-colors" title={item.name}>
                          {item.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium truncate italic">
                          {item.generic_name || 'General Medicine'}
                        </p>
                      </div>
                    </div>

                    {/* Price Section */}
                    <div className="mt-auto flex items-end justify-between mb-4">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Price</p>
                        <p className="text-lg font-black text-blue-800 tabular-nums">
                          LKR {getTotalPrice(item).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Category</p>
                        <p className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                          {item.category || 'General'}
                        </p>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                          <button
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm border border-slate-200 hover:bg-red-50 hover:text-red-500 active:scale-95 transition-all disabled:opacity-30"
                            onClick={() => handleQuantityChange(item.id, -1)}
                            disabled={!quantities[item.id] || quantities[item.id] <= 0}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                            </svg>
                          </button>
                          <span className="w-10 text-center font-black text-slate-700 text-sm">
                            {quantities[item.id] || 0}
                          </span>
                          <button
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-sky-600 text-white shadow-md shadow-sky-200 hover:bg-sky-700 active:scale-95 transition-all"
                            onClick={() => handleQuantityChange(item.id, 1)}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                          </button>
                        </div>

                        <button
                          className={`flex-1 h-10 flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all shadow-md active:translate-y-0.5 ${(quantities[item.id] || 0) > 0
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-100 hover:shadow-emerald-200 hover:-translate-y-0.5'
                            : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                            }`}
                          onClick={() => handleAddToCart(item)}
                          disabled={!quantities[item.id] || quantities[item.id] <= 0}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Add to Bill
                        </button>
                      </div>

                      {/* Variants Toggle */}
                      {item.variants?.length > 0 && (
                        <button
                          type="button"
                          onClick={() => openVariantModal(item)}
                          className="w-full py-2 px-3 rounded-lg border border-dashed border-sky-300 text-sky-600 bg-sky-50/50 hover:bg-sky-50 text-[11px] font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                          {getSelectedVariantNames(item.id).length > 0 ? (
                            <span className="truncate flex items-center gap-1">
                              <CheckCircleIcon className="w-3 h-3 text-emerald-500" />
                              {getSelectedVariantNames(item.id).join(', ')}
                            </span>
                          ) : (
                            <span>Select Strength / Unit</span>
                          )}
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {(!loadingInventoryItems && !inventoryItemsError && filteredItems.length === 0) && (
              <div className="col-span-full text-center py-20">
                <p className="text-slate-400 font-medium">No items found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bill Details Section */}
      <div className="w-[38%] flex flex-col h-full bg-white border-l border-slate-200 shadow-xl relative z-10">
        <div className="flex-1 flex flex-col min-h-0 bg-slate-50/30">
          {/* BillDetails is always visible for pharmacy POS workflow */}
          {order ? (
            <div className="flex-1 flex flex-col p-4 overflow-hidden">
              <BillDetails
                cart={cart}
                onRemoveItem={handleRemoveItem}
                onIncreaseQty={handleIncreaseQty}
                onDecreaseQty={handleDecreaseQty}
                onCancel={handleCancel}
                onCheckout={handleCheckout}
                customerName={customerName}
                customerPhone={customerPhone}
                onCustomerNameChange={setCustomerName}
                onCustomerPhoneChange={setCustomerPhone}
                onHoldCart={handleHoldCart}
                heldCarts={heldCarts}
                onResumeCart={handleResumeCart}
                onDeleteHeldCart={handleDeleteHeldCart}
                order={order}
                table={table}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 p-8">
              <div className="text-center">
                <div className="mb-6 w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                  <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-2">Initializing POS...</h3>
                <p className="text-sm text-slate-400">Please wait while we prepare the billing system</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Variant Selection Modal */}
      {
        selectedItemForVariants && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm max-h-[85vh] flex flex-col overflow-hidden border border-gray-200">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b border-blue-100">
                <h3 className="text-[15px] font-bold text-[#0b27b1] truncate">
                  {selectedItemForVariants.name}
                </h3>
                <p className="text-xs text-[#03648a] mt-0.5">Select your preferences</p>
              </div>
              {/* Options */}
              <div className="p-4 overflow-y-auto">
                {(popupVariants || []).map((variant, vIdx) => (
                  <div key={vIdx} className="space-y-2">
                    <h4 className="text-[13px] font-semibold text-[#0b27b1] flex items-center">
                      <span className="bg-blue-100/70 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-full mr-2">
                        {variant.typeName || variant.type}
                      </span>
                    </h4>
                    <div className="space-y-1.5 pl-1">
                      {(variant.options || []).map((opt, oIdx) => (
                        <label
                          key={oIdx}
                          className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${tempSelectedVariants[variant.type]?.name === opt.name
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-50 border border-transparent'
                            }`}
                        >
                          <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${tempSelectedVariants[variant.type]?.name === opt.name
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                            } flex items-center justify-center`}>
                            {tempSelectedVariants[variant.type]?.name === opt.name && (
                              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                            )}
                          </div>
                          <input
                            type="radio"
                            name={`variant-${variant.type}`}
                            checked={
                              !!tempSelectedVariants[variant.type] &&
                              tempSelectedVariants[variant.type].name === opt.name
                            }
                            onChange={() => {
                              setTempSelectedVariants(prev => ({
                                ...prev,
                                [variant.type]: opt
                              }));
                            }}
                            className="sr-only"
                          />
                          <span className="ml-3 text-[13px] text-gray-800 font-medium">
                            {opt.name}
                          </span>
                          {(() => {
                            // Show custom price adjustment if available, otherwise show base price adjustment or price
                            const priceToShow = opt.custom_price_adjustment !== null && opt.custom_price_adjustment !== undefined
                              ? Number(opt.custom_price_adjustment)
                              : opt.price_adjustment !== null && opt.price_adjustment !== undefined
                                ? Number(opt.price_adjustment)
                                : Number(opt.price) || 0;

                            if (priceToShow > 0) {
                              return (
                                <span className="ml-auto text-[12px] font-semibold text-blue-600">
                                  +LKR {priceToShow.toFixed(2)}
                                  {opt.custom_price_adjustment !== null && opt.custom_price_adjustment !== undefined && (
                                    <span className="text-[10px] text-green-600 ml-1">(Custom)</span>
                                  )}
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50/70">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setSelectedItemForVariants(null)}
                    className="px-4 py-2 text-[13px] font-medium text-gray-700 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <div className="flex items-center">
                    <span className="text-sm font-semibold text-gray-700 mr-3">
                      Total: LKR {getTotalPrice(selectedItemForVariants, tempSelectedVariants).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={saveVariantSelections}
                      className="px-4 py-2 text-[13px] font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:from-blue-700 hover:to-blue-600 transition-colors shadow-sm"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Enhanced Animations and Styles */}
      <style jsx>{`
        .font-inter { 
          font-family: 'Inter', 'Segoe UI', Arial, sans-serif; 
        }
        body, #root {
          background: #FFFFFF;
          min-height: 100vh;
        }
        .search-glow {
          box-shadow: 0 0 0 2px #7ed8fa, 0 0 8px 2px #94aefe;
        }
        .search-glow:focus, .search-glow:active {
          box-shadow: 0 0 0 3px #7ed8fa, 0 0 12px 4px #94aefe;
        }
        .card-glow {
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .card-glow:hover, .card-glow:focus-within {
          box-shadow: 0 2px 4px rgba(0,0,0,0.15);
        }

        .animate-menu-pop > * {
          animation: menuPop 0.7s cubic-bezier(.4,0,.2,1) both;
        }
        @keyframes menuPop {
          from { opacity: 0; transform: scale(0.97) translateY(24px);}
          to { opacity: 1; transform: scale(1) translateY(0);}
        }
      `}</style>
    </div >
  );
}

export default Home;
