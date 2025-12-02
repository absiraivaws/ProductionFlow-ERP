"use client";

import React, { useState, useEffect } from "react";
import { BOMService, BOM, BOMLine } from "@/lib/services/BOMService";
import { ItemService, Item } from "@/lib/services/ItemService";
import { Plus, Edit2, Trash2, CheckCircle, XCircle, FileText } from "lucide-react";

export default function BOMPage() {
    const [boms, setBOMs] = useState<BOM[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingBOM, setEditingBOM] = useState<BOM | null>(null);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    // Form state
    const [fgItemId, setFgItemId] = useState("");
    const [versionNo, setVersionNo] = useState(1);
    const [status, setStatus] = useState<"ACTIVE" | "INACTIVE" | "DRAFT">("DRAFT");
    const [remarks, setRemarks] = useState("");
    const [lines, setLines] = useState<BOMLine[]>([{ rmItemId: "", qtyPerUnit: 0 }]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [bomsData, itemsData] = await Promise.all([
            BOMService.getBOMs(),
            ItemService.getItems(),
        ]);
        setBOMs(bomsData);
        // Remove duplicate items by id
        const uniqueItems = itemsData.filter((item, index, self) =>
            index === self.findIndex((t) => t.id === item.id)
        );
        setItems(uniqueItems);
        setLoading(false);
    };

    const toggleRow = (bomId: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(bomId)) {
            newExpanded.delete(bomId);
        } else {
            newExpanded.add(bomId);
        }
        setExpandedRows(newExpanded);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const fgItem = items.find(i => i.id === fgItemId);
            const bomData = {
                fgItemId,
                fgItemName: fgItem?.name,
                versionNo,
                status,
                remarks,
                lines: lines.map(line => {
                    const rmItem = items.find(i => i.id === line.rmItemId);
                    return {
                        ...line,
                        rmItemName: rmItem?.name,
                        unit: rmItem?.unit,
                    };
                }),
                createdBy: "system",
            };

            if (editingBOM) {
                await BOMService.updateBOM(editingBOM.id, bomData);
            } else {
                await BOMService.createBOM(bomData);
            }

            resetForm();
            loadData();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const resetForm = () => {
        setFgItemId("");
        setVersionNo(1);
        setStatus("DRAFT");
        setRemarks("");
        setLines([{ rmItemId: "", qtyPerUnit: 0 }]);
        setEditingBOM(null);
        setShowForm(false);
    };

    const handleEdit = (bom: BOM) => {
        setEditingBOM(bom);
        setFgItemId(bom.fgItemId);
        setVersionNo(bom.versionNo);
        setStatus(bom.status);
        setRemarks(bom.remarks || "");
        setLines(bom.lines);
        setShowForm(true);
    };

    const handleActivate = async (bomId: string) => {
        try {
            await BOMService.activateBOM(bomId);
            loadData();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleDeactivate = async (bomId: string) => {
        await BOMService.deactivateBOM(bomId);
        loadData();
    };

    const addLine = () => {
        setLines([...lines, { rmItemId: "", qtyPerUnit: 0 }]);
    };

    const removeLine = (index: number) => {
        setLines(lines.filter((_, i) => i !== index));
    };

    const updateLine = (index: number, field: keyof BOMLine, value: any) => {
        const updated = [...lines];
        updated[index] = { ...updated[index], [field]: value };
        setLines(updated);
    };

    if (loading) {
        return <div className="flex items-center justify-center h-full"><div className="text-slate-500">Loading...</div></div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Bill of Materials (BOM)</h1>
                    <p className="text-slate-500 mt-1">Manage product recipes and material requirements</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus size={20} />
                    New BOM
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">
                        {editingBOM ? "Edit BOM" : "Create New BOM"}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Finished Good Item *
                                </label>
                                <select
                                    value={fgItemId}
                                    onChange={(e) => setFgItemId(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                >
                                    <option value="">Select item...</option>
                                    {items.filter(item => item.type === "FINISHED_GOOD").map(item => (
                                        <option key={item.id} value={item.id}>{item.sku} - {item.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Version No</label>
                                <input
                                    type="number"
                                    value={versionNo}
                                    onChange={(e) => setVersionNo(parseInt(e.target.value))}
                                    min="1"
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as any)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                >
                                    <option value="DRAFT">Draft</option>
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Remarks</label>
                            <textarea
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            />
                        </div>

                        {/* Material Lines */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-slate-700">Materials *</label>
                                <button
                                    type="button"
                                    onClick={addLine}
                                    className="text-sm text-blue-600 hover:text-blue-700"
                                >
                                    + Add Line
                                </button>
                            </div>
                            <div className="space-y-2">
                                {lines.map((line, index) => (
                                    <div key={index} className="flex gap-2">
                                        <select
                                            value={line.rmItemId}
                                            onChange={(e) => updateLine(index, "rmItemId", e.target.value)}
                                            required
                                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                                        >
                                            <option value="">Select material...</option>
                                            {items.filter(item => item.type === "RAW_MATERIAL").map(item => (
                                                <option key={item.id} value={item.id}>{item.sku} - {item.name}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            value={line.qtyPerUnit || ""}
                                            onChange={(e) => updateLine(index, "qtyPerUnit", parseFloat(e.target.value) || 0)}
                                            placeholder="Qty per unit"
                                            step="0.01"
                                            min="0"
                                            required
                                            className="w-32 px-3 py-2 border border-slate-300 rounded-lg"
                                        />
                                        {lines.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeLine(index)}
                                                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                {editingBOM ? "Update" : "Create"} BOM
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* BOM List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">BOM No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Finished Good</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Version</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Materials</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {boms.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        No BOMs found. Create your first BOM to get started.
                                    </td>
                                </tr>
                            ) : (
                                boms.map((bom) => (
                                    <React.Fragment key={bom.id}>
                                        <tr className="hover:bg-slate-50 cursor-pointer" onClick={() => toggleRow(bom.id)}>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-900">{bom.bomNo}</td>
                                            <td className="px-6 py-4 text-sm text-slate-900">{bom.fgItemName}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">v{bom.versionNo}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{bom.lines.length} items</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${bom.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                                                    bom.status === "INACTIVE" ? "bg-slate-100 text-slate-700" :
                                                        "bg-amber-100 text-amber-700"
                                                    }`}>
                                                    {bom.status === "ACTIVE" && <CheckCircle size={12} />}
                                                    {bom.status === "INACTIVE" && <XCircle size={12} />}
                                                    {bom.status === "DRAFT" && <FileText size={12} />}
                                                    {bom.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEdit(bom)}
                                                        className="text-blue-600 hover:text-blue-700"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    {bom.status !== "ACTIVE" && (
                                                        <button
                                                            onClick={() => handleActivate(bom.id)}
                                                            className="text-green-600 hover:text-green-700"
                                                            title="Activate"
                                                        >
                                                            <CheckCircle size={16} />
                                                        </button>
                                                    )}
                                                    {bom.status === "ACTIVE" && (
                                                        <button
                                                            onClick={() => handleDeactivate(bom.id)}
                                                            className="text-slate-600 hover:text-slate-700"
                                                            title="Deactivate"
                                                        >
                                                            <XCircle size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedRows.has(bom.id) && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-4 bg-slate-50">
                                                    <div className="space-y-2">
                                                        <h4 className="font-medium text-slate-900 mb-2">Raw Materials Required:</h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                            {bom.lines.map((line, idx) => (
                                                                <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200">
                                                                    <div className="text-sm font-medium text-slate-900">{line.rmItemName}</div>
                                                                    <div className="text-xs text-slate-600 mt-1">
                                                                        Qty: {line.qtyPerUnit} {line.unit}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {bom.remarks && (
                                                            <div className="mt-3 text-sm text-slate-600">
                                                                <span className="font-medium">Remarks:</span> {bom.remarks}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
