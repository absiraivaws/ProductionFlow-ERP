import { JournalService, JournalEntry } from "./JournalService";
import { AccountBalanceService } from "./AccountBalanceService";
import { StockLedgerService, StockTransactionType } from "./StockLedgerService";
import { COAService, AccountType } from "./COAService";

/**
 * Posting Engine Service
 * 
 * This is the core of the double-entry accounting system.
 * It automatically creates journal entries from business transactions
 * and updates account balances and stock ledger.
 */

export interface SalesInvoicePosting {
    invoiceId: string;
    invoiceNo: string;
    date: string;
    customerId: string;
    customerName: string;
    paymentTerm: "CASH" | "CREDIT";
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    lines: Array<{
        itemId: string;
        itemName: string;
        locationId: string;
        qty: number;
        unitCost: number; // For COGS calculation
        totalCost: number; // For COGS calculation
        batchNo?: string;
        serialNos?: string[];
        expiryDate?: string;
    }>;
    currency?: string;
    exchangeRate?: number;
}

export interface PurchaseInvoicePosting {
    invoiceId: string;
    invoiceNo: string;
    date: string;
    supplierId: string;
    supplierName: string;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    inventoryAmount: number; // Amount going to inventory
    expenseAmount: number; // Amount going to expense (if any)
}

export interface PaymentPosting {
    paymentId: string;
    paymentNo: string;
    date: string;
    supplierId: string;
    supplierName: string;
    amount: number;
    paymentMode: "CASH" | "BANK";
    bankAccountId?: string;
}

export interface ReceiptPosting {
    receiptId: string;
    receiptNo: string;
    date: string;
    customerId: string;
    customerName: string;
    amount: number;
    paymentMode: "CASH" | "BANK" | "CHEQUE" | "ONLINE";
    bankAccountId?: string;
}

export interface GRNPosting {
    grnId: string;
    grnNo: string;
    date: string;
    supplierId: string;
    supplierName: string;
    lines: Array<{
        itemId: string;
        itemName: string;
        locationId: string;
        locationName: string;
        qty: number;
        unitCost: number;
        totalCost: number;
    }>;
}

export interface ProductionIssuePosting {
    issueId: string;
    issueNo: string;
    date: string;
    productionOrderNo: string;
    lines: Array<{
        itemId: string;
        itemName: string;
        locationId: string;
        locationName: string;
        qty: number;
        unitCost: number;
        totalCost: number;
    }>;
}

export interface ProductionOutputPosting {
    outputId: string;
    outputNo: string;
    date: string;
    productionOrderNo: string;
    lines: Array<{
        itemId: string;
        itemName: string;
        locationId: string;
        locationName: string;
        qty: number;
        unitCost: number;
        totalCost: number;
    }>;
}

// Default account IDs (these match the comprehensive COA)
const ACCOUNTS = {
    CASH: "1001",
    BANK: "1002",
    ACCOUNTS_RECEIVABLE: "1200",
    INVENTORY_RAW_MATERIALS: "1300",
    INVENTORY_WIP: "1310",
    INVENTORY_FINISHED_GOODS: "1320",
    ACCOUNTS_PAYABLE: "2001",
    VAT_PAYABLE: "2100",
    SALES_REVENUE: "4000",
    COGS: "5000",
};

