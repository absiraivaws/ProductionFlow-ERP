import { AccountBalanceService, AccountBalance } from "./AccountBalanceService";
import { COAService, Account, AccountType } from "./COAService";
import { JournalService } from "./JournalService";

export interface TrialBalanceEntry {
    accountId: string;
    accountCode: string;
    accountName: string;
    accountType: AccountType;
    debit: number;
    credit: number;
}

export interface TrialBalance {
    entries: TrialBalanceEntry[];
    totalDebit: number;
    totalCredit: number;
    isBalanced: boolean;
    asOfDate: string;
}

export interface ProfitLossStatement {
    revenue: {
        accounts: TrialBalanceEntry[];
        total: number;
    };
    expenses: {
        accounts: TrialBalanceEntry[];
        total: number;
    };
    netProfit: number;
    fromDate: string;
    toDate: string;
}

export interface BalanceSheet {
    assets: {
        currentAssets: TrialBalanceEntry[];
        fixedAssets: TrialBalanceEntry[];
        total: number;
    };
    liabilities: {
        currentLiabilities: TrialBalanceEntry[];
        longTermLiabilities: TrialBalanceEntry[];
        total: number;
    };
    equity: {
        accounts: TrialBalanceEntry[];
        retainedEarnings: number;
        total: number;
    };
    asOfDate: string;
}

export const FinancialReportService = {
    /**
     * Generate Trial Balance
     * Lists all accounts with their debit and credit balances
     */
    getTrialBalance: async (asOfDate?: string): Promise<TrialBalance> => {
        const accounts = await COAService.getAccounts();
        const balances = await AccountBalanceService.getAllBalances();

        const entries: TrialBalanceEntry[] = [];
        let totalDebit = 0;
        let totalCredit = 0;

        for (const account of accounts) {
            const balance = balances.find(b => b.accountId === account.id);

            if (balance) {
                const entry: TrialBalanceEntry = {
                    accountId: account.id,
                    accountCode: account.accountCode,
                    accountName: account.accountName,
                    accountType: account.type,
                    debit: balance.totalDebit,
                    credit: balance.totalCredit,
                };

                entries.push(entry);
                totalDebit += balance.totalDebit;
                totalCredit += balance.totalCredit;
            }
        }

        // Sort by account code
        entries.sort((a, b) => a.accountCode.localeCompare(b.accountCode));

        return {
            entries,
            totalDebit,
            totalCredit,
            isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
            asOfDate: asOfDate || new Date().toISOString().split('T')[0],
        };
    },

    /**
     * Generate Profit & Loss Statement
     * Shows revenue and expenses for a period
     */
    getProfitLoss: async (fromDate?: string, toDate?: string): Promise<ProfitLossStatement> => {
        const trialBalance = await FinancialReportService.getTrialBalance();

        // Revenue accounts (income type)
        const revenueAccounts = trialBalance.entries.filter(e => e.accountType === "income");
        const totalRevenue = revenueAccounts.reduce((sum, acc) => {
            // For income accounts, credit increases revenue
            return sum + (acc.credit - acc.debit);
        }, 0);

        // Expense accounts
        const expenseAccounts = trialBalance.entries.filter(e => e.accountType === "expense");
        const totalExpenses = expenseAccounts.reduce((sum, acc) => {
            // For expense accounts, debit increases expenses
            return sum + (acc.debit - acc.credit);
        }, 0);

        const netProfit = totalRevenue - totalExpenses;

        return {
            revenue: {
                accounts: revenueAccounts,
                total: totalRevenue,
            },
            expenses: {
                accounts: expenseAccounts,
                total: totalExpenses,
            },
            netProfit,
            fromDate: fromDate || "2025-01-01",
            toDate: toDate || new Date().toISOString().split('T')[0],
        };
    },

    /**
     * Generate Balance Sheet
     * Shows assets, liabilities, and equity at a point in time
     */
    getBalanceSheet: async (asOfDate?: string): Promise<BalanceSheet> => {
        const trialBalance = await FinancialReportService.getTrialBalance(asOfDate);
        const profitLoss = await FinancialReportService.getProfitLoss();

        // Assets
        const assetAccounts = trialBalance.entries.filter(e => e.accountType === "asset");

        // Categorize assets (simple categorization based on account codes)
        const currentAssets = assetAccounts.filter(a =>
            parseInt(a.accountCode) < 1500 // Accounts below 1500 are current assets
        );
        const fixedAssets = assetAccounts.filter(a =>
            parseInt(a.accountCode) >= 1500 // Accounts 1500+ are fixed assets
        );

        const totalAssets = assetAccounts.reduce((sum, acc) => {
            // For assets, debit increases value
            return sum + (acc.debit - acc.credit);
        }, 0);

        // Liabilities
        const liabilityAccounts = trialBalance.entries.filter(e => e.accountType === "liability");

        // Categorize liabilities
        const currentLiabilities = liabilityAccounts.filter(a =>
            parseInt(a.accountCode) < 2500 // Accounts below 2500 are current liabilities
        );
        const longTermLiabilities = liabilityAccounts.filter(a =>
            parseInt(a.accountCode) >= 2500 // Accounts 2500+ are long-term liabilities
        );

        const totalLiabilities = liabilityAccounts.reduce((sum, acc) => {
            // For liabilities, credit increases value
            return sum + (acc.credit - acc.debit);
        }, 0);

        // Equity
        const equityAccounts = trialBalance.entries.filter(e => e.accountType === "equity");
        const equityFromAccounts = equityAccounts.reduce((sum, acc) => {
            // For equity, credit increases value
            return sum + (acc.credit - acc.debit);
        }, 0);

        // Retained earnings = Net Profit
        const retainedEarnings = profitLoss.netProfit;
        const totalEquity = equityFromAccounts + retainedEarnings;

        return {
            assets: {
                currentAssets,
                fixedAssets,
                total: totalAssets,
            },
            liabilities: {
                currentLiabilities,
                longTermLiabilities,
                total: totalLiabilities,
            },
            equity: {
                accounts: equityAccounts,
                retainedEarnings,
                total: totalEquity,
            },
            asOfDate: asOfDate || new Date().toISOString().split('T')[0],
        };
    },

    /**
     * Verify accounting equation: Assets = Liabilities + Equity
     */
    verifyAccountingEquation: async (): Promise<{
        assets: number;
        liabilities: number;
        equity: number;
        isBalanced: boolean;
        difference: number;
    }> => {
        const balanceSheet = await FinancialReportService.getBalanceSheet();

        const assets = balanceSheet.assets.total;
        const liabilities = balanceSheet.liabilities.total;
        const equity = balanceSheet.equity.total;
        const difference = assets - (liabilities + equity);

        return {
            assets,
            liabilities,
            equity,
            isBalanced: Math.abs(difference) < 0.01,
            difference,
        };
    },

    /**
     * Get financial summary
     */
    getFinancialSummary: async () => {
        const profitLoss = await FinancialReportService.getProfitLoss();
        const balanceSheet = await FinancialReportService.getBalanceSheet();
        const equation = await FinancialReportService.verifyAccountingEquation();

        return {
            revenue: profitLoss.revenue.total,
            expenses: profitLoss.expenses.total,
            netProfit: profitLoss.netProfit,
            totalAssets: balanceSheet.assets.total,
            totalLiabilities: balanceSheet.liabilities.total,
            totalEquity: balanceSheet.equity.total,
            accountingEquationBalanced: equation.isBalanced,
        };
    },
};
