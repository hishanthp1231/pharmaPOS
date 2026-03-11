import { useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { BellIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { WarningAmber, Inventory2 } from '@mui/icons-material';
import { useBranch } from '../context/BranchContext';
import Logo from './Logo';

const API_URL = '/api';

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

export default function Header() {
  const location = useLocation();
  const { storeInfo } = useStore();
  const { selectedBranch } = useBranch();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [expiryAlerts, setExpiryAlerts] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [loadingNotif, setLoadingNotif] = useState(false);
  const dropdownRef = useRef(null);

  // Clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Profile info state
  const [profileInfo, setProfileInfo] = useState({ name: '', role: '' });

  // Fetch profile info from backend
  useEffect(() => {
    axios.get('/api/profile')
      .then(res => {
        const data = res.data.data || {};
        setProfileInfo({
          name: data.name || '',
          role: data.role || 'Manager'
        });
      })
      .catch(() => setProfileInfo({ name: '', role: 'Manager' }));
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Extract the current page name from the URL path
  const getPageName = () => {
    const path = location.pathname;
    // Remove leading /dashboard if present
    let cleanPath = path.startsWith('/dashboard') ? path.replace('/dashboard', '') : path;
    if (cleanPath === '' || cleanPath === '/') return 'Dashboard';
    // Map of path to display names (must match sidebar names exactly)
    const pageNames = {
      '/home': 'Home',
      '/inventory': 'Inventory',
      '/orders': 'Orders',
      '/tables': 'Tables',
      '/customers': 'Customers',
      '/expenses': 'Expenses',
      '/reports': 'Reports',
      '/settings': 'Settings',
      '/inventory/items': 'Inventory',
      '/inventory/items/new': 'Add Inventory Item',
      '/inventory/items/edit/:id': 'Edit Inventory Item'
    };
    // Try exact match
    if (pageNames[cleanPath]) return pageNames[cleanPath];
    // Fallback: prettify
    return cleanPath.replace(/^\//, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get logged-in user
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  // Fetch role name from roles table if possible
  const [roleName, setRoleName] = useState(user.role || '');

  useEffect(() => {
    async function fetchRoleName() {
      if (user.role_id) {
        try {
          const res = await axios.get(`/api/user-management/roles/${user.role_id}`);
          const role = res.data?.data;
          setRoleName(role?.name || user.role || 'Manager');
        } catch {
          setRoleName(user.role || 'Manager');
        }
      } else {
        setRoleName(user.role || 'Manager');
      }
    }
    fetchRoleName();
  }, [user.role_id, user.role]);

  const isAdmin = user?.role_id && (user?.is_admin === true || user?.is_admin === 1);

  useEffect(() => {
    // Fetch expiry and low stock alerts (same logic as Reports page)
    async function fetchAlerts() {
      setLoadingNotif(true);
      try {
        const branchId = localStorage.getItem('reports_branch_id') || '1';
        const expiryDaysThreshold = Number(localStorage.getItem('expiry_days_threshold') || 90);
        const lowStockThreshold = Number(localStorage.getItem('low_stock_threshold') || 10);

        const grnRes = await axios.get(`${API_URL}/grn`, { params: { branch_id: branchId } });
        const medsRes = await axios.get(`${API_URL}/medicines`, { params: { branch_id: branchId } });
        const purchasedRes = await axios.get(`${API_URL}/grn/purchased-quantities`, { params: { branch_id: branchId } });
        const soldRes = await axios.get(`${API_URL}/sales-details/sold-quantities`, { params: { branch_id: branchId } });

        // --- Expiry Alerts ---
        const grnBatches = Array.isArray(grnRes.data.data) ? grnRes.data.data : [];
        const grnItems = grnBatches.flatMap(batch => batch.items || []);
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
          .filter(item => item.daysToExpiry <= expiryDaysThreshold && item.daysToExpiry >= 0)
          .sort((a, b) => a.daysToExpiry - b.daysToExpiry)
          .slice(0, 10);

        setExpiryAlerts(expirySoonGrn);

        // --- Low Stock Alerts ---
        const medicines = Array.isArray(medsRes.data.data) ? medsRes.data.data : [];
        const purchasedQuantities = {};
        (purchasedRes.data?.data || []).forEach(row => {
          purchasedQuantities[row.medicine_id] = Number(row.total_purchased) || 0;
        });
        const soldQuantities = {};
        (soldRes.data?.data || []).forEach(row => {
          soldQuantities[row.name] = Number(row.total_sold) || 0;
        });

        function getReorderLevel(m) {
          const keys = ['reorder_level', 'reorder', 'min_stock', 'minQty'];
          for (const k of keys) {
            if (m[k] !== undefined && m[k] !== null && m[k] !== '') {
              return Number(m[k]) || 0;
            }
          }
          return 10;
        }

        const medAggregates = (medicines || []).map(m => {
          const purchased = purchasedQuantities[m.id] ?? 0;
          const totalSold = soldQuantities[m.name] ?? 0;
          const available = Math.max(0, purchased - totalSold);
          return {
            id: m.id,
            name: m.name,
            category: m.category || 'Uncategorized',
            available,
            reorderLevel: getReorderLevel(m)
          };
        });

        const lowStockUpdated = medAggregates
          .filter(ma => ma.available <= lowStockThreshold)
          .sort((a, b) => a.available - b.available)
          .slice(0, 10);

        setLowStockAlerts(lowStockUpdated);
      } catch (err) {
        setExpiryAlerts([]);
        setLowStockAlerts([]);
      } finally {
        setLoadingNotif(false);
      }
    }
    if (showNotif) fetchAlerts();
  }, [showNotif]);

  // Close notification dropdown when navigating
  useEffect(() => {
    setShowNotif(false);
  }, [location.pathname]);

  // const isReportsPage = location.pathname.startsWith('/dashboard/reports');

  // Get expiryDaysThreshold for heading (always up-to-date)
  const expiryDaysThreshold = Number(localStorage.getItem('expiry_days_threshold') || 90);
  const lowStockThreshold = Number(localStorage.getItem('low_stock_threshold') || 10);

  return (
    <header className="sticky top-0 z-30 w-full bg-gradient-to-br from-navy via-blue-600/80 to-blue-500/50 
      backdrop-blur-2xl shadow-[0_4px_20px_rgba(0,0,0,0.15),0_2px_8px_rgba(0,0,0,0.1),inset_0_0_0.5px_rgba(255,255,255,0.2)] 
      border-b border-gray-200/30">

      <div className="max-w-screen-2xl mx-auto px-6 py-2.5 flex items-center justify-between">
        {/* Logo + Page Heading */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <Logo size="header" />
          </div>
          <div className="h-5 w-px bg-gray-300/40"></div>
          <h1 className="text-xl font-extrabold bg-gradient-to-r from-[#0b27b1] via-cyan-500 to-blue-400 
            bg-clip-text text-transparent tracking-tight drop-shadow-[0_1px_1px_rgba(4,146,194,0.25)]">
            {getPageName()}
          </h1>
          {/* Show current branch for admin */}
          {isAdmin && selectedBranch?.name && (
            <span className="ml-4 text-xs font-semibold text-[#0492c2] bg-blue-50 px-2 py-1 rounded">
              You are in "{selectedBranch.name}" branch now.
            </span>
          )}
        </div>

        {/* Center Clock */}
        <div className="hidden md:flex items-center justify-center">
          <div className="px-4 py-1.5 bg-white/50 backdrop-blur-sm rounded-lg border border-white/40 shadow-sm">
            <span className="text-sm font-bold text-[#0b27b1] tabular-nums">
              {currentTime.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
              <span className="mx-2 text-cyan-500">|</span>
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-5">

          {/* Notification Button - 3D / Embossed */}
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
              className="relative p-2 rounded-xl bg-gradient-to-br from-white via-blue-600/10 to-blue-600/20 
                shadow-[inset_2px_2px_4px_rgba(255,255,255,0.5),inset_-2px_-2px_4px_rgba(4,146,194,0.2)] 
                border border-white/30 text-blue-600/90 hover:shadow-[0_4px_10px_rgba(4,146,194,0.3)] 
                transition-all duration-300 active:translate-y-px"
              onClick={() => setShowNotif(v => !v)}
            >
              <BellIcon className="h-5 w-5 text-[#0b27b1]" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-cyan-400 shadow-md animate-pulse"></span>
            </button>
            {/* Notification Dropdown/Modal */}
            {showNotif && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  minWidth: 340,
                  maxHeight: 420, // Set max height for scroll
                  overflowY: 'auto', // Enable vertical scroll
                  background: '#fff',
                  border: '1px solid #e0e4ed',
                  borderRadius: 12,
                  boxShadow: '0 6px 24px rgba(4,146,194,0.10), 0 1.5px 4px rgba(4,146,194,0.06)',
                  zIndex: 9999,
                  padding: '18px 16px 16px 16px',
                  marginTop: 10
                }}
              >
                <div style={{ fontWeight: 700, color: '#0b27b1', marginBottom: 12, fontSize: 18 }}>Notifications</div>
                {loadingNotif ? (
                  <div style={{ color: '#0492c2', fontWeight: 500 }}>Loading...</div>
                ) : (
                  <>
                    {/* Expiry Alerts */}
                    <div style={{ marginBottom: 18 }}>
                      <div style={{ fontWeight: 600, color: '#0492C2', marginBottom: 8, fontSize: 15 }}>
                        <span>
                          <WarningAmber sx={{ fontSize: 18, verticalAlign: 'middle', color: '#0492C2', mr: 1 }} />
                          Expiring Medicines (next {expiryDaysThreshold} days)
                        </span>
                      </div>
                      {expiryAlerts.length === 0 ? (
                        <div style={{ color: '#aaa', fontSize: 13, marginBottom: 8 }}>No expiring medicines soon.</div>
                      ) : (
                        expiryAlerts.map(item => (
                          <div
                            key={item.id || item.medicine_id || item.medicine_name}
                            style={{
                              background: '#e4f4fa',
                              border: '1px solid #0492C2',
                              borderRadius: 8,
                              padding: '12px 14px',
                              marginBottom: 10,
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 10
                            }}
                          >
                            <WarningAmber sx={{ color: '#0492C2', fontSize: 22, mt: 0.3 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, color: '#0492C2', fontSize: 16, marginBottom: 4 }}>
                                {item.medicine_name}
                              </div>
                              <div style={{ fontSize: 14, color: '#03648a', lineHeight: 1.5 }}>
                                <span style={{ fontWeight: 600 }}>Expires in: </span>
                                <span style={{
                                  color: '#0492C2',
                                  fontWeight: 700,
                                  fontSize: 15
                                }}>
                                  {item.daysToExpiry} days
                                </span>
                                <br />
                                <span style={{ fontWeight: 600 }}>Date: </span>
                                <span style={{ color: '#03648a' }}>
                                  {item.expiryDate ? item.expiryDate.toISOString().slice(0, 10) : '-'}
                                </span>
                                <br />
                                <span style={{ fontWeight: 600 }}>Quantity: </span>
                                <span style={{ color: '#0492C2', fontWeight: 600 }}>{item.quantity}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Low Stock Alerts */}
                    <div>
                      <div style={{ fontWeight: 600, color: '#0492C2', marginBottom: 8, fontSize: 15 }}>
                        <Inventory2 sx={{ fontSize: 18, verticalAlign: 'middle', color: '#0492C2', mr: 1 }} />
                        Low Stock Medicines (less than {lowStockThreshold} units)
                      </div>
                      {lowStockAlerts.length === 0 ? (
                        <div style={{ color: '#aaa', fontSize: 13, marginBottom: 8 }}>No low stock medicines.</div>
                      ) : (
                        lowStockAlerts.map(m => (
                          <div
                            key={m.id || m.name}
                            style={{
                              background: '#e4f4fa',
                              border: '1px solid #0492C2',
                              borderRadius: 8,
                              padding: '12px 14px',
                              marginBottom: 10,
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 10
                            }}
                          >
                            <Inventory2 sx={{ color: '#0492C2', fontSize: 22, mt: 0.3 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, color: '#0492C2', fontSize: 16, marginBottom: 4 }}>
                                {m.name}
                              </div>
                              <div style={{ fontSize: 14, color: '#03648a', lineHeight: 1.5 }}>
                                <span style={{ fontWeight: 600 }}>Available: </span>
                                <span style={{ color: '#0492C2', fontWeight: 700, fontSize: 15 }}>{m.available}</span>
                                <br />
                                <span style={{ fontWeight: 600 }}>Reorder Level: </span>
                                <span style={{ color: '#0492C2', fontWeight: 600 }}>{m.reorderLevel}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Profile Button - 3D / Embossed */}
          <div
            ref={dropdownRef}
            className="flex items-center gap-3 px-3 py-1.5 bg-gradient-to-br from-white via-blue-600/10 to-blue-600/20 
            rounded-full shadow-[inset_2px_2px_4px_rgba(255,255,255,0.6),inset_-2px_-2px_4px_rgba(4,146,194,0.2)] 
            border border-white/30 backdrop-blur-md cursor-pointer hover:shadow-md transition duration-300 group active:translate-y-[1px]"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-[#0b27b1] via-cyan-500 to-blue-400 text-white text-xs font-bold flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]">
              {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
            </div>

            <div className="flex flex-col leading-tight">
              <div className="flex items-center text-sm font-medium text-[#0b27b1]">
                {roleName}
                <ChevronDownIcon className="ml-1 h-4 w-4 text-blue-600/60 group-hover:text-blue-600/90 transition" />
              </div>
              <span className="text-[11px] text-[#0b27b1]">{user.username || ''}</span>
            </div>

            {/* Dropdown menu */}
            {showDropdown && (
              <div className="absolute right-0 top-12 mt-1 w-48 bg-white/95 rounded-xl shadow-lg py-1 z-50 backdrop-blur-lg border border-gray-100/50 overflow-hidden">
                <a
                  href="/dashboard/settings"
                  className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50/80 transition-colors"
                  onClick={(e) => {
                    setShowDropdown(false);
                  }}
                >
                  Your Profile
                </a>
                <a
                  href="/dashboard/settings"
                  className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50/80 transition-colors"
                  onClick={(e) => {
                    setShowDropdown(false);
                  }}
                >
                  Settings
                </a>
                <div className="border-t border-gray-100 my-1"></div>
                <a
                  href="#"
                  className="block px-4 py-2.5 text-sm text-red-600 hover:bg-red-50/80 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowDropdown(false);
                    // Handle sign out here
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                  }}
                >
                  Sign out
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
