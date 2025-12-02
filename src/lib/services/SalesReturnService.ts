import { db } from "@/lib/firebase";
import { PostingEngineService } from "./PostingEngineService";
import { StockLedgerService } from "./StockLedgerService";

export type SalesReturnStatus = "DRAFT" | "APPROVED" | "PROCESSED" | "CANCELLED";

export interface SalesReturnLine {
    itemId: string;
    itemName?: string;
    locationId: string;
    locationName?: string;
    qty: number;
    price: number;
    taxRate: number;
    lineTotal: number;
    unitCost: number; // For COGS reversal
    unit?: string;
}

export interface SalesReturn {
    id: string;
    returnNo: string; // SR-0001
    customerId: string;
    customerName?: string;
    returnDate: string; // YYYY-MM-DD
    salesInvoiceId?: string; // Link to original sales invoice
    salesInvoiceNo?: string;
    reason: string;
    status: SalesReturnStatus;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    lines: SalesReturnLine[];
    remarks?: string;
    isPosted: boolean; // Has GL posting been done
    createdBy: string;
    createdAt: Date;
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

// Generate return number
const generateReturnNo = (returns: SalesReturn[]): string => {
    const count = returns.length + 1;
    return `SR-${String(count).padStart(4, '0')}`;
};

// Calculate totals
const calculateTotals = (lines: SalesReturnLine[]) => {
    const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const taxAmount = lines.reduce((sum, line) => sum + (line.lineTotal * line.taxRate), 0);
    const totalAmount = subtotal + taxAmount;
    return { subtotal, taxAmount, totalAmount };
};

export const SalesReturnService = {
    /**
     * Get all sales returns
     */
    getSalesReturns: async (filters?: {
        status?: SalesReturnStatus;
        customerId?: string;
        fromDate?: string;
        toDate?: string;
    }): Promise<SalesReturn[]> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            let returns: SalesReturn[] = getMockData(`sales_returns_${COMPANY_ID}`) || [];

            // Apply filters
            if (filters?.status) {
                returns = returns.filter(r => r.status === filters.status);
            }
            if (filters?.customerId) {
                returns = returns.filter(r => r.customerId === filters.customerId);
            }
            if (filters?.fromDate) {
                returns = returns.filter(r => r.returnDate >= filters.fromDate!);
            }
            if (filters?.toDate) {
                returns = returns.filter(r => r.returnDate <= filters.toDate!);
            }

            return returns.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        }
        return [];
    },

    /**
     * Get sales return by ID
     */
    getSalesReturnById: async (returnId: string): Promise<SalesReturn | null> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const returns = getMockData(`sales_returns_${COMPANY_ID}`) || [];
            return returns.find((r: SalesReturn) => r.id === returnId) || null;
        }
        return null;
    },

    /**
     * Create sales return
     */
    createSalesReturn: async (data: Omit<SalesReturn, "id" | "returnNo" | "isPosted" | "createdAt" | "updatedAt">) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const returns = getMockData(`sales_returns_${COMPANY_ID}`) || [];

            // Calculate totals
            const totals = calculateTotals(data.lines);

            const newReturn: SalesReturn = {
                ...data,
                ...totals,
                id: `SR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                returnNo: generateReturnNo(returns),
                isPosted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            returns.push(newReturn);
            setMockData(`sales_returns_${COMPANY_ID}`, returns);
            return newReturn;
        }
    },

    /**
     * Update sales return
     */
    updateSalesReturn: async (returnId: string, updates: Partial<SalesReturn>) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const returns = getMockData(`sales_returns_${COMPANY_ID}`) || [];
            const index = returns.findIndex((r: SalesReturn) => r.id === returnId);

            if (index === -1) {
                throw new Error("Sales return not found");
            }

            returns[index] = {
                ...returns[index],
                ...updates,
                updatedAt: new Date(),
            };

            setMockData(`sales_returns_${COMPANY_ID}`, returns);
            return returns[index];
        }
    },

    /**
     * Approve sales return
     */
    approveSalesReturn: async (returnId: string) => {
        const salesReturn = await SalesReturnService.getSalesReturnById(returnId);
        if (!salesReturn) {
            throw new Error("Sales return not found");
        }

        if (salesReturn.status !== "DRAFT") {
            throw new Error("Only draft returns can be approved");
        }

        return SalesReturnService.updateSalesReturn(returnId, {
            status: "APPROVED",
        });
    },

    /**
     * Process sales return
     * Updates stock and posts to GL
     */
    processSalesReturn: async (returnId: string) => {
        const salesReturn = await SalesReturnService.getSalesReturnById(returnId);
        if (!salesReturn) {
            throw new Error("Sales return not found");
        }

        if (salesReturn.status !== "APPROVED") {
            throw new Error("Only approved returns can be processed");
        }

        if (salesReturn.isPosted) {
            throw new Error("Return already processed");
        }

        // Update stock ledger (return stock in)
        for (const line of salesReturn.lines) {
            await StockLedgerService.createStockEntry({
                itemId: line.itemId,
                locationId: line.locationId,
                qty: line.qty, // Positive for return
                transactionType: "ADJUSTMENT",
                sourceType: "SALES_RETURN",
                sourceId: salesReturn.id,
                sourceNo: salesReturn.returnNo,
                date: salesReturn.returnDate,
                unitCost: line.unitCost,
                remarks: `Sales Return: ${salesReturn.returnNo}`,
            });
        }

        // Post to GL (reverse sales entry and COGS)
        // DR: Sales Returns, CR: Accounts Receivable
        // DR: Inventory, CR: COGS
        const journalEntries = [
            {
                accountId: "4100", // Sales Returns
                debit: salesReturn.subtotal,
                credit: 0,
            },
            {
                accountId: "4300", // VAT Output Tax
                debit: salesReturn.taxAmount,
                credit: 0,
            },
            {
                accountId: "1200", // Accounts Receivable
                debit: 0,
                credit: salesReturn.totalAmount,
            },
            // COGS reversal
            {
                accountId: "1320", // Finished Goods Inventory
                debit: salesReturn.lines.reduce((sum, line) => sum + (line.qty * line.unitCost), 0),
                credit: 0,
            },
            {
                accountId: "5000", // COGS
                debit: 0,
                credit: salesReturn.lines.reduce((sum, line) => sum + (line.qty * line.unitCost), 0),
            },
        ];

        // Create journal entry (would use JournalService in real implementation)

        return SalesReturnService.updateSalesReturn(returnId, {
            status: "PROCESSED",
            isPosted: true,
        });
    },

    /**
     * Cancel sales return
     */
    cancelSalesReturn: async (returnId: string, reason?: string) => {
        const salesReturn = await SalesReturnService.getSalesReturnById(returnId);
        if (!salesReturn) {
            throw new Error("Sales return not found");
        }

        if (salesReturn.status === "PROCESSED") {
            throw new Error("Cannot cancel a processed return");
        }

        return SalesReturnService.updateSalesReturn(returnId, {
            status: "CANCELLED",
            remarks: reason ? `${salesReturn.remarks || ''}\nCancelled: ${reason}` : salesReturn.remarks,
        });
    },
};
