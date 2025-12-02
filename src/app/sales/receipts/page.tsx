"use client";

import { useState, useEffect } from "react";
import { CustomerReceiptService, CustomerReceipt } from "@/lib/services/CustomerReceiptService";
import { SalesInvoiceService } from "@/lib/services/SalesInvoiceService";
import { CustomerService } from "@/lib/services/CustomerService";
import { Plus, DollarSign } from "lucide-react";

export default function CustomerReceiptsPage() {
    const [receipts, setReceipts] = useState<CustomerReceipt[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [customers, setCustomers] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState("");

    const [formData, setFormData] = useState({
        customerId: "",
        customerName: "",
        receiptDate: new Date().toISOString().split('T')[0],
        paymentMethod: "BANK" as "CASH" | "BANK" | "CHEQUE",
        referenceNo: "",
        amount: 0,
        remarks: "",
        allocations: [] as { invoiceId: string; invoiceNo: string; amount: number }[],
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [receiptsData, customersData] = await Promise.all([
            CustomerReceiptService.getReceipts(),
            CustomerService.getCustomers(),
        ]);
        setReceipts(receiptsData);
        setCustomers(customersData);
        setLoading(false);
    };

    const loadCustomerInvoices = async (customerId: string) => {
        const allInvoices = await SalesInvoiceService.getInvoices();
        const customerInvoices = allInvoices.filter(
            inv => inv.customerId === customerId && inv.status !== "PAID"
        );
        setInvoices(customerInvoices);
    };

    const handleCustomerChange = async (customerId: string) => {
        const customer = customers.find(c => c.id === customerId);
        setSelectedCustomer(customerId);
        setFormData({
            ...formData,
            customerId,
            customerName: customer?.name || "",
            allocations: [],
        });
        if (customerId) {
            await loadCustomerInvoices(customerId);
        } else {
            setInvoices([]);
        }
    };

    const handleAllocate = (invoice: any) => {
        const existing = formData.allocations.find(a => a.invoiceId === invoice.id);
        if (existing) {
            setFormData({
                ...formData,
                allocations: formData.allocations.filter(a => a.invoiceId !== invoice.id),
            });
        } else {
            setFormData({
                ...formData,
                allocations: [
                    ...formData.allocations,
                    {
                        invoiceId: invoice.id,
                        invoiceNo: invoice.invoiceNo,
                        amount: invoice.balanceAmount || invoice.totalAmount,
                    },
                ],
            });
        }
    };

    const getTotalAllocated = () => {
        return formData.allocations.reduce((sum, a) => sum + a.amount, 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (getTotalAllocated() > formData.amount) {
            alert("Total allocated amount cannot exceed receipt amount!");
            return;
        }

        try {
            await CustomerReceiptService.createReceipt({
                ...formData,
                createdBy: "admin",
            });
            resetForm();
            loadData();
            alert("✅ Customer receipt created successfully!");
        } catch (error: any) {
            alert(`❌ Error: ${error.message}`);
        }
    };

    const resetForm = () => {
        setFormData({
            customerId: "",
            customerName: "",
            receiptDate: new Date().toISOString().split('T')[0],
            paymentMethod: "BANK",
            referenceNo: "",
            amount: 0,
            remarks: "",
            allocations: [],
        });
        setSelectedCustomer("");
        setInvoices([]);
        setShowForm(false);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Customer Receipts</h1>
                    <p className="text-slate-500 mt-1">Record payments received from customers</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus size={20} />
                    New Receipt
                </button>
            </div>

            {showForm && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">New Customer Receipt</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Customer *</label>
                                <select
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    value={selectedCustomer}
                                    onChange={(e) => handleCustomerChange(e.target.value)}
                                >
                                    <option value="">Select Customer</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Receipt Date *</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    value={formData.receiptDate}
                                    onChange={(e) => setFormData({ ...formData, receiptDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method *</label>
                                <select
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    value={formData.paymentMethod}
                                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="BANK">Bank Transfer</option>
                                    <option value="CHEQUE">Cheque</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Reference No</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    value={formData.referenceNo}
                                    onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
                                    placeholder="Cheque/Transaction No"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Amount *</label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    min="0"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Remarks</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                    value={formData.remarks}
                                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                />
                            </div>
                        </div>

                        {selectedCustomer && invoices.length > 0 && (
                            <div className="border-t pt-4">
                                <h3 className="font-medium text-slate-900 mb-2">Allocate to Invoices</h3>
                                <div className="space-y-2">
                                    {invoices.map(inv => (
                                        <label key={inv.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50">
                                            <input
                                                type="checkbox"
                                                checked={formData.allocations.some(a => a.invoiceId === inv.id)}
                                                onChange={() => handleAllocate(inv)}
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium">{inv.invoiceNo}</div>
                                                <div className="text-sm text-slate-600">
                                                    Balance: ${(inv.balanceAmount || inv.totalAmount).toFixed(2)}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                    <div className="flex justify-between text-sm">
                                        <span>Total Allocated:</span>
                                        <span className="font-medium">${getTotalAllocated().toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Receipt Amount:</span>
                                        <span className="font-medium">${formData.amount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-bold mt-1">
                                        <span>Unallocated:</span>
                                        <span>${(formData.amount - getTotalAllocated()).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Create Receipt
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

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Receipt No</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Method</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        Loading receipts...
                                    </td>
                                </tr>
                            ) : receipts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        No receipts found. Create one to get started.
                                    </td>
                                </tr>
                            ) : (
                                receipts.map((receipt) => (
                                    <tr key={receipt.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                            {receipt.receiptNo}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {new Date(receipt.receiptDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-900">{receipt.customerName}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{receipt.paymentMethod}</td>
                                        <td className="px-6 py-4 text-sm text-right text-slate-900">
                                            ${receipt.amount.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                                receipt.isPosted
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-yellow-100 text-yellow-700"
                                            }`}>
                                                {receipt.isPosted ? "Posted" : "Draft"}
                                            </span>
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
