import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SalesDetails from '../components/SalesDetails';

export default function Sales() {
  // Create a ref to call setShowAddForm in SalesDetails
  const salesDetailsRef = useRef();
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-[95%] mx-auto p-4">
      {/* Back Button */}
      <button
        className="mb-4 px-5 py-2 bg-white/80 border border-slate-200 rounded-xl shadow hover:bg-slate-100 text-[#0b27b1] font-semibold transition-all duration-200"
        onClick={() => navigate('/dashboard/home')}
      >
        ← Back
      </button>
      <div className="flex items-center justify-between mb-6 px-1">
        <h2 className="text-xl font-semibold text-[#0b27b1]">
          Pharmacy Sales Details
        </h2>
        <button
          onClick={() => {
            if (salesDetailsRef.current && salesDetailsRef.current.openAddForm) {
              salesDetailsRef.current.openAddForm();
            }
          }}
          className="px-4 py-2 bg-[#0b27b1] text-white rounded-lg shadow hover:bg-[#107cd1] transition font-medium"
        >
          + Add Sales
        </button>
      </div>
      <div>
        <SalesDetails ref={salesDetailsRef} />
      </div>
    </div>
  );
}
