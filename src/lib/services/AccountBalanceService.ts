import { db } from "@/lib/firebase";
import { AccountType } from "./COAService";

export interface AccountBalance {
    accountId: string;
    accountCode?: string;
    accountName?: string;
    accountType?: AccountType;
    totalDebit: number;
    totalCredit: number;
    balance: number; // Calculated based on account type
    lastUpdated: Date;
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

/**
 * Calculate balance based on account type
 * Assets & Expenses: Debit increases, Credit decreases (balance = debit - credit)
 * Liabilities, Equity & Income: Credit increases, Debit decreases (balance = credit - debit)
 */
const calculateBalance = (accountType: AccountType, totalDebit: number, totalCredit: number): number => {
    if (accountType === "asset" || accountType === "expense") {
        return totalDebit - totalCredit;
    } else {
        // liability, equity, income
        return totalCredit - totalDebit;
    }
};

export const AccountBalanceService = {
    /**
     * Get balance for a specific account
     */
    getAccountBalance: async (accountId: string): Promise<AccountBalance | null> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const balances: AccountBalance[] = getMockData(`account_balances_${COMPANY_ID}`) || [];
            return balances.find(b => b.accountId === accountId) || null;
        }
        return null;
    },

    /**
     * Get all account balances
     */
    getAllBalances: async (): Promise<AccountBalance[]> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            return getMockData(`account_balances_${COMPANY_ID}`) || [];
        }
        return [];
    },

    /**
     * Update account balance after posting a journal entry
     * This should be called by the posting engine
     */
    updateAccountBalance: async (
        accountId: string,
        accountType: AccountType,
        debitAmount: number,
        creditAmount: number,
        accountCode?: string,
        accountName?: string
    ) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const balances: AccountBalance[] = getMockData(`account_balances_${COMPANY_ID}`) || [];
            const existingIndex = balances.findIndex(b => b.accountId === accountId);

            if (existingIndex >= 0) {
                // Update existing balance
                const existing = balances[existingIndex];
                existing.totalDebit += debitAmount;
                existing.totalCredit += creditAmount;
                existing.balance = calculateBalance(accountType, existing.totalDebit, existing.totalCredit);
                existing.lastUpdated = new Date();
            } else {
                // Create new balance
                const newBalance: AccountBalance = {
                    accountId,
                    accountCode,
                    accountName,
                    accountType,
                    totalDebit: debitAmount,
                    totalCredit: creditAmount,
                    balance: calculateBalance(accountType, debitAmount, creditAmount),
                    lastUpdated: new Date(),
                };
                balances.push(newBalance);
            }

            setMockData(`account_balances_${COMPANY_ID}`, balances);
        }
    },

    /**
     * Recalculate all account balances from journal entries
     * Useful for data integrity checks or migrations
     */
    recalculateAllBalances: async () => {
        if (USE_MOCK) {
            // This would query all journal entries and recalculate
            // For now, we'll just clear and let them rebuild
            setMockData(`account_balances_${COMPANY_ID}`, []);
        }
    },

    /**
     * Get balances for a specific account type
     */
    getBalancesByType: async (accountType: AccountType): Promise<AccountBalance[]> => {
        if (USE_MOCK) {
            const balances = await AccountBalanceService.getAllBalances();
            return balances.filter(b => b.accountType === accountType);
        }
        return [];
    },

    /**
     * Get total balance for all accounts of a specific type
     */
    getTotalBalanceByType: async (accountType: AccountType): Promise<number> => {
        const balances = await AccountBalanceService.getBalancesByType(accountType);
        return balances.reduce((sum, b) => sum + b.balance, 0);
    },

    /**
     * Initialize account balances from COA
     * This creates zero-balance entries for all accounts
     */
    initializeFromCOA: async (accounts: Array<{ id: string; accountCode: string; accountName: string; type: AccountType; openingBalance: number }>) => {
        if (USE_MOCK) {
            const balances: AccountBalance[] = [];

            for (const account of accounts) {
                const balance: AccountBalance = {
                    accountId: account.id,
                    accountCode: account.accountCode,
                    accountName: account.accountName,
                    accountType: account.type,
                    totalDebit: account.openingBalance > 0 && (account.type === "asset" || account.type === "expense") ? account.openingBalance : 0,
                    totalCredit: account.openingBalance > 0 && (account.type === "liability" || account.type === "equity" || account.type === "income") ? account.openingBalance : 0,
                    balance: account.openingBalance,
                    lastUpdated: new Date(),
                };
                balances.push(balance);
            }

            setMockData(`account_balances_${COMPANY_ID}`, balances);
            return balances;
        }
    },
};
