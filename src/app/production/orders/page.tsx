"use client";

import { useState, useEffect } from "react";
import { ProductionOrderService, ProductionOrder } from "@/lib/services/ProductionOrderService";
import { ItemService, Item } from "@/lib/services/ItemService";
import { LocationService, Location } from "@/lib/services/LocationService";
import { Plus, Play, CheckCircle, XCircle, Package, Clock, Eye, Truck, Factory } from "lucide-react";

export default function ProductionOrdersPage() {
    const [orders, setOrders] = useState<ProductionOrder[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Modal states
    const [showIssueMaterialsModal, setShowIssueMaterialsModal] = useState(false);
    const [showCompleteProductionModal, setShowCompleteProductionModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);

    // Form state
    const [fgItemId, setFgItemId] = useState("");
    const [plannedQty, setPlannedQty] = useState(0);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [outputLocationId, setOutputLocationId] = useState("");
    const [remarks, setRemarks] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [ordersData, itemsData, locationsData] = await Promise.all([
            ProductionOrderService.getProductionOrders(),
            ItemService.getItems(),
            LocationService.getLocations(),
        ]);
        setOrders(ordersData);
        setItems(itemsData);
        setLocations(locationsData);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const fgItem = items.find(i => i.id === fgItemId);
            const location = locations.find(l => l.id === outputLocationId);

            await ProductionOrderService.createProductionOrder({
                fgItemId,
                fgItemName: fgItem?.name,
                plannedQty,
                startDate,
                outputLocationId,
                outputLocationName: location?.name,
                remarks,
                createdBy: "system",
            });

            resetForm();
            loadData();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const resetForm = () => {
        setFgItemId("");
        setPlannedQty(0);
        setStartDate(new Date().toISOString().split('T')[0]);
        setOutputLocationId("");
        setRemarks("");
        setShowForm(false);
    };

    const handleStartProduction = async (orderId: string) => {
        try {
            await ProductionOrderService.startProduction(orderId);
            loadData();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleOpenIssueMaterials = (order: ProductionOrder) => {
        setSelectedOrder(order);
        setShowIssueMaterialsModal(true);
    };

    const handleOpenCompleteProduction = (order: ProductionOrder) => {
        setSelectedOrder(order);
        setShowCompleteProductionModal(true);
    };

    const handleOpenDetails = (order: ProductionOrder) => {
        setSelectedOrder(order);
        setShowDetailsModal(true);
    };

    const canIssueMaterials = (order: ProductionOrder) => {
        return order.status === "IN_PROGRESS" && order.materialLines.some(line => line.issuedQty < line.plannedQty);
    };

    const canCompleteProduction = (order: ProductionOrder) => {
        return order.status === "IN_PROGRESS" && order.materialLines.every(line => line.issuedQty >= line.plannedQty);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PLANNED": return "bg-blue-100 text-blue-700";
            case "IN_PROGRESS": return "bg-amber-100 text-amber-700";
            case "COMPLETED": return "bg-green-100 text-green-700";
            case "CANCELLED": return "bg-red-100 text-red-700";
            default: return "bg-slate-100 text-slate-700";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "PLANNED": return <Clock size={12} />;
            case "IN_PROGRESS": return <Play size={12} />;
            case "COMPLETED": return <CheckCircle size={12} />;
            case "CANCELLED": return <XCircle size={12} />;
            default: return <Package size={12} />;
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
                    <h1 className="text-3xl font-bold text-slate-900">Production Orders</h1>
                    <p className="text-slate-500 mt-1">Manage manufacturing operations</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus size={20} />
                    New Production Order
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-2xl font-bold text-blue-900">
                        {orders.filter(o => o.status === "PLANNED").length}
                    </div>
                    <div className="text-sm text-blue-600">Planned</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <div className="text-2xl font-bold text-amber-900">
                        {orders.filter(o => o.status === "IN_PROGRESS").length}
                    </div>
                    <div className="text-sm text-amber-600">In Progress</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="text-2xl font-bold text-green-900">
                        {orders.filter(o => o.status === "COMPLETED").length}
                    </div>
                    <div className="text-sm text-green-600">Completed</div>
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
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">Create Production Order</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    {items.map(item => (
                                        <option key={item.id} value={item.id}>{item.sku} - {item.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Planned Quantity *
                                </label>
                                <input
                                    type="number"
                                    value={plannedQty}
                                    onChange={(e) => setPlannedQty(parseFloat(e.target.value))}
                                    min="0"
                                    step="0.01"
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Start Date *
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Output Location *
                                </label>
                                <select
                                    value={outputLocationId}
                                    onChange={(e) => setOutputLocationId(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                >
                                    <option value="">Select location...</option>
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                                    ))}
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

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Create Order
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Order No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">BOM</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Planned Qty</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actual Qty</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Start Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                                        No production orders found. Create your first order to get started.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{order.orderNo}</td>
                                        <td className="px-6 py-4 text-sm text-slate-900">{order.fgItemName}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{order.bomNo || "-"}</td>
                                        <td className="px-6 py-4 text-sm text-slate-900">{order.plannedQty}</td>
                                        <td className="px-6 py-4 text-sm text-slate-900">{order.actualQty}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{order.startDate}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                {getStatusIcon(order.status)}
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                {/* Start Production - for PLANNED orders */}
                                                {order.status === "PLANNED" && (
                                                    <button
                                                        onClick={() => handleStartProduction(order.id)}
                                                        className="text-blue-600 hover:text-blue-700"
                                                        title="Start Production"
                                                    >
                                                        <Play size={16} />
                                                    </button>
                                                )}
                                                {/* Issue Materials - for IN_PROGRESS orders with pending materials */}
                                                {canIssueMaterials(order) && (
                                                    <button
                                                        onClick={() => handleOpenIssueMaterials(order)}
                                                        className="text-orange-600 hover:text-orange-700"
                                                        title="Issue Materials"
                                                    >
                                                        <Truck size={16} />
                                                    </button>
                                                )}
                                                {/* Complete Production - for IN_PROGRESS orders with all materials issued */}
                                                {canCompleteProduction(order) && (
                                                    <button
                                                        onClick={() => handleOpenCompleteProduction(order)}
                                                        className="text-green-600 hover:text-green-700"
                                                        title="Complete Production"
                                                    >
                                                        <Factory size={16} />
                                                    </button>
                                                )}
                                                {/* View Details - for all orders */}
                                                <button
                                                    onClick={() => handleOpenDetails(order)}
                                                    className="text-slate-600 hover:text-slate-700"
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
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

            {/* Material Issue Modal */}
            {showIssueMaterialsModal && selectedOrder && (
                <MaterialIssueModal
                    order={selectedOrder}
                    items={items}
                    locations={locations}
                    onClose={() => {
                        setShowIssueMaterialsModal(false);
                        setSelectedOrder(null);
                    }}
                    onSuccess={() => {
                        setShowIssueMaterialsModal(false);
                        setSelectedOrder(null);
                        loadData();
                    }}
                />
            )}

            {/* Production Completion Modal */}
            {showCompleteProductionModal && selectedOrder && (
                <ProductionCompletionModal
                    order={selectedOrder}
                    locations={locations}
                    onClose={() => {
                        setShowCompleteProductionModal(false);
                        setSelectedOrder(null);
                    }}
                    onSuccess={() => {
                        setShowCompleteProductionModal(false);
                        setSelectedOrder(null);
                        loadData();
                    }}
                />
            )}

            {/* Order Details Modal */}
            {showDetailsModal && selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={() => {
                        setShowDetailsModal(false);
                        setSelectedOrder(null);
                    }}
                />
            )}

            {/* Info Box */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Production Workflow</h3>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Create production order (automatically loads BOM and calculates material requirements)</li>
                    <li>Start production (changes status to IN_PROGRESS)</li>
                    <li>Issue materials (deducts from stock, posts to WIP)</li>
                    <li>Complete production (adds finished goods to stock, posts from WIP to FG)</li>
                </ol>
            </div>
        </div>
    );
}

// Material Issue Modal Component
function MaterialIssueModal({
    order,
    items,
    locations,
    onClose,
    onSuccess,
}: {
    order: ProductionOrder;
    items: Item[];
    locations: Location[];
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [materialIssues, setMaterialIssues] = useState(
        order.materialLines.map(line => ({
            rmItemId: line.rmItemId,
            rmItemName: line.rmItemName || "",
            locationId: "",
            locationName: "",
            plannedQty: line.plannedQty,
            issuedQty: line.issuedQty,
            qtyToIssue: line.plannedQty - line.issuedQty,
            unit: line.unit || "",
            unitCost: 0,
        }))
    );
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const issues = materialIssues
                .filter(m => m.qtyToIssue > 0)
                .map(m => {
                    const location = locations.find(l => l.id === m.locationId);
                    return {
                        rmItemId: m.rmItemId,
                        rmItemName: m.rmItemName,
                        locationId: m.locationId,
                        locationName: location?.name || "",
                        qty: m.qtyToIssue,
                        unitCost: m.unitCost,
                    };
                });

            if (issues.length === 0) {
                alert("Please enter quantities to issue");
                setSubmitting(false);
                return;
            }

            await ProductionOrderService.issueMaterials(order.id, issues);
            alert("Materials issued successfully!");
            onSuccess();
        } catch (error: any) {
            alert(error.message);
            setSubmitting(false);
        }
    };

    const updateMaterialIssue = (index: number, field: string, value: any) => {
        const updated = [...materialIssues];
        updated[index] = { ...updated[index], [field]: value };
        setMaterialIssues(updated);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4">
                    <h2 className="text-xl font-semibold text-slate-900">Issue Materials - {order.orderNo}</h2>
                    <p className="text-sm text-slate-500 mt-1">Product: {order.fgItemName}</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Material</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Planned</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Issued</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Remaining</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Location</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Qty to Issue</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Unit Cost</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {materialIssues.map((material, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-3 text-sm text-slate-900">{material.rmItemName}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{material.plannedQty} {material.unit}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{material.issuedQty} {material.unit}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-amber-600">
                                                {material.plannedQty - material.issuedQty} {material.unit}
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={material.locationId}
                                                    onChange={(e) => updateMaterialIssue(index, "locationId", e.target.value)}
                                                    required
                                                    className="w-full px-2 py-1 text-sm border border-slate-300 rounded"
                                                >
                                                    <option value="">Select...</option>
                                                    {locations.map(loc => (
                                                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    value={material.qtyToIssue}
                                                    onChange={(e) => updateMaterialIssue(index, "qtyToIssue", parseFloat(e.target.value) || 0)}
                                                    max={material.plannedQty - material.issuedQty}
                                                    min="0"
                                                    step="0.01"
                                                    className="w-24 px-2 py-1 text-sm border border-slate-300 rounded"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    value={material.unitCost}
                                                    onChange={(e) => updateMaterialIssue(index, "unitCost", parseFloat(e.target.value) || 0)}
                                                    min="0"
                                                    step="0.01"
                                                    className="w-24 px-2 py-1 text-sm border border-slate-300 rounded"
                                                    placeholder="0.00"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300"
                        >
                            {submitting ? "Issuing..." : "Issue Materials"}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Production Completion Modal Component
function ProductionCompletionModal({
    order,
    locations,
    onClose,
    onSuccess,
}: {
    order: ProductionOrder;
    locations: Location[];
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [outputQty, setOutputQty] = useState(order.plannedQty);
    const [outputLocationId, setOutputLocationId] = useState("");
    const [unitCost, setUnitCost] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const location = locations.find(l => l.id === outputLocationId);
            await ProductionOrderService.completeProduction(order.id, {
                fgItemId: order.fgItemId,
                fgItemName: order.fgItemName || "",
                locationId: outputLocationId,
                locationName: location?.name || "",
                qty: outputQty,
                unitCost,
            });
            alert("Production completed successfully!");
            onSuccess();
        } catch (error: any) {
            alert(error.message);
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
                <div className="border-b border-slate-200 px-6 py-4">
                    <h2 className="text-xl font-semibold text-slate-900">Complete Production - {order.orderNo}</h2>
                    <p className="text-sm text-slate-500 mt-1">Product: {order.fgItemName}</p>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <h3 className="font-medium text-blue-900 mb-2">Production Summary</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-blue-600">Planned Quantity:</span>
                                <span className="ml-2 font-semibold text-blue-900">{order.plannedQty}</span>
                            </div>
                            <div>
                                <span className="text-blue-600">Materials Issued:</span>
                                <span className="ml-2 font-semibold text-green-700">✓ Complete</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Actual Output Quantity *
                        </label>
                        <input
                            type="number"
                            value={outputQty}
                            onChange={(e) => setOutputQty(parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Output Location *
                        </label>
                        <select
                            value={outputLocationId}
                            onChange={(e) => setOutputLocationId(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        >
                            <option value="">Select location...</option>
                            {locations.map(loc => (
                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Unit Cost
                        </label>
                        <input
                            type="number"
                            value={unitCost}
                            onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            placeholder="0.00"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Leave as 0 to auto-calculate from material costs
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-200">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-300"
                        >
                            {submitting ? "Completing..." : "Complete Production"}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Order Details Modal Component
function OrderDetailsModal({
    order,
    onClose,
}: {
    order: ProductionOrder;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4">
                    <h2 className="text-xl font-semibold text-slate-900">Production Order Details</h2>
                    <p className="text-sm text-slate-500 mt-1">{order.orderNo}</p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Order Information */}
                    <div>
                        <h3 className="font-semibold text-slate-900 mb-3">Order Information</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-slate-500">Finished Good:</span>
                                <span className="ml-2 font-medium text-slate-900">{order.fgItemName}</span>
                            </div>
                            <div>
                                <span className="text-slate-500">BOM:</span>
                                <span className="ml-2 font-medium text-slate-900">{order.bomNo || "-"}</span>
                            </div>
                            <div>
                                <span className="text-slate-500">Planned Quantity:</span>
                                <span className="ml-2 font-medium text-slate-900">{order.plannedQty}</span>
                            </div>
                            <div>
                                <span className="text-slate-500">Actual Quantity:</span>
                                <span className="ml-2 font-medium text-slate-900">{order.actualQty}</span>
                            </div>
                            <div>
                                <span className="text-slate-500">Start Date:</span>
                                <span className="ml-2 font-medium text-slate-900">{order.startDate}</span>
                            </div>
                            <div>
                                <span className="text-slate-500">End Date:</span>
                                <span className="ml-2 font-medium text-slate-900">{order.endDate || "-"}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-slate-500">Status:</span>
                                <span className={`ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${order.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                                    order.status === "IN_PROGRESS" ? "bg-amber-100 text-amber-700" :
                                        order.status === "PLANNED" ? "bg-blue-100 text-blue-700" :
                                            "bg-slate-100 text-slate-700"
                                    }`}>
                                    {order.status}
                                </span>
                            </div>
                        </div>
                        {order.remarks && (
                            <div className="mt-3">
                                <span className="text-slate-500 text-sm">Remarks:</span>
                                <p className="mt-1 text-sm text-slate-900">{order.remarks}</p>
                            </div>
                        )}
                    </div>

                    {/* Material Lines */}
                    <div>
                        <h3 className="font-semibold text-slate-900 mb-3">Material Requirements</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Material</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Planned Qty</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Issued Qty</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {order.materialLines.map((line, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-3 text-slate-900">{line.rmItemName}</td>
                                            <td className="px-4 py-3 text-slate-600">{line.plannedQty} {line.unit}</td>
                                            <td className="px-4 py-3 text-slate-600">{line.issuedQty} {line.unit}</td>
                                            <td className="px-4 py-3">
                                                {line.issuedQty >= line.plannedQty ? (
                                                    <span className="text-green-600 font-medium">✓ Complete</span>
                                                ) : line.issuedQty > 0 ? (
                                                    <span className="text-amber-600 font-medium">Partial</span>
                                                ) : (
                                                    <span className="text-slate-400">Pending</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Output Lines (if completed) */}
                    {order.outputLines && order.outputLines.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-slate-900 mb-3">Production Output</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Product</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Location</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Quantity</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Unit Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {order.outputLines.map((line, index) => (
                                            <tr key={index}>
                                                <td className="px-4 py-3 text-slate-900">{line.fgItemName}</td>
                                                <td className="px-4 py-3 text-slate-600">{line.locationName}</td>
                                                <td className="px-4 py-3 text-slate-600">{line.qty} {line.unit}</td>
                                                <td className="px-4 py-3 text-slate-600">${line.unitCost?.toFixed(2) || "0.00"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
