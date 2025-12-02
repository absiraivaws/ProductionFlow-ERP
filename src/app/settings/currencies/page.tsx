"use client";

import { useState, useEffect } from "react";
import { CurrencyService, Currency } from "@/lib/services/CurrencyService";
import { Plus, Edit, Save, X } from "lucide-react";

export default function CurrenciesPage() {
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingCode, setEditingCode] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Currency>>({});

    useEffect(() => {
        document.title = "Currencies | Administration | ProductionFlow ERP";
        loadCurrencies();
    }, []);

    const loadCurrencies = async () => {
        setLoading(true);
        const data = await CurrencyService.getCurrencies();
        setCurrencies(data);
        setLoading(false);
    };

    const handleAdd = () => {
        setFormData({
            code: "",
            name: "",
            symbol: "",
            exchangeRate: 1.0,
            isBase: false,
            isActive: true
        });
        setIsAdding(true);
    };

    const handleEdit = (currency: Currency) => {
        setFormData(currency);
        setEditingCode(currency.code);
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingCode(null);
        setFormData({});
    };

    const handleSave = async () => {
        try {
            if (isAdding) {
                if (!formData.code || !formData.name) return;
                await CurrencyService.addCurrency(formData as Currency);
            } else if (editingCode) {
                await CurrencyService.updateCurrency(editingCode, formData);
            }
            handleCancel();
            loadCurrencies();
        } catch (error: any) {
            alert(error.message);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading currencies...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Currencies</h1>
                    <p className="text-slate-500 mt-1">Manage exchange rates and active currencies</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus size={20} />
                    Add Currency
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-700">Code</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Name</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Symbol</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Exchange Rate</th>
                            <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {isAdding && (
                            <tr className="bg-blue-50">
                                <td className="px-6 py-4">
                                    <input
                                        type="text"
                                        placeholder="USD"
                                        className="w-20 px-2 py-1 border rounded"
                                        value={formData.code || ""}
                                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <input
                                        type="text"
                                        placeholder="US Dollar"
                                        className="w-full px-2 py-1 border rounded"
                                        value={formData.name || ""}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <input
                                        type="text"
                                        placeholder="$"
                                        className="w-12 px-2 py-1 border rounded"
                                        value={formData.symbol || ""}
                                        onChange={e => setFormData({ ...formData, symbol: e.target.value })}
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <input
                                        type="number"
                                        step="0.0001"
                                        className="w-24 px-2 py-1 border rounded"
                                        value={formData.exchangeRate || ""}
                                        onChange={e => setFormData({ ...formData, exchangeRate: parseFloat(e.target.value) })}
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Active</span>
                                </td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-100 rounded">
                                        <Save size={18} />
                                    </button>
                                    <button onClick={handleCancel} className="p-1 text-red-600 hover:bg-red-100 rounded">
                                        <X size={18} />
                                    </button>
                                </td>
                            </tr>
                        )}
                        {currencies.map(currency => (
                            <tr key={currency.code} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-900">
                                    {currency.code}
                                    {currency.isBase && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Base</span>}
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                    {editingCode === currency.code ? (
                                        <input
                                            type="text"
                                            className="w-full px-2 py-1 border rounded"
                                            value={formData.name || ""}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    ) : currency.name}
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                    {editingCode === currency.code ? (
                                        <input
                                            type="text"
                                            className="w-12 px-2 py-1 border rounded"
                                            value={formData.symbol || ""}
                                            onChange={e => setFormData({ ...formData, symbol: e.target.value })}
                                        />
                                    ) : currency.symbol}
                                </td>
                                <td className="px-6 py-4 font-mono text-slate-600">
                                    {editingCode === currency.code ? (
                                        <input
                                            type="number"
                                            step="0.0001"
                                            className="w-24 px-2 py-1 border rounded"
                                            value={formData.exchangeRate || ""}
                                            onChange={e => setFormData({ ...formData, exchangeRate: parseFloat(e.target.value) })}
                                            disabled={currency.isBase}
                                        />
                                    ) : currency.exchangeRate.toFixed(4)}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${currency.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {currency.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {editingCode === currency.code ? (
                                        <div className="flex justify-end gap-2">
                                            <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-100 rounded">
                                                <Save size={18} />
                                            </button>
                                            <button onClick={handleCancel} className="p-1 text-red-600 hover:bg-red-100 rounded">
                                                <X size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleEdit(currency)}
                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                        >
                                            <Edit size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
