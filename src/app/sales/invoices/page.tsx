"use client";

import { useState, useEffect } from "react";
import { InvoiceService, Invoice, InvoiceItem } from "@/lib/services/InvoiceService";
import { CustomerService, Customer } from "@/lib/services/CustomerService";
import { ItemService, Item } from "@/lib/services/ItemService";
import { Plus, Trash2, FileText, AlertCircle, CheckCircle } from "lucide-react";

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        customerId: "",
        customerName: "",
        paymentType: "credit" as "cash" | "credit",
        items: [
            { itemId: "", qty: 0, sellingPrice: 0, costPrice: 0, lineTotal: 0 },
        ] as InvoiceItem[],
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [invoicesData, customersData, itemsData] = await Promise.all([
            InvoiceService.getInvoices(),
            CustomerService.getCustomers(),
            ItemService.getItems(),
        ]);
        setInvoices(invoicesData);
        setCustomers(customersData.filter(c => c.isActive));
        setItems(itemsData.filter(i => i.isActive));
        setLoading(false);
    };

    const handleOpenModal = () => {
        setFormData({
            date: new Date().toISOString().split('T')[0],
            customerId: "",
            customerName: "",
            paymentType: "credit",
            items: [{ itemId: "", qty: 0, sellingPrice: 0, costPrice: 0, lineTotal: 0 }],
        });
        setError(null);
        setSuccess(null);
        setIsModalOpen(true);
    };

    const handleAddItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { itemId: "", qty: 0, sellingPrice: 0, costPrice: 0, lineTotal: 0 }],
        });
    };

    const handleRemoveItem = (index: number) => {
        if (formData.items.length > 1) {
            const newItems = formData.items.filter((_, i) => i !== index);
            setFormData({ ...formData, items: newItems });
        }
    };

    const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };

        // Auto-calculate line total
        if (field === "qty" || field === "sellingPrice") {
            newItems[index].lineTotal = newItems[index].qty * newItems[index].sellingPrice;
        }

        // Auto-fill prices from item master
        if (field === "itemId" && value) {
            const item = items.find(i => i.id === value);
            if (item) {
                newItems[index].sellingPrice = item.sellingPrice;
                newItems[index].costPrice = item.costPrice;
                newItems[index].lineTotal = newItems[index].qty * item.sellingPrice;
                newItems[index].itemName = item.name;
            }
        }

        setFormData({ ...formData, items: newItems });
    };

    const handleCustomerChange = (customerId: string) => {
        const customer = customers.find(c => c.id === customerId);
        setFormData({
            ...formData,
            customerId,
            customerName: customer?.name || "",
        });
    };

    const calculateTotal = () => {
        return formData.items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        // Validate
        if (!formData.customerId) {
            setError("Please select a customer");
            return;
        }

        if (formData.items.some(item => !item.itemId || item.qty <= 0)) {
            setError("All items must have a valid item and quantity");
            return;
        }

        // Check stock availability
        for (const item of formData.items) {
            const stockItem = items.find(i => i.id === item.itemId);
            if (stockItem && stockItem.currentStock < item.qty) {
                setError(`Insufficient stock for ${stockItem.name}. Available: ${stockItem.currentStock}, Required: ${item.qty}`);
                return;
            }
        }

        try {
            await InvoiceService.createInvoice({
                ...formData,
                createdBy: "admin", // mock
            });

            setSuccess("Invoice created successfully! Stock and accounts updated.");
            setTimeout(() => {
                setIsModalOpen(false);
                loadData();
            }, 1500);
        } catch (err: any) {
            setError(err.message || "Failed to create invoice");
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 rounded-lg text-emerald-600">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Sales Invoices</h1>
                        <p className="text-slate-500">Record sales transactions</p>
                    </div>
                </div>
                <button
                    onClick={handleOpenModal}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700"
                >
                    <Plus size={18} />
                    New Invoice
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-medium text-slate-700">Date</th>
                            <th className="px-6 py-4 font-medium text-slate-700">Invoice No</th>
                            <th className="px-6 py-4 font-medium text-slate-700">Customer</th>
                            <th className="px-6 py-4 font-medium text-slate-700">Payment</th>
                            <th className="px-6 py-4 font-medium text-slate-700 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading invoices...</td></tr>
                        ) : invoices.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No invoices found. Create one to get started.</td></tr>
                        ) : (
                            invoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 text-slate-600">{new Date(invoice.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-mono text-slate-600">{invoice.invoiceNo}</td>
                                    <td className="px-6 py-4 text-slate-900">{invoice.customerName}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium border ${invoice.paymentType === 'cash'
                                                ? 'bg-green-50 text-green-700 border-green-100'
                                                : 'bg-amber-50 text-amber-700 border-amber-100'
                                            }`}>
                                            {invoice.paymentType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-600">${invoice.invoiceTotal.toFixed(2)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl p-6 m-4 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">New Sales Invoice</h2>

                        {error && (
                            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md flex items-center gap-2">
                                <CheckCircle size={18} />
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Customer</label>
                                    <select
                                        required
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        value={formData.customerId}
                                        onChange={(e) => handleCustomerChange(e.target.value)}
                                    >
                                        <option value="">Select Customer</option>
                                        {customers.map(customer => (
                                            <option key={customer.id} value={customer.id}>
                                                {customer.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Payment Type</label>
                                    <select
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        value={formData.paymentType}
                                        onChange={(e) => setFormData({ ...formData, paymentType: e.target.value as "cash" | "credit" })}
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="credit">Credit</option>
                                    </select>
                                </div>
                            </div>

                            <div className="border-t border-slate-200 pt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-medium text-slate-900">Items</h3>
                                    <button
                                        type="button"
                                        onClick={handleAddItem}
                                        className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                                    >
                                        <Plus size={16} />
                                        Add Item
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {formData.items.map((item, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                            <div className="col-span-5">
                                                <select
                                                    required
                                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                    value={item.itemId}
                                                    onChange={(e) => handleItemChange(index, "itemId", e.target.value)}
                                                >
                                                    <option value="">Select Item</option>
                                                    {items.map(i => (
                                                        <option key={i.id} value={i.id}>
                                                            {i.sku} - {i.name} (Stock: {i.currentStock})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-span-2">
                                                <input
                                                    type="number"
                                                    step="1"
                                                    min="1"
                                                    placeholder="Qty"
                                                    required
                                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                    value={item.qty || ""}
                                                    onChange={(e) => handleItemChange(index, "qty", parseInt(e.target.value) || 0)}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="Price"
                                                    required
                                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                    value={item.sellingPrice || ""}
                                                    onChange={(e) => handleItemChange(index, "sellingPrice", parseFloat(e.target.value) || 0)}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <input
                                                    type="text"
                                                    disabled
                                                    placeholder="Total"
                                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono bg-slate-50"
                                                    value={item.lineTotal.toFixed(2)}
                                                />
                                            </div>
                                            <div className="col-span-1 flex justify-end">
                                                {formData.items.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(index)}
                                                        className="p-2 text-slate-400 hover:text-red-600"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-200 flex justify-end">
                                    <div className="text-right">
                                        <div className="text-sm text-slate-500">Invoice Total</div>
                                        <div className="text-2xl font-bold text-slate-900">${calculateTotal().toFixed(2)}</div>
                                    </div>
                                </div>
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
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                                >
                                    Create Invoice
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
