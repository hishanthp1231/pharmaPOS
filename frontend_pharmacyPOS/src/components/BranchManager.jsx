import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useBranch } from '../context/BranchContext';
import { XMarkIcon, PencilIcon, TrashIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { Visibility, Edit, Delete } from '@mui/icons-material';

export default function BranchManager() {
  console.log('BranchManager component mounted');
  const branchContext = useBranch();
  console.log('BranchManager context:', branchContext); // Add this line

  // Destructure as before
  const {
    branches,
    selectedBranch,
    branchId, // <--- use branchId from context
    loading,
    error,
    addBranch,
    updateBranch,
    deleteBranch,
    toggleBranchStatus,
    refreshBranches,
    setSelectedBranch
  } = branchContext;

  const [modal, setModal] = useState({ open: false, edit: null });
  const [form, setForm] = useState({
    name: '',
    code: '',
    address: '',
    tel: '',
    manager: '',
    active: true
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Open modal for adding a new branch
  const openAdd = () => {
    console.log('Add Branch button clicked');
    setForm({
      name: '',
      code: '',
      address: '',
      tel: '',
      manager: '',
      active: true
    });
    setFormError('');
    setModal({ open: true, edit: false });
  };

  // Open modal for editing a branch
  const openEdit = (branch) => {
    setForm({
      id: branch.id,
      name: branch.name || '',
      code: branch.code || '',
      address: branch.address || '',
      tel: branch.tel || '',
      manager: branch.manager || '',
      active: branch.active === 1 || branch.active === true || branch.active === "true"
    });
    setFormError('');
    setModal({ open: true, edit: true });
  };

  // Close modal
  const closeModal = () => {
    if (isSubmitting) return; // Prevent closing while submitting
    setModal({ open: false, edit: false });
    setFormError('');
  };

  // Handle form input changes with validation
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    // Clear any previous error for this field
    if (formError) {
      setFormError('');
    }

    setForm(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  // Validate form fields
  const validateForm = () => {
    if (!form.name || form.name.trim() === '') {
      setFormError('Branch name is required');
      return false;
    }
    if (!form.code || form.code.trim() === '') {
      setFormError('Branch code is required');
      return false;
    }
    if (!form.address || form.address.trim() === '') {
      setFormError('Branch address is required');
      return false;
    }
    if (!form.tel || form.tel.trim() === '') {
      setFormError('Branch telephone is required');
      return false;
    }
    if (!form.manager || form.manager.trim() === '') {
      setFormError('Branch manager is required');
      return false;
    }
    if (form.code && !/^[A-Z0-9-]+$/.test(form.code)) {
      setFormError('Branch code can only contain letters, numbers, and hyphens');
      return false;
    }
    if (form.tel && !/^[0-9+\-\s()]+$/.test(form.tel)) {
      setFormError('Please enter a valid phone number');
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('BranchManager handleSubmit called');

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      // Prepare branch data
      const branchData = {
        name: form.name.trim(),
        code: form.code.trim(),
        address: form.address.trim(),
        tel: form.tel.trim(),
        manager: form.manager.trim(),
        active: form.active ? "true" : "false"
      };

      // Call the appropriate API function
      const result = modal.edit
        ? await updateBranch(form.id, branchData)
        : await addBranch(branchData);

      if (!result.success) {
        setFormError(result.error || `Failed to ${modal.edit ? 'update' : 'add'} branch`);
        return;
      }

      // Close modal and refresh branches list
      closeModal();
      await refreshBranches();

      // Show success message
      toast.success(`Branch ${modal.edit ? 'updated' : 'added'} successfully`);

    } catch (err) {
      // Always log the error for debugging
      console.error('Error submitting branch form:', err);

      // Handle specific error cases
      let errorMessage = `Failed to ${modal.edit ? 'update' : 'add'} branch. Please try again.`;

      if (err.response) {
        // Prefer 'error' property if present, else 'message'
        errorMessage = err.response.data?.error || err.response.data?.message || errorMessage;
        if (err.response.status === 400) {
          errorMessage = errorMessage || 'Invalid data. Please check your input.';
        } else if (err.response.status === 401) {
          errorMessage = 'Session expired. Please log in again.';
        } else if (err.response.status === 403) {
          errorMessage = 'You do not have permission to perform this action.';
        } else if (err.response.status === 409) {
          errorMessage = 'A branch with this name or code already exists.';
        }
      } else if (err.request) {
        errorMessage = 'Unable to connect to the server. Please check your connection.';
      }

      setFormError(errorMessage);
      // Also show error in a toast for visibility
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete branch
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this branch? This action cannot be undone.')) {
      return;
    }

    const result = await deleteBranch(id);
    if (!result.success) {
      setFormError(result.error || 'Failed to delete branch');
    } else {
      await refreshBranches();
    }
  };

  // Toggle branch status
  const handleToggle = async (branch) => {
    const result = await toggleBranchStatus(branch.id, branch.active);
    if (!result.success) {
      setFormError(result.error || 'Failed to update branch status');
    } else {
      await refreshBranches();
    }
  };

  // After branch operations, ensure selectedBranch is valid
  useEffect(() => {
    if (branches.length > 0 && branchId) {
      const branch = branches.find(b => String(b.id) === String(branchId));
      if (branch) setSelectedBranch(branch);
    }
  }, [branches, branchId, setSelectedBranch]);

  useEffect(() => {
    refreshBranches();
  }, []);

  // Add handlers for view, edit, delete
  const navigate = useNavigate();
  const handleViewBranch = (id) => {
    const branch = branches.find(b => b.id === id);
    if (branch) {
      setSelectedBranch(branch);
      localStorage.setItem('branch_id', branch.id);
      navigate('/dashboard');
    }
  };
  const handleEditBranch = (id) => {
    const branch = branches.find(b => b.id === id);
    if (branch) openEdit(branch);
  };
  const handleDeleteBranch = async (id) => {
    await handleDelete(id);
  };

  return (
    <div>
      {/* Show current branch info */}
      {selectedBranch && (
        <div className="mb-2 text-xs text-[#0b27b1] font-semibold">
          Current Branch: {selectedBranch.name} ({selectedBranch.code})
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#0492C2]">Branch Management</h2>
        <button
          className="bg-[#0492C2] hover:bg-[#0377A8] text-white font-medium py-2 px-4 rounded-md shadow-sm transition-colors duration-200 flex items-center"
          type="button"
          onClick={openAdd}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add New Branch
        </button>
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2z" clipRule="evenodd" />
            </svg>
            {error === 'Cannot connect to backend server. Please check if the backend is running at http://localhost:5000.'
              ? <span>
                {error} <br />
                <span className="text-xs text-gray-500">Start your backend and reload this page.</span>
              </span>
              : error}
          </div>
        </div>
      )}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#E6F4F9]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#0369A1] uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#0369A1] uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#0369A1] uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#0369A1] uppercase tracking-wider">Tel</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#0369A1] uppercase tracking-wider">Manager</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#0369A1] uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[#0369A1] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0492C2]"></div>
                      <span className="text-[#0369A1] font-medium">Loading branches...</span>
                    </div>
                  </td>
                </tr>
              ) : branches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <svg className="w-12 h-12 mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <p className="text-gray-600">No branches found</p>
                      <p className="text-sm text-gray-400 mt-1">Add a new branch to get started</p>
                    </div>
                  </td>
                </tr>
              ) : (
                branches.map((branch) => (
                  <tr key={branch.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{branch.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">{branch.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{branch.address}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{branch.tel}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{branch.manager || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${branch.active === 1 || branch.active === true || branch.active === "true"
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                            }`}
                        >
                          {branch.active === 1 || branch.active === true || branch.active === "true" ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          className="ml-2 text-xs text-[#0369A1] hover:text-[#024E7D] transition-colors"
                          type="button"
                          onClick={() => handleToggle(branch)}
                          title="Toggle status"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-center text-sm">
                      <div className="flex justify-center items-center space-x-1">
                        <button
                          onClick={() => handleViewBranch(branch.id)}
                          className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-[#f0f4ff] hover:text-[#0b27b1] transition-colors duration-200 shadow-sm"
                          title="View Branch"
                        >
                          <Visibility className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditBranch(branch.id)}
                          className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-[#f0f4ff] hover:text-[#0b27b1] transition-colors duration-200 shadow-sm"
                          title="Edit Branch"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBranch(branch.id)}
                          className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-red-50 hover:text-red-600 transition-colors duration-200 shadow-sm"
                          title="Delete Branch"
                        >
                          <Delete className="w-4 h-4" />
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
      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {modal.edit ? 'Edit Branch' : 'Add Branch'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Branch Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${formError && !form.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                  placeholder="Enter branch name"
                  required
                  autoComplete="off"
                  autoFocus
                />
                {formError && !form.name && (
                  <p className="mt-1 text-sm text-red-600">Branch name is required</p>
                )}
              </div>
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                  Branch Code
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${formError && form.code && !/^[A-Z0-9-]*$/.test(form.code)
                    ? 'border-red-300'
                    : 'border-gray-300'
                    }`}
                  placeholder="e.g., BR-001"
                  autoComplete="off"
                />
                {formError && form.code && !/^[A-Z0-9-]*$/.test(form.code) && (
                  <p className="mt-1 text-sm text-red-600">Only letters, numbers, and hyphens allowed</p>
                )}
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  rows={3}
                  value={form.address}
                  onChange={handleChange}
                  className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter branch address"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="tel" className="block text-sm font-medium text-gray-700 mb-1">
                    Telephone No.
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 flex items-center">
                      <label htmlFor="country" className="sr-only">Country</label>
                      <span className="h-full py-0 pl-3 pr-1 border-transparent bg-transparent text-gray-500 sm:text-sm flex items-center">
                        +91
                      </span>
                    </div>
                    <input
                      type="tel"
                      id="tel"
                      name="tel"
                      value={form.tel}
                      onChange={handleChange}
                      className={`block w-full rounded-md border-gray-300 pl-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${formError && form.tel && !/^[0-9\-\s()]*$/.test(form.tel)
                        ? 'border-red-300'
                        : 'border-gray-300'
                        }`}
                      placeholder="123-456-7890"
                      autoComplete="tel"
                    />
                  </div>
                  {formError && form.tel && !/^[0-9\-\s()]*$/.test(form.tel) && (
                    <p className="mt-1 text-sm text-red-600">Please enter a valid phone number</p>
                  )}
                </div>
                <div>
                  <label htmlFor="manager" className="block text-sm font-medium text-gray-700 mb-1">
                    Branch Manager
                  </label>
                  <input
                    type="text"
                    id="manager"
                    name="manager"
                    value={form.manager}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Manager's name"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="active"
                    name="active"
                    checked={form.active}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="active" className="ml-2 block text-sm font-medium text-gray-700">
                    Active Branch
                  </label>
                </div>
                <div className="text-sm text-gray-500">
                  {form.active ? 'This branch will be available for selection' : 'This branch will be hidden from selection'}
                </div>
              </div>
              {formError && (
                <div className="text-red-600 text-sm mt-2">{formError}</div>
              )}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    console.log('Cancel button clicked');
                    closeModal();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

