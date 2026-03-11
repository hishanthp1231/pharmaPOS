import React, { useState, useEffect } from 'react';
import BranchManager from '../components/BranchManager';
import api from '../utils/axios';
import { toast } from 'react-toastify';
import { UserPlus, Shield, Users } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const SuperAdminDashboard = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const normalizedRole = String(user?.role || '').toLowerCase().replace(/[\s-]+/g, '_');
    const isSuperAdmin = normalizedRole === 'super_admin' || normalizedRole === 'superadmin' || user?.username === 'superadmin' || user?.is_admin === true || user?.is_admin === 1;
    if (!isSuperAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    const [branches, setBranches] = useState([]);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [adminForm, setAdminForm] = useState({
        username: '', target_user_role: 'branch_admin', password: '', email: '', name: '', contact: '', branchId: ''
    });

    const fetchBranches = async () => {
        try {
            const res = await api.get('/branches');
            if (res.data.success) {
                setBranches(res.data.branches);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, []);

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        try {
            const resAdmin = await api.post('/user-management/branch-admin', adminForm);
            if (resAdmin.data.success) {
                toast.success('Branch Admin created successfully');
                setShowAdminModal(false);
                setAdminForm({ username: '', target_user_role: 'branch_admin', password: '', email: '', name: '', contact: '', branchId: '' });
                fetchBranches();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create admin');
        }
    };

    return (
        <div className="p-8 min-h-screen bg-gray-50/30">
            {/* Header Section */}
            <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Oversight</h1>
                    <p className="text-gray-500 mt-1 font-medium">Global branch management and administrative control center</p>
                </div>
                <button
                    onClick={() => setShowAdminModal(true)}
                    className="group relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 text-white px-8 py-3.5 rounded-2xl flex items-center gap-3 shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all active:scale-95"
                >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Shield size={22} className="group-hover:rotate-12 transition-transform" />
                    <span className="font-bold text-sm tracking-wide">DEPLOY BRANCH ADMIN</span>
                </button>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 gap-10">
                <div className="bg-white/60 backdrop-blur-2xl border border-white/50 shadow-2xl shadow-gray-200/40 rounded-[2.5rem] overflow-hidden transition-all hover:bg-white/80 group">
                    <div className="p-8 border-b border-gray-100/50 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                            <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                                <Users size={22} />
                            </span>
                            Branch Registry
                        </h2>
                        <div className="flex gap-2">
                            <div className="px-3 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-full border border-green-100 uppercase tracking-tighter">System Online</div>
                        </div>
                    </div>
                    <div className="p-4">
                        <BranchManager />
                    </div>
                </div>
            </div>

            {/* Modern Modal */}
            {showAdminModal && (
                <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-white/95 backdrop-blur-3xl rounded-[2.5rem] p-10 w-full max-w-xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] border border-white/80 transform transition-all animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-5 mb-8">
                            <div className="p-4 bg-purple-100 text-purple-600 rounded-3xl animate-pulse">
                                <Shield size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">New Administrator</h3>
                                <p className="text-sm text-gray-500 font-medium">Assign a manager to a specific branch location</p>
                            </div>
                        </div>

                        <form onSubmit={handleCreateAdmin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Target Location</label>
                                <select
                                    className="w-full bg-gray-50/50 border border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none p-4 rounded-2xl transition-all font-semibold text-gray-700 cursor-pointer"
                                    value={adminForm.branchId}
                                    onChange={e => setAdminForm({ ...adminForm, branchId: e.target.value })}
                                    required
                                >
                                    <option value="">Select a branch territory</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Full Name</label>
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        className="w-full bg-gray-50/50 border border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none p-4 rounded-2xl transition-all font-medium"
                                        value={adminForm.name}
                                        onChange={e => setAdminForm({ ...adminForm, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Identifier</label>
                                    <input
                                        type="text"
                                        placeholder="admin_ident"
                                        className="w-full bg-gray-50/50 border border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none p-4 rounded-2xl transition-all font-medium"
                                        value={adminForm.username}
                                        onChange={e => setAdminForm({ ...adminForm, username: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Security Credentials</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full bg-gray-50/50 border border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none p-4 rounded-2xl transition-all font-mono tracking-widest"
                                    value={adminForm.password}
                                    onChange={e => setAdminForm({ ...adminForm, password: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Contact Channels</label>
                                <div className="grid grid-cols-2 gap-6">
                                    <input
                                        type="email"
                                        placeholder="email@hq.com"
                                        className="w-full bg-gray-50/50 border border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none p-4 rounded-2xl transition-all font-medium"
                                        value={adminForm.email}
                                        onChange={e => setAdminForm({ ...adminForm, email: e.target.value })}
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="+1 (555) 000"
                                        className="w-full bg-gray-50/50 border border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none p-4 rounded-2xl transition-all font-medium"
                                        value={adminForm.contact}
                                        onChange={e => setAdminForm({ ...adminForm, contact: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAdminModal(false)}
                                    className="flex-1 px-4 py-4 text-gray-400 font-black uppercase tracking-widest hover:bg-gray-50 hover:text-gray-600 rounded-3xl transition-all"
                                >
                                    Discard
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] bg-gradient-to-br from-indigo-600 to-violet-700 text-white font-black uppercase tracking-widest py-4 rounded-3xl shadow-xl shadow-indigo-100 hover:shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-95"
                                >
                                    Confirm Deployment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminDashboard;
