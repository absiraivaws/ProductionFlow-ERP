import { db } from "@/lib/firebase";
import { PostingEngineService } from "./PostingEngineService";
import { StockLedgerService } from "./StockLedgerService";

export type PurchaseReturnStatus = "DRAFT" | "APPROVED" | "PROCESSED" | "CANCELLED";

export interface PurchaseReturnLine {
    itemId: string;
    itemName?: string;
    locationId: string;
    locationName?: string;
    qty: number;
    price: number;
    taxRate: number;
    lineTotal: number;
    unit?: string;
}

export interface PurchaseReturn {
    id: string;
    returnNo: string; // PR-0001
    supplierId: string;
    supplierName?: string;
    returnDate: string; // YYYY-MM-DD
    purchaseInvoiceId?: string; // Link to original purchase invoice
    purchaseInvoiceNo?: string;
    reason: string;
    status: PurchaseReturnStatus;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    lines: PurchaseReturnLine[];
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
const generateReturnNo = (returns: PurchaseReturn[]): string => {
    const count = returns.length + 1;
    return `PR-${String(count).padStart(4, '0')}`;
};

// Calculate totals
const calculateTotals = (lines: PurchaseReturnLine[]) => {
    const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const taxAmount = lines.reduce((sum, line) => sum + (line.lineTotal * line.taxRate), 0);
    const totalAmount = subtotal + taxAmount;
    return { subtotal, taxAmount, totalAmount };
};

export const PurchaseReturnService = {
    /**
     * Get all purchase returns
     */
    getPurchaseReturns: async (filters?: {
        status?: PurchaseReturnStatus;
        supplierId?: string;
        fromDate?: string;
        toDate?: string;
    }): Promise<PurchaseReturn[]> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            let returns: PurchaseReturn[] = getMockData(`purchase_returns_${COMPANY_ID}`) || [];

            // Apply filters
            if (filters?.status) {
                returns = returns.filter(r => r.status === filters.status);
            }
            if (filters?.supplierId) {
                returns = returns.filter(r => r.supplierId === filters.supplierId);
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
     * Get purchase return by ID
     */
    getPurchaseReturnById: async (returnId: string): Promise<PurchaseReturn | null> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const returns = getMockData(`purchase_returns_${COMPANY_ID}`) || [];
            return returns.find((r: PurchaseReturn) => r.id === returnId) || null;
        }
        return null;
    },

    /**
     * Create purchase return
     */
    createPurchaseReturn: async (data: Omit<PurchaseReturn, "id" | "returnNo" | "isPosted" | "createdAt" | "updatedAt">) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const returns = getMockData(`purchase_returns_${COMPANY_ID}`) || [];

            // Calculate totals
            const totals = calculateTotals(data.lines);

            const newReturn: PurchaseReturn = {
                ...data,
                ...totals,
                id: `PR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                returnNo: generateReturnNo(returns),
                isPosted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            returns.push(newReturn);
            setMockData(`purchase_returns_${COMPANY_ID}`, returns);
            return newReturn;
        }
    },

    /**
     * Update purchase return
     */
    updatePurchaseReturn: async (returnId: string, updates: Partial<PurchaseReturn>) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const returns = getMockData(`purchase_returns_${COMPANY_ID}`) || [];
            const index = returns.findIndex((r: PurchaseReturn) => r.id === returnId);

            if (index === -1) {
                throw new Error("Purchase return not found");
            }

            returns[index] = {
                ...returns[index],
                ...updates,
                updatedAt: new Date(),
            };

            setMockData(`purchase_returns_${COMPANY_ID}`, returns);
            return returns[index];
        }
    },

    /**
     * Approve purchase return
     */
    approvePurchaseReturn: async (returnId: string) => {
        const purchaseReturn = await PurchaseReturnService.getPurchaseReturnById(returnId);
        if (!purchaseReturn) {
            throw new Error("Purchase return not found");
        }

        if (purchaseReturn.status !== "DRAFT") {
            throw new Error("Only draft returns can be approved");
        }

        return PurchaseReturnService.updatePurchaseReturn(returnId, {
            status: "APPROVED",
        });
    },

    /**
     * Process purchase return
     * Updates stock and posts to GL
     */
    processPurchaseReturn: async (returnId: string) => {
        const purchaseReturn = await PurchaseReturnService.getPurchaseReturnById(returnId);
        if (!purchaseReturn) {
            throw new Error("Purchase return not found");
        }

        if (purchaseReturn.status !== "APPROVED") {
            throw new Error("Only approved returns can be processed");
        }

        if (purchaseReturn.isPosted) {
            throw new Error("Return already processed");
        }

        // Update stock ledger (return stock out)
        for (const line of purchaseReturn.lines) {
            await StockLedgerService.createEntry({
                itemId: line.itemId,
                locationId: line.locationId,
                qty: -line.qty, // Negative for return
                transactionType: "ADJUSTMENT",
                sourceType: "PURCHASE_RETURN",
                sourceId: purchaseReturn.id,
                sourceNo: purchaseReturn.returnNo,
                date: purchaseReturn.returnDate,
                unitCost: line.price,
                remarks: `Purchase Return: ${purchaseReturn.returnNo}`,
            });
        }

        // Post to GL (reverse purchase entry)
        // DR: Accounts Payable, CR: Inventory
        const journalEntries = [
            {
                accountId: "2001", // Accounts Payable
                debit: purchaseReturn.totalAmount,
                credit: 0,
            },
            {
                accountId: "1300", // Inventory - Raw Materials
                debit: 0,
                credit: purchaseReturn.subtotal,
            },
            {
                accountId: "5500", // VAT Input Tax
                debit: 0,
                credit: purchaseReturn.taxAmount,
            },
        ];

        // Create journal entry (would use JournalService in real implementation)

        return PurchaseReturnService.updatePurchaseReturn(returnId, {
            status: "PROCESSED",
            isPosted: true,
        });
    },

    /**
     * Cancel purchase return
     */
    cancelPurchaseReturn: async (returnId: string, reason?: string) => {
        const purchaseReturn = await PurchaseReturnService.getPurchaseReturnById(returnId);
        if (!purchaseReturn) {
            throw new Error("Purchase return not found");
        }

        if (purchaseReturn.status === "PROCESSED") {
            throw new Error("Cannot cancel a processed return");
        }

        return PurchaseReturnService.updatePurchaseReturn(returnId, {
            status: "CANCELLED",
            remarks: reason ? `${purchaseReturn.remarks || ''}\nCancelled: ${reason}` : purchaseReturn.remarks,
        });
    },
};
