import { db } from "@/lib/firebase";

export type StockTransactionType =
    | "GRN"                    // Goods Received Note (Purchase)
    | "SALES_INVOICE"          // Sales Invoice (Sale)
    | "PRODUCTION_ISSUE"       // Material issued to production
    | "PRODUCTION_OUTPUT"      // Finished goods from production
    | "ADJUSTMENT_IN"          // Stock adjustment increase
    | "ADJUSTMENT_OUT"         // Stock adjustment decrease
    | "TRANSFER_IN"            // Transfer from another location
    | "TRANSFER_OUT"           // Transfer to another location
    | "OPENING_BALANCE";       // Opening stock

export interface StockLedgerEntry {
    id: string;
    itemId: string;
    itemName?: string; // For display
    locationId: string;
    locationName?: string; // For display
    txnDate: string; // YYYY-MM-DD
    sourceType: StockTransactionType;
    sourceId: string; // Reference to source document (GRN ID, Invoice ID, etc.)
    sourceNo?: string; // Document number for display (GRN-001, INV-001, etc.)
    qtyIn: number;
    qtyOut: number;
    unitCost: number; // Cost per unit
    totalCost: number; // Total value of transaction
    balanceQty?: number; // Running balance (calculated)
    remarks?: string;
    batchNo?: string;
    serialNo?: string;
    expiryDate?: string;
    createdAt: Date;
}

export interface StockBalance {
    itemId: string;
    itemName?: string;
    locationId: string;
    locationName?: string;
    balanceQty: number;
    avgCost: number;
    stockValue: number;
    lastUpdated: Date;
}

const USE_MOCK = true; // Force mock for debugging
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

