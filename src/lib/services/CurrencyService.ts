import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";

export interface Currency {
    code: string; // USD, EUR, GBP
    name: string;
    symbol: string;
    exchangeRate: number; // Rate relative to base currency (1.0 for base)
    isBase: boolean;
    isActive: boolean;
}

const USE_MOCK = process.env.NEXT_PUBLIC_FIREBASE_API_KEY === "mock-api-key" || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const COMPANY_ID = "default-company";

// Mock storage helper
const getMockData = (key: string) => {
    if (typeof window === "undefined") return null;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
};

const setMockData = (key: string, data: any) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, JSON.stringify(data));
};

const getDefaultCurrencies = (): Currency[] => [
    { code: "USD", name: "US Dollar", symbol: "$", exchangeRate: 1.0, isBase: true, isActive: true },
    { code: "EUR", name: "Euro", symbol: "€", exchangeRate: 0.85, isBase: false, isActive: true },
    { code: "GBP", name: "British Pound", symbol: "£", exchangeRate: 0.75, isBase: false, isActive: true },
];

export const CurrencyService = {
    getCurrencies: async (): Promise<Currency[]> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            let currencies = getMockData(`currencies_${COMPANY_ID}`);
            if (!currencies || currencies.length === 0) {
                currencies = getDefaultCurrencies();
                setMockData(`currencies_${COMPANY_ID}`, currencies);
            }
            return currencies;
        }
        // Firebase implementation would go here
        return [];
    },

    updateCurrency: async (code: string, updates: Partial<Currency>) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const currencies = getMockData(`currencies_${COMPANY_ID}`) || getDefaultCurrencies();
            const index = currencies.findIndex((c: Currency) => c.code === code);

            if (index !== -1) {
                currencies[index] = { ...currencies[index], ...updates };
                setMockData(`currencies_${COMPANY_ID}`, currencies);
                return currencies[index];
            }
        }
    },

    addCurrency: async (currency: Currency) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const currencies = getMockData(`currencies_${COMPANY_ID}`) || getDefaultCurrencies();
            if (currencies.some((c: Currency) => c.code === currency.code)) {
                throw new Error("Currency already exists");
            }
            currencies.push(currency);
            setMockData(`currencies_${COMPANY_ID}`, currencies);
            return currency;
        }
    },

    getBaseCurrency: async (): Promise<Currency> => {
        const currencies = await CurrencyService.getCurrencies();
        return currencies.find(c => c.isBase) || getDefaultCurrencies()[0];
    }
};
