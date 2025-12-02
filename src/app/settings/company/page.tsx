"use client";

import { useState, useEffect } from "react";
import { CompanySettingsService, CompanySettings } from "@/lib/services/CompanySettingsService";
import { CurrencyService, Currency } from "@/lib/services/CurrencyService";
import { toast } from "@/lib/stores/useToast";
import { Save, Building2 } from "lucide-react";

export default function CompanySettingsPage() {
    const [loading, setLoading] = useState(false);
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [formData, setFormData] = useState<Partial<CompanySettings>>({
        companyName: "",
        defaultCurrency: "USD",
        fiscalYearStart: "01-01",
        address: "",
        phone: "",
        email: "",
    });

    useEffect(() => {
        document.title = "Company Settings | Administration | ProductionFlow ERP";
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [settings, currenciesData] = await Promise.all([
                CompanySettingsService.getSettings(),
                CurrencyService.getCurrencies(),
            ]);
            setFormData(settings);
            setCurrencies(currenciesData);
        } catch (error) {
            console.error("Failed to load company settings", error);
            toast.error("Failed to load company settings");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await CompanySettingsService.updateSettings(formData);
            toast.success("Company settings saved successfully!");
        } catch (error) {
            console.error("Error saving", error);
            toast.error("Failed to save settings");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8 flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                    <Building2 size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Company Settings</h1>
                    <p className="text-slate-500">Manage your company profile and preferences</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Company Name *</label>
                        <input
                            type="text"
                            required
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.companyName || ""}
                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                        <textarea
                            rows={3}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.address || ""}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                        <input
                            type="tel"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.phone || ""}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.email || ""}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Default Currency *</label>
                        <select
                            required
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.defaultCurrency}
                            onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value })}
                        >
                            {currencies.map(c => (
                                <option key={c.code} value={c.code}>{c.code} - {c.name} ({c.symbol})</option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-1">This currency will be used across all modules</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Fiscal Year Start</label>
                        <input
                            type="text"
                            placeholder="MM-DD (e.g., 01-01)"
                            pattern="[0-1][0-9]-[0-3][0-9]"
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={formData.fiscalYearStart || ""}
                            onChange={(e) => setFormData({ ...formData, fiscalYearStart: e.target.value })}
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Save size={18} />
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}
