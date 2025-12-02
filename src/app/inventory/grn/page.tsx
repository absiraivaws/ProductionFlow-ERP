"use client";

import { useState, useEffect } from "react";
import { GRNService, GRN, GRNItem } from "@/lib/services/GRNService";
import { PurchaseOrderService, PurchaseOrder } from "@/lib/services/PurchaseOrderService";
import { SupplierService, Supplier } from "@/lib/services/SupplierService";
import { ItemService, Item } from "@/lib/services/ItemService";
import { Plus, Package, CheckCircle } from "lucide-react";

export default function GRNPage() {
    const [grns, setGRNs] = useState<GRN[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [selectedPO, setSelectedPO] = useState<string>("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [supplierName, setSupplierName] = useState("");
    const [paymentType, setPaymentType] = useState<"cash" | "credit">("credit");
    const [grnItems, setGrnItems] = useState<Partial<GRNItem>[]>([
        { itemId: "", qty: 0, costPrice: 0, lineTotal: 0 }
    ]);

    useEffect(() => {
        document.title = "Goods Receipt Note | Procurement | ProductionFlow ERP";
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [grnsData, posData, suppliersData, itemsData] = await Promise.all([
            GRNService.getGRNs(),
            PurchaseOrderService.getPurchaseOrders({ status: "APPROVED" }),
            SupplierService.getSuppliers(true),
            ItemService.getItems(),
        ]);
        setGRNs(grnsData);
        setPurchaseOrders(posData);
        setSuppliers(suppliersData);
        setItems(itemsData);
        setLoading(false);
    };

    const handlePOSelection = (poId: string) => {
        setSelectedPO(poId);
        const po = purchaseOrders.find(p => p.id === poId);
        if (po) {
            setSupplierName(po.supplierName || "");
            // Pre-fill items from PO
            const poItems = po.lines.map(line => ({
                itemId: line.itemId,
                itemName: line.itemName,
                qty: line.qty - line.receivedQty, // Remaining qty
                costPrice: line.price,
                lineTotal: (line.qty - line.receivedQty) * line.price,
            }));
            setGrnItems(poItems);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const grnData = {
                date,
                supplierName,
                items: grnItems.map(item => {
                    const itemData = items.find(i => i.id === item.itemId);
                    return {
                        itemId: item.itemId!,
                        itemName: itemData?.name,
                        qty: item.qty!,
                        costPrice: item.costPrice!,
                        lineTotal: item.lineTotal!,
                    };
                }),
                paymentType,
                createdBy: "system",
            };

            await GRNService.createGRN(grnData);

            // Update PO received quantities if PO was selected
            if (selectedPO) {
                const po = purchaseOrders.find(p => p.id === selectedPO);
                if (po) {
                    for (let i = 0; i < grnItems.length; i++) {
                        const grnItem = grnItems[i];
                        const poLineIndex = po.lines.findIndex(l => l.itemId === grnItem.itemId);
                        if (poLineIndex !== -1) {
                            await PurchaseOrderService.updateReceivedQty(
                                selectedPO,
                                poLineIndex,
                                grnItem.qty!
                            );
                        }
                    }
                }
            }

            resetForm();
            loadData();
            alert("GRN created successfully and stock updated!");
        } catch (error: any) {
            alert(error.message);
        }
    };

    const resetForm = () => {
        setSelectedPO("");
        setDate(new Date().toISOString().split('T')[0]);
        setSupplierName("");
        setPaymentType("credit");
        setGrnItems([{ itemId: "", qty: 0, costPrice: 0, lineTotal: 0 }]);
        setShowForm(false);
    };

    const addItem = () => {
        setGrnItems([...grnItems, { itemId: "", qty: 0, costPrice: 0, lineTotal: 0 }]);
    };

    const removeItem = (index: number) => {
        setGrnItems(grnItems.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof GRNItem, value: any) => {
        const updated = [...grnItems];
        updated[index] = { ...updated[index], [field]: value };

        // Auto-calculate line total
        if (field === "qty" || field === "costPrice") {
            const qty = field === "qty" ? value : updated[index].qty || 0;
            const price = field === "costPrice" ? value : updated[index].costPrice || 0;
            updated[index].lineTotal = qty * price;
        }

        setGrnItems(updated);
    };

    if (loading) {
        return <div className="flex items-center justify-center h-full"><div className="text-slate-500">Loading...</div></div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Goods Receipt Note (GRN)</h1>
                    <p className="text-slate-500 mt-1">Receive purchased goods into inventory</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus size={20} />
                    New GRN
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="text-2xl font-bold text-green-900">
                        {grns.length}
                    </div>
                    <div className="text-sm text-green-600">Total GRNs</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-2xl font-bold text-blue-900">
                        ${grns.reduce((sum, grn) => sum + grn.grnTotal, 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-blue-600">Total Value</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <div className="text-2xl font-bold text-amber-900">
                        {purchaseOrders.length}
                    </div>
                    <div className="text-sm text-amber-600">Pending POs</div>
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">Create GRN</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Purchase Order (Optional)
                                </label>
                                <select
                                    value={selectedPO}
                                    onChange={(e) => handlePOSelection(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                >
                                    <option value="">Select PO or create standalone...</option>
                                    {purchaseOrders.map(po => (
                                        <option key={po.id} value={po.id}>
                                            {po.poNo} - {po.supplierName} (${po.totalAmount.toFixed(2)})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">GRN Date *</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Type *</label>
                                <select
                                    value={paymentType}
                                    onChange={(e) => setPaymentType(e.target.value as "cash" | "credit")}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="credit">Credit</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Supplier Name *</label>
                            <input
                                type="text"
                                value={supplierName}
                                onChange={(e) => setSupplierName(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                placeholder="Enter supplier name"
                            />
                        </div>

                        {/* Items */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-slate-700">Items *</label>
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="text-sm text-blue-600 hover:text-blue-700"
                                >
                                    + Add Item
                                </button>
                            </div>

                            {/* Column Headers */}
                            <div className="flex gap-2 mb-1">
                                <div className="flex-1 text-xs font-medium text-slate-600">Item</div>
                                <div className="w-32 text-xs font-medium text-slate-600">Quantity</div>
                                <div className="w-32 text-xs font-medium text-slate-600">Cost Price</div>
                                <div className="w-32 text-xs font-medium text-slate-600">Line Total</div>
                                <div className="w-10"></div> {/* Space for delete button */}
                            </div>

                            <div className="space-y-2">
                                {grnItems.map((item, index) => (
                                    <div key={index} className="flex gap-2">
                                        <select
                                            value={item.itemId}
                                            onChange={(e) => updateItem(index, "itemId", e.target.value)}
                                            required
                                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                                        >
                                            <option value="">Select item...</option>
                                            {items.map(itm => (
                                                <option key={itm.id} value={itm.id}>{itm.name}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            value={item.qty}
                                            onChange={(e) => updateItem(index, "qty", parseFloat(e.target.value) || 0)}
                                            placeholder="0"
                                            step="0.01"
                                            min="0"
                                            required
                                            className="w-32 px-3 py-2 border border-slate-300 rounded-lg"
                                        />
                                        <input
                                            type="number"
                                            value={item.costPrice}
                                            onChange={(e) => updateItem(index, "costPrice", parseFloat(e.target.value) || 0)}
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                            required
                                            className="w-32 px-3 py-2 border border-slate-300 rounded-lg"
                                        />
                                        <input
                                            type="number"
                                            value={item.lineTotal}
                                            readOnly
                                            placeholder="0.00"
                                            className="w-32 px-3 py-2 border border-slate-300 rounded-lg bg-slate-50"
                                        />
                                        {grnItems.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                                            >
                                                ×
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
                                Create GRN & Update Stock
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

            {/* GRN List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">GRN No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Supplier</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Items</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Payment</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {grns.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                        No GRNs found. Create your first GRN to receive goods.
                                    </td>
                                </tr>
                            ) : (
                                grns.map((grn) => (
                                    <tr key={grn.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{grn.grnNo}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{grn.date}</td>
                                        <td className="px-6 py-4 text-sm text-slate-900">{grn.supplierName}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{grn.items.length} items</td>
                                        <td className="px-6 py-4 text-sm text-slate-900">${grn.grnTotal.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 capitalize">{grn.paymentType}</td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                <CheckCircle size={12} />
                                                Posted
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">GRN Workflow</h3>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Select an approved Purchase Order or create standalone GRN</li>
                    <li>Enter received quantities (can differ from ordered quantities)</li>
                    <li>GRN automatically updates stock ledger and inventory balances</li>
                    <li>Accounting entries are posted (Debit: Inventory, Credit: Cash/AP)</li>
                    <li>Purchase Order status updates based on received quantities</li>
                </ol>
            </div>
        </div>
    );
}
