import React from 'react';
import { useBranch } from '../context/BranchContext';

export default function BranchSelector() {
  const { branches, selectedBranch, setSelectedBranch, loading, error } = useBranch();
  // Get logged-in user
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const normalizedRole = String(user?.role || '').toLowerCase().replace(/[\s-]+/g, '_');
  const isAdmin = normalizedRole === 'super_admin' || normalizedRole === 'superadmin' || user?.username === 'superadmin' || user?.is_admin === true || user?.is_admin === 1;

  if (loading) {
    return <div className="px-4 py-2">Loading branches...</div>;
  }

  if (error) {
    return (
      <div className="px-4 py-2 text-red-600">
        {error === 'Cannot connect to backend server. Please check if the backend is running at http://localhost:5000.'
          ? (
            <span>
              {error} <br />
              <span className="text-xs text-gray-500">Start your backend and reload this page.</span>
            </span>
          )
          : error}
      </div>
    );
  }

  if (!branches.length) {
    return <div className="px-4 py-2">No branches available</div>;
  }

  const handleBranchChange = (e) => {
    if (!isAdmin) return; // Non-admin users cannot change branch
    const branch = branches.find(b => String(b.id) === e.target.value);
    setSelectedBranch(branch);
    window.location.reload();
  };

  return (
    <div className="px-4 py-2">
      <label htmlFor="branch-select" className="block mb-2">
        Select Branch:
      </label>
      <select
        id="branch-select"
        value={selectedBranch ? selectedBranch.id : ''}
        onChange={handleBranchChange}
        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        disabled={loading || branches.length === 0 || !isAdmin}
      >
        <option value="">Select a branch</option>
        {branches.map((branch) => (
          <option 
            key={branch.id} 
            value={branch.id}
            disabled={!branch.active}
            className={!branch.active ? 'text-gray-400' : ''}
          >
            {branch.name} {!branch.active && '(Inactive)'}
          </option>
        ))}
      </select>
      {/* Show current branch for admin */}
      {isAdmin && selectedBranch?.name && (
        <div className="mt-2 text-xs text-[#0492c2] font-semibold">
          You are in "{selectedBranch.name}" branch now.
        </div>
      )}
    </div>
  );
}
