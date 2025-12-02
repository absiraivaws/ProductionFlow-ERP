"use client";

import { useState, useEffect } from "react";
import { COAService, Account, AccountType } from "@/lib/services/COAService";
import { Plus, Edit, Trash2, BookOpen, RefreshCw } from "lucide-react";

export default function ChartOfAccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [filterType, setFilterType] = useState<AccountType | "all">("all");

    const [formData, setFormData] = useState({
        accountCode: "",
        accountName: "",
        type: "asset" as AccountType,
        openingBalance: 0,
        isActive: true,
    });

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        setLoading(true);
        const data = await COAService.getAccounts();
        setAccounts(data);
        setLoading(false);
    };

    const handleOpenModal = (account?: Account) => {
        if (account) {
            setEditingAccount(account);
            setFormData({
                accountCode: account.accountCode,
                accountName: account.accountName,
                type: account.type,
                openingBalance: account.openingBalance,
                isActive: account.isActive,
            });
        } else {
            setEditingAccount(null);
            setFormData({
                accountCode: "",
                accountName: "",
                type: "asset",
                openingBalance: 0,
                isActive: true,
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingAccount) {
            await COAService.updateAccount(editingAccount.id, formData);
        } else {
            await COAService.createAccount(formData);
        }
        setIsModalOpen(false);
        loadAccounts();
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this account?")) {
            await COAService.deleteAccount(id);
            loadAccounts();
        }
    };

    const handleSeedDefault = async () => {
        if (confirm("This will reset the Chart of Accounts to default. Continue?")) {
            await COAService.seedDefaultAccounts();
            loadAccounts();
        }
    };

    const filteredAccounts = filterType === "all"
        ? accounts
        : accounts.filter(a => a.type === filterType);

    const accountsByType = {
        asset: accounts.filter(a => a.type === "asset"),
        liability: accounts.filter(a => a.type === "liability"),
        equity: accounts.filter(a => a.type === "equity"),
        income: accounts.filter(a => a.type === "income"),
        expense: accounts.filter(a => a.type === "expense"),
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-lg text-green-600">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Chart of Accounts</h1>
                        <p className="text-slate-500">Manage your accounting structure</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSeedDefault}
                        className="flex items-center gap-2 bg-slate-600 text-white px-4 py-2 rounded-md hover:bg-slate-700"
                    >
                        <RefreshCw size={18} />
                        Reset to Default
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                        <Plus size={18} />
                        Add Account
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 border-b border-slate-200">
                {["all", "asset", "liability", "equity", "income", "expense"].map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type as any)}
                        className={`px-4 py-2 capitalize font-medium border-b-2 transition-colors ${filterType === type
                                ? "border-green-600 text-green-600"
                                : "border-transparent text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        {type} {type !== "all" && `(${accountsByType[type as AccountType]?.length || 0})`}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-medium text-slate-700">Code</th>
                            <th className="px-6 py-4 font-medium text-slate-700">Account Name</th>
                            <th className="px-6 py-4 font-medium text-slate-700">Type</th>
                            <th className="px-6 py-4 font-medium text-slate-700 text-right">Opening Balance</th>
                            <th className="px-6 py-4 font-medium text-slate-700">Status</th>
                            <th className="px-6 py-4 font-medium text-slate-700 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading accounts...</td></tr>
                        ) : filteredAccounts.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No accounts found.</td></tr>
                        ) : (
                            filteredAccounts.map((account) => (
                                <tr key={account.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-mono text-slate-600">{account.accountCode}</td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{account.accountName}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium border ${account.type === "asset" ? "bg-blue-50 text-blue-700 border-blue-100" :
                                                account.type === "liability" ? "bg-red-50 text-red-700 border-red-100" :
                                                    account.type === "equity" ? "bg-purple-50 text-purple-700 border-purple-100" :
                                                        account.type === "income" ? "bg-green-50 text-green-700 border-green-100" :
                                                            "bg-orange-50 text-orange-700 border-orange-100"
                                            }`}>
                                            {account.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-600">
                                        ${account.openingBalance.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-medium border ${account.isActive
                                                ? "bg-green-50 text-green-700 border-green-100"
                                                : "bg-slate-50 text-slate-700 border-slate-100"
                                            }`}>
                                            {account.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleOpenModal(account)} className="p-2 text-slate-400 hover:text-blue-600">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(account.id)} className="p-2 text-slate-400 hover:text-red-600">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">{editingAccount ? "Edit Account" : "New Account"}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Account Code</label>
                                <input
                                    type="text"
                                    required
                                    disabled={!!editingAccount}
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-slate-50"
                                    value={formData.accountCode}
                                    onChange={(e) => setFormData({ ...formData, accountCode: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Account Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    value={formData.accountName}
                                    onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Account Type</label>
                                <select
                                    required
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as AccountType })}
                                >
                                    <option value="asset">Asset</option>
                                    <option value="liability">Liability</option>
                                    <option value="equity">Equity</option>
                                    <option value="income">Income</option>
                                    <option value="expense">Expense</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Opening Balance</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                                    value={formData.openingBalance}
                                    onChange={(e) => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    className="rounded border-slate-300 text-green-600 focus:ring-green-500"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                />
                                <label htmlFor="isActive" className="text-sm text-slate-700">Active Account</label>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                >
                                    {editingAccount ? "Update Account" : "Create Account"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
