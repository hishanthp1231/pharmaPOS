import {
  BsBoxSeamFill, BsStack, BsGearFill,
  BsPeopleFill, BsFillPieChartFill, BsArrowRightSquareFill,
  BsClipboard2CheckFill, BsListTask, BsBarChartFill, BsCapsule
} from 'react-icons/bs';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import api from '../utils/axios';

// All possible navigation items
const allNavigation = [
  { name: 'Dashboard', icon: BsBarChartFill, path: '/dashboard' },
  { name: 'Home', icon: BsCapsule, path: '/dashboard/home' },
  { name: 'Inventory', icon: BsBoxSeamFill, path: '/dashboard/inventory' },

  { name: 'Suppliers', icon: BsClipboard2CheckFill, path: '/dashboard/suppliers' },
  { name: 'Customers', icon: BsPeopleFill, path: '/dashboard/customers' },
  { name: 'Expenses', icon: BsStack, path: '/dashboard/expenses' },
  { name: 'Reports', icon: BsFillPieChartFill, path: '/dashboard/reports' },
  { name: 'Settings', icon: BsGearFill, path: '/dashboard/settings' },
  // Oversight removed from sidebar
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState(null);
  const sidebarRef = useRef(null);

  // Get logged-in user from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [rolePages, setRolePages] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Define static permissions based on Enum roles
  const rolePermissions = {
    super_admin: {
      isAdmin: true,
      pages: ['All']
    },
    branch_admin: {
      isAdmin: false,
      pages: ['Dashboard', 'Home', 'Inventory', 'Suppliers', 'Customers', 'Expenses', 'Reports', 'Settings', 'Add Sales']
    },
    branch_user: {
      isAdmin: false,
      pages: ['Dashboard', 'Home', 'Sales', 'Customers', 'Inventory'] // Restricted access
    }
  };

  const normalizePages = (pages) => {
    const list = Array.isArray(pages) ? pages : [];
    const mapped = list.map((p) => (p === 'Sales' ? 'Add Sales' : p));
    return Array.from(new Set(mapped));
  };

  useEffect(() => {
    let cancelled = false;
    const loadPermissions = async () => {
      if (!user.role && !user.role_id) {
        setRolePages([]);
        setIsAdmin(false);
        return;
      }

      const permission = rolePermissions[user.role];
      if (permission) {
        if (cancelled) return;
        setIsAdmin(permission.isAdmin);
        if (permission.pages[0] === 'All') {
          setRolePages(allNavigation.map(n => n.name));
        } else {
          setRolePages(permission.pages);
        }
        console.log('[SIDEBAR] Permissions set for:', user.role);
        return;
      }

      if (user.role_id) {
        try {
          const res = await api.get(`/user-management/roles/${user.role_id}`);
          const role = res.data?.data;
          const pagesRaw = Array.isArray(role?.pages) ? role.pages : JSON.parse(role?.pages || '[]');
          const pages = normalizePages(pagesRaw);
          if (cancelled) return;
          if (role?.is_admin === 1 || role?.is_admin === true) {
            setIsAdmin(true);
            setRolePages(allNavigation.map(n => n.name));
          } else {
            setIsAdmin(false);
            setRolePages(pages);
          }
          console.log('[SIDEBAR] Permissions set for role_id:', user.role_id);
          return;
        } catch {
          if (cancelled) return;
        }
      }

      // Fallback or unknown role
      setRolePages([]);
      setIsAdmin(false);
    };
    loadPermissions();
    return () => { cancelled = true; };
  }, [user.role, user.role_id]);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes silver-blink {
        0% { opacity: 0.9; background-position: 0% 0%; filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.7)) brightness(1); }
        25% { opacity: 1; background-position: 50% 50%; filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.9)) brightness(1.1); }
        50% { opacity: 0.95; background-position: 100% 100%; filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.8)) brightness(1.05); }
        75% { opacity: 1; background-position: 50% 50%; filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.9)) brightness(1.1); }
        100% { opacity: 0.9; background-position: 0% 0%; filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.7)) brightness(1); }
      }

      .glass-silver-border {
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(14px) saturate(180%);
        -webkit-backdrop-filter: blur(14px) saturate(180%);
        border-radius: 0.75rem;
        position: relative;
        border: none;
        overflow: hidden;
        box-shadow: 
          inset 1px 1px 2px rgba(255, 255, 255, 0.2),
          inset -1px -1px 2px rgba(0, 0, 0, 0.1),
          0 4px 8px rgba(0, 0, 0, 0.05);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        padding: 0.25rem; /* Reduced inner padding */
      }
      
      .glass-silver-border:hover {
        transform: translate3d(0, -2px, 10px) scale(1.02);
        box-shadow: 
          inset 2px 2px 4px rgba(255, 255, 255, 0.25),
          inset -2px -2px 4px rgba(0, 0, 0, 0.15),
          0 8px 16px rgba(0, 0, 0, 0.1);
        z-index: 10;
      }
      
      .glass-silver-border::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 0.7rem;
        padding: 5px; /* Increased border width */
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.9) 0%,
          rgba(230, 230, 230, 0.95) 15%,
          rgba(192, 192, 192, 0.95) 30%,
          rgba(150, 150, 150, 0.95) 50%,
          rgba(192, 192, 192, 0.95) 70%,
          rgba(230, 230, 230, 0.95) 85%,
          rgba(255, 255, 255, 0.9) 100%
        );
        -webkit-mask: 
          linear-gradient(#fff 0 0) content-box, 
          linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        animation: silver-blink 4s ease-in-out infinite;
      }
      
      .active-nav-item {
        background: linear-gradient(135deg, #7ed8fa 0%, #94aefe 100%);
        color: white;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      }
      
      .active-nav-item .text-gray-700 {
        color: white;
      }
      
      .active-nav-item .text-gray-500 {
        color: white;
      }

      .no-scrollbar::-webkit-scrollbar {
        display: none;
      }
      
      .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Filter navigation items based on role
  const navigation = isAdmin
    ? allNavigation
    : allNavigation.filter(item => rolePages.includes(item.name));

  // If not admin, redirect to first allowed page if not already on one
  useEffect(() => {
    if (!isAdmin && navigation.length > 0) {
      const allowedPaths = navigation.map(item => item.path);
      if (!allowedPaths.includes(location.pathname)) {
        navigate(navigation[0].path, { replace: true });
      }
    }
    // eslint-disable-next-line
  }, [isAdmin, rolePages, location.pathname]);

  return (
    <div
      ref={sidebarRef}
      className="w-20 h-full flex flex-col bg-white/80 backdrop-blur-lg border-r border-gray-200/50 shadow-[2px_0_8px_rgba(0,0,0,0.1),4px_0_16px_rgba(0,0,0,0.08)] overflow-hidden"
      style={{ height: 'calc(100vh - 4rem)' }} // Account for header height
    >
      {/* Navigation Items - with proper spacing from top */}
      <div className="flex-1 flex flex-col space-y-1 overflow-y-auto no-scrollbar pt-6 px-1.5 pb-3">
        {navigation.map((item) => {
          const isDashboard = item.path === '/dashboard';
          const isActive = isDashboard
            ? (location.pathname === '/' || location.pathname === '/dashboard')
            : location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative group flex flex-col items-center justify-center p-1 aspect-square w-full rounded-xl transition-all duration-300 overflow-hidden ${isActive
                ? 'bg-gradient-to-b from-[#0492c2] to-[#0b27b1] text-white shadow-[inset_0_6px_10px_rgba(0,0,0,0.7),0_0_12px_rgba(255,255,255,0.3)]'
                : 'bg-white/80 text-gray-700 hover:text-[#0b27b1] shadow-[inset_0_0_6px_rgba(0,0,0,0.15),inset_0_0_4px_rgba(255,255,255,0.6)] hover:shadow-[inset_0_0_8px_rgba(0,0,0,0.2),inset_0_0_6px_rgba(255,255,255,0.7)]'
                }`}
              title={item.name}
            >
              <item.icon
                className={`w-6 h-6 mb-1 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'
                  }`}
                aria-hidden="true"
              />
              <span className="text-[10px] font-bold text-center leading-tight tracking-tight">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Footer - stays at bottom */}
      <div className="px-1.5 pb-3 border-t border-gray-200/50">
        <button
          onClick={(e) => {
            e.stopPropagation();
            localStorage.removeItem('user');
            navigate('/');
          }}
          className="w-full flex flex-col items-center justify-center p-1.5 aspect-square rounded-xl transition-all duration-300 overflow-hidden bg-white/80 text-gray-700 hover:text-[#0b27b1] shadow-[inset_0_0_6px_rgba(0,0,0,0.15),inset_0_0_4px_rgba(255,255,255,0.6)] hover:shadow-[inset_0_0_8px_rgba(0,0,0,0.2),inset_0_0_6px_rgba(255,255,255,0.7)] mt-2"
          title="Logout"
        >
          <BsArrowRightSquareFill className="w-6 h-6 mb-1 text-gray-500 group-hover:text-[#0b27b1]" />
          <span className="text-[10px] font-bold leading-tight tracking-tight">Logout</span>
        </button>
      </div>
    </div>
  );
}