export const StockLedgerService = {
    /**
     * Create a stock ledger entry
     */
    createEntry: async (entry: Omit<StockLedgerEntry, "id" | "createdAt">) => {
        try {
            const newEntry: StockLedgerEntry = {
                ...entry,
                id: `STK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                createdAt: new Date(),
            };

            if (USE_MOCK) {
                await new Promise(resolve => setTimeout(resolve, 300));
                const entries = getMockData(`stock_ledger_${COMPANY_ID}`) || [];
                entries.push(newEntry);
                setMockData(`stock_ledger_${COMPANY_ID}`, entries);

                // Update stock balance
                await StockLedgerService.updateStockBalance(entry.itemId, entry.locationId);

                return newEntry;
            } else {
                console.warn("StockLedgerService: API not implemented, returning undefined");
                return undefined;
            }
        } catch (error) {
            console.error("Error in StockLedgerService.createEntry:", error);
            throw error;
        }
    },

    /**
     * Get all stock ledger entries with optional filters
     */
    getEntries: async (filters?: {
        itemId?: string;
        locationId?: string;
        sourceType?: StockTransactionType;
        fromDate?: string;
        toDate?: string;
    }): Promise<StockLedgerEntry[]> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            let entries: StockLedgerEntry[] = getMockData(`stock_ledger_${COMPANY_ID}`) || [];

            // Apply filters
            if (filters?.itemId) {
                entries = entries.filter(e => e.itemId === filters.itemId);
            }
            if (filters?.locationId) {
                entries = entries.filter(e => e.locationId === filters.locationId);
            }
            if (filters?.sourceType) {
                entries = entries.filter(e => e.sourceType === filters.sourceType);
            }
            if (filters?.fromDate) {
                entries = entries.filter(e => e.txnDate >= filters.fromDate!);
            }
            if (filters?.toDate) {
                entries = entries.filter(e => e.txnDate <= filters.toDate!);
            }

            // Sort by date and calculate running balance
            entries.sort((a, b) => {
                const dateCompare = a.txnDate.localeCompare(b.txnDate);
                if (dateCompare !== 0) return dateCompare;
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            });

            // Calculate running balance
            let runningBalance = 0;
            entries.forEach(entry => {
                runningBalance += entry.qtyIn - entry.qtyOut;
                entry.balanceQty = runningBalance;
            });

            return entries;
        }
        return [];
    },

    /**
     * Get stock balance for a specific item and location
     */
    getStockBalance: async (itemId: string, locationId: string): Promise<StockBalance | null> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const balances: StockBalance[] = getMockData(`stock_balances_${COMPANY_ID}`) || [];
            return balances.find(b => b.itemId === itemId && b.locationId === locationId) || null;
        }
        return null;
    },

    /**
     * Get all stock balances with optional filters
     */
    getAllStockBalances: async (filters?: {
        itemId?: string;
        locationId?: string;
        minQty?: number;
    }): Promise<StockBalance[]> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            let balances: StockBalance[] = getMockData(`stock_balances_${COMPANY_ID}`) || [];

            // Apply filters
            if (filters?.itemId) {
                balances = balances.filter(b => b.itemId === filters.itemId);
            }
            if (filters?.locationId) {
                balances = balances.filter(b => b.locationId === filters.locationId);
            }
            if (filters?.minQty !== undefined) {
                balances = balances.filter(b => b.balanceQty >= filters.minQty!);
            }

            return balances;
        }
        return [];
    },

    /**
     * Update stock balance for an item-location combination
     * This recalculates from all ledger entries
     */
    updateStockBalance: async (itemId: string, locationId: string) => {
        if (USE_MOCK) {
            const entries = await StockLedgerService.getEntries({ itemId, locationId });

            let totalQtyIn = 0;
            let totalQtyOut = 0;
            let totalCost = 0;

            entries.forEach(entry => {
                totalQtyIn += entry.qtyIn;
                totalQtyOut += entry.qtyOut;
                totalCost += entry.totalCost;
            });

            const balanceQty = totalQtyIn - totalQtyOut;
            const avgCost = balanceQty > 0 ? totalCost / balanceQty : 0;
            const stockValue = balanceQty * avgCost;

            const balances: StockBalance[] = getMockData(`stock_balances_${COMPANY_ID}`) || [];
            const existingIndex = balances.findIndex(b => b.itemId === itemId && b.locationId === locationId);

            const balance: StockBalance = {
                itemId,
                locationId,
                balanceQty,
                avgCost,
                stockValue,
                lastUpdated: new Date(),
            };

            if (existingIndex >= 0) {
                balances[existingIndex] = balance;
            } else {
                balances.push(balance);
            }

            setMockData(`stock_balances_${COMPANY_ID}`, balances);
            return balance;
        }
    },

    /**
     * Get stock movement report for an item
     */
    getStockMovementReport: async (itemId: string, locationId?: string, fromDate?: string, toDate?: string) => {
        const entries = await StockLedgerService.getEntries({
            itemId,
            locationId,
            fromDate,
            toDate,
        });

        return entries;
    },

    /**
     * Check if sufficient stock is available
     */
    checkStockAvailability: async (itemId: string, locationId: string, requiredQty: number) => {
        const balance = await StockLedgerService.getStockBalance(itemId, locationId);
        return (balance?.balanceQty || 0) >= requiredQty;
    },

    /**
     * Get available batches for an item at a location
     */
    getBatchBalances: async (itemId: string, locationId: string): Promise<Array<{ batchNo: string, expiryDate?: string, qty: number }>> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const entries: StockLedgerEntry[] = getMockData(`stock_ledger_${COMPANY_ID}`) || [];

            const batchMap = new Map<string, { batchNo: string, expiryDate?: string, qty: number, firstDate: string }>();

            // Filter for item and location, and only entries with batchNo
            const relevantEntries = entries.filter(e => e.itemId === itemId && e.locationId === locationId && e.batchNo);

            for (const entry of relevantEntries) {
                const key = entry.batchNo!;
                const current = batchMap.get(key) || {
                    batchNo: key,
                    expiryDate: entry.expiryDate,
                    qty: 0,
                    firstDate: entry.txnDate
                };

                if (entry.txnDate < current.firstDate) {
                    current.firstDate = entry.txnDate;
                }

                current.qty += (entry.qtyIn - entry.qtyOut);
                batchMap.set(key, current);
            }

            return Array.from(batchMap.values())
                .filter(b => b.qty > 0)
                .sort((a, b) => {
                    if (a.expiryDate && b.expiryDate) {
                        return a.expiryDate.localeCompare(b.expiryDate);
                    }
                    return a.firstDate.localeCompare(b.firstDate);
                });
        }
        return [];
    },

    /**
     * Get available serial numbers for an item at a location
     */
    getAvailableSerials: async (itemId: string, locationId: string): Promise<string[]> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const entries: StockLedgerEntry[] = getMockData(`stock_ledger_${COMPANY_ID}`) || [];

            const serials = new Set<string>();

            // Filter for item and location
            const relevantEntries = entries.filter(e => e.itemId === itemId && e.locationId === locationId && e.serialNo);

            // Replay history to find currently available serials
            // Sort by date ascending
            relevantEntries.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

            for (const entry of relevantEntries) {
                if (entry.serialNo) {
                    // Handle comma-separated serials if any (though usually one per entry for serials, but schema allows string)
                    // My schema says serialNo: string. But GRNService joins them.
                    const entrySerials = entry.serialNo.split(',').map(s => s.trim());

                    if (entry.qtyIn > 0) {
                        entrySerials.forEach(s => serials.add(s));
                    }
                    if (entry.qtyOut > 0) {
                        entrySerials.forEach(s => serials.delete(s));
                    }
                }
            }

            return Array.from(serials);
        }
        return [];
    },

    /**
     * Get total stock value across all locations
     */
    getTotalStockValue: async (): Promise<number> => {
        if (USE_MOCK) {
            const balances = await StockLedgerService.getAllStockBalances();
            return balances.reduce((sum, b) => sum + b.stockValue, 0);
        }
        return 0;
    },

    /**
     * Recalculate all stock balances from ledger entries
     */
    recalculateAllBalances: async () => {
        if (USE_MOCK) {
            console.log("Recalculating all balances...");
            const entries = await StockLedgerService.getEntries();
            console.log(`Found ${entries.length} ledger entries.`);

            const uniqueItemLocations = new Set<string>();

            entries.forEach(e => {
                uniqueItemLocations.add(`${e.itemId}|${e.locationId}`);
            });

            console.log(`Found ${uniqueItemLocations.size} unique item-location pairs.`);

            for (const itemLoc of uniqueItemLocations) {
                const [itemId, locationId] = itemLoc.split('|');
                await StockLedgerService.updateStockBalance(itemId, locationId);
            }

            const balances = await StockLedgerService.getAllStockBalances();
            console.log(`Recalculation complete. Total balances: ${balances.length}`);
            return balances;
        }
    },
};
