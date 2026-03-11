import React, { useState, useEffect } from 'react';
import { BsPrinter } from 'react-icons/bs';
import { MdVisibility } from 'react-icons/md';
import JsBarcode from 'jsbarcode';
import { Search } from '@mui/icons-material';
import { toApiUrl } from '../config/api';

// Helper: pad medicine id to 8 digits
const generateBarcodeNumber = (id) => String(id).padStart(8, '0');

const API_URL = toApiUrl('/medicines');

export default function MedicineBarcode() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      const meds = (data.data || []).map(med => ({
        ...med,
        barcodeNumber: generateBarcodeNumber(med.id),
        stock: med.stock ?? '-', // If you have stock info, use it
      }));
      setMedicines(meds);
    } catch (err) {
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  // Generate barcode image as dataURL
  const generateBarcode = (medicine) => {
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, medicine.barcodeNumber, {
      format: 'CODE128',
      displayValue: true,
      width: 2,
      height: 50,
      fontSize: 12,
      margin: 5
    });
    return canvas.toDataURL('image/png');
  };

  // Print barcode
  const handlePrint = (medicine) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    const barcodeData = generateBarcode(medicine);
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Barcode - ${medicine.name}</title>
        <style>
          @page { margin: 0.5cm; size: 3.5in 2in; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
          .barcode-container { width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; }
          .barcode-img { max-width: 100%; height: auto; margin: 0 auto; image-rendering: crisp-edges; }
          .item-details { text-align: center; width: 100%; font-size: 12px; }
          .item-name { font-weight: bold; margin-bottom: 2px; }
          .item-code { font-size: 11px; color: #666; margin-bottom: 2px; }
          .item-price { font-size: 14px; font-weight: bold; color: #d32f2f; margin-top: 3px; }
        </style>
      </head>
      <body>
        <div class="barcode-container">
          <img src="${barcodeData}" alt="Barcode" class="barcode-img"/>
          <div class="item-details">
            <div class="item-name">${medicine.name}</div>
            <div class="item-code">${medicine.genericName || ''}</div>
            ${medicine.defaultMRP ? `<div class="item-price">LKR ${Number(medicine.defaultMRP).toFixed(2)}</div>` : ''}
            <div class="barcode-number">${medicine.barcodeNumber}</div>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            }, 500);
          };
        </script>
      </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  // Preview barcode modal
  const handlePreview = (medicine) => {
    setSelectedMedicine(medicine);
    setShowPreview(true);
  };

  // Filtered medicines
  const filteredMedicines = medicines.filter(med =>
    !searchTerm ||
    (med.name && med.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (med.genericName && med.genericName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="flex justify-center p-4">Loading medicines...</div>;
  }

  return (
    <div className="space-y-4 p-4">
      {/* Barcodes Table */}
      <div className="bg-white rounded-lg shadow-sm border border-[#e0e4ed] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#e0e4ed]">
            <thead className="bg-[#f8f9fd]">
              <tr>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">SN</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Barcode</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Medicine Name</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Generic Name</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">MRP</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-[#5a6e9a] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#e0e4ed]">
              {filteredMedicines.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                      </svg>
                      <p className="text-sm font-medium text-gray-500">No medicines found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMedicines.map((medicine, idx) => (
                  <tr key={medicine.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-2 py-2 text-center text-sm text-gray-700">{idx + 1}</td>
                    <td className="px-2 py-2 text-center">
                      <div className="flex flex-col items-center">
                        <img src={generateBarcode(medicine)} alt="Barcode" className="h-8 w-auto" />
                        <span className="text-xs text-gray-500 mt-0.5">{medicine.barcodeNumber}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center text-sm font-medium text-gray-900">{medicine.name}</td>
                    <td className="px-2 py-2 text-center text-xs text-gray-500">{medicine.genericName || '-'}</td>
                    <td className="px-2 py-2 text-center text-xs text-[#0b27b1] font-semibold">
                      {medicine.defaultMRP ? `LKR ${Number(medicine.defaultMRP).toFixed(2)}` : '-'}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <div className="flex justify-center items-center space-x-1">
                        <button
                          onClick={() => handlePreview(medicine)}
                          className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-[#f0f4ff] hover:text-[#0b27b1] transition-colors duration-200 shadow-sm"
                          title="View Barcode"
                        >
                          <MdVisibility className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrint(medicine)}
                          className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-[#f0f4ff] hover:text-[#0b27b1] transition-colors duration-200 shadow-sm"
                          title="Print Barcode"
                        >
                          <BsPrinter className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Barcode Preview Modal */}
      {showPreview && selectedMedicine && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="sticky top-0 bg-white border-b border-[#e0e4ed] p-4 rounded-t-xl">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-[#03648a]">
                  {selectedMedicine.name} - Barcode
                </h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <Search className="h-4 w-4" style={{ color: '#0b27b1' }} />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex flex-col items-center">
                <img src={generateBarcode(selectedMedicine)} alt="Barcode Preview" className="mb-6 w-full max-w-xs" />
                <div className="text-center w-full">
                  <p className="font-medium text-[#2d3748] text-lg">{selectedMedicine.name}</p>
                  {selectedMedicine.genericName && (
                    <p className="text-sm text-[#5a6e9a] mt-1">{selectedMedicine.genericName}</p>
                  )}
                  {selectedMedicine.defaultMRP && (
                    <p className="text-lg font-bold text-[#0b27b1] mt-2">
                      LKR {Number(selectedMedicine.defaultMRP).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-8 flex justify-end space-x-3">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => handlePrint(selectedMedicine)}
                  className="px-6 py-2 bg-gradient-to-r from-[#0492C2] to-[#b6e0fe] text-white rounded-lg font-semibold shadow hover:from-[#037ba1] hover:to-[#b6e0fe] transition flex items-center gap-2"
                >
                  <BsPrinter className="w-4 h-4" />
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
