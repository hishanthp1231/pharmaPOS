import { useState } from 'react';
import MedicineMaster from '../components/MedicineMaster';
import Purchases from '../components/Purchases';
import ExpiryTracking from '../components/ExpiryTracking';
import MedicineBarcode from '../components/MedicineBarcode'; // import the barcode component

const inventoryTabs = [
  { id: 'medicineMaster', name: 'Medicine Master' },
  { id: 'purchases', name: 'Purchases' },
  { id: 'expiryTracking', name: 'Expiry Tracking' },
  { id: 'barcodes', name: 'Barcodes' }, // add barcode tab
];

export default function Inventory() {
  const [activeTab, setActiveTab] = useState('medicineMaster');
  const [showMedicineForm, setShowMedicineForm] = useState(false);
  const [showPurchasesModal, setShowPurchasesModal] = useState(false);

  // Handler to open medicine form (pass down to MedicineMaster)
  const handleAddMedicine = () => setShowMedicineForm(true);

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      <div className="w-full max-w-16xl mx-auto pt-0 px-6 pb-6">
        {/* Modern Tabs Navigation */}
        <div className="mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 border border-slate-200/60 shadow-lg shadow-slate-200/20">
            <div className="flex justify-between items-center">
              <nav className="flex space-x-2">
                {inventoryTabs.map((tab) => (
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
              {activeTab === 'medicineMaster' && (
                <button
                  onClick={() => setShowMedicineForm(true)}
                  className="group relative px-6 py-3 bg-gradient-to-r from-[#0b27b1] to-[#1e40af] text-white rounded-xl font-semibold shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-200/60 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center"
                >
                  <span className="text-lg mr-2">+</span>
                  <span>Add Medicine</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#083093] to-[#0b27b1] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                </button>
              )}
              {activeTab === 'purchases' && (
                <button
                  onClick={() => setShowPurchasesModal(true)}
                  className="group relative px-6 py-3 bg-gradient-to-r from-[#0b27b1] to-[#1e40af] text-white rounded-xl font-semibold shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-200/60 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center"
                >
                  <span className="text-lg mr-2">+</span>
                  <span>Add GRN</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#083093] to-[#0b27b1] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'medicineMaster' && (
            <MedicineMaster
              showFilter
              showForm={showMedicineForm}
              setShowForm={setShowMedicineForm}
            />
          )}
          {activeTab === 'purchases' && (
            <Purchases
              showAddModal={showPurchasesModal}
              setShowAddModal={setShowPurchasesModal}
            />
          )}
          {activeTab === 'expiryTracking' && <ExpiryTracking />}
          {activeTab === 'barcodes' && <MedicineBarcode />}
        </div>
      </div>
    </div>
  );
}
