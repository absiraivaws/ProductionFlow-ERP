"use client";

import { useState, useEffect } from "react";
import { RoleService, Role, Permission } from "@/lib/services/RoleService";
import { Plus, Edit, Trash2, Shield } from "lucide-react";

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);

    const defaultPermissions: Permission = {
        accounting: false,
        inventory: false,
        sales: false,
        settings: false,
    };

    const [formData, setFormData] = useState<{ name: string; permissions: Permission }>({
        name: "",
        permissions: defaultPermissions,
    });

    useEffect(() => {
        loadRoles();
    }, []);

    const loadRoles = async () => {
        setLoading(true);
        const data = await RoleService.getRoles();
        setRoles(data);
        setLoading(false);
    };

    const handleOpenModal = (role?: Role) => {
        if (role) {
            setEditingRole(role);
            setFormData({ name: role.name, permissions: role.permissions });
        } else {
            setEditingRole(null);
            setFormData({ name: "", permissions: defaultPermissions });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingRole) {
            await RoleService.updateRole(editingRole.id, formData);
        } else {
            await RoleService.createRole(formData);
        }
        setIsModalOpen(false);
        loadRoles();
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this role?")) {
            await RoleService.deleteRole(id);
            loadRoles();
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Roles & Permissions</h1>
                        <p className="text-slate-500">Manage user roles and access levels</p>
                    </div>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                >
                    <Plus size={18} />
                    Add Role
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-medium text-slate-700">Role Name</th>
                            <th className="px-6 py-4 font-medium text-slate-700">Permissions</th>
                            <th className="px-6 py-4 font-medium text-slate-700 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">Loading roles...</td></tr>
                        ) : roles.length === 0 ? (
                            <tr><td colSpan={3} className="px-6 py-8 text-center text-slate-500">No roles found. Create one to get started.</td></tr>
                        ) : (
                            roles.map((role) => (
                                <tr key={role.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">{role.name}</td>
                                    <td className="px-6 py-4 text-slate-500">
                                        <div className="flex gap-2 flex-wrap">
                                            {Object.entries(role.permissions).map(([key, value]) => (
                                                value && (
                                                    <span key={key} className="px-2 py-1 bg-slate-100 rounded text-xs capitalize">
                                                        {key}
                                                    </span>
                                                )
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleOpenModal(role)} className="p-2 text-slate-400 hover:text-blue-600">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(role.id)} className="p-2 text-slate-400 hover:text-red-600">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">{editingRole ? "Edit Role" : "New Role"}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Role Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Permissions</label>
                                <div className="space-y-2">
                                    {Object.keys(defaultPermissions).map((key) => (
                                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                                checked={(formData.permissions as any)[key]}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    permissions: { ...formData.permissions, [key]: e.target.checked }
                                                })}
                                            />
                                            <span className="text-sm capitalize">{key}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                                >
                                    {editingRole ? "Update Role" : "Create Role"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
