import { useState, useEffect } from 'react';
import axios from 'axios';
import { useBranch } from '../context/BranchContext';

export default function BillSettings() {
  const { selectedBranch } = useBranch();
  const [settings, setSettings] = useState({
    defaultPaymentMethod: 'Cash',
    defaultDiscountType: 'percentage',
    defaultDiscountValue: 0,
    taxPercentage: 18,
    receiptFooter: 'Thank you for your business!',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line
  }, [selectedBranch?.id]);

  const fetchSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/billing-settings', {
        params: { branch_id: selectedBranch?.id || 1 }
      });
      if (res.data) setSettings(res.data);
    } catch (err) {
      setError('Failed to load billing settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post('/api/billing-settings', { ...settings, branch_id: selectedBranch?.id || 1 });
      setSuccess('Settings saved successfully!');
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSave}>
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">{error}</div>}
      {success && <div className="bg-green-50 text-green-600 p-4 rounded-xl border border-green-200">{success}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-[#0b27b1] mb-2">
            Default Payment Method
          </label>
          <select
            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/20 focus:border-[#0b27b1] transition-all duration-200"
            name="defaultPaymentMethod"
            value={settings.defaultPaymentMethod}
            onChange={handleChange}
          >
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="QR">QR</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#0b27b1] mb-2">
            Default Discount Type
          </label>
          <select
            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/20 focus:border-[#0b27b1] transition-all duration-200"
            name="defaultDiscountType"
            value={settings.defaultDiscountType}
            onChange={handleChange}
          >
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed (LKR)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#0b27b1] mb-2">
            Default Discount Value
          </label>
          <input
            type="number"
            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/20 focus:border-[#0b27b1] transition-all duration-200"
            name="defaultDiscountValue"
            value={settings.defaultDiscountValue}
            onChange={handleChange}
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#0b27b1] mb-2">
            Tax Percentage (%)
          </label>
          <input
            type="number"
            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/20 focus:border-[#0b27b1] transition-all duration-200"
            name="taxPercentage"
            value={settings.taxPercentage}
            onChange={handleChange}
            min="0"
            max="100"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-[#0b27b1] mb-2">
            Receipt Footer Text
          </label>
          <textarea
            className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0b27b1]/20 focus:border-[#0b27b1] transition-all duration-200 min-h-[80px] resize-none"
            name="receiptFooter"
            value={settings.receiptFooter || ''}
            onChange={handleChange}
            placeholder="Enter receipt footer text"
            rows="3"
            maxLength="255"
          />
          <p className="mt-2 text-xs text-slate-500">
            {settings.receiptFooter?.length || 0}/255 characters
          </p>
        </div>
      </div>
      <div className="flex justify-end mt-6 pt-6 border-t border-slate-200">
        <button
          className="px-6 py-3 bg-gradient-to-r from-[#0b27b1] to-[#1e40af] text-white rounded-xl font-semibold shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-200/60 transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
