'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Plus, CreditCard as Edit2, Trash2, Shield, Eye, EyeOff, Loader as Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function UserManagement() {
    const { isAdmin } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddUser, setShowAddUser] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', password: '', role: 'viewer' });
    const [submitting, setSubmitting] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [updatingRole, setUpdatingRole] = useState(null);
    const [deletingUser, setDeletingUser] = useState(null);

    useEffect(() => {
        if (isAdmin) {
            fetchUsers();
        }
    }, [isAdmin]);

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users');
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            } else {
                toast.error('Error fetching users');
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Error fetching users');
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newUser),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('User created successfully!');
                setNewUser({ email: '', password: '', role: 'viewer' });
                setShowAddUser(false);
                setShowPassword(false);
                fetchUsers();
            } else {
                toast.error(data.error || 'Error creating user');
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateRole = async (userId, newRole) => {
        setUpdatingRole(userId);

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ role: newRole }),
            });

            if (response.ok) {
                toast.success('User role updated successfully!');
                fetchUsers();
                setEditingUser(null);
            } else {
                const data = await response.json();
                toast.error(data.error || 'Error updating user role');
            }
        } catch (error) {
            toast.error('Error updating user role');
        } finally {
            setUpdatingRole(null);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm('Are you sure you want to delete this user?')) {
            return;
        }

        setDeletingUser(userId);

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.success('User deleted successfully!');
                fetchUsers();
            } else {
                const data = await response.json();
                toast.error(data.error || 'Error deleting user');
            }
        } catch (error) {
            toast.error('Error deleting user');
        } finally {
            setDeletingUser(null);
        }
    };

    if (!isAdmin) {
        return (
            <div className="max-w-7xl mx-auto p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700">Access denied. Admin privileges required.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6">
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#363636',
                        color: '#fff',
                    },
                    success: {
                        duration: 3000,
                        iconTheme: {
                            primary: '#10B981',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        duration: 4000,
                        iconTheme: {
                            primary: '#EF4444',
                            secondary: '#fff',
                        },
                    },
                }}
            />

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                            <Users className="h-5 w-5 mr-2 text-blue-600" />
                            User Management
                        </h2>
                        <button
                            onClick={() => setShowAddUser(true)}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-colors"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add User
                        </button>
                    </div>
                </div>

                {/* Add User Form */}
                {showAddUser && (
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <form onSubmit={handleAddUser} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="user@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={newUser.password}
                                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Password"
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                                            ) : (
                                                <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Role
                                    </label>
                                    <select
                                        value={newUser.role}
                                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="viewer">Viewer</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddUser(false);
                                        setShowPassword(false);
                                        setNewUser({ email: '', password: '', role: 'viewer' });
                                    }}
                                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        'Create User'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Users Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {editingUser === user.id ? (
                                            <div className="flex items-center space-x-2">
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                                                    disabled={updatingRole === user.id}
                                                    className="text-xs px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                                >
                                                    <option value="viewer">Viewer</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                                {updatingRole === user.id && (
                                                    <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                                                )}
                                            </div>
                                        ) : (
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin'
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {user.role === 'admin' ? (
                                                    <Shield className="h-3 w-3 mr-1" />
                                                ) : (
                                                    <Eye className="h-3 w-3 mr-1" />
                                                )}
                                                {user.role}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                            <button
                                                onClick={() => setEditingUser(editingUser === user.id ? null : user.id)}
                                                disabled={updatingRole === user.id}
                                                className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                disabled={deletingUser === user.id}
                                                className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                            >
                                                {deletingUser === user.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}