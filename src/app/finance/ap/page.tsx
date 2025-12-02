"use client";

import { useState, useEffect } from "react";
import { SupplierPaymentService, SupplierPayment } from "@/lib/services/SupplierPaymentService";
import { SupplierService, Supplier } from "@/lib/services/SupplierService";
import { DollarSign, Filter } from "lucide-react";

export default function AccountsPayablePage() {
    const [payments, setPayments] = useState<SupplierPayment[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterSupplier, setFilterSupplier] = useState("");

    useEffect(() => {
        document.title = "Accounts Payable | Finance | ProductionFlow ERP";
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [paymentsData, suppliersData] = await Promise.all([
            SupplierPaymentService.getSupplierPayments(),
            SupplierService.getSuppliers(true),
        ]);
        setPayments(paymentsData);
        setSuppliers(suppliersData);
        setLoading(false);
    };

    const filteredPayments = payments.filter(p => {
        if (filterSupplier && p.supplierId !== filterSupplier) return false;
        return true;
    });

    const pendingPayments = filteredPayments.filter(p => p.status === "PENDING");
    const totalPayable = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Accounts Payable</h1>
                <p className="text-slate-500 mt-1">Track supplier bills and pending payments</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="text-2xl font-bold text-red-900">
                        ${totalPayable.toFixed(2)}
                    </div>
                    <div className="text-sm text-red-600">Total Payable</div>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <div className="text-2xl font-bold text-amber-900">
                        {pendingPayments.length}
                    </div>
                    <div className="text-sm text-amber-600">Pending Payments</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="text-2xl font-bold text-green-900">
                        {filteredPayments.filter(p => p.status === "PAID").length}
                    </div>
                    <div className="text-sm text-green-600">Paid</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-4">
                    <Filter size={20} className="text-slate-400" />
                    <select
                        value={filterSupplier}
                        onChange={(e) => setFilterSupplier(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg"
                    >
                        <option value="">All Suppliers</option>
                        {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-700">Payment No</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Supplier</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Date</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Amount</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Mode</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredPayments.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                    No payments found
                                </td>
                            </tr>
                        ) : (
                            filteredPayments.map(payment => (
                                <tr key={payment.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-blue-600">{payment.paymentNo}</td>
                                    <td className="px-6 py-4 text-slate-900">{payment.supplierName}</td>
                                    <td className="px-6 py-4 text-slate-600">{payment.paymentDate}</td>
                                    <td className="px-6 py-4 text-slate-900">${payment.amount.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-slate-600">{payment.paymentMode}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${payment.status === "PAID" ? "bg-green-100 text-green-700" :
                                                "bg-amber-100 text-amber-700"
                                            }`}>
                                            {payment.status}
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
