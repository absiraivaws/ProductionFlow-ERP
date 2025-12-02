import { db } from "@/lib/firebase";

export interface CompanySettings {
    id: string;
    companyName: string;
    defaultCurrency: string; // Currency code (USD, EUR, etc.)
    fiscalYearStart: string; // MM-DD format
    taxId?: string;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string;
    updatedAt: Date;
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

// Default company settings
const getDefaultSettings = (): CompanySettings => ({
    id: COMPANY_ID,
    companyName: "ProductionFlow ERP",
    defaultCurrency: "USD",
    fiscalYearStart: "01-01",
    updatedAt: new Date(),
});

export const CompanySettingsService = {
    /**
     * Get company settings
     */
    getSettings: async (): Promise<CompanySettings> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            let settings = getMockData(`company_settings_${COMPANY_ID}`);
            if (!settings) {
                settings = getDefaultSettings();
                setMockData(`company_settings_${COMPANY_ID}`, settings);
            }
            return settings;
        }
        return getDefaultSettings();
    },

    /**
     * Update company settings
     */
    updateSettings: async (updates: Partial<CompanySettings>): Promise<CompanySettings> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const settings = await CompanySettingsService.getSettings();
            const updated = {
                ...settings,
                ...updates,
                updatedAt: new Date(),
            };
            setMockData(`company_settings_${COMPANY_ID}`, updated);
            return updated;
        }
        return getDefaultSettings();
    },

    /**
     * Get default currency
     */
    getDefaultCurrency: async (): Promise<string> => {
        const settings = await CompanySettingsService.getSettings();
        return settings.defaultCurrency;
    },

    /**
     * Set default currency
     */
    setDefaultCurrency: async (currencyCode: string): Promise<void> => {
        await CompanySettingsService.updateSettings({ defaultCurrency: currencyCode });
    },
};
