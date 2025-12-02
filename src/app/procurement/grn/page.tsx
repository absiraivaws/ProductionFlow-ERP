"use client";

import { useState, useEffect } from "react";
import { GRNService, GRN, GRNItem } from "@/lib/services/GRNService";
import { ItemService, Item } from "@/lib/services/ItemService";
import { SupplierService, Supplier } from "@/lib/services/SupplierService";
import { Plus, CheckCircle, XCircle, Clock, Package, Truck, Edit, Save, AlertCircle } from "lucide-react";

export default function GRNPage() {
    const [grns, setGrns] = useState<GRN[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<GRN>>({});

    useEffect(() => {
        document.title = "Goods Received Notes | Procurement | ProductionFlow ERP";
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [grnsData, itemsData, suppliersData] = await Promise.all([
            GRNService.getGRNs(),
            ItemService.getItems(),
            SupplierService.getSuppliers(true),
        ]);
        setGrns(grnsData);
        setItems(itemsData);
        setSuppliers(suppliersData);
        setLoading(false);
    };

    const handleEdit = (grn: GRN) => {
        setEditingId(grn.id);
        setEditForm(JSON.parse(JSON.stringify(grn))); // Deep copy
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const validateForm = () => {
        if (!editForm.items) return true;
        for (const item of editForm.items) {
            const tracking = getTrackingType(item.itemId);
            if (tracking === "SERIAL") {
                const serialCount = item.serialNos?.length || 0;
                if (serialCount !== item.qty) {
                    alert(`Item ${item.itemName} requires ${item.qty} serial numbers, but ${serialCount} provided.`);
                    return false;
                }
                // Check for duplicates
                const uniqueSerials = new Set(item.serialNos);
                if (uniqueSerials.size !== serialCount) {
                    alert(`Item ${item.itemName} has duplicate serial numbers.`);
                    return false;
                }
            }
            if (tracking === "BATCH" && !item.batchNo) {
                alert(`Item ${item.itemName} requires a Batch Number.`);
                return false;
            }
        }
        return true;
    };

    const handleSave = async () => {
        if (!editingId || !editForm) return;
        if (!validateForm()) return;
        try {
            await GRNService.updateGRN(editingId, editForm);
            setEditingId(null);
            loadData();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleConfirm = async (grnId: string) => {
        if (!confirm("Are you sure you want to confirm this GRN? Stock will be updated.")) return;
        try {
            // If currently editing, save first
            if (editingId === grnId) {
                if (!validateForm()) return;
                await GRNService.updateGRN(grnId, editForm);
            }
            await GRNService.confirmGRN(grnId);
            setEditingId(null);
            loadData();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const updateItem = (index: number, field: keyof GRNItem, value: any) => {
        if (!editForm.items) return;
        const newItems = [...editForm.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setEditForm({ ...editForm, items: newItems });
    };

    const updateSerialNos = (index: number, value: string) => {
        if (!editForm.items) return;
        const newItems = [...editForm.items];
        // Split by comma or newline and clean up
        const serials = value.split(/[\n,]+/).map(s => s.trim()).filter(s => s);
        newItems[index] = { ...newItems[index], serialNos: serials };
        setEditForm({ ...editForm, items: newItems });
    };

    const getTrackingType = (itemId: string) => {
        return items.find(i => i.id === itemId)?.trackingType || "NONE";
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "DRAFT": return "bg-slate-100 text-slate-700";
            case "CONFIRMED": return "bg-green-100 text-green-700";
            default: return "bg-slate-100 text-slate-700";
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
                    <h1 className="text-3xl font-bold text-slate-900">Goods Received Notes</h1>
                    <p className="text-slate-500 mt-1">Manage incoming stock and verify deliveries</p>
                </div>
                {/* Manual creation button could go here, but we focus on PO flow */}
            </div>

            {/* GRN List */}
            <div className="space-y-4">
                {grns.map(grn => (
                    <div key={grn.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-4">
                                <span className="font-mono font-medium text-slate-900">{grn.grnNo}</span>
                                <span className="text-sm text-slate-500">{grn.date}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(grn.status)}`}>
                                    {grn.status}
                                </span>
                                {grn.poNo && (
                                    <span className="text-sm text-slate-500 flex items-center gap-1">
                                        <Truck size={14} />
                                        Ref: {grn.poNo}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {grn.status === "DRAFT" && editingId !== grn.id && (
                                    <>
                                        <button
                                            onClick={() => handleEdit(grn)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                            title="Edit Details"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleConfirm(grn.id)}
                                            className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 flex items-center gap-1"
                                        >
                                            <CheckCircle size={16} />
                                            Confirm
                                        </button>
                                    </>
                                )}
                                {editingId === grn.id && (
                                    <>
                                        <button
                                            onClick={handleSave}
                                            className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center gap-1"
                                        >
                                            <Save size={16} />
                                            Save
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            className="px-3 py-1.5 bg-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-300"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="p-4">
                            <div className="mb-2 text-sm font-medium text-slate-700">
                                Supplier: {grn.supplierName}
                            </div>

                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-slate-500 border-b border-slate-100">
                                        <th className="pb-2 font-medium">Item</th>
                                        <th className="pb-2 font-medium w-24">Qty</th>
                                        <th className="pb-2 font-medium w-32">Cost</th>
                                        <th className="pb-2 font-medium w-32">Total</th>
                                        <th className="pb-2 font-medium w-64">Tracking Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {(editingId === grn.id ? editForm.items : grn.items)?.map((item, idx) => {
                                        const tracking = getTrackingType(item.itemId);
                                        const isEditing = editingId === grn.id;

                                        return (
                                            <tr key={idx}>
                                                <td className="py-3">{item.itemName}</td>
                                                <td className="py-3">{item.qty}</td>
                                                <td className="py-3">${item.costPrice.toFixed(2)}</td>
                                                <td className="py-3">${item.lineTotal.toFixed(2)}</td>
                                                <td className="py-3">
                                                    {tracking === "NONE" && <span className="text-slate-400">-</span>}

                                                    {tracking === "BATCH" && (
                                                        <div className="space-y-2">
                                                            {isEditing ? (
                                                                <>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Batch No"
                                                                        value={item.batchNo || ""}
                                                                        onChange={(e) => updateItem(idx, "batchNo", e.target.value)}
                                                                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                                                                    />
                                                                    <input
                                                                        type="date"
                                                                        placeholder="Expiry"
                                                                        value={item.expiryDate || ""}
                                                                        onChange={(e) => updateItem(idx, "expiryDate", e.target.value)}
                                                                        className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                                                                    />
                                                                </>
                                                            ) : (
                                                                <div className="text-xs">
                                                                    <div>Batch: {item.batchNo || "-"}</div>
                                                                    <div>Exp: {item.expiryDate || "-"}</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {tracking === "SERIAL" && (
                                                        <div className="space-y-2">
                                                            {isEditing ? (
                                                                <textarea
                                                                    placeholder="Serial Numbers (comma separated)"
                                                                    value={item.serialNos ? item.serialNos.join(", ") : ""}
                                                                    onChange={(e) => updateSerialNos(idx, e.target.value)}
                                                                    className="w-full px-2 py-1 border border-slate-300 rounded text-xs h-16"
                                                                />
                                                            ) : (
                                                                <div className="text-xs break-all">
                                                                    SN: {item.serialNos ? item.serialNos.join(", ") : "-"}
                                                                </div>
                                                            )}
                                                            {isEditing && (
                                                                <div className={`text-xs ${item.serialNos?.length !== item.qty ? 'text-amber-600' : 'text-green-600'}`}>
                                                                    Count: {item.serialNos?.length || 0} / {item.qty}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}

                {grns.length === 0 && (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                        <Package className="mx-auto h-12 w-12 text-slate-400" />
                        <h3 className="mt-2 text-sm font-medium text-slate-900">No GRNs</h3>
                        <p className="mt-1 text-sm text-slate-500">Approve a Purchase Order to create a GRN.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
