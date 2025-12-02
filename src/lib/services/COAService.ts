import { db } from "@/lib/firebase";
import { collection, doc, setDoc, getDocs, updateDoc, deleteDoc } from "firebase/firestore";

export type AccountType = "asset" | "liability" | "equity" | "income" | "expense";

export interface Account {
    id: string;
    accountCode: string;
    accountName: string;
    type: AccountType;
    parentId?: string;
    isActive: boolean;
    openingBalance: number;
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

// Default Chart of Accounts - Comprehensive for Production ERP
const getDefaultAccounts = (): Account[] => [
    // ===== ASSETS =====
    // Current Assets - Cash & Bank
    { id: "1001", accountCode: "1001", accountName: "Cash in Hand", type: "asset", isActive: true, openingBalance: 0 },
    { id: "1002", accountCode: "1002", accountName: "Bank - Current Account", type: "asset", isActive: true, openingBalance: 0 },
    { id: "1003", accountCode: "1003", accountName: "Bank - Savings Account", type: "asset", isActive: true, openingBalance: 0 },

    // Current Assets - Receivables
    { id: "1200", accountCode: "1200", accountName: "Accounts Receivable (Trade Debtors)", type: "asset", isActive: true, openingBalance: 0 },

    // Current Assets - Inventory
    { id: "1300", accountCode: "1300", accountName: "Inventory - Raw Materials", type: "asset", isActive: true, openingBalance: 0 },
    { id: "1310", accountCode: "1310", accountName: "Inventory - Work in Progress (WIP)", type: "asset", isActive: true, openingBalance: 0 },
    { id: "1320", accountCode: "1320", accountName: "Inventory - Finished Goods", type: "asset", isActive: true, openingBalance: 0 },
    { id: "1330", accountCode: "1330", accountName: "Inventory - Packaging Materials", type: "asset", isActive: true, openingBalance: 0 },

    // Fixed Assets
    { id: "1500", accountCode: "1500", accountName: "Plant & Machinery", type: "asset", isActive: true, openingBalance: 0 },
    { id: "1510", accountCode: "1510", accountName: "Office Equipment", type: "asset", isActive: true, openingBalance: 0 },
    { id: "1520", accountCode: "1520", accountName: "Vehicles", type: "asset", isActive: true, openingBalance: 0 },

    // ===== LIABILITIES =====
    // Current Liabilities
    { id: "2001", accountCode: "2001", accountName: "Accounts Payable (Trade Creditors)", type: "liability", isActive: true, openingBalance: 0 },
    { id: "2100", accountCode: "2100", accountName: "VAT Payable", type: "liability", isActive: true, openingBalance: 0 },
    { id: "2200", accountCode: "2200", accountName: "Accrued Expenses", type: "liability", isActive: true, openingBalance: 0 },

    // Long-term Liabilities
    { id: "2500", accountCode: "2500", accountName: "Bank Loan", type: "liability", isActive: true, openingBalance: 0 },

    // ===== EQUITY =====
    { id: "3001", accountCode: "3001", accountName: "Owner's Capital", type: "equity", isActive: true, openingBalance: 0 },
    { id: "3100", accountCode: "3100", accountName: "Retained Earnings", type: "equity", isActive: true, openingBalance: 0 },

    // ===== INCOME =====
    { id: "4000", accountCode: "4000", accountName: "Sales Revenue - Local", type: "income", isActive: true, openingBalance: 0 },
    { id: "4100", accountCode: "4100", accountName: "Sales Returns", type: "income", isActive: true, openingBalance: 0 },
    { id: "4200", accountCode: "4200", accountName: "Other Income", type: "income", isActive: true, openingBalance: 0 },
    { id: "4300", accountCode: "4300", accountName: "VAT Output Tax", type: "income", isActive: true, openingBalance: 0 },

    // ===== EXPENSES =====
    // Cost of Goods Sold
    { id: "5000", accountCode: "5000", accountName: "Cost of Goods Sold (COGS)", type: "expense", isActive: true, openingBalance: 0 },

    // Direct Production Expenses
    { id: "5100", accountCode: "5100", accountName: "Direct Wages (Factory)", type: "expense", isActive: true, openingBalance: 0 },
    { id: "5200", accountCode: "5200", accountName: "Electricity - Factory", type: "expense", isActive: true, openingBalance: 0 },
    { id: "5210", accountCode: "5210", accountName: "Factory Maintenance", type: "expense", isActive: true, openingBalance: 0 },

    // Administrative Expenses
    { id: "5300", accountCode: "5300", accountName: "Salaries - Administrative", type: "expense", isActive: true, openingBalance: 0 },
    { id: "5310", accountCode: "5310", accountName: "Office Rent", type: "expense", isActive: true, openingBalance: 0 },
    { id: "5320", accountCode: "5320", accountName: "Office Utilities", type: "expense", isActive: true, openingBalance: 0 },
    { id: "5330", accountCode: "5330", accountName: "Office Supplies", type: "expense", isActive: true, openingBalance: 0 },

    // Selling & Distribution Expenses
    { id: "5400", accountCode: "5400", accountName: "Sales Commission", type: "expense", isActive: true, openingBalance: 0 },
    { id: "5410", accountCode: "5410", accountName: "Delivery Expenses", type: "expense", isActive: true, openingBalance: 0 },
    { id: "5420", accountCode: "5420", accountName: "Marketing & Advertising", type: "expense", isActive: true, openingBalance: 0 },

    // VAT Input
    { id: "5500", accountCode: "5500", accountName: "VAT Input Tax", type: "expense", isActive: true, openingBalance: 0 },
];

export const COAService = {
    getAccounts: async (): Promise<Account[]> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 500));
            let accounts = getMockData(`coa_${COMPANY_ID}`);

            // Initialize with default accounts if empty
            if (!accounts || accounts.length === 0) {
                accounts = getDefaultAccounts();
                setMockData(`coa_${COMPANY_ID}`, accounts);
            }

            return accounts;
        }
        return [];
    },

    createAccount: async (account: Omit<Account, "id">) => {
        const newAccount = {
            ...account,
            id: account.accountCode // Use account code as ID
        };

        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const accounts = getMockData(`coa_${COMPANY_ID}`) || [];
            accounts.push(newAccount);
            setMockData(`coa_${COMPANY_ID}`, accounts);
            return newAccount;
        }
    },

    updateAccount: async (accountId: string, updates: Partial<Account>) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const accounts = getMockData(`coa_${COMPANY_ID}`) || [];
            const index = accounts.findIndex((a: Account) => a.id === accountId);
            if (index !== -1) {
                accounts[index] = { ...accounts[index], ...updates };
                setMockData(`coa_${COMPANY_ID}`, accounts);
            }
        }
    },

    deleteAccount: async (accountId: string) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const accounts = getMockData(`coa_${COMPANY_ID}`) || [];
            const filtered = accounts.filter((a: Account) => a.id !== accountId);
            setMockData(`coa_${COMPANY_ID}`, filtered);
        }
    },

    seedDefaultAccounts: async () => {
        if (USE_MOCK) {
            const accounts = getDefaultAccounts();
            setMockData(`coa_${COMPANY_ID}`, accounts);
            return accounts;
        }
    }
};
