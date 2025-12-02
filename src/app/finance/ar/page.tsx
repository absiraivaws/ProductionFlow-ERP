"use client";

import { useState, useEffect } from "react";
import { SalesInvoiceService, SalesInvoice } from "@/lib/services/SalesInvoiceService";
import { CustomerService, Customer } from "@/lib/services/CustomerService";
import { DollarSign, Calendar, User, Filter } from "lucide-react";
import Link from "next/link";

export default function AccountsReceivablePage() {
    const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterCustomer, setFilterCustomer] = useState("");
    const [filterStatus, setFilterStatus] = useState<"ALL" | "UNPAID" | "PARTLY_PAID">("ALL");

    useEffect(() => {
        document.title = "Accounts Receivable | Finance | ProductionFlow ERP";
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [invoicesData, customersData] = await Promise.all([
            SalesInvoiceService.getSalesInvoices(),
            CustomerService.getCustomers(true),
        ]);
        setInvoices(invoicesData);
        setCustomers(customersData);
        setLoading(false);
    };

    const filteredInvoices = invoices.filter(inv => {
        if (filterCustomer && inv.customerId !== filterCustomer) return false;
        if (filterStatus === "UNPAID" && inv.status !== "UNPAID") return false;
        if (filterStatus === "PARTLY_PAID" && inv.status !== "PARTLY_PAID") return false;
        return true;
    });

    const totalReceivable = filteredInvoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);
    const overdueInvoices = filteredInvoices.filter(inv => {
        if (!inv.dueDate || inv.balanceAmount <= 0) return false;
        return new Date(inv.dueDate) < new Date();
    });

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Accounts Receivable</h1>
                <p className="text-slate-500 mt-1">Track customer invoices and outstanding payments</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-2xl font-bold text-blue-900">
                        ${totalReceivable.toFixed(2)}
                    </div>
                    <div className="text-sm text-blue-600">Total Receivable</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <div className="text-2xl font-bold text-amber-900">
                        {filteredInvoices.filter(i => i.balanceAmount > 0).length}
                    </div>
                    <div className="text-sm text-amber-600">Outstanding Invoices</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="text-2xl font-bold text-red-900">
                        {overdueInvoices.length}
                    </div>
                    <div className="text-sm text-red-600">Overdue Invoices</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="text-2xl font-bold text-green-900">
                        {filteredInvoices.filter(i => i.status === "PAID").length}
                    </div>
                    <div className="text-sm text-green-600">Paid Invoices</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-4">
                    <Filter size={20} className="text-slate-400" />
                    <select
                        value={filterCustomer}
                        onChange={(e) => setFilterCustomer(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg"
                    >
                        <option value="">All Customers</option>
                        {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="px-3 py-2 border border-slate-300 rounded-lg"
                    >
                        <option value="ALL">All Status</option>
                        <option value="UNPAID">Unpaid</option>
                        <option value="PARTLY_PAID">Partly Paid</option>
                    </select>
                </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-700">Invoice No</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Customer</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Date</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Due Date</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Total</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Paid</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Balance</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredInvoices.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                                    No invoices found
                                </td>
                            </tr>
                        ) : (
                            filteredInvoices.map(invoice => (
                                <tr key={invoice.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-blue-600">
                                        <Link href={`/sales/invoices`}>{invoice.invoiceNo}</Link>
                                    </td>
                                    <td className="px-6 py-4 text-slate-900">{invoice.customerName}</td>
                                    <td className="px-6 py-4 text-slate-600">{invoice.invoiceDate}</td>
                                    <td className="px-6 py-4 text-slate-600">{invoice.dueDate || "-"}</td>
                                    <td className="px-6 py-4 text-slate-900">${invoice.totalAmount.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-green-600">${invoice.paidAmount.toFixed(2)}</td>
                                    <td className="px-6 py-4 font-semibold text-amber-600">${invoice.balanceAmount.toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${invoice.status === "PAID" ? "bg-green-100 text-green-700" :
                                                invoice.status === "PARTLY_PAID" ? "bg-amber-100 text-amber-700" :
                                                    "bg-red-100 text-red-700"
                                            }`}>
                                            {invoice.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
