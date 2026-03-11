import React, { useState, useEffect } from 'react';
import {
  UserIcon,
  PrinterIcon,
  XMarkIcon,
  CheckCircleIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import { BsCashStack, BsCreditCard2FrontFill, BsQrCode } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';

import { toast } from 'react-toastify';
import BillReceipt from './BillReceipt';
import api from '../utils/axios';
import { useBranch } from '../context/BranchContext';
import { useAuth } from '../context/AuthContext';

export default function BillDetails({
  cart = [],
  onRemoveItem,
  onIncreaseQty,
  onDecreaseQty,
  onCancel,
  onCheckout,
  customerName: customerNameProp,
  customerPhone: customerPhoneProp,
  onCustomerNameChange,
  onCustomerPhoneChange,
  onHoldCart,
  heldCarts = [],
  onResumeCart,
  onDeleteHeldCart,
}) {
  const [internalCustomerName, setInternalCustomerName] = useState('');
  const customerName = customerNameProp !== undefined ? customerNameProp : internalCustomerName;
  const setCustomerName = onCustomerNameChange || setInternalCustomerName;
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showReceipt, setShowReceipt] = useState(false);
  const [internalCustomerPhone, setInternalCustomerPhone] = useState('');
  const customerPhone = customerPhoneProp !== undefined ? customerPhoneProp : internalCustomerPhone;
  const setCustomerPhone = onCustomerPhoneChange || setInternalCustomerPhone;
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paidAmount, setPaidAmount] = useState('');
  const [futureCredit, setFutureCredit] = useState(0);
  const [discounts, setDiscounts] = useState([]);
  const [selectedDiscount, setSelectedDiscount] = useState('');
  const [lastCompletedOrder, setLastCompletedOrder] = useState(null);
  const [billingSettings, setBillingSettings] = useState({
    defaultPaymentMethod: 'cash',
    defaultDiscountType: 'percentage',
    defaultDiscountValue: 0,
    taxPercentage: 18
  });
  const [allCustomers, setAllCustomers] = useState([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [showHeldCarts, setShowHeldCarts] = useState(false);
  const { selectedBranch } = useBranch();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBillingSettings = async () => {
      try {
        const response = await api.get('/billing-settings', {
          params: { branch_id: selectedBranch?.id || 1 }
        });
        if (response.data) {
          setBillingSettings(prev => ({ ...prev, ...response.data }));
          const defaultMethod = (response.data.defaultPaymentMethod || 'cash').toLowerCase();
          setPaymentMethod(defaultMethod);
          if (response.data.defaultDiscountType === 'percentage' && response.data.defaultDiscountValue) {
            setDiscountPercentage(parseFloat(response.data.defaultDiscountValue));
          }
        }
      } catch (error) {
        console.error('Error fetching billing settings:', error);
      }
    };

    const fetchDiscounts = async () => {
      try {
        const response = await api.get('/discounts');
        setDiscounts((response.data || []).map(d => ({
          ...d,
          items: typeof d.items === 'string' ? JSON.parse(d.items) : (d.items || [])
        })));
      } catch (error) {
        console.error('Error fetching discounts:', error);
        setDiscounts([]);
      }
    };

    fetchBillingSettings();
    fetchDiscounts();
  }, [selectedBranch?.id]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await api.get('/customers', {
          params: { branch_id: selectedBranch?.id || 1 }
        });
        const customerData = Array.isArray(res.data)
          ? res.data
          : (Array.isArray(res.data?.data) ? res.data.data : []);
        setAllCustomers(customerData);
      } catch (err) {
        console.error('[BillDetails] Failed to fetch customers:', err);
      }
    };
    fetchCustomers();
  }, [selectedBranch]);

  const filteredCustomers = (() => {
    const searchText = customerName.trim().toLowerCase();
    const customers = searchText.length > 0
      ? allCustomers.filter(c =>
        String(c?.name || '').toLowerCase().includes(searchText) ||
        String(c?.phone || '').includes(customerName.trim())
      )
      : allCustomers;

    return customers.slice(0, 100);
  })();

  const handleSelectCustomer = (customer) => {
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone || '');
    setShowCustomerSuggestions(false);
  };

  const [discountType, setDiscountType] = useState('percentage');

  const handleDiscountChange = (e) => {
    const discountId = e.target.value;
    setSelectedDiscount(discountId);
    if (!discountId) {
      setDiscountPercentage(0);
      setDiscountType('percentage');
      return;
    }
    const selected = discounts.find(d => String(d.id) === String(discountId));
    if (selected) {
      setDiscountType(selected.type || 'percentage');
      setDiscountPercentage(Number(selected.value) || 0);
    }
  };

  const paymentMethods = [
    { method: 'cash', icon: <BsCashStack className="w-4 h-4" />, label: 'Cash' },
    { method: 'card', icon: <BsCreditCard2FrontFill className="w-4 h-4" />, label: 'Card' },
    { method: 'qr', icon: <BsQrCode className="w-4 h-4" />, label: 'QR' },
  ];

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method.toLowerCase());
  };

  const taxRate = (billingSettings.taxPercentage || 18) / 100;
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discountAmount = (subtotal * (discountPercentage / 100));
  const taxAmount = (subtotal - discountAmount) * taxRate;
  const grandTotal = subtotal - discountAmount + taxAmount;

  const handleQuantityChange = (index, delta) => {
    if (delta > 0) onIncreaseQty(index);
    else onDecreaseQty(index);
  };

  const removeFromCart = (index) => {
    onRemoveItem(index);
    toast.info('Item removed', { position: 'bottom-right' });
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Clear all items from cart?')) {
      for (let i = cart.length - 1; i >= 0; i--) onRemoveItem(i);
      setCustomerName('');
      setCustomerPhone('');
      setDiscountPercentage(0);
      setPaymentMethod('cash');
      toast.info('Cart cleared', { position: 'bottom-right' });
    }
  };

  const handlePaid = async () => {
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    let paid = parseFloat(paidAmount);
    if (!paidAmount || isNaN(paid)) { paid = grandTotal; setPaidAmount(grandTotal.toFixed(2)); }
    if (paid < grandTotal - 0.01) { toast.error(`Short by LKR ${(grandTotal - paid).toFixed(2)}`); return; }

    setIsProcessing(true);
    try {
      let credit = paid > grandTotal ? paid - grandTotal : 0;
      if (credit > 0) {
        setFutureCredit(credit);
        toast.info(`Change: LKR ${credit.toFixed(2)}`);
      } else {
        setFutureCredit(0);
      }

      const orderSnapshot = {
        id: `INV-${Date.now()}`,
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim(),
        cart: [...cart],
        subtotal,
        discount: { type: 'percentage', value: discountPercentage, amount: discountAmount },
        tax: { rate: taxRate, amount: taxAmount },
        total: grandTotal,
        paidAmount: paid,
        futureCredit: credit,
        paymentMethod,
        date: new Date().toISOString(),
        cashier: user?.username || 'Cashier',
        branch: selectedBranch || { name: 'Main Branch' }
      };

      setLastCompletedOrder(orderSnapshot);
      setShowReceipt(true);

      if (onCheckout) await onCheckout(orderSnapshot);

      setCustomerName('');
      setCustomerPhone('');
      setDiscountPercentage(0);
      setSelectedDiscount('');
      setPaymentMethod('cash');
      setPaidAmount('');
      setFutureCredit(0);
      toast.success('Payment successful!');
    } catch (error) {
      toast.error('Payment failed: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    const orderSnapshot = {
      id: `INV-${Date.now()}`,
      customerName: customerName.trim() || 'Walk-in Customer',
      customerPhone: customerPhone.trim(),
      cart: [...cart],
      subtotal,
      discount: { type: 'percentage', value: discountPercentage, amount: discountAmount },
      tax: { rate: taxRate, amount: taxAmount },
      total: grandTotal,
      paidAmount: parseFloat(paidAmount) || grandTotal,
      futureCredit,
      paymentMethod,
      date: new Date().toISOString(),
      cashier: user?.username || 'Cashier',
      branch: selectedBranch || { name: 'Main Branch' }
    };
    setLastCompletedOrder(orderSnapshot);
    setShowReceipt(true);
    setTimeout(() => window.print(), 200);
  };

  const handleCancel = () => {
    if (window.confirm('Cancel this transaction?')) {
      if (onCancel) onCancel();
      else clearCart();
      toast.info('Transaction cancelled');
    }
  };

  const handleHoldClick = () => {
    if (!onHoldCart) return;
    onHoldCart({ customerName, customerPhone });
    setCustomerName('');
    setCustomerPhone('');
    setDiscountPercentage(0);
    setSelectedDiscount('');
    setPaymentMethod('cash');
    setPaidAmount('');
    setFutureCredit(0);
    setShowHeldCarts(false);
  };

  const changeAmount = paidAmount ? parseFloat(paidAmount) - grandTotal : 0;

  return (
    <>
      <div className="w-full h-full flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-lg overflow-hidden">

        {/* Header */}
        <div className="flex-none bg-gradient-to-r from-sky-600 to-blue-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-sm tracking-wide">Bill Details</h2>
              <p className="text-sky-200 text-[10px]">{cart.length} item{cart.length !== 1 ? 's' : ''} in cart</p>
            </div>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-sky-200 hover:text-white text-[10px] font-medium transition-colors px-2 py-1 rounded-lg hover:bg-white/10">
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Customer Details */}
        <div className="flex-none px-4 pt-3 pb-2 flex flex-col gap-2">
          <div className="relative">
            <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Customer name (optional)"
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 focus:bg-white transition-all text-slate-700 placeholder-slate-400"
              value={customerName}
              onChange={(e) => {
                const nextValue = e.target.value;
                setCustomerName(nextValue);

                const exactMatch = allCustomers.find(c =>
                  String(c?.name || '').toLowerCase() === nextValue.trim().toLowerCase()
                );
                if (exactMatch?.phone) {
                  setCustomerPhone(exactMatch.phone);
                }

                setShowCustomerSuggestions(true);
              }}
              onFocus={() => setShowCustomerSuggestions(true)}
              onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 200)}
            />
            {/* Auto-suggestions list */}
            {showCustomerSuggestions && filteredCustomers.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto">
                {filteredCustomers.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCustomer(c)}
                    className="w-full px-4 py-2 text-left hover:bg-sky-50 transition-colors flex flex-col gap-0.5"
                  >
                    <span className="text-xs font-bold text-slate-700">{c.name}</span>
                    {c.phone && <span className="text-[10px] text-slate-400">{c.phone}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <PhoneIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Phone number (optional)"
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 focus:bg-white transition-all text-slate-700 placeholder-slate-400"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>
          {(onHoldCart || heldCarts.length > 0) && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleHoldClick}
                  disabled={cart.length === 0 || !onHoldCart}
                  className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition-all duration-200 ${cart.length === 0 || !onHoldCart
                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                    : 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100'
                    }`}
                >
                  Hold Cart
                </button>
                <button
                  onClick={() => setShowHeldCarts(v => !v)}
                  disabled={heldCarts.length === 0}
                  className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition-all duration-200 ${heldCarts.length === 0
                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                    : 'bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100'
                    }`}
                >
                  Held ({heldCarts.length})
                </button>
              </div>
              {showHeldCarts && heldCarts.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                  {heldCarts.map(h => {
                    const created = h.createdAt ? new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                    return (
                      <div key={h.id} className="flex items-center justify-between px-3 py-2 border-b border-slate-100 last:border-b-0">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-700 truncate">
                            {h.customerName || 'Walk-in Customer'}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {(h.cart?.length || 0)} items {created ? `• ${created}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => {
                              onResumeCart?.(h.id);
                              setShowHeldCarts(false);
                            }}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100"
                          >
                            Resume
                          </button>
                          <button
                            onClick={() => onDeleteHeldCart?.(h.id)}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-red-50 text-red-500 border border-red-200 hover:bg-red-100"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 min-h-0 px-4 pb-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <svg className="w-7 h-7 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-400">Cart is empty</p>
              <p className="text-[11px] text-slate-300 mt-0.5">Add items from the inventory</p>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Column headers */}
              <div className="flex items-center px-1 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <span className="w-[38%]">Item</span>
                <span className="w-[24%] text-center">Qty</span>
                <span className="w-[18%] text-right">Price</span>
                <span className="w-[18%] text-right">Total</span>
                <span className="w-[2%]"></span>
              </div>

              {/* Scrollable items */}
              <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-slate-50">
                {cart.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="flex items-center px-1 py-2 group hover:bg-sky-50/40 transition-colors rounded-lg">
                    {/* Item name */}
                    <div className="w-[38%] pr-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate leading-tight">{item.name}</p>
                      {item.selectedVariants && Object.keys(item.selectedVariants).length > 0 && (
                        <p className="text-[9px] text-slate-400 truncate">
                          {Object.values(item.selectedVariants).map(v => v.name).join(', ')}
                        </p>
                      )}
                    </div>

                    {/* Quantity controls */}
                    <div className="w-[24%] flex items-center justify-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleQuantityChange(index, -1); }}
                        disabled={item.qty <= 1}
                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-sky-100 text-slate-500 hover:text-sky-600 flex items-center justify-center transition-colors disabled:opacity-30 text-sm font-bold"
                      >
                        −
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-slate-700 bg-sky-50 rounded-md py-0.5">{item.qty}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleQuantityChange(index, 1); }}
                        className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-sky-100 text-slate-500 hover:text-sky-600 flex items-center justify-center transition-colors text-sm font-bold"
                      >
                        +
                      </button>
                    </div>

                    {/* Price */}
                    <div className="w-[18%] text-right">
                      <span className="text-[11px] text-slate-500">{item.price.toFixed(2)}</span>
                    </div>

                    {/* Total */}
                    <div className="w-[18%] text-right">
                      <span className="text-[11px] font-bold text-slate-700">{(item.price * item.qty).toFixed(2)}</span>
                    </div>

                    {/* Remove */}
                    <div className="w-[5%] pl-1.5">
                      <button
                        onClick={() => removeFromCart(index)}
                        className="w-5 h-5 rounded-md bg-red-50 hover:bg-red-100 border border-red-200 flex items-center justify-center transition-colors"
                        title="Remove item"
                      >
                        <XMarkIcon className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section */}
        <div className="flex-none border-t border-slate-100">

          {/* Discount Row */}
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center gap-2">
              <select
                value={selectedDiscount}
                onChange={handleDiscountChange}
                className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all"
              >
                <option value="">No Discount</option>
                {discounts.filter(d => d.status === 'Active').map((discount) => (
                  <option key={discount.id} value={discount.id}>
                    {discount.name} ({discount.type === 'percentage' ? `${discount.value}%` : `LKR ${discount.value}`})
                  </option>
                ))}
              </select>
              <button
                onClick={() => navigate('/dashboard/discounts')}
                className="w-8 h-8 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-600 hover:text-sky-700 transition-colors flex-shrink-0"
                title="Manage Discounts"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
              <div className="relative flex-shrink-0">
                <input
                  type="number"
                  min="0"
                  max={discountType === 'percentage' ? 100 : undefined}
                  value={discountPercentage}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : Number(e.target.value);
                    setDiscountPercentage(value);
                    if (value > 0) setSelectedDiscount('');
                  }}
                  className="w-16 text-center text-xs font-semibold border border-slate-200 rounded-xl pl-2 pr-6 py-2 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all appearance-none [-moz-appearance:_textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                  {discountType === 'percentage' ? '%' : 'LKR'}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="px-4 pb-2">
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map(({ method, icon, label }) => {
                const isActive = paymentMethod === method;
                return (
                  <button
                    key={method}
                    onClick={() => handlePaymentMethodChange(method)}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${isActive
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-200/50'
                      : 'bg-slate-50 text-slate-500 border border-slate-200 hover:border-sky-300 hover:text-sky-600 hover:bg-sky-50'
                      }`}
                  >
                    {React.cloneElement(icon, { className: 'w-3.5 h-3.5' })}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Totals */}
          <div className="px-4 pb-2">
            <div className="bg-gradient-to-br from-slate-50 to-sky-50/50 rounded-xl p-3 border border-slate-100 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Subtotal</span>
                <span className="text-xs font-semibold text-slate-700">LKR {subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-emerald-600">Discount ({discountPercentage}%)</span>
                  <span className="text-xs font-semibold text-emerald-600">− LKR {discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Tax ({billingSettings.taxPercentage || 18}%)</span>
                <span className="text-xs font-semibold text-slate-700">LKR {taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200/80">
                <span className="text-sm font-bold text-slate-800">Total</span>
                <span className="text-base font-extrabold text-sky-700">LKR {grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Paid Amount */}
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 flex-shrink-0">Paid</label>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">LKR</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paidAmount}
                  onChange={e => setPaidAmount(e.target.value)}
                  placeholder={grandTotal.toFixed(2)}
                  className="w-full pl-9 pr-14 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-right text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all bg-slate-50"
                />
                <button
                  onClick={() => setPaidAmount(grandTotal.toFixed(2))}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-2 py-1 rounded-lg transition-colors border border-sky-200/60"
                >
                  EXACT
                </button>
              </div>
            </div>
            {/* Change/shortage indicator */}
            {paidAmount && changeAmount < -0.01 && (
              <div className="mt-1.5 flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 border border-red-100 rounded-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                <span className="text-[11px] font-semibold text-red-600">Short: LKR {Math.abs(changeAmount).toFixed(2)}</span>
              </div>
            )}
            {paidAmount && changeAmount > 0.01 && (
              <div className="mt-1.5 flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                <span className="text-[11px] font-semibold text-emerald-600">Change: LKR {changeAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="px-4 pb-3 pt-1">
            <div className="flex gap-2">
              <button
                onClick={handlePaid}
                disabled={cart.length === 0 || isProcessing}
                className={`flex-[2] py-2.5 rounded-xl font-bold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 ${cart.length === 0 || isProcessing
                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-200/50 hover:shadow-lg hover:shadow-sky-300/50 hover:-translate-y-0.5 active:translate-y-0'
                  }`}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4" />
                    Pay Now
                  </>
                )}
              </button>
              <button
                onClick={handlePrint}
                disabled={cart.length === 0}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-1 ${cart.length === 0
                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  : 'bg-slate-100 text-slate-600 hover:bg-sky-50 hover:text-sky-600 border border-slate-200 hover:border-sky-200'
                  }`}
              >
                <PrinterIcon className="w-3.5 h-3.5" />
                Print
              </button>
              <button
                onClick={handleCancel}
                disabled={cart.length === 0}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-1 ${cart.length === 0
                  ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                  : 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 hover:border-red-300'
                  }`}
              >
                <XMarkIcon className="w-3.5 h-3.5" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && lastCompletedOrder && (
        <BillReceipt
          order={{
            ...lastCompletedOrder,
            billingSettings: {
              ...billingSettings,
              receiptFooter: billingSettings.receiptFooter || 'Thank you for your business!',
              taxPercentage: billingSettings.taxPercentage || 18
            }
          }}
          onClose={() => setShowReceipt(false)}
          printMode={false}
        />
      )}
    </>
  );
}
