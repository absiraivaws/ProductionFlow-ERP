import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CurrencyState {
    currentCurrency: {
        code: string;
        symbol: string;
        exchangeRate: number;
    };
    setCurrency: (code: string, symbol: string, exchangeRate: number) => void;
}

export const useCurrency = create<CurrencyState>()(
    persist(
        (set) => ({
            currentCurrency: {
                code: 'USD',
                symbol: '$',
                exchangeRate: 1.0,
            },
            setCurrency: (code, symbol, exchangeRate) => set({
                currentCurrency: { code, symbol, exchangeRate }
            }),
        }),
        {
            name: 'currency-storage',
        }
    )
);
