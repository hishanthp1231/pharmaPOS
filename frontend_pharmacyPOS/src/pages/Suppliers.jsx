import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { Add } from '@mui/icons-material';
import { Search } from '@mui/icons-material';
import api from '../utils/axios';

import { MdVisibility, MdOutlineEdit, MdOutlineDelete } from 'react-icons/md';
import SuppliersList from '../components/SuppliersList';
import SupplierPurchaseHistory from '../components/SupplierPurchaseHistory';
import SupplierPayments from '../components/SupplierPayments';

export default function Suppliers() {
  const [activeTab, setActiveTab] = useState('suppliers');
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);

  const supplierTabs = [
    { id: 'suppliers', name: 'Suppliers' },
    { id: 'history', name: 'Purchase History' },
    { id: 'payments', name: 'Payments' },
  ];

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 min-h-screen">
      <div className="w-full max-w-7xl mx-auto pt-0 px-6 pb-6">
        {/* Modern Tabs Navigation */}
        <div className="mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 border border-slate-200/60 shadow-lg shadow-slate-200/20">
            <div className="flex justify-between items-center">
              <nav className="flex space-x-2">
                {supplierTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === tab.id
                        ? 'bg-gradient-to-r from-[#0b27b1] to-[#1e40af] text-white shadow-lg shadow-blue-200/50 transform scale-105'
                        : 'text-slate-600 hover:text-[#0b27b1] hover:bg-slate-50/80'
                      }`}
                  >
                    <span className="relative z-10">{tab.name}</span>
                    {activeTab === tab.id && (
                      <div className="absolute inset-0 bg-gradient-to-r from-[#0b27b1] to-[#1e40af] rounded-xl blur-sm opacity-30"></div>
                    )}
                  </button>
                ))}
              </nav>
              {/* Add Button aligned with navigation */}
              {activeTab === 'suppliers' && (
                <button
                  onClick={() => setShowAddEditModal(true)}
                  className="group relative px-6 py-3 bg-gradient-to-r from-[#0b27b1] to-[#1e40af] text-white rounded-xl font-semibold shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-200/60 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center"
                >
                  <span className="text-lg mr-2">+</span>
                  <span>Add Supplier</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#083093] to-[#0b27b1] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                </button>
              )}
              {activeTab === 'payments' && (
                <button
                  onClick={() => {
                    // Find the SupplierPayments component and trigger its add modal
                    // We'll use a custom event for simplicity
                    window.dispatchEvent(new CustomEvent('openAddSupplierPaymentModal'));
                  }}
                  className="group relative px-6 py-3 bg-gradient-to-r from-[#0b27b1] to-[#1e40af] text-white rounded-xl font-semibold shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-200/60 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center"
                >
                  <span className="text-lg mr-2">+</span>
                  <span>Add Payment</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#083093] to-[#0b27b1] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'suppliers' && (
            <SuppliersList
              showAddEditModal={showAddEditModal}
              setShowAddEditModal={setShowAddEditModal}
              editSupplier={editSupplier}
              setEditSupplier={setEditSupplier}
            />
          )}
          {activeTab === 'history' && <SupplierPurchaseHistory />}
          {activeTab === 'payments' && <SupplierPayments />}
        </div>
      </div>
    </div>
  );
}
