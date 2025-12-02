"use client";

import { useState, useEffect } from "react";
import { JournalService, Journal } from "@/lib/services/JournalService";
import { Calendar, TrendingUp, TrendingDown, Building2 } from "lucide-react";

export default function BankBookPage() {
    const [journals, setJournals] = useState<Journal[]>([]);
    const [loading, setLoading] = useState(true);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        document.title = "Bank Book | Finance | ProductionFlow ERP";
        // Set from date to 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        setFromDate(thirtyDaysAgo.toISOString().split('T')[0]);
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const journalsData = await JournalService.getJournals();
        setJournals(journalsData);
        setLoading(false);
    };

    // Filter for bank transactions (account ID 1002 = Bank)
    const bankTransactions = journals.filter(j => {
        const hasDate = !fromDate || !toDate || (j.date >= fromDate && j.date <= toDate);
        const hasBank = j.entries.some(e => e.accountId === "1002");
        return hasDate && hasBank;
    }).flatMap(j =>
        j.entries
            .filter(e => e.accountId === "1002")
            .map(e => ({
                date: j.date,
                description: j.description,
                debit: e.debit,
                credit: e.credit,
                journalNo: j.voucherNo,
            }))
    ).sort((a, b) => a.date.localeCompare(b.date));

    let runningBalance = 0;
    const transactionsWithBalance = bankTransactions.map(t => {
        runningBalance += (t.debit - t.credit);
        return { ...t, balance: runningBalance };
    });

    const totalIn = bankTransactions.reduce((sum, t) => sum + t.debit, 0);
    const totalOut = bankTransactions.reduce((sum, t) => sum + t.credit, 0);

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Bank Book</h1>
                <p className="text-slate-500 mt-1">View all bank transactions and balances</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="text-green-600" size={20} />
                        <div>
                            <div className="text-2xl font-bold text-green-900">${totalIn.toFixed(2)}</div>
                            <div className="text-sm text-green-600">Deposits</div>
                        </div>
                    </div>
                </div>
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <div className="flex items-center gap-2">
                        <TrendingDown className="text-red-600" size={20} />
                        <div>
                            <div className="text-2xl font-bold text-red-900">${totalOut.toFixed(2)}</div>
                            <div className="text-sm text-red-600">Withdrawals</div>
                        </div>
                    </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2">
                        <Building2 className="text-blue-600" size={20} />
                        <div>
                            <div className="text-2xl font-bold text-blue-900">${runningBalance.toFixed(2)}</div>
                            <div className="text-sm text-blue-600">Bank Balance</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Date Filter */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-4">
                    <Calendar size={20} className="text-slate-400" />
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

            {/* Transactions Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-700">Date</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Journal No</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Description</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 text-right">Deposits</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 text-right">Withdrawals</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 text-right">Balance</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {transactionsWithBalance.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                    No bank transactions found
                                </td>
                            </tr>
                        ) : (
                            transactionsWithBalance.map((txn, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 text-slate-600">{txn.date}</td>
                                    <td className="px-6 py-4 font-medium text-blue-600">{txn.journalNo}</td>
                                    <td className="px-6 py-4 text-slate-900">{txn.description}</td>
                                    <td className="px-6 py-4 text-right text-green-600 font-semibold">
                                        {txn.debit > 0 ? `$${txn.debit.toFixed(2)}` : "-"}
                                    </td>
                                    <td className="px-6 py-4 text-right text-red-600 font-semibold">
                                        {txn.credit > 0 ? `$${txn.credit.toFixed(2)}` : "-"}
                                    </td>
                                    <td className="px-6 py-4 text-right font-semibold text-slate-900">
                                        ${txn.balance.toFixed(2)}
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
