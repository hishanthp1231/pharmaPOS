import React, { useState, useEffect } from 'react';
import api from '../utils/axios';
import { toast } from 'react-toastify';
import { UserPlus, Users, Trash2 } from 'lucide-react';

export default function BranchUserManagement({ branchId, currentUserRole }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        name: '',
        contact: ''
    });

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/user-management/branch/${branchId}`);
            if (res.data.success) {
                setUsers(res.data.users);
            }
        } catch (err) {
            toast.error('Failed to fetch users');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (branchId) {
            fetchUsers();
        }
    }, [branchId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const endpoint = '/user-management/branch-user';
            // If we want to support creating admins here, we'd need logic. For now, just branch users.

            const res = await api.post(endpoint, {
                ...formData,
                branchId
            });

            if (res.data.success) {
                toast.success('User created successfully');
                setShowAddModal(false);
                setFormData({ username: '', email: '', password: '', name: '', contact: '' });
                fetchUsers();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create user');
        }
    };

    return (
        <div className="bg-transparent">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 p-6 pb-0">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                        <Users size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Staff Directory</h3>
                        <p className="text-sm text-gray-500 font-medium">Manage and monitor branch personnel</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 text-white px-6 py-3 rounded-2xl flex items-center gap-3 shadow-lg shadow-blue-100 hover:shadow-blue-200 transition-all active:scale-95"
                >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <UserPlus size={20} className="group-hover:-translate-y-0.5 transition-transform" />
                    <span className="font-bold text-sm tracking-wide">ADD PERSONNEL</span>
                </button>
            </div>

            <div className="overflow-hidden px-6 pb-6">
                <div className="overflow-x-auto rounded-[2rem] border border-gray-100/50 bg-white/40 backdrop-blur-md">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100/50">
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Full Name</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Identity</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Contact</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Designation</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/30">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center py-20 animate-pulse text-gray-400 font-bold uppercase tracking-widest">Loading Records...</td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan="5" className="text-center py-20 text-gray-400 font-medium italic">No personnel identified for this location</td></tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.id} className="group/row hover:bg-white/60 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="font-bold text-gray-900">{user.name}</div>
                                        </td>
                                        <td className="px-8 py-5 text-sm">
                                            <div className="text-gray-600 font-semibold">{user.username}</div>
                                            <div className="text-gray-400 text-xs">{user.email}</div>
                                        </td>
                                        <td className="px-8 py-5 text-sm text-gray-600 font-medium">
                                            {user.contact || 'N/A'}
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${user.role === 'branch_admin'
                                                ? 'bg-purple-100/50 text-purple-700 border-purple-200/50'
                                                : 'bg-emerald-100/50 text-emerald-700 border-emerald-200/50'
                                                }`}>
                                                {user.role?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-200"></div>
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Active</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showAddModal && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xl flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300">
                    <div className="bg-white/95 backdrop-blur-3xl rounded-[2.5rem] p-10 w-full max-w-xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] border border-white/80 transform transition-all animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-5 mb-8">
                            <div className="p-4 bg-blue-100 text-blue-600 rounded-3xl animate-pulse">
                                <UserPlus size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Enroll Personnel</h3>
                                <p className="text-sm text-gray-500 font-medium">Register a new user to the branch staff directory</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Full Name</label>
                                    <input
                                        type="text"
                                        placeholder="Jane Smith"
                                        className="w-full bg-gray-50/50 border border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none p-4 rounded-2xl transition-all font-medium"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Identity Tag</label>
                                    <input
                                        type="text"
                                        placeholder="jane_ops"
                                        className="w-full bg-gray-50/50 border border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none p-4 rounded-2xl transition-all font-medium"
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Secret Key</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full bg-gray-50/50 border border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none p-4 rounded-2xl transition-all font-mono tracking-widest"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Communication</label>
                                <div className="grid grid-cols-2 gap-6">
                                    <input
                                        type="email"
                                        placeholder="jane@branch.com"
                                        className="w-full bg-gray-50/50 border border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none p-4 rounded-2xl transition-all font-medium"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="+1 (555) STAFF"
                                        className="w-full bg-gray-50/50 border border-gray-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none p-4 rounded-2xl transition-all font-medium"
                                        value={formData.contact}
                                        onChange={e => setFormData({ ...formData, contact: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-4 text-gray-400 font-black uppercase tracking-widest hover:bg-gray-50 hover:text-gray-600 rounded-3xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black uppercase tracking-widest py-4 rounded-3xl shadow-xl shadow-blue-100 hover:shadow-blue-200 transition-all hover:scale-[1.02] active:scale-95"
                                >
                                    Activate Enrolment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
