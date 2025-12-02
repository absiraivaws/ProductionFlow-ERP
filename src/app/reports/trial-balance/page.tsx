"use client";

import { useState, useEffect } from "react";
import { AccountBalanceService, AccountBalance } from "@/lib/services/AccountBalanceService";
import { COAService, Account } from "@/lib/services/COAService";
import { Calendar, Scale } from "lucide-react";

export default function TrialBalancePage() {
    const [balances, setBalances] = useState<AccountBalance[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        document.title = "Trial Balance | Reports | ProductionFlow ERP";
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
    const trialBalanceData = balances.map(bal => {
        const account = accounts.find(a => a.id === bal.accountId);
        return {
            ...bal,
            accountCode: account?.accountCode || "",
            accountName: account?.accountName || bal.accountName,
            accountType: account?.type || "",
        };
    }).filter(b => b.totalDebit !== 0 || b.totalCredit !== 0); // Only show accounts with balances

    const totalDebit = trialBalanceData.reduce((sum, b) => sum + b.totalDebit, 0);
    const totalCredit = trialBalanceData.reduce((sum, b) => sum + b.totalCredit, 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Trial Balance</h1>
                <p className="text-slate-500 mt-1">Summary of all account balances to verify double-entry</p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-2xl font-bold text-blue-900">${totalDebit.toFixed(2)}</div>
                    <div className="text-sm text-blue-600">Total Debit</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="text-2xl font-bold text-purple-900">${totalCredit.toFixed(2)}</div>
                    <div className="text-sm text-purple-600">Total Credit</div>
                </div>
                <div className={`rounded-lg p-4 border ${isBalanced ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-2">
                        <Scale className={isBalanced ? 'text-green-600' : 'text-red-600'} size={20} />
                        <div>
                            <div className={`text-2xl font-bold ${isBalanced ? 'text-green-900' : 'text-red-900'}`}>
                                {isBalanced ? "Balanced" : "Unbalanced"}
                            </div>
                            <div className={`text-sm ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                                {isBalanced ? "Debits = Credits" : `Difference: $${Math.abs(totalDebit - totalCredit).toFixed(2)}`}
                            </div>
                        </div>
                    </div>
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

            {/* Trial Balance Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-700">Account Code</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Account Name</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Type</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 text-right">Debit</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 text-right">Credit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {trialBalanceData.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                    No account balances found
                                </td>
                            </tr>
                        ) : (
                            <>
                                {trialBalanceData.map((bal) => (
                                    <tr key={bal.accountId} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-900">{bal.accountCode}</td>
                                        <td className="px-6 py-4 text-slate-900">{bal.accountName}</td>
                                        <td className="px-6 py-4 text-slate-600 text-xs">{bal.accountType}</td>
                                        <td className="px-6 py-4 text-right text-slate-900">
                                            {bal.totalDebit > 0 ? `$${bal.totalDebit.toFixed(2)}` : "-"}
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-900">
                                            {bal.totalCredit > 0 ? `$${bal.totalCredit.toFixed(2)}` : "-"}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-slate-100 font-semibold">
                                    <td colSpan={3} className="px-6 py-4 text-slate-900">TOTAL</td>
                                    <td className="px-6 py-4 text-right text-blue-900">${totalDebit.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right text-purple-900">${totalCredit.toFixed(2)}</td>
                                </tr>
                            </>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
