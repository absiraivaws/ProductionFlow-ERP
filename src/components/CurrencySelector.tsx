"use client";

import { useCurrency } from "@/lib/stores/useCurrency";
import { CurrencyService, Currency } from "@/lib/services/CurrencyService";
import { useEffect, useState } from "react";
import { DollarSign, ChevronDown } from "lucide-react";

export default function CurrencySelector() {
    const { currentCurrency, setCurrency } = useCurrency();
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        loadCurrencies();
    }, []);

    const loadCurrencies = async () => {
        const data = await CurrencyService.getCurrencies();
        setCurrencies(data.filter(c => c.isActive));
    };

    const handleCurrencyChange = (currency: Currency) => {
        setCurrency(currency.code, currency.symbol, currency.exchangeRate);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
                <DollarSign className="w-4 h-4 text-slate-600" />
                <span className="font-medium text-slate-700">{currentCurrency.code}</span>
                <span className="text-slate-500">{currentCurrency.symbol}</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-20">
                        <div className="p-2">
                            <div className="text-xs font-medium text-slate-500 px-3 py-2">
                                Select Currency
                            </div>
                            {currencies.map((currency) => (
                                <button
                                    key={currency.code}
                                    onClick={() => handleCurrencyChange(currency)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-slate-50 transition-colors ${currentCurrency.code === currency.code ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{currency.code}</span>
                                        <span className="text-sm text-slate-500">{currency.symbol}</span>
                                    </div>
                                    <div className="text-xs text-slate-500">
                                        {currency.name}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
