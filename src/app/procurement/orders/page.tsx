"use client";

import { useState, useEffect } from "react";
import { PurchaseOrderService, PurchaseOrder, PurchaseOrderLine } from "@/lib/services/PurchaseOrderService";
import { ItemService, Item } from "@/lib/services/ItemService";
import { SupplierService, Supplier } from "@/lib/services/SupplierService";
import { LocationService, Location } from "@/lib/services/LocationService";
import { GRNService, GRN } from "@/lib/services/GRNService";
import { CurrencyService, Currency } from "@/lib/services/CurrencyService";
import { toast } from "@/lib/stores/useToast";
import { Plus, CheckCircle, XCircle, Clock, Package, Truck, FileText, CreditCard, Trash2 } from "lucide-react";
import Link from "next/link";

export default function PurchaseOrdersPage() {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [grns, setGrns] = useState<GRN[]>([]);
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [supplierId, setSupplierId] = useState("");
    const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
    const [deliveryDate, setDeliveryDate] = useState("");
    const [currency, setCurrency] = useState("USD");
    const [remarks, setRemarks] = useState("");
    const [lines, setLines] = useState<Partial<PurchaseOrderLine>[]>([
        { itemId: "", locationId: "", qty: 0, price: 0, taxRate: 0, lineTotal: 0, receivedQty: 0 }
    ]);

    useEffect(() => {
        document.title = "Purchase Orders | Procurement | ProductionFlow ERP";
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [ordersData, itemsData, suppliersData, locationsData, grnsData, currenciesData] = await Promise.all([
            PurchaseOrderService.getPurchaseOrders(),
            ItemService.getItems(),
            SupplierService.getSuppliers(true),
            LocationService.getLocations(),
            GRNService.getGRNs(),
            CurrencyService.getCurrencies(),
        ]);
        setOrders(ordersData);
        setItems(itemsData);
        setSuppliers(suppliersData);
        setLocations(locationsData);
        setGrns(grnsData);
        setCurrencies(currenciesData);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const supplier = suppliers.find(s => s.id === supplierId);
            const selectedCurrency = currencies.find(c => c.code === currency);

            const orderData = {
                supplierId,
                supplierName: supplier?.name,
                poDate,
                deliveryDate,
                currency,
                exchangeRate: selectedCurrency?.exchangeRate || 1.0,
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
                        receivedQty: 0,
                        unit: item?.unit,
                    };
                }),
                remarks,
                createdBy: "system",
            };

            const newOrder = await PurchaseOrderService.createPurchaseOrder(orderData);
            toast.success(`Purchase Order ${newOrder?.poNo || ''} created successfully!`);
            resetForm();
            loadData();
        } catch (error: any) {
            toast.error(`Failed to create purchase order: ${error.message}`);
        }
    };

    const resetForm = () => {
        setSupplierId("");
        setPoDate(new Date().toISOString().split('T')[0]);
        setDeliveryDate("");
        setRemarks("");
        setLines([{ itemId: "", locationId: "", qty: 0, price: 0, taxRate: 0, lineTotal: 0, receivedQty: 0 }]);
        setShowForm(false);
    };

    const handleApprove = async (poId: string) => {
        try {
            await PurchaseOrderService.approvePurchaseOrder(poId);
            loadData();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const addLine = () => {
        setLines([...lines, { itemId: "", locationId: "", qty: 0, price: 0, taxRate: 0, lineTotal: 0, receivedQty: 0 }]);
    };

    const removeLine = (index: number) => {
        setLines(lines.filter((_, i) => i !== index));
    };

    const updateLine = (index: number, field: keyof PurchaseOrderLine, value: any) => {
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
            case "PARTIALLY_RECEIVED": return "bg-amber-100 text-amber-700";
            case "RECEIVED": return "bg-green-100 text-green-700";
            case "CLOSED": return "bg-purple-100 text-purple-700";
            case "CANCELLED": return "bg-red-100 text-red-700";
            default: return "bg-slate-100 text-slate-700";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "DRAFT": return <Clock size={12} />;
            case "APPROVED": return <CheckCircle size={12} />;
            case "PARTIALLY_RECEIVED": return <Truck size={12} />;
            case "RECEIVED": return <Package size={12} />;
            case "CLOSED": return <CheckCircle size={12} />;
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
                    <h1 className="text-3xl font-bold text-slate-900">Purchase Orders</h1>
                    <p className="text-slate-500 mt-1">Manage purchase orders and supplier deliveries</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus size={20} />
                    New Purchase Order
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="text-2xl font-bold text-slate-900">
                        {orders.filter(o => o.status === "DRAFT").length}
                    </div>
                    <div className="text-sm text-slate-600">Draft</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-2xl font-bold text-blue-900">
                        {orders.filter(o => o.status === "APPROVED").length}
                    </div>
                    <div className="text-sm text-blue-600">Approved</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="text-2xl font-bold text-green-900">
                        {orders.filter(o => o.status === "RECEIVED").length}
                    </div>
                    <div className="text-sm text-green-600">Received</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="text-2xl font-bold text-slate-900">
                        {orders.length}
                    </div>
                    <div className="text-sm text-slate-600">Total Orders</div>
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">Create Purchase Order</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Supplier *</label>
                                <select
                                    value={supplierId}
                                    onChange={(e) => {
                                        setSupplierId(e.target.value);
                                        const supplier = suppliers.find(s => s.id === e.target.value);
                                        if (supplier?.defaultCurrency) {
                                            setCurrency(supplier.defaultCurrency);
                                        }
                                    }}
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
                                <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                >
                                    {currencies.map(c => (
                                        <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">PO Date *</label>
                                <input
                                    type="date"
                                    value={poDate}
                                    onChange={(e) => setPoDate(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Delivery Date</label>
                                <input
                                    type="date"
                                    value={deliveryDate}
                                    onChange={(e) => setDeliveryDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                />
                            </div>
                        </div>

                        {/* Order Lines */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-slate-700">Items *</label>
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
                                                {items.filter(item => item.type === "RAW_MATERIAL").map(item => (
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
                                            <button
                                                type="button"
                                                onClick={() => removeLine(index)}
                                                className="text-red-500 hover:text-red-700 p-2"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
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

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Create Purchase Order
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

            {/* Orders List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">PO No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Supplier</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">PO Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Delivery Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                        No purchase orders found. Create your first order to get started.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{order.poNo}</td>
                                        <td className="px-6 py-4 text-sm text-slate-900">{order.supplierName}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{order.poDate}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{order.deliveryDate || "-"}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{order.poDate}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{order.deliveryDate || "-"}</td>
                                        <td className="px-6 py-4 text-sm text-slate-900">{order.currency || "$"} {order.totalAmount.toFixed(2)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                {getStatusIcon(order.status)}
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                {order.status === "DRAFT" && (
                                                    <button
                                                        onClick={() => handleApprove(order.id)}
                                                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                                    >
                                                        Approve
                                                    </button>
                                                )}
                                                {order.status === "APPROVED" && (
                                                    <>
                                                        {grns.some(g => g.poId === order.id) ? (
                                                            <Link
                                                                href="/procurement/grn"
                                                                className="flex items-center gap-1 text-purple-600 hover:text-purple-700 text-sm font-medium"
                                                            >
                                                                <FileText size={14} />
                                                                View GRN
                                                            </Link>
                                                        ) : (
                                                            <button
                                                                onClick={() => alert("Navigate to GRN creation")}
                                                                className="text-green-600 hover:text-green-700 text-sm font-medium"
                                                            >
                                                                Create GRN
                                                            </button>
                                                        )}
                                                    </>
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
        </div>
    );
}
