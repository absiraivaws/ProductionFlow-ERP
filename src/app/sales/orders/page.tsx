"use client";

import { useState, useEffect } from "react";
import { SalesOrderService, SalesOrder, SalesOrderLine } from "@/lib/services/SalesOrderService";
import { ItemService, Item } from "@/lib/services/ItemService";
import { CustomerService, Customer } from "@/lib/services/CustomerService";
import { SalesInvoiceService, SalesInvoice } from "@/lib/services/SalesInvoiceService";
import { toast } from "@/lib/stores/useToast";
import CurrencyAmount from "@/components/CurrencyAmount";
import { Plus, CheckCircle, XCircle, Package, DollarSign, Truck, MoreVertical, Eye, Edit, Trash2, FileText } from "lucide-react";
import Link from "next/link";
import { OrderDetailsModal, PaymentModal, DeliveryModal } from "./modals";

export default function SalesOrdersPage() {
    const [orders, setOrders] = useState<SalesOrder[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Modal states
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showDeliveryModal, setShowDeliveryModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

    // Form state
    const [customerId, setCustomerId] = useState("");
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [deliveryDate, setDeliveryDate] = useState("");
    const [paymentTerm, setPaymentTerm] = useState<"CASH" | "CREDIT">("CREDIT");
    const [remarks, setRemarks] = useState("");
    const [lines, setLines] = useState<Partial<SalesOrderLine>[]>([
        { itemId: "", qty: 0, price: 0, taxRate: 0, lineTotal: 0, deliveredQty: 0 }
    ]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [ordersData, itemsData, customersData, invoicesData] = await Promise.all([
            SalesOrderService.getSalesOrders(),
            ItemService.getItems(),
            CustomerService.getCustomers(),
            SalesInvoiceService.getSalesInvoices(),
        ]);
        setOrders(ordersData);
        setItems(itemsData);
        setCustomers(customersData);
        setInvoices(invoicesData);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const customer = customers.find(c => c.id === customerId);

            const orderData = {
                customerId,
                customerName: customer?.name,
                orderDate,
                deliveryDate,
                paymentTerm,
                status: "DRAFT" as const,
                subtotal: 0,
                taxAmount: 0,
                totalAmount: 0,
                lines: lines.map(line => {
                    const item = items.find(i => i.id === line.itemId);
                    return {
                        itemId: line.itemId!,
                        itemName: item?.name,
                        qty: line.qty!,
                        price: line.price!,
                        taxRate: line.taxRate!,
                        lineTotal: line.lineTotal!,
                        deliveredQty: 0,
                        unit: item?.unit,
                    };
                }),
                remarks,
                createdBy: "system",
            };

            const newOrder = await SalesOrderService.createSalesOrder(orderData);
            toast.success(`Quotation ${newOrder?.orderNo || ''} created successfully!`);
            resetForm();
            loadData();
        } catch (error: any) {
            toast.error(`Failed to create quotation: ${error.message}`);
        }
    };

    const resetForm = () => {
        setCustomerId("");
        setOrderDate(new Date().toISOString().split('T')[0]);
        setDeliveryDate("");
        setPaymentTerm("CREDIT");
        setRemarks("");
        setLines([{ itemId: "", qty: 0, price: 0, taxRate: 0, lineTotal: 0, deliveredQty: 0 }]);
        setShowForm(false);
    };

    const handleConfirmOrder = async (orderId: string) => {
        if (!confirm('Confirm this quotation and create a production order? This will lock the quotation and start the production process.')) return;
        try {
            setOpenDropdown(null);
            const result = await SalesOrderService.confirmSalesOrder(orderId);
            if (result && result.invoice) {
                toast.success(`Order confirmed! Production Order created. Draft Invoice ${result.invoice.invoiceNo} generated.`);
            } else {
                toast.success('Order confirmed and Production Order created successfully!');
            }
            loadData();
        } catch (error: any) {
            toast.error(`Failed to confirm order: ${error.message}`);
        }
    };

    const handleRecordPayment = async (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        setSelectedOrder(order);
        setShowPaymentModal(true);
        setOpenDropdown(null);
    };

    const confirmPayment = async (amount: number) => {
        if (!selectedOrder) return;

        try {
            await SalesOrderService.updateSalesOrder(selectedOrder.id, {
                paymentStatus: "PAID",
            });
            toast.success(`Payment of $${amount.toFixed(2)} recorded successfully!`);
            loadData();
        } catch (error: any) {
            toast.error(`Failed to record payment: ${error.message}`);
        }
    };

    const handleDeliver = async (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        setSelectedOrder(order);
        setShowDeliveryModal(true);
        setOpenDropdown(null);
    };

    const confirmDelivery = async () => {
        if (!selectedOrder) return;

        try {
            await SalesOrderService.deliverSalesOrder(selectedOrder.id);
            toast.success('Order delivered successfully! Stock updated and Invoice posted to GL.');
            loadData();
        } catch (error: any) {
            toast.error(`Failed to deliver order: ${error.message}`);
        }
    };

    const handleCancel = async (orderId: string) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        if (!confirm(`Cancel Order ${order.orderNo}?\n\nThis action cannot be undone.`)) return;

        try {
            setOpenDropdown(null);
            await SalesOrderService.updateSalesOrder(orderId, {
                status: "CANCELLED",
            });
            toast.success(`Order ${order.orderNo} cancelled successfully`);
            loadData();
        } catch (error: any) {
            toast.error(`Failed to cancel order: ${error.message}`);
        }
    };

    const handleDelete = async (orderId: string) => {
        if (!confirm('Are you sure you want to delete this order?')) return;
        try {
            // Note: Delete functionality would need to be added to SalesOrderService
            setNotification({ type: 'error', message: 'Delete functionality coming soon' });
            setTimeout(() => setNotification(null), 3000);
            setOpenDropdown(null);
        } catch (error: any) {
            setNotification({ type: 'error', message: error.message });
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const addLine = () => {
        setLines([...lines, { itemId: "", qty: 0, price: 0, taxRate: 0, lineTotal: 0, deliveredQty: 0 }]);
    };

    const removeLine = (index: number) => {
        setLines(lines.filter((_, i) => i !== index));
    };

    const updateLine = (index: number, field: keyof SalesOrderLine, value: any) => {
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
            case "CONFIRMED": return "bg-blue-100 text-blue-700";
            case "PARTIALLY_DELIVERED": return "bg-amber-100 text-amber-700";
            case "DELIVERED": return "bg-green-100 text-green-700";
            case "INVOICED": return "bg-purple-100 text-purple-700";
            case "CANCELLED": return "bg-red-100 text-red-700";
            default: return "bg-slate-100 text-slate-700";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "DRAFT": return <Clock size={12} />;
            case "CONFIRMED": return <CheckCircle size={12} />;
            case "PARTIALLY_DELIVERED": return <Truck size={12} />;
            case "DELIVERED": return <Package size={12} />;
            case "INVOICED": return <CheckCircle size={12} />;
            case "CANCELLED": return <XCircle size={12} />;
            default: return <Clock size={12} />;
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-full"><div className="text-slate-500">Loading...</div></div>;
    }

    return (
        <>
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                    {notification.message}
                </div>
            )}
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Quotations</h1>
                        <p className="text-slate-500 mt-1">Manage customer quotations and production</p>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Plus size={20} />
                        New Quotation
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
                            {orders.filter(o => o.status === "CONFIRMED").length}
                        </div>
                        <div className="text-sm text-blue-600">Confirmed</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="text-2xl font-bold text-green-900">
                            {orders.filter(o => o.status === "DELIVERED").length}
                        </div>
                        <div className="text-sm text-green-600">Delivered</div>
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
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">Create Quotation</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Customer *</label>
                                    <select
                                        value={customerId}
                                        onChange={(e) => setCustomerId(e.target.value)}
                                        required
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    >
                                        <option value="">Select customer...</option>
                                        {customers.map(customer => (
                                            <option key={customer.id} value={customer.id}>{customer.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Payment Term *</label>
                                    <select
                                        value={paymentTerm}
                                        onChange={(e) => setPaymentTerm(e.target.value as "CASH" | "CREDIT")}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    >
                                        <option value="CASH">Cash</option>
                                        <option value="CREDIT">Credit</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Order Date *</label>
                                    <input
                                        type="date"
                                        value={orderDate}
                                        onChange={(e) => setOrderDate(e.target.value)}
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

                            {/* Column Headers - Hidden on Mobile */}
                            <div className="hidden md:grid md:grid-cols-12 gap-4 mb-2 px-2">
                                <div className="col-span-4 text-xs font-medium text-slate-600">Item</div>
                                <div className="col-span-2 text-xs font-medium text-slate-600">Quantity</div>
                                <div className="col-span-2 text-xs font-medium text-slate-600">Unit Price</div>
                                <div className="col-span-2 text-xs font-medium text-slate-600">Tax %</div>
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
                                                {items.filter(item => item.type === "FINISHED_GOOD").map(item => (
                                                    <option key={item.id} value={item.id}>{item.sku} - {item.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Quantity */}
                                        <div className="col-span-2 mb-3 md:mb-0">
                                            <label className="block text-xs font-medium text-slate-700 mb-1 md:hidden">Quantity</label>
                                            <input
                                                type="number"
                                                value={line.qty}
                                                onChange={(e) => updateLine(index, "qty", e.target.value === "" ? 0 : parseFloat(e.target.value))}
                                                placeholder="Qty"
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
                                                onChange={(e) => updateLine(index, "price", e.target.value === "" ? 0 : parseFloat(e.target.value))}
                                                placeholder="Price"
                                                step="0.01"
                                                min="0"
                                                required
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                            />
                                        </div>

                                        {/* Tax Rate */}
                                        <div className="col-span-2 mb-3 md:mb-0">
                                            <label className="block text-xs font-medium text-slate-700 mb-1 md:hidden">Tax %</label>
                                            <input
                                                type="number"
                                                value={line.taxRate}
                                                onChange={(e) => updateLine(index, "taxRate", e.target.value === "" ? 0 : parseFloat(e.target.value))}
                                                placeholder="Tax %"
                                                step="0.01"
                                                min="0"
                                                max="1"
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
                                                placeholder="Total"
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
                                    Create Quotation
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
                    </div >
                )
                }

                {/* Orders List */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Quotation No</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Customer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Production</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Payment</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                            No sales orders found. Create your first order to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 text-sm font-medium text-slate-900">{order.orderNo}</td>
                                            <td className="px-6 py-4 text-sm text-slate-900">{order.customerName}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600">{order.orderDate}</td>
                                            <td className="px-6 py-4 text-sm text-slate-900"><CurrencyAmount value={order.totalAmount} /></td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                    {getStatusIcon(order.status)}
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {order.productionStatus || "-"}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {order.paymentStatus || "UNPAID"}
                                            </td>
                                            <td className="px-6 py-4 relative">
                                                <button
                                                    onClick={() => setOpenDropdown(openDropdown === order.id ? null : order.id)}
                                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                                >
                                                    <MoreVertical size={18} className="text-slate-600" />
                                                </button>

                                                {/* Dropdown Menu */}
                                                {openDropdown === order.id && (
                                                    <>
                                                        <div
                                                            className="fixed inset-0 z-10"
                                                            onClick={() => setOpenDropdown(null)}
                                                        />
                                                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 z-20">
                                                            <div className="py-1">
                                                                {/* View Details */}
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedOrder(order);
                                                                        setShowDetailsModal(true);
                                                                        setOpenDropdown(null);
                                                                    }}
                                                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                                >
                                                                    <Eye size={16} />
                                                                    View Details
                                                                </button>

                                                                {/* Edit - Only for DRAFT */}
                                                                <button
                                                                    onClick={() => {
                                                                        alert('Edit functionality coming soon');
                                                                        setOpenDropdown(null);
                                                                    }}
                                                                    disabled={order.status !== "DRAFT"}
                                                                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${order.status === "DRAFT"
                                                                        ? 'text-slate-700 hover:bg-slate-50'
                                                                        : 'text-slate-400 cursor-not-allowed'
                                                                        }`}
                                                                >
                                                                    <Edit size={16} />
                                                                    Edit
                                                                </button>

                                                                <div className="border-t border-slate-200 my-1" />

                                                                {/* Confirm & Produce - Only for DRAFT */}
                                                                <button
                                                                    onClick={() => handleConfirmOrder(order.id)}
                                                                    disabled={order.status !== "DRAFT"}
                                                                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${order.status === "DRAFT"
                                                                        ? 'text-blue-600 hover:bg-blue-50'
                                                                        : 'text-slate-400 cursor-not-allowed'
                                                                        }`}
                                                                >
                                                                    <CheckCircle size={16} />
                                                                    Confirm & Produce
                                                                </button>

                                                                {/* Record Payment - Only for CONFIRMED & UNPAID */}
                                                                <button
                                                                    onClick={() => handleRecordPayment(order.id)}
                                                                    disabled={order.status !== "CONFIRMED" || order.paymentStatus === "PAID"}
                                                                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${order.status === "CONFIRMED" && order.paymentStatus !== "PAID"
                                                                        ? 'text-green-600 hover:bg-green-50'
                                                                        : 'text-slate-400 cursor-not-allowed'
                                                                        }`}
                                                                >
                                                                    <Package size={16} />
                                                                    Record Payment
                                                                </button>

                                                                {/* Deliver - Only for CONFIRMED & PAID */}
                                                                <button
                                                                    onClick={() => handleDeliver(order.id)}
                                                                    disabled={order.status !== "CONFIRMED" || (order.paymentTerm === "CASH" && order.paymentStatus !== "PAID")}
                                                                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${order.status === "CONFIRMED" && (order.paymentTerm === "CREDIT" || order.paymentStatus === "PAID")
                                                                        ? 'text-purple-600 hover:bg-purple-50'
                                                                        : 'text-slate-400 cursor-not-allowed'
                                                                        }`}
                                                                >
                                                                    <Truck size={16} />
                                                                    Deliver
                                                                </button>

                                                                {/* View Invoice - If exists */}
                                                                {invoices.find(i => i.salesOrderId === order.id) && (
                                                                    <Link
                                                                        href="/sales/invoices"
                                                                        className="w-full px-4 py-2 text-left text-sm text-indigo-600 hover:bg-indigo-50 flex items-center gap-2"
                                                                    >
                                                                        <FileText size={16} />
                                                                        View Invoice
                                                                    </Link>
                                                                )}

                                                                {/* Create Invoice - Only for DELIVERED and if no invoice exists */}
                                                                {!invoices.find(i => i.salesOrderId === order.id) && (
                                                                    <button
                                                                        onClick={() => {
                                                                            alert('Create invoice functionality coming soon');
                                                                            setOpenDropdown(null);
                                                                        }}
                                                                        disabled={order.status !== "DELIVERED"}
                                                                        className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${order.status === "DELIVERED"
                                                                            ? 'text-indigo-600 hover:bg-indigo-50'
                                                                            : 'text-slate-400 cursor-not-allowed'
                                                                            }`}
                                                                    >
                                                                        <FileText size={16} />
                                                                        Create Invoice
                                                                    </button>
                                                                )}

                                                                <div className="border-t border-slate-200 my-1" />

                                                                {/* Cancel - Not for DELIVERED/INVOICED/CANCELLED */}
                                                                <button
                                                                    onClick={() => handleCancel(order.id)}
                                                                    disabled={["DELIVERED", "INVOICED", "CANCELLED"].includes(order.status)}
                                                                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${!["DELIVERED", "INVOICED", "CANCELLED"].includes(order.status)
                                                                        ? 'text-amber-600 hover:bg-amber-50'
                                                                        : 'text-slate-400 cursor-not-allowed'
                                                                        }`}
                                                                >
                                                                    <XCircle size={16} />
                                                                    Cancel Order
                                                                </button>

                                                                {/* Delete - Only for DRAFT */}
                                                                <button
                                                                    onClick={() => handleDelete(order.id)}
                                                                    disabled={order.status !== "DRAFT"}
                                                                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${order.status === "DRAFT"
                                                                        ? 'text-red-600 hover:bg-red-50'
                                                                        : 'text-slate-400 cursor-not-allowed'
                                                                        }`}
                                                                >
                                                                    <Trash2 size={16} />
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showDetailsModal && selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={() => setShowDetailsModal(false)}
                />
            )}

            {showPaymentModal && selectedOrder && (
                <PaymentModal
                    order={selectedOrder}
                    onClose={() => setShowPaymentModal(false)}
                    onConfirm={confirmPayment}
                />
            )}

            {showDeliveryModal && selectedOrder && (
                <DeliveryModal
                    order={selectedOrder}
                    onClose={() => setShowDeliveryModal(false)}
                    onConfirm={confirmDelivery}
                />
            )}
        </>
    );
}
