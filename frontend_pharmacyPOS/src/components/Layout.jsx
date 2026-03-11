import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import '../styles/layout.css';

export default function Layout() {
  const location = useLocation();
  const isHomePage = location.pathname === '/home' || location.pathname === '/';
  const isAuthPage = location.pathname === '/signin' || location.pathname === '/signup';

  return (
    <div className="h-screen overflow-hidden bg-gray-50">
      {!isAuthPage && (
        <>
          {/* Header - Full width, fixed at top */}
          <div className="fixed top-0 left-0 right-0 z-30">
            <Header />
          </div>

          <div className="flex h-full pt-16"> {/* pt-16 to account for fixed header height */}
            {/* Sidebar - Fixed on left side */}
            <div className="hidden lg:block w-20 h-full flex-shrink-0 bg-white border-r border-gray-200 fixed left-0 top-16 bottom-0 z-20">
              <Sidebar />
            </div>

            {/* Mobile sidebar */}
            <div className="lg:hidden fixed inset-y-0 left-0 z-40">
              <Sidebar />
            </div>

            {/* Main content area - takes remaining width with left margin for sidebar */}
            <div className="flex-1 lg:ml-20">
              {/* Main content - only this area is scrollable */}
              <main className="h-full overflow-y-auto bg-gray-50">
                <div className="page-container">
                  <Outlet />
                </div>
              </main>
            </div>
          </div>
        </>
      )}

      {isAuthPage && (
        <div className="h-full overflow-y-auto">
          <Outlet />
        </div>
      )}
    </div>
  );
}
