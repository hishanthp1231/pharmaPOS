import React, { useState, useEffect } from 'react';
import { MdVisibility, MdOutlineEdit, MdDelete } from 'react-icons/md';
import api from '../utils/axios';

// Updated available pages to match Sidebar
const availablePages = [
  'Dashboard', 'Home', 'Inventory', 'Suppliers', 'Customers', 'Expenses', 'Reports', 'Settings', 'Add Sales'
];

export default function UserManagement() {
  // Role form state
  const [roleForm, setRoleForm] = useState({
    name: '',
    can_view: false,
    can_edit: false,
    can_delete: false,
    pages: [],
    is_admin: false
  });

  // User form state
  const [userForm, setUserForm] = useState({
    branch_id: [],
    username: '',
    password: '',
    role_id: ''
  });

  // Fetched data
  const [branches, setBranches] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedRoleIsAdmin, setSelectedRoleIsAdmin] = useState(false);
  const [error, setError] = useState('');

  // Modal states
  const [showAddRole, setShowAddRole] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);

  // View/Edit/Delete modals for roles/users
  const [viewRole, setViewRole] = useState(null);
  const [editRole, setEditRole] = useState(null);
  const [deleteRoleId, setDeleteRoleId] = useState(null);

  const [viewUser, setViewUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [deleteUserId, setDeleteUserId] = useState(null);

  // Edit form states
  const [editRoleForm, setEditRoleForm] = useState({ name: '', can_view: false, can_edit: false, can_delete: false, pages: [], is_admin: false });
  const [editUserForm, setEditUserForm] = useState({ branch_id: [], username: '', password: '', role_id: '' });

  // Fetch branches and roles on mount
  useEffect(() => {
    api.get('/branches')
      .then(res => {
        const data = Array.isArray(res.data)
          ? res.data
          : (res.data.branches || res.data.data || []);
        setBranches(Array.isArray(data) ? data : []);
      })
      .catch(() => setError('Failed to fetch branches. Please check your backend.'));
    api.get('/user-management/roles')
      .then(res => {
        setRoles(res.data.data || []);
      })
      .catch(() => setError('Failed to fetch roles. Please check your backend.'));
  }, []);

  // Fetch users on mount
  const [users, setUsers] = useState([]);
  useEffect(() => {
    api.get('/user-management/users')
      .then(res => setUsers(res.data.data || []))
      .catch(() => setError('Failed to fetch users.'));
  }, []);

  // Handle role selection in user form
  useEffect(() => {
    if (userForm.role_id) {
      const role = roles.find(r => String(r.id) === String(userForm.role_id));
      setSelectedRoleIsAdmin(role?.is_admin === 1 || role?.is_admin === true);
    } else {
      setSelectedRoleIsAdmin(false);
    }
  }, [userForm.role_id, roles]);

  // Auto-select all permissions/pages if is_admin is checked
  useEffect(() => {
    if (roleForm.is_admin) {
      setRoleForm(prev => ({
        ...prev,
        can_view: true,
        can_edit: true,
        can_delete: true,
        pages: [...availablePages]
      }));
    }
  }, [roleForm.is_admin]);

  // Handle role form submit
  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/user-management/roles', {
        ...roleForm
      });
      setRoleForm({ name: '', can_view: false, can_edit: false, can_delete: false, pages: [], is_admin: false });
      alert('Role added!');
      // Refresh roles list
      api.get('/user-management/roles')
        .then(res => setRoles(res.data.data || []));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add role.');
    }
  };

  // Handle user form submit
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/user-management/users', {
        ...userForm,
        branch_id: selectedRoleIsAdmin ? null : (userForm.branch_id.length === 1 ? userForm.branch_id[0] : userForm.branch_id)
      });
      setUserForm({ branch_id: [], username: '', password: '', role_id: '' });
      alert('User added!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add user.');
    }
  };

  // Handle page selection for role
  const handlePageChange = (page) => {
    if (roleForm.is_admin) return; // Prevent manual change if admin
    setRoleForm((prev) => ({
      ...prev,
      pages: prev.pages.includes(page)
        ? prev.pages.filter(p => p !== page)
        : [...prev.pages, page]
    }));
  };

  // Handle branch selection for user
  const handleBranchChange = (branchId) => {
    setUserForm((prev) => ({
      ...prev,
      branch_id: prev.branch_id.includes(branchId)
        ? prev.branch_id.filter(id => id !== branchId)
        : [...prev.branch_id, branchId]
    }));
  };

  // Handle view/edit/delete for roles
  const handleViewRole = async (role) => {
    try {
      const res = await api.get(`/user-management/roles/${role.id}`);
      setViewRole(res.data.data || role);
    } catch {
      setViewRole(role);
    }
  };
  const handleEditRole = async (role) => {
    try {
      const res = await api.get(`/user-management/roles/${role.id}`);
      const r = res.data.data || role;
      setEditRole(r);
      setEditRoleForm({ ...r, pages: Array.isArray(r.pages) ? r.pages : JSON.parse(r.pages || '[]') });
    } catch {
      setEditRole(role);
      setEditRoleForm({ ...role, pages: Array.isArray(role.pages) ? role.pages : JSON.parse(role.pages || '[]') });
    }
  };
  const handleDeleteRole = async (id) => {
    setDeleteRoleId(id);
  };
  const confirmDeleteRole = async () => {
    try {
      await api.delete(`/user-management/roles/${deleteRoleId}`);
      setDeleteRoleId(null);
      api.get('/user-management/roles')
        .then(res => setRoles(res.data.data || []));
    } catch (err) {
      setError('Failed to delete role.');
      setDeleteRoleId(null);
    }
  };

  // Handle view/edit/delete for users
  const handleViewUser = async (user) => {
    try {
      const res = await api.get(`/user-management/users/${user.id}`);
      setViewUser(res.data.data || user);
    } catch {
      setViewUser(user);
    }
  };
  const handleEditUser = async (user) => {
    try {
      const res = await api.get(`/user-management/users/${user.id}`);
      const u = res.data.data || user;
      setEditUser(u);
      setEditUserForm({ ...u, branch_id: Array.isArray(u.branch_id) ? u.branch_id : [u.branch_id] });
    } catch {
      setEditUser(user);
      setEditUserForm({ ...user, branch_id: Array.isArray(user.branch_id) ? user.branch_id : [user.branch_id] });
    }
  };
  const handleDeleteUser = async (id) => {
    setDeleteUserId(id);
  };
  const confirmDeleteUser = async () => {
    try {
      await api.delete(`/user-management/users/${deleteUserId}`);
      setDeleteUserId(null);
      api.get('/user-management/users')
        .then(res => setUsers(res.data.data || []));
    } catch (err) {
      setError('Failed to delete user.');
      setDeleteUserId(null);
    }
  };

  // Submit edit role
  const handleEditRoleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/user-management/roles/${editRole.id}`, editRoleForm);
      setEditRole(null);
      api.get('/user-management/roles')
        .then(res => setRoles(res.data.data || []));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update role.');
    }
  };

  // Submit edit user
  const handleEditUserSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/user-management/users/${editUser.id}`, editUserForm);
      setEditUser(null);
      api.get('/user-management/users')
        .then(res => setUsers(res.data.data || []));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user.');
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">{error}</div>
      )}

      {/* Roles Table */}
      <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">Roles Management</h3>
          <button
            className="px-6 py-3 bg-gradient-to-r from-[#0b27b1] to-[#1e40af] text-white rounded-xl font-semibold shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-200/60 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center"
            onClick={() => setShowAddRole(true)}
          >
            <span className="text-lg mr-2">+</span>
            Add Role
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Permissions</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Pages</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Admin</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {roles.map(role => (
                <tr key={role.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-4 text-sm text-slate-700 font-medium">{role.name}</td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    <div className="flex flex-wrap gap-1">
                      {role.can_view && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs">View</span>}
                      {role.can_edit && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs">Edit</span>}
                      {role.can_delete && <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs">Delete</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">{Array.isArray(role.pages) ? role.pages.join(', ') : role.pages}</td>
                  <td className="px-4 py-4 text-sm">
                    {role.is_admin ?
                      <span className="px-2 py-1 bg-purple-100  text-blue-700 rounded-md text-xs font-medium">Yes</span> :
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">No</span>
                    }
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <button
                        onClick={() => handleViewRole(role)}
                        className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-[#f0f4ff] hover:text-[#0b27b1] transition-colors duration-200 shadow-sm"
                        title="View Role"
                      >
                        <MdVisibility className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditRole(role)}
                        className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-[#f0f4ff] hover:text-[#0b27b1] transition-colors duration-200 shadow-sm"
                        title="Edit Role"
                      >
                        <MdOutlineEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className="p-1.5 rounded-lg bg-white border border-[#e0e4ed] text-[#5a6e9a] hover:bg-red-50 hover:text-red-600 transition-colors duration-200 shadow-sm"
                        title="Delete Role"
                      >
                        <MdDelete className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800">Users Management</h3>
          <button
            className="px-6 py-3 bg-gradient-to-r from-[#0b27b1] to-[#1e40af] text-white rounded-xl font-semibold shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-200/60 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center"
            onClick={() => setShowAddUser(true)}
          >
            <span className="text-lg mr-2">+</span>
            Add User
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Username</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Role</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Branch(es)</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-4 text-sm text-slate-700 font-medium">{user.username}</td>
                  <td className="px-4 py-4 text-sm text-slate-600">{roles.find(r => r.id === user.role_id)?.name || user.role_id}</td>
                  <td className="px-4 py-4 text-sm text-slate-600">{Array.isArray(user.branch_id) ? user.branch_id.join(', ') : user.branch_id}</td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-[#0b27b1] hover:border-blue-200 transition-all duration-200 shadow-sm"
                        title="View User"
                      >
                        <MdVisibility className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-[#0b27b1] hover:border-blue-200 transition-all duration-200 shadow-sm"
                        title="Edit User"
                      >
                        <MdOutlineEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-200 shadow-sm"
                        title="Delete User"
                      >
                        <MdDelete className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Role Modal */}
      {showAddRole && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <form onSubmit={handleRoleSubmit} className="space-y-4">
              <h2 className="text-lg font-bold mb-2">Add Role</h2>
              <input
                type="text"
                placeholder="Role Name"
                value={roleForm.name}
                onChange={e => setRoleForm({ ...roleForm, name: e.target.value })}
                className="border p-2 w-full rounded"
                required
              />
              <div className="flex gap-4">
                <label>
                  <input
                    type="checkbox"
                    checked={roleForm.can_view}
                    onChange={e => setRoleForm({ ...roleForm, can_view: e.target.checked })}
                    disabled={roleForm.is_admin}
                  /> Can View
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={roleForm.can_edit}
                    onChange={e => setRoleForm({ ...roleForm, can_edit: e.target.checked })}
                    disabled={roleForm.is_admin}
                  /> Can Edit
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={roleForm.can_delete}
                    onChange={e => setRoleForm({ ...roleForm, can_delete: e.target.checked })}
                    disabled={roleForm.is_admin}
                  /> Can Delete
                </label>
              </div>
              <div>
                <div className="font-semibold mb-1">Select Pages:</div>
                <div className="flex flex-wrap gap-3">
                  {availablePages.map(page => (
                    <label key={page} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={roleForm.pages.includes(page)}
                        onChange={() => handlePageChange(page)}
                        disabled={roleForm.is_admin}
                      /> {page}
                    </label>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={roleForm.is_admin}
                  onChange={e => setRoleForm({ ...roleForm, is_admin: e.target.checked })}
                /> Is Admin
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold shadow hover:bg-gray-300 transition text-xs"
                  onClick={() => setShowAddRole(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition text-xs">
                  Add Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <form onSubmit={handleUserSubmit} className="space-y-4">
              <h2 className="text-lg font-bold mb-2">Add User</h2>
              <div>
                <div className="font-semibold mb-1">Select Role:</div>
                <select
                  value={userForm.role_id}
                  onChange={e => setUserForm({ ...userForm, role_id: e.target.value })}
                  className="border p-2 w-full rounded"
                  required
                >
                  <option value="">Select Role</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name} {role.is_admin ? '(Admin)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              {!selectedRoleIsAdmin && (
                <div>
                  <div className="font-semibold mb-1">Select Branch(es):</div>
                  <div className="flex flex-wrap gap-3">
                    {branches.map(branch => (
                      <label key={branch.id} className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={userForm.branch_id.includes(branch.id)}
                          onChange={() => handleBranchChange(branch.id)}
                        /> {branch.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <input
                type="text"
                placeholder="Username"
                value={userForm.username}
                onChange={e => setUserForm({ ...userForm, username: e.target.value })}
                className="border p-2 w-full rounded"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={userForm.password}
                onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                className="border p-2 w-full rounded"
                required
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold shadow hover:bg-gray-300 transition text-xs"
                  onClick={() => setShowAddUser(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition text-xs">
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Role Modal */}
      {viewRole && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Role Details</h3>
            <div className="space-y-2 text-sm">
              <div><strong>Name:</strong> {viewRole.name}</div>
              <div><strong>Permissions:</strong> {viewRole.can_view ? 'View ' : ''}{viewRole.can_edit ? 'Edit ' : ''}{viewRole.can_delete ? 'Delete' : ''}</div>
              <div><strong>Pages:</strong> {Array.isArray(viewRole.pages) ? viewRole.pages.join(', ') : viewRole.pages}</div>
              <div><strong>Admin:</strong> {viewRole.is_admin ? 'Yes' : 'No'}</div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold shadow hover:bg-gray-300 transition text-xs"
                onClick={() => setViewRole(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editRole && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <form onSubmit={handleEditRoleSubmit} className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Edit Role</h3>
              <input
                type="text"
                placeholder="Role Name"
                value={editRoleForm.name}
                onChange={e => setEditRoleForm({ ...editRoleForm, name: e.target.value })}
                className="border p-2 w-full rounded"
                required
              />
              <div className="flex gap-4">
                <label>
                  <input
                    type="checkbox"
                    checked={editRoleForm.can_view}
                    onChange={e => setEditRoleForm({ ...editRoleForm, can_view: e.target.checked })}
                    disabled={editRoleForm.is_admin}
                  /> Can View
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={editRoleForm.can_edit}
                    onChange={e => setEditRoleForm({ ...editRoleForm, can_edit: e.target.checked })}
                    disabled={editRoleForm.is_admin}
                  /> Can Edit
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={editRoleForm.can_delete}
                    onChange={e => setEditRoleForm({ ...editRoleForm, can_delete: e.target.checked })}
                    disabled={editRoleForm.is_admin}
                  /> Can Delete
                </label>
              </div>
              <div>
                <div className="font-semibold mb-1">Select Pages:</div>
                <div className="flex flex-wrap gap-3">
                  {availablePages.map(page => (
                    <label key={page} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={editRoleForm.pages.includes(page)}
                        onChange={() => {
                          setEditRoleForm(prev => ({
                            ...prev,
                            pages: prev.pages.includes(page)
                              ? prev.pages.filter(p => p !== page)
                              : [...prev.pages, page]
                          }));
                        }}
                        disabled={editRoleForm.is_admin}
                      /> {page}
                    </label>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editRoleForm.is_admin}
                  onChange={e => setEditRoleForm({ ...editRoleForm, is_admin: e.target.checked })}
                /> Is Admin
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold shadow hover:bg-gray-300 transition text-xs"
                  onClick={() => setEditRole(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition text-xs">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Role Modal */}
      {deleteRoleId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Delete Role</h3>
            <p className="mb-4">Are you sure you want to delete this role?</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold shadow hover:bg-gray-300 transition text-xs"
                onClick={() => setDeleteRoleId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold shadow hover:bg-red-700 transition text-xs"
                onClick={confirmDeleteRole}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {viewUser && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">User Details</h3>
            <div className="space-y-2 text-sm">
              <div><strong>Username:</strong> {viewUser.username}</div>
              <div><strong>Role:</strong> {roles.find(r => r.id === viewUser.role_id)?.name || viewUser.role_id}</div>
              <div><strong>Branch(es):</strong> {Array.isArray(viewUser.branch_id) ? viewUser.branch_id.join(', ') : viewUser.branch_id}</div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold shadow hover:bg-gray-300 transition text-xs"
                onClick={() => setViewUser(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <form onSubmit={handleEditUserSubmit} className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Edit User</h3>
              <div>
                <label className="block text-xs font-semibold mb-1">Username</label>
                <input
                  type="text"
                  name="username"
                  value={editUserForm.username}
                  onChange={e => setEditUserForm(f => ({ ...f, username: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Password (leave blank to keep unchanged)</label>
                <input
                  type="password"
                  name="password"
                  value={editUserForm.password || ''}
                  onChange={e => setEditUserForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Role</label>
                <select
                  name="role_id"
                  value={editUserForm.role_id}
                  onChange={e => setEditUserForm(f => ({ ...f, role_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  required
                >
                  <option value="">Select Role</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name} {role.is_admin ? '(Admin)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Branch(es)</label>
                <div className="flex flex-wrap gap-2">
                  {branches.map(branch => (
                    <label key={branch.id} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={editUserForm.branch_id.includes(branch.id)}
                        onChange={() => {
                          setEditUserForm(prev => ({
                            ...prev,
                            branch_id: prev.branch_id.includes(branch.id)
                              ? prev.branch_id.filter(id => id !== branch.id)
                              : [...prev.branch_id, branch.id]
                          }));
                        }}
                      /> {branch.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold shadow hover:bg-gray-300 transition text-xs"
                  onClick={() => setEditUser(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition text-xs">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deleteUserId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Delete User</h3>
            <p className="text-sm mb-4">Are you sure you want to delete this user? This action cannot be undone.</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold shadow hover:bg-gray-300 transition text-xs"
                onClick={() => setDeleteUserId(null)}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold shadow hover:bg-red-700 transition text-xs"
                onClick={confirmDeleteUser}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