export const PostingEngineService = {
    /**
     * Post a sales invoice
     * Creates:
     * - DR: AR (if credit) or Cash/Bank (if cash)
     * - CR: Sales Revenue
     * - CR: VAT Output
     * - DR: COGS
     * - CR: Finished Goods Inventory
     */
    postSalesInvoice: async (data: SalesInvoicePosting) => {
        const entries: JournalEntry[] = [];
        const exchangeRate = data.exchangeRate || 1.0;

        // Convert amounts to base currency
        const totalAmountBase = data.totalAmount * exchangeRate;
        const subtotalBase = data.subtotal * exchangeRate;
        const taxAmountBase = data.taxAmount * exchangeRate;

        // 1. Record the sale
        if (data.paymentTerm === "CREDIT") {
            // DR: Accounts Receivable
            entries.push({
                accountId: ACCOUNTS.ACCOUNTS_RECEIVABLE,
                accountName: "Accounts Receivable",
                debit: totalAmountBase,
                credit: 0,
            });
        } else {
            // DR: Cash (assuming cash sale)
            entries.push({
                accountId: ACCOUNTS.CASH,
                accountName: "Cash",
                debit: totalAmountBase,
                credit: 0,
            });
        }

        // CR: Sales Revenue
        entries.push({
            accountId: ACCOUNTS.SALES_REVENUE,
            accountName: "Sales Revenue",
            debit: 0,
            credit: subtotalBase,
        });

        // CR: VAT Output (if applicable)
        if (data.taxAmount > 0) {
            entries.push({
                accountId: ACCOUNTS.VAT_PAYABLE,
                accountName: "VAT Payable",
                debit: 0,
                credit: taxAmountBase,
            });
        }

        // Create journal entry for the sale
        const journal = await JournalService.createJournal({
            date: data.date,
            description: `Sales Invoice ${data.invoiceNo} - ${data.customerName}`,
            entries,
            createdBy: "system",
        });

        // Update account balances
        const accounts = await COAService.getAccounts();
        for (const entry of entries) {
            const account = accounts.find(a => a.id === entry.accountId);
            if (account) {
                await AccountBalanceService.updateAccountBalance(
                    entry.accountId,
                    account.type,
                    entry.debit,
                    entry.credit,
                    account.accountCode,
                    account.accountName
                );
            }
        }

        // 2. Record COGS and reduce inventory
        const cogsEntries: JournalEntry[] = [];
        let totalCOGS = 0;

        for (const line of data.lines) {
            totalCOGS += line.totalCost;

            // Update stock ledger (stock out)
            await StockLedgerService.createEntry({
                itemId: line.itemId,
                itemName: line.itemName,
                locationId: line.locationId,
                txnDate: data.date,
                sourceType: "SALES_INVOICE",
                sourceId: data.invoiceId,
                sourceNo: data.invoiceNo,
                qtyIn: 0,
                qtyOut: line.qty,
                unitCost: line.unitCost,
                totalCost: line.totalCost,
                batchNo: line.batchNo,
                serialNo: line.serialNos ? line.serialNos.join(",") : undefined,
                expiryDate: line.expiryDate,
                remarks: `Sales Invoice ${data.invoiceNo}`,
            });
        }

        // DR: COGS
        cogsEntries.push({
            accountId: ACCOUNTS.COGS,
            accountName: "Cost of Goods Sold",
            debit: totalCOGS,
            credit: 0,
        });

        // CR: Finished Goods Inventory
        cogsEntries.push({
            accountId: ACCOUNTS.INVENTORY_FINISHED_GOODS,
            accountName: "Inventory - Finished Goods",
            debit: 0,
            credit: totalCOGS,
        });

        // Create COGS journal entry
        const cogsJournal = await JournalService.createJournal({
            date: data.date,
            description: `COGS for Invoice ${data.invoiceNo}`,
            entries: cogsEntries,
            createdBy: "system",
        });

        // Update account balances for COGS
        for (const entry of cogsEntries) {
            const account = accounts.find(a => a.id === entry.accountId);
            if (account) {
                await AccountBalanceService.updateAccountBalance(
                    entry.accountId,
                    account.type,
                    entry.debit,
                    entry.credit,
                    account.accountCode,
                    account.accountName
                );
            }
        }

        return { salesJournal: journal, cogsJournal };
    },

    /**
     * Post a purchase invoice (supplier invoice)
     * Creates:
     * - DR: Inventory / Expense
     * - CR: Accounts Payable
     */
    postPurchaseInvoice: async (data: PurchaseInvoicePosting) => {
        const entries: JournalEntry[] = [];

        // DR: Inventory (for goods) or Expense (for services)
        if (data.inventoryAmount > 0) {
            entries.push({
                accountId: ACCOUNTS.INVENTORY_RAW_MATERIALS,
                accountName: "Inventory - Raw Materials",
                debit: data.inventoryAmount,
                credit: 0,
            });
        }

        if (data.expenseAmount > 0) {
            // This would go to a specific expense account
            // For now, using a generic expense account
            entries.push({
                accountId: "5002", // Expense account
                accountName: "Purchases Expense",
                debit: data.expenseAmount,
                credit: 0,
            });
        }

        // CR: Accounts Payable
        entries.push({
            accountId: ACCOUNTS.ACCOUNTS_PAYABLE,
            accountName: "Accounts Payable",
            debit: 0,
            credit: data.totalAmount,
        });

        const journal = await JournalService.createJournal({
            date: data.date,
            description: `Supplier Invoice ${data.invoiceNo} - ${data.supplierName}`,
            entries,
            createdBy: "system",
        });

        // Update account balances
        const accounts = await COAService.getAccounts();
        for (const entry of entries) {
            const account = accounts.find(a => a.id === entry.accountId);
            if (account) {
                await AccountBalanceService.updateAccountBalance(
                    entry.accountId,
                    account.type,
                    entry.debit,
                    entry.credit,
                    account.accountCode,
                    account.accountName
                );
            }
        }

        return journal;
    },

    /**
     * Post a supplier payment
     * Creates:
     * - DR: Accounts Payable
     * - CR: Cash / Bank
     */
    postSupplierPayment: async (data: PaymentPosting) => {
        const entries: JournalEntry[] = [];

        // DR: Accounts Payable
        entries.push({
            accountId: ACCOUNTS.ACCOUNTS_PAYABLE,
            accountName: "Accounts Payable",
            debit: data.amount,
            credit: 0,
        });

        // CR: Cash or Bank
        const cashAccountId = data.paymentMode === "BANK" && data.bankAccountId
            ? data.bankAccountId
            : ACCOUNTS.CASH;

        entries.push({
            accountId: cashAccountId,
            accountName: data.paymentMode === "BANK" ? "Bank" : "Cash",
            debit: 0,
            credit: data.amount,
        });

        const journal = await JournalService.createJournal({
            date: data.date,
            description: `Payment ${data.paymentNo} to ${data.supplierName}`,
            entries,
            createdBy: "system",
        });

        // Update account balances
        const accounts = await COAService.getAccounts();
        for (const entry of entries) {
            const account = accounts.find(a => a.id === entry.accountId);
            if (account) {
                await AccountBalanceService.updateAccountBalance(
                    entry.accountId,
                    account.type,
                    entry.debit,
                    entry.credit,
                    account.accountCode,
                    account.accountName
                );
            }
        }

        return journal;
    },

    /**
     * Post a customer receipt
     * Creates:
     * - DR: Cash / Bank
     * - CR: Accounts Receivable
     */
    postCustomerReceipt: async (data: ReceiptPosting) => {
        const entries: JournalEntry[] = [];

        // DR: Cash or Bank
        const cashAccountId = data.paymentMode === "BANK" && data.bankAccountId
            ? data.bankAccountId
            : ACCOUNTS.CASH;

        entries.push({
            accountId: cashAccountId,
            accountName: data.paymentMode === "BANK" ? "Bank" : "Cash",
            debit: data.amount,
            credit: 0,
        });

        // CR: Accounts Receivable
        entries.push({
            accountId: ACCOUNTS.ACCOUNTS_RECEIVABLE,
            accountName: "Accounts Receivable",
            debit: 0,
            credit: data.amount,
        });

        const journal = await JournalService.createJournal({
            date: data.date,
            description: `Receipt ${data.receiptNo} from ${data.customerName}`,
            entries,
            createdBy: "system",
        });

        // Update account balances
        const accounts = await COAService.getAccounts();
        for (const entry of entries) {
            const account = accounts.find(a => a.id === entry.accountId);
            if (account) {
                await AccountBalanceService.updateAccountBalance(
                    entry.accountId,
                    account.type,
                    entry.debit,
                    entry.credit,
                    account.accountCode,
                    account.accountName
                );
            }
        }

        return journal;
    },

    /**
     * Post a GRN (Goods Received Note)
     * Creates stock ledger entries
     * Note: GL posting happens when supplier invoice is received
     */
    postGRN: async (data: GRNPosting) => {
        for (const line of data.lines) {
            await StockLedgerService.createEntry({
                itemId: line.itemId,
                itemName: line.itemName,
                locationId: line.locationId,
                locationName: line.locationName,
                txnDate: data.date,
                sourceType: "GRN",
                sourceId: data.grnId,
                sourceNo: data.grnNo,
                qtyIn: line.qty,
                qtyOut: 0,
                unitCost: line.unitCost,
                totalCost: line.totalCost,
                remarks: `GRN ${data.grnNo} from ${data.supplierName}`,
            });
        }

        return { success: true, message: "GRN posted to stock ledger" };
    },

    /**
     * Post production material issue
     * Creates:
     * - DR: Work in Progress (WIP)
     * - CR: Raw Materials Inventory
     */
    postProductionIssue: async (data: ProductionIssuePosting) => {
        const entries: JournalEntry[] = [];
        let totalCost = 0;

        // Update stock ledger for each material
        for (const line of data.lines) {
            totalCost += line.totalCost;

            await StockLedgerService.createEntry({
                itemId: line.itemId,
                itemName: line.itemName,
                locationId: line.locationId,
                locationName: line.locationName,
                txnDate: data.date,
                sourceType: "PRODUCTION_ISSUE",
                sourceId: data.issueId,
                sourceNo: data.issueNo,
                qtyIn: 0,
                qtyOut: line.qty,
                unitCost: line.unitCost,
                totalCost: line.totalCost,
                remarks: `Material issue for ${data.productionOrderNo}`,
            });
        }

        // DR: WIP
        entries.push({
            accountId: ACCOUNTS.INVENTORY_WIP,
            accountName: "Inventory - Work in Progress",
            debit: totalCost,
            credit: 0,
        });

        // CR: Raw Materials
        entries.push({
            accountId: ACCOUNTS.INVENTORY_RAW_MATERIALS,
            accountName: "Inventory - Raw Materials",
            debit: 0,
            credit: totalCost,
        });

        const journal = await JournalService.createJournal({
            date: data.date,
            description: `Material issue for ${data.productionOrderNo}`,
            entries,
            createdBy: "system",
        });

        // Update account balances
        const accounts = await COAService.getAccounts();
        for (const entry of entries) {
            const account = accounts.find(a => a.id === entry.accountId);
            if (account) {
                await AccountBalanceService.updateAccountBalance(
                    entry.accountId,
                    account.type,
                    entry.debit,
                    entry.credit,
                    account.accountCode,
                    account.accountName
                );
            }
        }

        return journal;
    },

    /**
     * Post production output
     * Creates:
     * - DR: Finished Goods Inventory
     * - CR: Work in Progress (WIP)
     */
    postProductionOutput: async (data: ProductionOutputPosting) => {
        const entries: JournalEntry[] = [];
        let totalCost = 0;

        // Update stock ledger for finished goods
        for (const line of data.lines) {
            totalCost += line.totalCost;

            await StockLedgerService.createEntry({
                itemId: line.itemId,
                itemName: line.itemName,
                locationId: line.locationId,
                locationName: line.locationName,
                txnDate: data.date,
                sourceType: "PRODUCTION_OUTPUT",
                sourceId: data.outputId,
                sourceNo: data.outputNo,
                qtyIn: line.qty,
                qtyOut: 0,
                unitCost: line.unitCost,
                totalCost: line.totalCost,
                remarks: `Production output from ${data.productionOrderNo}`,
            });
        }

        // DR: Finished Goods
        entries.push({
            accountId: ACCOUNTS.INVENTORY_FINISHED_GOODS,
            accountName: "Inventory - Finished Goods",
            debit: totalCost,
            credit: 0,
        });

        // CR: WIP
        entries.push({
            accountId: ACCOUNTS.INVENTORY_WIP,
            accountName: "Inventory - Work in Progress",
            debit: 0,
            credit: totalCost,
        });

        const journal = await JournalService.createJournal({
            date: data.date,
            description: `Production output from ${data.productionOrderNo}`,
            entries,
            createdBy: "system",
        });

        // Update account balances
        const accounts = await COAService.getAccounts();
        for (const entry of entries) {
            const account = accounts.find(a => a.id === entry.accountId);
            if (account) {
                await AccountBalanceService.updateAccountBalance(
                    entry.accountId,
                    account.type,
                    entry.debit,
                    entry.credit,
                    account.accountCode,
                    account.accountName
                );
            }
        }

        return journal;
    },
};
