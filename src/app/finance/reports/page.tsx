"use client";

import { useState, useEffect } from "react";
import { FinancialReportService, TrialBalance, ProfitLossStatement, BalanceSheet } from "@/lib/services/FinancialReportService";
import { AgingReportService, ARAgingReport, APAgingReport } from "@/lib/services/AgingReportService";
import { FileText, TrendingUp, Scale, DollarSign } from "lucide-react";

export default function FinancialReportsPage() {
    const [activeTab, setActiveTab] = useState<"trial-balance" | "profit-loss" | "balance-sheet" | "aging">("trial-balance");
    const [trialBalance, setTrialBalance] = useState<TrialBalance | null>(null);
    const [profitLoss, setProfitLoss] = useState<ProfitLossStatement | null>(null);
    const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
    const [arAging, setARAging] = useState<ARAgingReport | null>(null);
    const [apAging, setAPAging] = useState<APAgingReport | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        setLoading(true);
        const [tb, pl, bs, ar, ap] = await Promise.all([
            FinancialReportService.getTrialBalance(),
            FinancialReportService.getProfitLoss(),
            FinancialReportService.getBalanceSheet(),
            AgingReportService.getARAgingReport(),
            AgingReportService.getAPAgingReport(),
        ]);
        setTrialBalance(tb);
        setProfitLoss(pl);
        setBalanceSheet(bs);
        setARAging(ar);
        setAPAging(ap);
        setLoading(false);
    };

    if (loading) {
        return <div className="flex items-center justify-center h-full"><div className="text-slate-500">Loading reports...</div></div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Financial Reports</h1>
                <p className="text-slate-500 mt-1">Comprehensive financial statements and analysis</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="text-blue-600" size={20} />
                        <div className="text-sm text-blue-600">Revenue</div>
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                        ${profitLoss?.revenue.total.toFixed(2) || "0.00"}
                    </div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="text-red-600 rotate-180" size={20} />
                        <div className="text-sm text-red-600">Expenses</div>
                    </div>
                    <div className="text-2xl font-bold text-red-900">
                        ${profitLoss?.expenses.total.toFixed(2) || "0.00"}
                    </div>
                </div>
                <div className={`rounded-lg p-4 border ${(profitLoss?.netProfit || 0) >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <DollarSign className={`${(profitLoss?.netProfit || 0) >= 0 ? "text-green-600" : "text-red-600"}`} size={20} />
                        <div className={`text-sm ${(profitLoss?.netProfit || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>Net Profit</div>
                    </div>
                    <div className={`text-2xl font-bold ${(profitLoss?.netProfit || 0) >= 0 ? "text-green-900" : "text-red-900"}`}>
                        ${profitLoss?.netProfit.toFixed(2) || "0.00"}
                    </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                        <Scale className="text-slate-600" size={20} />
                        <div className="text-sm text-slate-600">Total Assets</div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                        ${balanceSheet?.assets.total.toFixed(2) || "0.00"}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab("trial-balance")}
                        className={`px-4 py-2 border-b-2 transition-colors ${activeTab === "trial-balance"
                                ? "border-blue-600 text-blue-600 font-medium"
                                : "border-transparent text-slate-600 hover:text-slate-900"
                            }`}
                    >
                        Trial Balance
                    </button>
                    <button
                        onClick={() => setActiveTab("profit-loss")}
                        className={`px-4 py-2 border-b-2 transition-colors ${activeTab === "profit-loss"
                                ? "border-blue-600 text-blue-600 font-medium"
                                : "border-transparent text-slate-600 hover:text-slate-900"
                            }`}
                    >
                        Profit & Loss
                    </button>
                    <button
                        onClick={() => setActiveTab("balance-sheet")}
                        className={`px-4 py-2 border-b-2 transition-colors ${activeTab === "balance-sheet"
                                ? "border-blue-600 text-blue-600 font-medium"
                                : "border-transparent text-slate-600 hover:text-slate-900"
                            }`}
                    >
                        Balance Sheet
                    </button>
                    <button
                        onClick={() => setActiveTab("aging")}
                        className={`px-4 py-2 border-b-2 transition-colors ${activeTab === "aging"
                                ? "border-blue-600 text-blue-600 font-medium"
                                : "border-transparent text-slate-600 hover:text-slate-900"
                            }`}
                    >
                        AR/AP Aging
                    </button>
                </div>
            </div>

            {/* Trial Balance */}
            {activeTab === "trial-balance" && trialBalance && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-200">
                        <h2 className="text-xl font-semibold text-slate-900">Trial Balance</h2>
                        <p className="text-sm text-slate-500 mt-1">As of {trialBalance.asOfDate}</p>
                        {trialBalance.isBalanced ? (
                            <p className="text-sm text-green-600 mt-2">✓ Books are balanced</p>
                        ) : (
                            <p className="text-sm text-red-600 mt-2">⚠ Books are not balanced!</p>
                        )}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Account Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Debit</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Credit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {trialBalance.entries.map((entry) => (
                                    <tr key={entry.accountId} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-sm text-slate-600">{entry.accountCode}</td>
                                        <td className="px-6 py-4 text-sm text-slate-900">{entry.accountName}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 capitalize">{entry.accountType}</td>
                                        <td className="px-6 py-4 text-sm text-right text-slate-900">
                                            {entry.debit > 0 ? `$${entry.debit.toFixed(2)}` : "-"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right text-slate-900">
                                            {entry.credit > 0 ? `$${entry.credit.toFixed(2)}` : "-"}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-slate-100 font-semibold">
                                    <td colSpan={3} className="px-6 py-4 text-sm text-slate-900">TOTAL</td>
                                    <td className="px-6 py-4 text-sm text-right text-slate-900">${trialBalance.totalDebit.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-sm text-right text-slate-900">${trialBalance.totalCredit.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Profit & Loss */}
            {activeTab === "profit-loss" && profitLoss && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-slate-900">Profit & Loss Statement</h2>
                        <p className="text-sm text-slate-500 mt-1">From {profitLoss.fromDate} to {profitLoss.toDate}</p>
                    </div>

                    {/* Revenue */}
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-slate-900 mb-3">Revenue</h3>
                        <div className="space-y-2">
                            {profitLoss.revenue.accounts.map((acc) => (
                                <div key={acc.accountId} className="flex justify-between text-sm">
                                    <span className="text-slate-700">{acc.accountName}</span>
                                    <span className="text-slate-900 font-medium">${(acc.credit - acc.debit).toFixed(2)}</span>
                                </div>
                            ))}
                            <div className="flex justify-between text-sm font-semibold pt-2 border-t border-slate-200">
                                <span className="text-slate-900">Total Revenue</span>
                                <span className="text-slate-900">${profitLoss.revenue.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Expenses */}
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-slate-900 mb-3">Expenses</h3>
                        <div className="space-y-2">
                            {profitLoss.expenses.accounts.map((acc) => (
                                <div key={acc.accountId} className="flex justify-between text-sm">
                                    <span className="text-slate-700">{acc.accountName}</span>
                                    <span className="text-slate-900 font-medium">${(acc.debit - acc.credit).toFixed(2)}</span>
                                </div>
                            ))}
                            <div className="flex justify-between text-sm font-semibold pt-2 border-t border-slate-200">
                                <span className="text-slate-900">Total Expenses</span>
                                <span className="text-slate-900">${profitLoss.expenses.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Net Profit */}
                    <div className={`p-4 rounded-lg ${profitLoss.netProfit >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                        <div className="flex justify-between items-center">
                            <span className={`text-lg font-semibold ${profitLoss.netProfit >= 0 ? "text-green-900" : "text-red-900"}`}>
                                Net {profitLoss.netProfit >= 0 ? "Profit" : "Loss"}
                            </span>
                            <span className={`text-2xl font-bold ${profitLoss.netProfit >= 0 ? "text-green-900" : "text-red-900"}`}>
                                ${Math.abs(profitLoss.netProfit).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Balance Sheet */}
            {activeTab === "balance-sheet" && balanceSheet && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-slate-900">Balance Sheet</h2>
                        <p className="text-sm text-slate-500 mt-1">As of {balanceSheet.asOfDate}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Assets */}
                        <div>
                            <h3 className="text-lg font-medium text-slate-900 mb-4">Assets</h3>

                            <div className="mb-4">
                                <h4 className="text-sm font-medium text-slate-700 mb-2">Current Assets</h4>
                                <div className="space-y-1">
                                    {balanceSheet.assets.currentAssets.map((acc) => (
                                        <div key={acc.accountId} className="flex justify-between text-sm">
                                            <span className="text-slate-600">{acc.accountName}</span>
                                            <span className="text-slate-900">${(acc.debit - acc.credit).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-4">
                                <h4 className="text-sm font-medium text-slate-700 mb-2">Fixed Assets</h4>
                                <div className="space-y-1">
                                    {balanceSheet.assets.fixedAssets.map((acc) => (
                                        <div key={acc.accountId} className="flex justify-between text-sm">
                                            <span className="text-slate-600">{acc.accountName}</span>
                                            <span className="text-slate-900">${(acc.debit - acc.credit).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-3 border-t-2 border-slate-300">
                                <div className="flex justify-between font-semibold">
                                    <span className="text-slate-900">Total Assets</span>
                                    <span className="text-slate-900">${balanceSheet.assets.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Liabilities & Equity */}
                        <div>
                            <h3 className="text-lg font-medium text-slate-900 mb-4">Liabilities & Equity</h3>

                            <div className="mb-4">
                                <h4 className="text-sm font-medium text-slate-700 mb-2">Current Liabilities</h4>
                                <div className="space-y-1">
                                    {balanceSheet.liabilities.currentLiabilities.map((acc) => (
                                        <div key={acc.accountId} className="flex justify-between text-sm">
                                            <span className="text-slate-600">{acc.accountName}</span>
                                            <span className="text-slate-900">${(acc.credit - acc.debit).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-4">
                                <h4 className="text-sm font-medium text-slate-700 mb-2">Long-term Liabilities</h4>
                                <div className="space-y-1">
                                    {balanceSheet.liabilities.longTermLiabilities.map((acc) => (
                                        <div key={acc.accountId} className="flex justify-between text-sm">
                                            <span className="text-slate-600">{acc.accountName}</span>
                                            <span className="text-slate-900">${(acc.credit - acc.debit).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-4">
                                <h4 className="text-sm font-medium text-slate-700 mb-2">Equity</h4>
                                <div className="space-y-1">
                                    {balanceSheet.equity.accounts.map((acc) => (
                                        <div key={acc.accountId} className="flex justify-between text-sm">
                                            <span className="text-slate-600">{acc.accountName}</span>
                                            <span className="text-slate-900">${(acc.credit - acc.debit).toFixed(2)}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Retained Earnings</span>
                                        <span className="text-slate-900">${balanceSheet.equity.retainedEarnings.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-3 border-t-2 border-slate-300">
                                <div className="flex justify-between font-semibold mb-2">
                                    <span className="text-slate-900">Total Liabilities & Equity</span>
                                    <span className="text-slate-900">${(balanceSheet.liabilities.total + balanceSheet.equity.total).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* AR/AP Aging */}
            {activeTab === "aging" && arAging && apAging && (
                <div className="space-y-6">
                    {/* AR Aging */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-200">
                            <h2 className="text-xl font-semibold text-slate-900">Accounts Receivable Aging</h2>
                            <p className="text-sm text-slate-500 mt-1">As of {arAging.asOfDate}</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Customer</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Current</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">31-60 Days</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">61-90 Days</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">90+ Days</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {arAging.buckets.map((bucket) => (
                                        <tr key={bucket.customerId} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 text-sm text-slate-900">{bucket.customerName}</td>
                                            <td className="px-6 py-4 text-sm text-right text-slate-900">${bucket.current.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-sm text-right text-amber-600">${bucket.days30.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-sm text-right text-orange-600">${bucket.days60.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-sm text-right text-red-600">${bucket.days90Plus.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-sm text-right font-medium text-slate-900">${bucket.total.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-slate-100 font-semibold">
                                        <td className="px-6 py-4 text-sm text-slate-900">TOTAL</td>
                                        <td className="px-6 py-4 text-sm text-right text-slate-900">${arAging.totals.current.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-sm text-right text-slate-900">${arAging.totals.days30.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-sm text-right text-slate-900">${arAging.totals.days60.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-sm text-right text-slate-900">${arAging.totals.days90Plus.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-sm text-right text-slate-900">${arAging.totals.total.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* AP Aging */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-200">
                            <h2 className="text-xl font-semibold text-slate-900">Accounts Payable Aging</h2>
                            <p className="text-sm text-slate-500 mt-1">As of {apAging.asOfDate}</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Supplier</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Current</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">31-60 Days</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">61-90 Days</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">90+ Days</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {apAging.buckets.map((bucket) => (
                                        <tr key={bucket.supplierId} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 text-sm text-slate-900">{bucket.supplierName}</td>
                                            <td className="px-6 py-4 text-sm text-right text-slate-900">${bucket.current.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-sm text-right text-amber-600">${bucket.days30.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-sm text-right text-orange-600">${bucket.days60.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-sm text-right text-red-600">${bucket.days90Plus.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-sm text-right font-medium text-slate-900">${bucket.total.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-slate-100 font-semibold">
                                        <td className="px-6 py-4 text-sm text-slate-900">TOTAL</td>
                                        <td className="px-6 py-4 text-sm text-right text-slate-900">${apAging.totals.current.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-sm text-right text-slate-900">${apAging.totals.days30.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-sm text-right text-slate-900">${apAging.totals.days60.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-sm text-right text-slate-900">${apAging.totals.days90Plus.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-sm text-right text-slate-900">${apAging.totals.total.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
