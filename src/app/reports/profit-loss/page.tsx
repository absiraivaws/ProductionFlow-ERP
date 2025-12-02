"use client";

import { useState, useEffect } from "react";
import { AccountBalanceService, AccountBalance } from "@/lib/services/AccountBalanceService";
import { COAService, Account } from "@/lib/services/COAService";
import { Calendar, TrendingUp, TrendingDown } from "lucide-react";

export default function ProfitLossPage() {
    const [balances, setBalances] = useState<AccountBalance[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        document.title = "Profit & Loss | Reports | ProductionFlow ERP";
        const firstDayOfYear = new Date(new Date().getFullYear(), 0, 1);
        setFromDate(firstDayOfYear.toISOString().split('T')[0]);
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [balancesData, accountsData] = await Promise.all([
            AccountBalanceService.getAllBalances(),
            COAService.getAccounts(),
        ]);
        setBalances(balancesData);
        setAccounts(accountsData);
        setLoading(false);
    };

    // Merge balances with account details
    const accountsWithBalances = balances.map(bal => {
        const account = accounts.find(a => a.id === bal.accountId);
        return {
            ...bal,
            accountCode: account?.accountCode || "",
            accountName: account?.accountName || bal.accountName,
            accountType: account?.type || "",
        };
    });

    // Revenue accounts (4000-4999)
    const revenue = accountsWithBalances.filter(a =>
        a.accountCode.startsWith('4') && (a.totalCredit - a.totalDebit) > 0
    );
    const totalRevenue = revenue.reduce((sum, a) => sum + (a.totalCredit - a.totalDebit), 0);

    // Expense accounts (5000-5999)
    const expenses = accountsWithBalances.filter(a =>
        a.accountCode.startsWith('5') && (a.totalDebit - a.totalCredit) > 0
    );
    const totalExpenses = expenses.reduce((sum, a) => sum + (a.totalDebit - a.totalCredit), 0);

    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Profit & Loss Statement</h1>
                <p className="text-slate-500 mt-1">Revenue, expenses, and net profit for the period</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="text-green-600" size={20} />
                        <div>
                            <div className="text-2xl font-bold text-green-900">${totalRevenue.toFixed(2)}</div>
                            <div className="text-sm text-green-600">Total Revenue</div>
                        </div>
                    </div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="flex items-center gap-2">
                        <TrendingDown className="text-red-600" size={20} />
                        <div>
                            <div className="text-2xl font-bold text-red-900">${totalExpenses.toFixed(2)}</div>
                            <div className="text-sm text-red-600">Total Expenses</div>
                        </div>
                    </div>
                </div>
                <div className={`rounded-lg p-4 border ${netProfit >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-900' : 'text-amber-900'}`}>
                        ${Math.abs(netProfit).toFixed(2)}
                    </div>
                    <div className={`text-sm ${netProfit >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                        {netProfit >= 0 ? 'Net Profit' : 'Net Loss'}
                    </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="text-2xl font-bold text-purple-900">{profitMargin.toFixed(1)}%</div>
                    <div className="text-sm text-purple-600">Profit Margin</div>
                </div>
            </div>

            {/* Date Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-4">
                    <Calendar size={20} className="text-slate-400" />
                    <label className="text-sm font-medium text-slate-700">Period:</label>
                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg"
                    />
                    <span className="text-slate-500">to</span>
                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg"
                    />
                </div>
            </div>

            {/* P&L Statement */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 space-y-6">
                    {/* Revenue Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Revenue</h3>
                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-slate-100">
                                {revenue.map(acc => (
                                    <tr key={acc.accountId}>
                                        <td className="py-2 text-slate-900">{acc.accountName}</td>
                                        <td className="py-2 text-right text-green-600 font-medium">
                                            ${(acc.totalCredit - acc.totalDebit).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="font-semibold bg-green-50">
                                    <td className="py-3 text-slate-900">Total Revenue</td>
                                    <td className="py-3 text-right text-green-900">${totalRevenue.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Expenses Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3">Expenses</h3>
                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-slate-100">
                                {expenses.map(acc => (
                                    <tr key={acc.accountId}>
                                        <td className="py-2 text-slate-900">{acc.accountName}</td>
                                        <td className="py-2 text-right text-red-600 font-medium">
                                            ${(acc.totalDebit - acc.totalCredit).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="font-semibold bg-red-50">
                                    <td className="py-3 text-slate-900">Total Expenses</td>
                                    <td className="py-3 text-right text-red-900">${totalExpenses.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Net Profit */}
                    <div className={`p-4 rounded-lg ${netProfit >= 0 ? 'bg-blue-50' : 'bg-amber-50'}`}>
                        <div className="flex justify-between items-center">
                            <span className={`text-lg font-bold ${netProfit >= 0 ? 'text-blue-900' : 'text-amber-900'}`}>
                                {netProfit >= 0 ? 'Net Profit' : 'Net Loss'}
                            </span>
                            <span className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-900' : 'text-amber-900'}`}>
                                ${Math.abs(netProfit).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
