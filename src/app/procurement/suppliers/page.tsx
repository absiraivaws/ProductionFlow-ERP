"use client";

import { useState, useEffect } from "react";
import { SupplierService, Supplier } from "@/lib/services/SupplierService";
import { Plus, Edit, Trash2, Users, CheckCircle, XCircle } from "lucide-react";

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

    // Set page title
    useEffect(() => {
        document.title = "Suppliers | Procurement | ProductionFlow ERP";
    }, []);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        taxId: "",
        paymentTerms: "Net 30",
        creditLimit: 0,
        isActive: true,
    });

    useEffect(() => {
        loadSuppliers();
    }, []);

    const loadSuppliers = async () => {
        setLoading(true);
        const data = await SupplierService.getSuppliers();
        setSuppliers(data);
        setLoading(false);
    };

    const handleOpenForm = (supplier?: Supplier) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData({
                name: supplier.name,
                contactPerson: supplier.contactPerson || "",
                email: supplier.email || "",
                phone: supplier.phone || "",
                address: supplier.address || "",
                taxId: supplier.taxId || "",
                paymentTerms: supplier.paymentTerms || "Net 30",
                creditLimit: supplier.creditLimit || 0,
                isActive: supplier.isActive,
            });
        } else {
            setEditingSupplier(null);
            setFormData({
                name: "",
                contactPerson: "",
                email: "",
                phone: "",
                address: "",
                taxId: "",
                paymentTerms: "Net 30",
                creditLimit: 0,
                isActive: true,
            });
        }
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingSupplier) {
                await SupplierService.updateSupplier(editingSupplier.id, formData);
            } else {
                await SupplierService.createSupplier({
                    ...formData,
                    createdBy: "system",
                });
            }
            setShowForm(false);
            loadSuppliers();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this supplier?")) {
            await SupplierService.deleteSupplier(id);
            loadSuppliers();
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-full"><div className="text-slate-500">Loading...</div></div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Suppliers</h1>
                    <p className="text-slate-500 mt-1">Manage supplier information and contacts</p>
                </div>
                <button
                    onClick={() => handleOpenForm()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus size={20} />
                    New Supplier
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-2xl font-bold text-blue-900">
                        {suppliers.length}
                    </div>
                    <div className="text-sm text-blue-600">Total Suppliers</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="text-2xl font-bold text-green-900">
                        {suppliers.filter(s => s.isActive).length}
                    </div>
                    <div className="text-sm text-green-600">Active</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="text-2xl font-bold text-slate-900">
                        {suppliers.filter(s => !s.isActive).length}
                    </div>
                    <div className="text-sm text-slate-600">Inactive</div>
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-slate-900 mb-4">
                            {editingSupplier ? "Edit Supplier" : "New Supplier"}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Supplier Name *</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Contact Person</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        value={formData.contactPerson}
                                        onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tax ID</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        value={formData.taxId}
                                        onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Payment Terms</label>
                                    <select
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        value={formData.paymentTerms}
                                        onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Net 15">Net 15</option>
                                        <option value="Net 30">Net 30</option>
                                        <option value="Net 60">Net 60</option>
                                        <option value="Net 90">Net 90</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Credit Limit</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        value={formData.creditLimit}
                                        onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                <textarea
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                />
                                <label htmlFor="isActive" className="text-sm text-slate-700">Active Supplier</label>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    {editingSupplier ? "Update" : "Create"} Supplier
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Suppliers Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Code</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Supplier Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Contact Person</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Phone</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Payment Terms</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {suppliers.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                                        No suppliers found. Create your first supplier to get started.
                                    </td>
                                </tr>
                            ) : (
                                suppliers.map((supplier) => (
                                    <tr key={supplier.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-sm font-mono text-slate-600">{supplier.code}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{supplier.name}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{supplier.contactPerson || "-"}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{supplier.email || "-"}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{supplier.phone || "-"}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{supplier.paymentTerms || "-"}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${supplier.isActive
                                                ? "bg-green-100 text-green-700"
                                                : "bg-slate-100 text-slate-700"
                                                }`}>
                                                {supplier.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                {supplier.isActive ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleOpenForm(supplier)}
                                                    className="text-blue-600 hover:text-blue-700"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(supplier.id)}
                                                    className="text-red-600 hover:text-red-700"
                                                    title="Delete"
                                                >
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
            </div>
        </div>
    );
}
