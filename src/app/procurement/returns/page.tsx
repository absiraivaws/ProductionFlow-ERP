"use client";

import { useState, useEffect } from "react";
import { PurchaseReturnService, PurchaseReturn, PurchaseReturnLine } from "@/lib/services/PurchaseReturnService";
import { SupplierService, Supplier } from "@/lib/services/SupplierService";
import { ItemService, Item } from "@/lib/services/ItemService";
import { LocationService, Location } from "@/lib/services/LocationService";
import { Plus, CheckCircle, XCircle, Clock, AlertTriangle, Trash2 } from "lucide-react";

export default function PurchaseReturnsPage() {
    const [returns, setReturns] = useState<PurchaseReturn[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [supplierId, setSupplierId] = useState("");
    const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
    const [reason, setReason] = useState("");
    const [remarks, setRemarks] = useState("");
    const [lines, setLines] = useState<Partial<PurchaseReturnLine>[]>([
        { itemId: "", locationId: "", qty: 0, price: 0, taxRate: 0, lineTotal: 0 }
    ]);

    useEffect(() => {
        document.title = "Purchase Returns | Procurement | ProductionFlow ERP";
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [returnsData, suppliersData, itemsData, locationsData] = await Promise.all([
            PurchaseReturnService.getPurchaseReturns(),
            SupplierService.getSuppliers(true),
            ItemService.getItems(),
            LocationService.getLocations(),
        ]);
        setReturns(returnsData);
        setSuppliers(suppliersData);
        setItems(itemsData);
        setLocations(locationsData);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const supplier = suppliers.find(s => s.id === supplierId);

            const returnData = {
                supplierId,
                supplierName: supplier?.name,
                returnDate,
                reason,
                status: "DRAFT" as const,
                subtotal: 0,
                taxAmount: 0,
                totalAmount: 0,
                lines: lines.map(line => {
                    const item = items.find(i => i.id === line.itemId);
                    const location = locations.find(l => l.id === line.locationId);
                    return {
                        itemId: line.itemId!,
                        itemName: item?.name,
                        locationId: line.locationId!,
                        locationName: location?.name,
                        qty: line.qty!,
                        price: line.price!,
                        taxRate: line.taxRate!,
                        lineTotal: line.lineTotal!,
                        unit: item?.unit,
                    };
                }),
                remarks,
                createdBy: "system",
            };

            await PurchaseReturnService.createPurchaseReturn(returnData);
            resetForm();
            loadData();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const resetForm = () => {
        setSupplierId("");
        setReturnDate(new Date().toISOString().split('T')[0]);
        setReason("");
        setRemarks("");
        setLines([{ itemId: "", locationId: "", qty: 0, price: 0, taxRate: 0, lineTotal: 0 }]);
        setShowForm(false);
    };

    const handleApprove = async (returnId: string) => {
        try {
            await PurchaseReturnService.approvePurchaseReturn(returnId);
            loadData();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleProcess = async (returnId: string) => {
        try {
            await PurchaseReturnService.processPurchaseReturn(returnId);
            loadData();
            alert("Purchase return processed! Stock has been updated.");
        } catch (error: any) {
            alert(error.message);
        }
    };

    const addLine = () => {
        setLines([...lines, { itemId: "", locationId: "", qty: 0, price: 0, taxRate: 0, lineTotal: 0 }]);
    };

    const removeLine = (index: number) => {
        setLines(lines.filter((_, i) => i !== index));
    };

    const updateLine = (index: number, field: keyof PurchaseReturnLine, value: any) => {
        const updated = [...lines];
        updated[index] = { ...updated[index], [field]: value };

        // Auto-calculate line total
        if (field === "qty" || field === "price") {
            const qty = field === "qty" ? value : updated[index].qty || 0;
            const price = field === "price" ? value : updated[index].price || 0;
            updated[index].lineTotal = qty * price;
        }

        setLines(updated);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "DRAFT": return "bg-slate-100 text-slate-700";
            case "APPROVED": return "bg-blue-100 text-blue-700";
            case "PROCESSED": return "bg-green-100 text-green-700";
            case "CANCELLED": return "bg-red-100 text-red-700";
            default: return "bg-slate-100 text-slate-700";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "DRAFT": return <Clock size={12} />;
            case "APPROVED": return <CheckCircle size={12} />;
            case "PROCESSED": return <CheckCircle size={12} />;
            case "CANCELLED": return <XCircle size={12} />;
            default: return <Clock size={12} />;
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
                    <h1 className="text-3xl font-bold text-slate-900">Purchase Returns</h1>
                    <p className="text-slate-500 mt-1">Return defective or excess goods to suppliers</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus size={20} />
                    New Purchase Return
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="text-2xl font-bold text-slate-900">
                        {returns.filter(r => r.status === "DRAFT").length}
                    </div>
                    <div className="text-sm text-slate-600">Draft</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-2xl font-bold text-blue-900">
                        {returns.filter(r => r.status === "APPROVED").length}
                    </div>
                    <div className="text-sm text-blue-600">Approved</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="text-2xl font-bold text-green-900">
                        {returns.filter(r => r.status === "PROCESSED").length}
                    </div>
                    <div className="text-sm text-green-600">Processed</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="text-2xl font-bold text-slate-900">
                        {returns.length}
                    </div>
                    <div className="text-sm text-slate-600">Total Returns</div>
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">Create Purchase Return</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Supplier *</label>
                                <select
                                    value={supplierId}
                                    onChange={(e) => setSupplierId(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                >
                                    <option value="">Select supplier...</option>
                                    {suppliers.map(supplier => (
                                        <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Return Date *</label>
                                <input
                                    type="date"
                                    value={returnDate}
                                    onChange={(e) => setReturnDate(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Return *</label>
                            <input
                                type="text"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                required
                                placeholder="e.g., Defective items, Wrong items received, Excess stock"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            />
                        </div>

                        {/* Return Lines */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-slate-700">Items to Return *</label>
                                <button
                                    type="button"
                                    onClick={addLine}
                                    className="text-sm text-blue-600 hover:text-blue-700"
                                >
                                    + Add Line
                                </button>
                            </div>

                            {/* Column Headers - Hidden on Mobile */}
                            <div className="hidden md:grid md:grid-cols-12 gap-4 mb-2 px-2">
                                <div className="col-span-4 text-xs font-medium text-slate-600">Item</div>
                                <div className="col-span-2 text-xs font-medium text-slate-600">Location</div>
                                <div className="col-span-1 text-xs font-medium text-slate-600">Quantity</div>
                                <div className="col-span-2 text-xs font-medium text-slate-600">Unit Price</div>
                                <div className="col-span-1 text-xs font-medium text-slate-600">Tax %</div>
                                <div className="col-span-1 text-xs font-medium text-slate-600">Total</div>
                                <div className="col-span-1"></div>
                            </div>

                            <div className="space-y-4 md:space-y-2">
                                {lines.map((line, index) => (
                                    <div key={index} className="bg-slate-50 p-4 md:p-0 rounded-lg md:bg-transparent md:grid md:grid-cols-12 md:gap-4 md:items-start">
                                        {/* Item Selection */}
                                        <div className="col-span-4 mb-3 md:mb-0">
                                            <label className="block text-xs font-medium text-slate-700 mb-1 md:hidden">Item</label>
                                            <select
                                                value={line.itemId}
                                                onChange={(e) => updateLine(index, "itemId", e.target.value)}
                                                required
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                            >
                                                <option value="">Select item...</option>
                                                {items.map(item => (
                                                    <option key={item.id} value={item.id}>{item.sku} - {item.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Location Selection */}
                                        <div className="col-span-2 mb-3 md:mb-0">
                                            <label className="block text-xs font-medium text-slate-700 mb-1 md:hidden">Location</label>
                                            <select
                                                value={line.locationId}
                                                onChange={(e) => updateLine(index, "locationId", e.target.value)}
                                                required
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                            >
                                                <option value="">Location...</option>
                                                {locations.map(loc => (
                                                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Quantity */}
                                        <div className="col-span-1 mb-3 md:mb-0">
                                            <label className="block text-xs font-medium text-slate-700 mb-1 md:hidden">Quantity</label>
                                            <input
                                                type="number"
                                                value={line.qty}
                                                onChange={(e) => updateLine(index, "qty", parseFloat(e.target.value) || 0)}
                                                placeholder="0"
                                                step="0.01"
                                                min="0"
                                                required
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                            />
                                        </div>

                                        {/* Unit Price */}
                                        <div className="col-span-2 mb-3 md:mb-0">
                                            <label className="block text-xs font-medium text-slate-700 mb-1 md:hidden">Unit Price</label>
                                            <input
                                                type="number"
                                                value={line.price}
                                                onChange={(e) => updateLine(index, "price", parseFloat(e.target.value) || 0)}
                                                placeholder="0.00"
                                                step="0.01"
                                                min="0"
                                                required
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                            />
                                        </div>

                                        {/* Tax Rate */}
                                        <div className="col-span-1 mb-3 md:mb-0">
                                            <label className="block text-xs font-medium text-slate-700 mb-1 md:hidden">Tax %</label>
                                            <input
                                                type="number"
                                                value={line.taxRate}
                                                onChange={(e) => updateLine(index, "taxRate", parseFloat(e.target.value) || 0)}
                                                placeholder="0"
                                                step="0.01"
                                                min="0"
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                            />
                                        </div>

                                        {/* Line Total */}
                                        <div className="col-span-1 mb-3 md:mb-0">
                                            <label className="block text-xs font-medium text-slate-700 mb-1 md:hidden">Total</label>
                                            <input
                                                type="number"
                                                value={line.lineTotal}
                                                readOnly
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 text-sm"
                                            />
                                        </div>

                                        {/* Delete Button */}
                                        <div className="col-span-1 flex justify-end md:justify-center items-center h-full pt-1">
                                            {lines.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeLine(index)}
                                                    className="text-red-500 hover:text-red-700 p-2"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Additional Remarks</label>
                            <textarea
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Create Purchase Return
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

            {/* Returns List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Return No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Supplier</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Reason</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {returns.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                        No purchase returns found. Create your first return to get started.
                                    </td>
                                </tr>
                            ) : (
                                returns.map((returnItem) => (
                                    <tr key={returnItem.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{returnItem.returnNo}</td>
                                        <td className="px-6 py-4 text-sm text-slate-900">{returnItem.supplierName}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{returnItem.returnDate}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{returnItem.reason}</td>
                                        <td className="px-6 py-4 text-sm text-slate-900">${returnItem.totalAmount.toFixed(2)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(returnItem.status)}`}>
                                                {getStatusIcon(returnItem.status)}
                                                {returnItem.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                {returnItem.status === "DRAFT" && (
                                                    <button
                                                        onClick={() => handleApprove(returnItem.id)}
                                                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                                {returnItem.status === "APPROVED" && (
                                                    <button
                                                        onClick={() => handleProcess(returnItem.id)}
                                                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                                                    >
                                                        Process & Update Stock
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="text-amber-600 mt-1" size={20} />
                    <div>
                        <h3 className="font-semibold text-amber-900 mb-2">Purchase Return Workflow</h3>
                        <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
                            <li>Create return with items and reason (DRAFT status)</li>
                            <li>Approve the return to authorize processing</li>
                            <li>Process return to update stock ledger (reduces inventory)</li>
                            <li>Accounting entries posted: DR Accounts Payable, CR Inventory</li>
                            <li>Stock is deducted from the specified locations</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}
