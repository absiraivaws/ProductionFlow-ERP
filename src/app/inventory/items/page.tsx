"use client";

import { useState, useEffect } from "react";
import { ItemService, Item } from "@/lib/services/ItemService";
import { toast } from "@/lib/stores/useToast";
import { useFormatAmount } from "@/lib/utils/currency";
import { Plus, Edit, Trash2, Package } from "lucide-react";

export default function ItemsPage() {
    const formatAmount = useFormatAmount();
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        sku: "",
        type: "RAW_MATERIAL" as "RAW_MATERIAL" | "FINISHED_GOOD",
        unit: "pcs",
        costPrice: 0,
        sellingPrice: 0,
        openingStockQty: 0,
        openingStockValue: 0,
        minimumStock: 0,
        isActive: true,
        trackingType: "NONE" as "NONE" | "BATCH" | "SERIAL",
    });

    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        setLoading(true);
        const data = await ItemService.getItems();
        setItems(data);
        setLoading(false);
    };

    const handleOpenModal = (item?: Item) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name,
                sku: item.sku,
                type: item.type || "RAW_MATERIAL",
                unit: item.unit,
                costPrice: item.costPrice,
                sellingPrice: item.sellingPrice,
                openingStockQty: item.openingStockQty,
                openingStockValue: item.openingStockValue,
                minimumStock: item.minimumStock || 0,
                isActive: item.isActive,
                trackingType: item.trackingType || "NONE",
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: "",
                sku: "",
                type: "RAW_MATERIAL",
                unit: "pcs",
                costPrice: 0,
                sellingPrice: 0,
                openingStockQty: 0,
                openingStockValue: 0,
                minimumStock: 0,
                isActive: true,
                trackingType: "NONE",
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await ItemService.updateItem(editingItem.id, formData);
                toast.success(`Item ${formData.name} updated successfully!`);
            } else {
                await ItemService.createItem(formData);
                toast.success(`Item ${formData.name} created successfully!`);
            }
            setIsModalOpen(false);
            await loadItems();
        } catch (error: any) {
            console.error('Error saving item:', error);
            toast.error(`Failed to save item: ${error.message || 'Unknown error'}`);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this item?")) {
            await ItemService.deleteItem(id);
            loadItems();
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-100 rounded-lg text-amber-600">
                        <Package size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Item Master</h1>
                        <p className="text-slate-500">Manage inventory items</p>
                    </div>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-amber-700"
                >
                    <Plus size={18} />
                    Add Item
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-medium text-slate-700">SKU</th>
                            <th className="px-6 py-4 font-medium text-slate-700">Item Name</th>
                            <th className="px-6 py-4 font-medium text-slate-700">Unit</th>
                            <th className="px-6 py-4 font-medium text-slate-700 text-right">Cost Price</th>
                            <th className="px-6 py-4 font-medium text-slate-700 text-right">Selling Price</th>
                            <th className="px-6 py-4 font-medium text-slate-700 text-right">Stock</th>
                            <th className="px-6 py-4 font-medium text-slate-700 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">Loading items...</td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">No items found. Add one to get started.</td></tr>
                        ) : (
                            items.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-mono text-slate-600">{item.sku}</td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{item.name}</td>
                                    <td className="px-6 py-4 text-slate-600">{item.unit}</td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-600">{formatAmount(item.costPrice)}</td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-600">{formatAmount(item.sellingPrice)}</td>
                                    <td className="px-6 py-4 text-right font-mono">
                                        <span className={item.currentStock < 10 ? "text-red-600 font-medium" : "text-slate-600"}>
                                            {item.currentStock}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleOpenModal(item)} className="p-2 text-slate-400 hover:text-blue-600">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600">
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
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">{editingItem ? "Edit Item" : "New Item"}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Item Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        value={formData.sku}
                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Item Type *</label>
                                    <select
                                        required
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                    >
                                        <option value="RAW_MATERIAL">Raw Material</option>
                                        <option value="FINISHED_GOOD">Finished Good</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                                    <select
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                    >
                                        <option value="pcs">Pieces (pcs)</option>
                                        <option value="kg">Kilogram (kg)</option>
                                        <option value="ltr">Liter (ltr)</option>
                                        <option value="box">Box</option>
                                        <option value="dozen">Dozen</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Cost Price</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        value={formData.costPrice}
                                        onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Selling Price</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        value={formData.sellingPrice}
                                        onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Opening Stock Qty</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        value={formData.openingStockQty}
                                        onChange={(e) => setFormData({ ...formData, openingStockQty: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Opening Stock Value</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        value={formData.openingStockValue}
                                        onChange={(e) => setFormData({ ...formData, openingStockValue: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Minimum Stock</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        value={formData.minimumStock}
                                        onChange={(e) => setFormData({ ...formData, minimumStock: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tracking Type</label>
                                    <select
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        value={formData.trackingType}
                                        onChange={(e) => setFormData({ ...formData, trackingType: e.target.value as any })}
                                    >
                                        <option value="NONE">None</option>
                                        <option value="BATCH">Batch Tracking</option>
                                        <option value="SERIAL">Serial Number Tracking</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                />
                                <label htmlFor="isActive" className="text-sm text-slate-700">Active Item</label>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
                                >
                                    {editingItem ? "Update Item" : "Create Item"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
