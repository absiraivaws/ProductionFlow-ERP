import { db } from "@/lib/firebase";
import { ItemService } from "./ItemService";
import { JournalService } from "./JournalService";
import { StockLedgerService } from "./StockLedgerService";

export interface GRNItem {
    itemId: string;
    itemName?: string;
    qty: number;
    costPrice: number;
    lineTotal: number;
    batchNo?: string;
    serialNos?: string[];
    expiryDate?: string;
}

export interface GRN {
    id: string;
    grnNo: string;
    date: string;
    supplierId?: string;
    supplierName: string;
    poId?: string; // Link to Purchase Order
    poNo?: string; // Purchase Order Number
    items: GRNItem[];
    grnTotal: number;
    paymentType: "cash" | "credit";
    status: "DRAFT" | "CONFIRMED"; // GRN status
    createdBy: string;
    createdAt: Date;
}

const USE_MOCK = process.env.NEXT_PUBLIC_FIREBASE_API_KEY === "mock-api-key" || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const COMPANY_ID = "default-company";

const getMockData = (key: string) => {
    if (typeof window === "undefined") return null;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
};

const setMockData = (key: string, data: any) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, JSON.stringify(data));
};

const generateGRNNo = (grns: GRN[]): string => {
    const count = grns.length + 1;
    return `GRN-${String(count).padStart(5, '0')}`;
};

