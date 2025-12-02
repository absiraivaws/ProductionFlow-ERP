"use client";

import { useState, useEffect } from "react";
import { AccountBalanceService, AccountBalance } from "@/lib/services/AccountBalanceService";
import { COAService, Account } from "@/lib/services/COAService";
import { Calendar, Building2 } from "lucide-react";

export default function BalanceSheetPage() {
    const [balances, setBalances] = useState<AccountBalance[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        document.title = "Balance Sheet | Reports | ProductionFlow ERP";
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
            balance: bal.totalDebit - bal.totalCredit,
        };
    });

    // Assets (1000-1999) - Debit balance
    const assets = accountsWithBalances.filter(a =>
        a.accountCode.startsWith('1') && a.balance > 0
    );
    const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);

    // Liabilities (2000-2999) - Credit balance
    const liabilities = accountsWithBalances.filter(a =>
        a.accountCode.startsWith('2') && a.balance < 0
    );
    const totalLiabilities = liabilities.reduce((sum, a) => sum + Math.abs(a.balance), 0);

    // Equity (3000-3999) - Credit balance
    const equity = accountsWithBalances.filter(a =>
        a.accountCode.startsWith('3') && a.balance < 0
    );
    const totalEquity = equity.reduce((sum, a) => sum + Math.abs(a.balance), 0);

    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
    const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01;

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Balance Sheet</h1>
                <p className="text-slate-500 mt-1">Assets, Liabilities, and Equity as of date</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-2xl font-bold text-blue-900">${totalAssets.toFixed(2)}</div>
                    <div className="text-sm text-blue-600">Total Assets</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="text-2xl font-bold text-red-900">${totalLiabilities.toFixed(2)}</div>
                    <div className="text-sm text-red-600">Total Liabilities</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="text-2xl font-bold text-purple-900">${totalEquity.toFixed(2)}</div>
                    <div className="text-sm text-purple-600">Total Equity</div>
                </div>
            </div>

            {/* Date Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-4">
                    <Calendar size={20} className="text-slate-400" />
                    <label className="text-sm font-medium text-slate-700">As of Date:</label>
                    <input
                        type="date"
                        value={asOfDate}
                        onChange={(e) => setAsOfDate(e.target.value)}
                        className="px-3 py-2 border border-slate-300 rounded-lg"
                    />
                </div>
            </div>

            {/* Balance Sheet */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assets Side */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Assets</h3>
                    <table className="w-full text-sm">
                        <tbody className="divide-y divide-slate-100">
                            {assets.map(acc => (
                                <tr key={acc.accountId}>
                                    <td className="py-2 text-slate-900">{acc.accountName}</td>
                                    <td className="py-2 text-right text-blue-600 font-medium">
                                        ${acc.balance.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                            <tr className="font-semibold bg-blue-50">
                                <td className="py-3 text-slate-900">Total Assets</td>
                                <td className="py-3 text-right text-blue-900">${totalAssets.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Liabilities & Equity Side */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Liabilities & Equity</h3>
                    <table className="w-full text-sm">
                        <tbody className="divide-y divide-slate-100">
                            {/* Liabilities */}
                            <tr className="bg-slate-50">
                                <td colSpan={2} className="py-2 font-medium text-slate-700">Liabilities</td>
                            </tr>
                            {liabilities.map(acc => (
                                <tr key={acc.accountId}>
                                    <td className="py-2 text-slate-900 pl-4">{acc.accountName}</td>
                                    <td className="py-2 text-right text-red-600 font-medium">
                                        ${Math.abs(acc.balance).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                            <tr className="font-semibold bg-red-50">
                                <td className="py-3 text-slate-900">Total Liabilities</td>
                                <td className="py-3 text-right text-red-900">${totalLiabilities.toFixed(2)}</td>
                            </tr>

                            {/* Equity */}
                            <tr className="bg-slate-50">
                                <td colSpan={2} className="py-2 font-medium text-slate-700">Equity</td>
                            </tr>
                            {equity.map(acc => (
                                <tr key={acc.accountId}>
                                    <td className="py-2 text-slate-900 pl-4">{acc.accountName}</td>
                                    <td className="py-2 text-right text-purple-600 font-medium">
                                        ${Math.abs(acc.balance).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                            <tr className="font-semibold bg-purple-50">
                                <td className="py-3 text-slate-900">Total Equity</td>
                                <td className="py-3 text-right text-purple-900">${totalEquity.toFixed(2)}</td>
                            </tr>

                            {/* Total */}
                            <tr className="font-bold bg-slate-100">
                                <td className="py-3 text-slate-900">Total Liabilities & Equity</td>
                                <td className="py-3 text-right text-slate-900">${totalLiabilitiesAndEquity.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Balance Check */}
            <div className={`p-4 rounded-lg ${isBalanced ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center justify-between">
                    <span className={`font-semibold ${isBalanced ? 'text-green-900' : 'text-red-900'}`}>
                        {isBalanced ? '✓ Balance Sheet is Balanced' : '✗ Balance Sheet is Unbalanced'}
                    </span>
                    <span className={`text-sm ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                        {isBalanced
                            ? 'Assets = Liabilities + Equity'
                            : `Difference: $${Math.abs(totalAssets - totalLiabilitiesAndEquity).toFixed(2)}`
                        }
                    </span>
                </div>
            </div>
        </div>
    );
}
