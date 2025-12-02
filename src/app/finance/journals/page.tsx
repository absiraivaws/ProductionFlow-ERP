"use client";

import { useState, useEffect } from "react";
import { JournalService, Journal } from "@/lib/services/JournalService";
import { COAService, Account } from "@/lib/services/COAService";
import { Plus, FileText, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Wallet, CreditCard, Banknote } from "lucide-react";

type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";
type PaymentMethod = "CASH" | "BANK" | "CREDIT";

export default function JournalEntriesPage() {
    const [journals, setJournals] = useState<Journal[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        description: "",
        transactionType: "INCOME" as TransactionType,
        paymentMethod: "CASH" as PaymentMethod,
        fromAccount: "",
        amount: 0,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [journalsData, accountsData] = await Promise.all([
            JournalService.getJournals(),
            COAService.getAccounts(),
        ]);
        setJournals(journalsData);
        setAccounts(accountsData.filter(a => a.isActive));
        setLoading(false);
    };

    const handleOpenModal = () => {
        setFormData({
            date: new Date().toISOString().split('T')[0],
            description: "",
            transactionType: "INCOME",
            paymentMethod: "CASH",
            fromAccount: "",
            amount: 0,
        });
        setError(null);
        setSuccess(null);
        setIsModalOpen(true);
    };

    // Get the cash/bank account based on payment method
    const getCashBankAccount = () => {
        switch (formData.paymentMethod) {
            case "CASH":
                return accounts.find(a => a.accountCode === "1001"); // Cash in Hand
            case "BANK":
                return accounts.find(a => a.accountCode === "1002"); // Bank - Current Account
            case "CREDIT":
                return accounts.find(a => a.accountCode === "1200"); // Accounts Receivable
            default:
                return null;
        }
    };

    // Filter accounts based on transaction type
    const getFromAccountOptions = () => {
        switch (formData.transactionType) {
            case "INCOME":
                // For income: From Account is Income account
                return accounts.filter(a => a.type === "income");
            case "EXPENSE":
                // For expense: From Account is Expense account
                return accounts.filter(a => a.type === "expense");
            case "TRANSFER":
                // For transfer: From Account can be any asset
                return accounts.filter(a => a.type === "asset");
            default:
                return accounts;
        }
    };

    const getToAccountOptions = () => {
        // For transfer only
        return accounts.filter(a => a.type === "asset" && a.id !== formData.fromAccount);
    };

    const getTransactionExplanation = () => {
        switch (formData.transactionType) {
            case "INCOME":
                return "Record income received (e.g., sales revenue, service income)";
            case "EXPENSE":
                return "Record expense paid (e.g., rent, utilities, salaries)";
            case "TRANSFER":
                return "Transfer between accounts (e.g., bank to cash, cash to bank)";
            default:
                return "";
        }
    };

    const getAccountLabel = () => {
        switch (formData.transactionType) {
            case "INCOME":
                return "Income Account";
            case "EXPENSE":
                return "Expense Account";
            case "TRANSFER":
                return "From Account";
            default:
                return "Account";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!formData.fromAccount) {
            setError("Please select an account");
            return;
        }

        if (formData.amount <= 0) {
            setError("Amount must be greater than zero");
            return;
        }

        try {
            const fromAccount = accounts.find(a => a.id === formData.fromAccount);
            const cashBankAccount = getCashBankAccount();

            if (!cashBankAccount && formData.transactionType !== "TRANSFER") {
                setError("Cash/Bank account not found in Chart of Accounts");
                return;
            }

            let entries = [];

            if (formData.transactionType === "TRANSFER") {
                // For transfer, we need a "To Account" - we'll use a simple approach
                // In a real implementation, you'd add a toAccount field for transfers
                setError("Transfer functionality requires a 'To Account' field. Please use Income/Expense for now.");
                return;
            }

            switch (formData.transactionType) {
                case "INCOME":
                    // DR: Cash/Bank/AR, CR: Income
                    entries = [
                        {
                            accountId: cashBankAccount!.id,
                            accountName: cashBankAccount!.accountName,
                            debit: formData.amount,
                            credit: 0,
                        },
                        {
                            accountId: formData.fromAccount,
                            accountName: fromAccount?.accountName,
                            debit: 0,
                            credit: formData.amount,
                        },
                    ];
                    break;

                case "EXPENSE":
                    // DR: Expense, CR: Cash/Bank
                    entries = [
                        {
                            accountId: formData.fromAccount,
                            accountName: fromAccount?.accountName,
                            debit: formData.amount,
                            credit: 0,
                        },
                        {
                            accountId: cashBankAccount!.id,
                            accountName: cashBankAccount!.accountName,
                            debit: 0,
                            credit: formData.amount,
                        },
                    ];
                    break;
            }

            await JournalService.createJournal({
                date: formData.date,
                description: formData.description,
                entries,
                createdBy: "admin",
            });

            setSuccess("Journal entry created successfully!");
            setTimeout(() => {
                setIsModalOpen(false);
                loadData();
            }, 1500);
        } catch (err: any) {
            setError(err.message || "Failed to create journal entry");
        }
    };

    const label = getAccountLabel();
    const cashBankAccount = getCashBankAccount();

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Journal Entries</h1>
                        <p className="text-slate-500">Record manual accounting transactions</p>
                    </div>
                </div>
                <button
                    onClick={handleOpenModal}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                    <Plus size={18} />
                    New Journal Entry
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-medium text-slate-700">Date</th>
                            <th className="px-6 py-4 font-medium text-slate-700">Reference</th>
                            <th className="px-6 py-4 font-medium text-slate-700">Description</th>
                            <th className="px-6 py-4 font-medium text-slate-700 text-right">Debit</th>
                            <th className="px-6 py-4 font-medium text-slate-700 text-right">Credit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading journals...</td></tr>
                        ) : journals.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No journal entries found. Create one to get started.</td></tr>
                        ) : (
                            journals.map((journal) => (
                                <tr key={journal.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 text-slate-600">{new Date(journal.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-mono text-slate-600">{journal.referenceNo}</td>
                                    <td className="px-6 py-4 text-slate-900">{journal.description}</td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-600">${journal.totalDebit.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right font-mono text-slate-600">${journal.totalCredit.toFixed(2)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 m-4 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">New Journal Entry</h2>

                        {error && (
                            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md flex items-center gap-2">
                                <CheckCircle size={18} />
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Transaction Type Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Transaction Type *</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, transactionType: "INCOME", fromAccount: "" })}
                                        className={`p-4 rounded-lg border-2 transition-all ${formData.transactionType === "INCOME"
                                                ? "border-green-500 bg-green-50"
                                                : "border-slate-200 hover:border-green-300"
                                            }`}
                                    >
                                        <TrendingUp className={`mx-auto mb-2 ${formData.transactionType === "INCOME" ? "text-green-600" : "text-slate-400"}`} size={24} />
                                        <div className={`font-medium ${formData.transactionType === "INCOME" ? "text-green-900" : "text-slate-600"}`}>Income</div>
                                        <div className="text-xs text-slate-500 mt-1">Money received</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, transactionType: "EXPENSE", fromAccount: "" })}
                                        className={`p-4 rounded-lg border-2 transition-all ${formData.transactionType === "EXPENSE"
                                                ? "border-red-500 bg-red-50"
                                                : "border-slate-200 hover:border-red-300"
                                            }`}
                                    >
                                        <TrendingDown className={`mx-auto mb-2 ${formData.transactionType === "EXPENSE" ? "text-red-600" : "text-slate-400"}`} size={24} />
                                        <div className={`font-medium ${formData.transactionType === "EXPENSE" ? "text-red-900" : "text-slate-600"}`}>Expense</div>
                                        <div className="text-xs text-slate-500 mt-1">Money paid</div>
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">{getTransactionExplanation()}</p>
                            </div>

                            {/* Payment Method Selection (only for Income/Expense) */}
                            {formData.transactionType !== "TRANSFER" && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        {formData.transactionType === "INCOME" ? "Received Via" : "Paid Via"} *
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, paymentMethod: "CASH" })}
                                            className={`p-3 rounded-lg border-2 transition-all ${formData.paymentMethod === "CASH"
                                                    ? "border-blue-500 bg-blue-50"
                                                    : "border-slate-200 hover:border-blue-300"
                                                }`}
                                        >
                                            <Wallet className={`mx-auto mb-1 ${formData.paymentMethod === "CASH" ? "text-blue-600" : "text-slate-400"}`} size={20} />
                                            <div className={`text-sm font-medium ${formData.paymentMethod === "CASH" ? "text-blue-900" : "text-slate-600"}`}>Cash</div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, paymentMethod: "BANK" })}
                                            className={`p-3 rounded-lg border-2 transition-all ${formData.paymentMethod === "BANK"
                                                    ? "border-blue-500 bg-blue-50"
                                                    : "border-slate-200 hover:border-blue-300"
                                                }`}
                                        >
                                            <Banknote className={`mx-auto mb-1 ${formData.paymentMethod === "BANK" ? "text-blue-600" : "text-slate-400"}`} size={20} />
                                            <div className={`text-sm font-medium ${formData.paymentMethod === "BANK" ? "text-blue-900" : "text-slate-600"}`}>Bank</div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, paymentMethod: "CREDIT" })}
                                            className={`p-3 rounded-lg border-2 transition-all ${formData.paymentMethod === "CREDIT"
                                                    ? "border-blue-500 bg-blue-50"
                                                    : "border-slate-200 hover:border-blue-300"
                                                }`}
                                        >
                                            <CreditCard className={`mx-auto mb-1 ${formData.paymentMethod === "CREDIT" ? "text-blue-600" : "text-slate-400"}`} size={20} />
                                            <div className={`text-sm font-medium ${formData.paymentMethod === "CREDIT" ? "text-blue-900" : "text-slate-600"}`}>Credit</div>
                                        </button>
                                    </div>
                                    {cashBankAccount && (
                                        <p className="text-xs text-slate-500 mt-2">
                                            Will use: <span className="font-medium">{cashBankAccount.accountName}</span>
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Date and Amount */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={formData.amount || ""}
                                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="e.g., Monthly rent payment, Sales revenue, etc."
                                />
                            </div>

                            {/* Account Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{label} *</label>
                                <select
                                    required
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formData.fromAccount}
                                    onChange={(e) => setFormData({ ...formData, fromAccount: e.target.value })}
                                >
                                    <option value="">Select account...</option>
                                    {getFromAccountOptions().map(account => (
                                        <option key={account.id} value={account.id}>
                                            {account.accountCode} - {account.accountName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Preview */}
                            {formData.fromAccount && formData.amount > 0 && cashBankAccount && formData.transactionType !== "TRANSFER" && (
                                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                    <h4 className="text-sm font-medium text-slate-700 mb-2">Transaction Preview:</h4>
                                    <div className="space-y-1 text-sm">
                                        {formData.transactionType === "INCOME" && (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-600">DR: {cashBankAccount.accountName}</span>
                                                    <span className="font-mono text-green-600">${formData.amount.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-600">CR: {accounts.find(a => a.id === formData.fromAccount)?.accountName}</span>
                                                    <span className="font-mono text-green-600">${formData.amount.toFixed(2)}</span>
                                                </div>
                                            </>
                                        )}
                                        {formData.transactionType === "EXPENSE" && (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-600">DR: {accounts.find(a => a.id === formData.fromAccount)?.accountName}</span>
                                                    <span className="font-mono text-red-600">${formData.amount.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-600">CR: {cashBankAccount.accountName}</span>
                                                    <span className="font-mono text-red-600">${formData.amount.toFixed(2)}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                >
                                    Create Journal Entry
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
