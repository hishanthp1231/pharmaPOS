import React from 'react';
import BranchUserManagement from '../components/BranchUserManagement';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const BranchAdminDashboard = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const branchId = user.branchId || user.branch_id;
    const branchName = user.branchName || user.branch_name;

    if (user.role !== 'branch_admin') {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="p-8 min-h-screen bg-transparent">
            <div className="mb-10">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Branch Operations</h1>
                <p className="text-gray-500 mt-1 font-medium">Administration and user management for <span className="text-indigo-600 underline decoration-indigo-200 underline-offset-4">{branchName || 'your branch'}</span></p>
            </div>

            <div className="grid grid-cols-1 gap-10">
                <div className="bg-white/60 backdrop-blur-2xl border border-white/50 shadow-2xl shadow-gray-200/40 rounded-[2.5rem] overflow-hidden transition-all hover:bg-white/80 group">
                    <div className="p-2">
                        <BranchUserManagement branchId={branchId} currentUserRole={user.role} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BranchAdminDashboard;
