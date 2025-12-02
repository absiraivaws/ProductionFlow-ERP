"use client";

import { useState, useEffect } from "react";
import { CustomerReceiptService, CustomerReceipt } from "@/lib/services/CustomerReceiptService";
import { CustomerService, Customer } from "@/lib/services/CustomerService";
import { SalesInvoiceService, SalesInvoice } from "@/lib/services/SalesInvoiceService";
import { Plus, Receipt } from "lucide-react";

export default function CustomerReceiptsPage() {
    const [receipts, setReceipts] = useState<CustomerReceipt[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [customerId, setCustomerId] = useState("");
    const [amount, setAmount] = useState(0);
    const [paymentMode, setPaymentMode] = useState<"CASH" | "BANK" | "CHEQUE" | "ONLINE">("CASH");
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [remarks, setRemarks] = useState("");

    useEffect(() => {
        document.title = "Customer Receipts | Finance | ProductionFlow ERP";
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [receiptsData, customersData, invoicesData] = await Promise.all([
            CustomerReceiptService.getCustomerReceipts(),
            CustomerService.getCustomers(true),
            SalesInvoiceService.getSalesInvoices(),
        ]);
        setReceipts(receiptsData);
        setCustomers(customersData);
        setInvoices(invoicesData);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const customer = customers.find(c => c.id === customerId);
            await CustomerReceiptService.createCustomerReceipt({
                customerId,
                customerName: customer?.name,
                amount,
                paymentMode,
                paymentDate,
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
        setCustomerId("");
        setAmount(0);
        setPaymentMode("CASH");
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setRemarks("");
        setShowForm(false);
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Customer Receipts</h1>
                    <p className="text-slate-500 mt-1">Record customer payments and allocate to invoices</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus size={20} />
                    New Receipt
                </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="text-2xl font-bold text-green-900">
                        ${receipts.reduce((sum, r) => sum + r.amount, 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-green-600">Total Receipts</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-2xl font-bold text-blue-900">
                        {receipts.length}
                    </div>
                    <div className="text-sm text-blue-600">Total Transactions</div>
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-xl font-semibold text-slate-900 mb-4">Record Customer Receipt</h2>
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
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Amount *</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(parseFloat(e.target.value))}
                                    step="0.01"
                                    min="0"
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Mode *</label>
                                <select
                                    value={paymentMode}
                                    onChange={(e) => setPaymentMode(e.target.value as any)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="BANK">Bank Transfer</option>
                                    <option value="CHEQUE">Cheque</option>
                                    <option value="ONLINE">Online Payment</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                                <input
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                />
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
                                Record Receipt
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

            {/* Receipts Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-700">Receipt No</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Customer</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Date</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Amount</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Mode</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Remarks</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {receipts.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                    No receipts found
                                </td>
                            </tr>
                        ) : (
                            receipts.map(receipt => (
                                <tr key={receipt.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-blue-600">{receipt.receiptNo}</td>
                                    <td className="px-6 py-4 text-slate-900">{receipt.customerName}</td>
                                    <td className="px-6 py-4 text-slate-600">{receipt.paymentDate}</td>
                                    <td className="px-6 py-4 text-green-600 font-semibold">${receipt.amount.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-slate-600">{receipt.paymentMode}</td>
                                    <td className="px-6 py-4 text-slate-500 text-xs">{receipt.remarks || "-"}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
