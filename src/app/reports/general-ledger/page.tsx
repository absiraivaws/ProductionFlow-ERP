"use client";

import { useState, useEffect } from "react";
import { JournalService, Journal } from "@/lib/services/JournalService";
import { COAService, Account } from "@/lib/services/COAService";
import { Calendar, Filter, FileText } from "lucide-react";

export default function GeneralLedgerPage() {
    const [journals, setJournals] = useState<Journal[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAccount, setSelectedAccount] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        document.title = "General Ledger | Reports | ProductionFlow ERP";
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        setFromDate(thirtyDaysAgo.toISOString().split('T')[0]);
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [journalsData, accountsData] = await Promise.all([
            JournalService.getJournals(),
            COAService.getAccounts(),
        ]);
        setJournals(journalsData);
        setAccounts(accountsData);
        setLoading(false);
    };

    const filteredTransactions = journals.filter(j => {
        const hasDate = !fromDate || !toDate || (j.date >= fromDate && j.date <= toDate);
        const hasAccount = !selectedAccount || j.entries.some(e => e.accountId === selectedAccount);
        return hasDate && hasAccount;
    }).flatMap(j =>
        j.entries
            .filter(e => !selectedAccount || e.accountId === selectedAccount)
            .map(e => ({
                date: j.date,
                journalNo: j.journalNo,
                description: j.description,
                accountId: e.accountId,
                accountName: e.accountName,
                debit: e.debit,
                credit: e.credit,
            }))
    ).sort((a, b) => a.date.localeCompare(b.date));

    let runningBalance = 0;
    const transactionsWithBalance = filteredTransactions.map(t => {
        runningBalance += (t.debit - t.credit);
        return { ...t, balance: runningBalance };
    });

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">General Ledger</h1>
                <p className="text-slate-500 mt-1">Account-wise transaction listing with running balance</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Account</label>
                        <select
                            value={selectedAccount}
                            onChange={(e) => setSelectedAccount(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        >
                            <option value="">All Accounts</option>
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.accountCode} - {acc.accountName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">From Date</label>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">To Date</label>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        />
                    </div>
                </div>
            </div>

            {/* Ledger Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-700">Date</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Journal No</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Account</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Description</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 text-right">Debit</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 text-right">Credit</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 text-right">Balance</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {transactionsWithBalance.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                    No transactions found
                                </td>
                            </tr>
                        ) : (
                            transactionsWithBalance.map((txn, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 text-slate-600">{txn.date}</td>
                                    <td className="px-6 py-4 font-medium text-blue-600">{txn.journalNo}</td>
                                    <td className="px-6 py-4 text-slate-600 text-xs">{txn.accountName}</td>
                                    <td className="px-6 py-4 text-slate-900">{txn.description}</td>
                                    <td className="px-6 py-4 text-right text-slate-900">
                                        {txn.debit > 0 ? `$${txn.debit.toFixed(2)}` : "-"}
                                    </td>
                                    <td className="px-6 py-4 text-right text-slate-900">
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