export const GRNService = {
    getGRNs: async (): Promise<GRN[]> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const grns = getMockData(`grns_${COMPANY_ID}`) || [];
            return grns.sort((a: GRN, b: GRN) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
        }
        return [];
    },

    /**
     * Create draft GRN from Purchase Order
     */
    createDraftGRN: async (data: {
        poId: string;
        poNo: string;
        supplierId?: string;
        supplierName: string;
        items: GRNItem[];
        createdBy: string;
    }) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const grns = getMockData(`grns_${COMPANY_ID}`) || [];

            const grnTotal = data.items.reduce((sum, item) => sum + item.lineTotal, 0);

            const newGRN: GRN = {
                id: Math.random().toString(36).substr(2, 9),
                grnNo: generateGRNNo(grns),
                date: new Date().toISOString().split('T')[0],
                supplierId: data.supplierId,
                supplierName: data.supplierName,
                poId: data.poId,
                poNo: data.poNo,
                items: data.items,
                grnTotal,
                paymentType: "credit", // Default to credit for PO-based GRNs
                status: "DRAFT",
                createdBy: data.createdBy,
                createdAt: new Date(),
            };

            grns.push(newGRN);
            setMockData(`grns_${COMPANY_ID}`, grns);
            return newGRN;
        }
    },

    updateGRN: async (grnId: string, updates: Partial<GRN>) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const grns = getMockData(`grns_${COMPANY_ID}`) || [];
            const index = grns.findIndex((g: GRN) => g.id === grnId);

            if (index !== -1) {
                // Recalculate total if items changed
                let grnTotal = grns[index].grnTotal;
                if (updates.items) {
                    grnTotal = updates.items.reduce((sum: number, item: GRNItem) => sum + item.lineTotal, 0);
                }

                grns[index] = {
                    ...grns[index],
                    ...updates,
                    grnTotal
                };
                setMockData(`grns_${COMPANY_ID}`, grns);
                return grns[index];
            }
        }
    },

    createGRN: async (data: Omit<GRN, "id" | "grnNo" | "grnTotal" | "createdAt">) => {
        const grnTotal = data.items.reduce((sum, item) => sum + item.lineTotal, 0);

        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const grns = getMockData(`grns_${COMPANY_ID}`) || [];

            const newGRN: GRN = {
                ...data,
                id: Math.random().toString(36).substr(2, 9),
                grnNo: generateGRNNo(grns),
                grnTotal,
                status: data.status || "CONFIRMED", // Default to CONFIRMED for backward compatibility
                createdAt: new Date(),
            };

            // Only process if status is CONFIRMED
            if (newGRN.status === "CONFIRMED") {
                // Update stock for each item
                for (const item of data.items) {
                    // Create stock ledger entry
                    await StockLedgerService.createEntry({
                        itemId: item.itemId,
                        itemName: item.itemName,
                        locationId: "LOC-001", // Default location
                        txnDate: data.date,
                        sourceType: "GRN",
                        sourceId: newGRN.id,
                        sourceNo: newGRN.grnNo,
                        qtyIn: item.qty,
                        qtyOut: 0,
                        unitCost: item.costPrice,
                        totalCost: item.lineTotal,
                        batchNo: item.batchNo,
                        serialNo: item.serialNos ? item.serialNos.join(",") : undefined,
                        expiryDate: item.expiryDate,
                        remarks: `GRN ${newGRN.grnNo}`,
                    });
                    // Also update item master stock count
                    await ItemService.updateStock(item.itemId, item.qty);
                }

                // Post accounting entries
                // Debit: Inventory, Credit: Cash or Accounts Payable
                const journalEntries = [
                    {
                        accountId: "1004", // Inventory
                        debit: grnTotal,
                        credit: 0,
                    },
                    {
                        accountId: data.paymentType === "cash" ? "1001" : "2001", // Cash or Accounts Payable
                        debit: 0,
                        credit: grnTotal,
                    },
                ];

                await JournalService.createJournal({
                    date: data.date,
                    description: `GRN ${newGRN.grnNo} - ${data.supplierName}`,
                    entries: journalEntries,
                    createdBy: data.createdBy,
                });

                // Update linked PO if exists
                if (data.poId) {
                    await GRNService.updatePOFromGRN(data.poId, data.items);
                }
            }

            grns.push(newGRN);
            setMockData(`grns_${COMPANY_ID}`, grns);
            return newGRN;
        }
    },

    /**
     * Confirm GRN - update stock and PO
     */
    confirmGRN: async (grnId: string) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const grns = getMockData(`grns_${COMPANY_ID}`) || [];
            const index = grns.findIndex((g: GRN) => g.id === grnId);

            if (index === -1) {
                throw new Error("GRN not found");
            }

            const grn = grns[index];

            if (grn.status === "CONFIRMED") {
                throw new Error("GRN already confirmed");
            }

            // Update stock for each item
            for (const item of grn.items) {
                // Create stock ledger entry
                await StockLedgerService.createEntry({
                    itemId: item.itemId,
                    itemName: item.itemName,
                    locationId: "LOC-001", // Default location
                    txnDate: grn.date,
                    sourceType: "GRN",
                    sourceId: grn.id,
                    sourceNo: grn.grnNo,
                    qtyIn: item.qty,
                    qtyOut: 0,
                    unitCost: item.costPrice,
                    totalCost: item.lineTotal,
                    batchNo: item.batchNo,
                    serialNo: item.serialNos ? item.serialNos.join(",") : undefined,
                    expiryDate: item.expiryDate,
                    remarks: `GRN ${grn.grnNo}`,
                });
                // Also update item master stock count
                await ItemService.updateStock(item.itemId, item.qty);
            }

            // Post accounting entries
            const journalEntries = [
                {
                    accountId: "1004", // Inventory
                    debit: grn.grnTotal,
                    credit: 0,
                },
                {
                    accountId: grn.paymentType === "cash" ? "1001" : "2001", // Cash or Accounts Payable
                    debit: 0,
                    credit: grn.grnTotal,
                },
            ];

            await JournalService.createJournal({
                date: grn.date,
                description: `GRN ${grn.grnNo} - ${grn.supplierName}`,
                entries: journalEntries,
                createdBy: grn.createdBy,
            });

            // Update linked PO if exists
            if (grn.poId) {
                await GRNService.updatePOFromGRN(grn.poId, grn.items);
            }

            // Update GRN status
            grns[index] = {
                ...grn,
                status: "CONFIRMED",
            };

            setMockData(`grns_${COMPANY_ID}`, grns);
            return grns[index];
        }
    },

    /**
     * Update Purchase Order from GRN
     */
    updatePOFromGRN: async (poId: string, grnItems: GRNItem[]) => {
        // Import PurchaseOrderService dynamically to avoid circular dependency
        const { PurchaseOrderService } = await import("./PurchaseOrderService");

        const po = await PurchaseOrderService.getPurchaseOrderById(poId);

        if (!po) {
            throw new Error("Purchase Order not found");
        }

        // Update received quantities
        for (const grnItem of grnItems) {
            const lineIndex = po.lines.findIndex(l => l.itemId === grnItem.itemId);
            if (lineIndex >= 0) {
                await PurchaseOrderService.updateReceivedQty(
                    poId,
                    lineIndex,
                    po.lines[lineIndex].receivedQty + grnItem.qty
                );
            }
        }

        // Refresh PO to get updated data
        const updatedPO = await PurchaseOrderService.getPurchaseOrderById(poId);

        if (!updatedPO) return;

        // Check if fully received
        const allReceived = updatedPO.lines.every(l => l.receivedQty >= l.qty);
        const partiallyReceived = updatedPO.lines.some(l => l.receivedQty > 0);

        if (allReceived) {
            await PurchaseOrderService.updatePurchaseOrder(poId, {
                status: "RECEIVED",
            });
        } else if (partiallyReceived) {
            await PurchaseOrderService.updatePurchaseOrder(poId, {
                status: "PARTIALLY_RECEIVED",
            });
        }
    },
};
