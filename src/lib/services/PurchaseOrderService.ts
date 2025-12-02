import { db } from "@/lib/firebase";
import { GRNService } from "./GRNService";
import { SupplierPaymentService } from "./SupplierPaymentService";

export type PurchaseOrderStatus = "DRAFT" | "APPROVED" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CLOSED" | "CANCELLED";

export interface PurchaseOrderLine {
    itemId: string;
    itemName?: string;
    locationId: string;
    locationName?: string;
    qty: number;
    price: number;
    taxRate: number;
    lineTotal: number;
    receivedQty: number;
    unit?: string;
}

export interface PurchaseOrder {
    id: string;
    poNo: string; // PO-0001
    supplierId: string;
    supplierName?: string;
    poDate: string; // YYYY-MM-DD
    deliveryDate?: string;
    status: PurchaseOrderStatus;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    lines: PurchaseOrderLine[];
    remarks?: string;
    currency: string; // e.g., "USD", "EUR"
    exchangeRate: number; // 1.0 for base currency
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

// Generate PO number
const generatePONo = (orders: PurchaseOrder[]): string => {
    const count = orders.length + 1;
    return `PO-${String(count).padStart(4, '0')}`;
};

// Calculate totals
const calculateTotals = (lines: PurchaseOrderLine[]) => {
    const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const taxAmount = lines.reduce((sum, line) => sum + (line.lineTotal * line.taxRate), 0);
    const totalAmount = subtotal + taxAmount;
    return { subtotal, taxAmount, totalAmount };
};

export const PurchaseOrderService = {
    /**
     * Get all purchase orders
     */
    getPurchaseOrders: async (filters?: {
        status?: PurchaseOrderStatus;
        supplierId?: string;
        fromDate?: string;
        toDate?: string;
    }): Promise<PurchaseOrder[]> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            let orders: PurchaseOrder[] = getMockData(`purchase_orders_${COMPANY_ID}`) || [];

            // Apply filters
            if (filters?.status) {
                orders = orders.filter(o => o.status === filters.status);
            }
            if (filters?.supplierId) {
                orders = orders.filter(o => o.supplierId === filters.supplierId);
            }
            if (filters?.fromDate) {
                orders = orders.filter(o => o.poDate >= filters.fromDate!);
            }
            if (filters?.toDate) {
                orders = orders.filter(o => o.poDate <= filters.toDate!);
            }

            return orders.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        }
        return [];
    },

    /**
     * Get purchase order by ID
     */
    getPurchaseOrderById: async (poId: string): Promise<PurchaseOrder | null> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const orders = getMockData(`purchase_orders_${COMPANY_ID}`) || [];
            return orders.find((o: PurchaseOrder) => o.id === poId) || null;
        }
        return null;
    },

    /**
     * Create purchase order
     */
    createPurchaseOrder: async (data: Omit<PurchaseOrder, "id" | "poNo" | "createdAt" | "updatedAt">) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const orders = getMockData(`purchase_orders_${COMPANY_ID}`) || [];

            // Calculate totals
            const totals = calculateTotals(data.lines);

            const newOrder: PurchaseOrder = {
                ...data,
                ...totals,
                id: `PO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                poNo: generatePONo(orders),
                currency: data.currency || "USD",
                exchangeRate: data.exchangeRate || 1.0,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            orders.push(newOrder);
            setMockData(`purchase_orders_${COMPANY_ID}`, orders);
            return newOrder;
        }
    },

    /**
     * Update purchase order
     */
    updatePurchaseOrder: async (poId: string, updates: Partial<PurchaseOrder>) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const orders = getMockData(`purchase_orders_${COMPANY_ID}`) || [];
            const index = orders.findIndex((o: PurchaseOrder) => o.id === poId);

            if (index === -1) {
                throw new Error("Purchase order not found");
            }

            // Recalculate totals if lines are updated
            if (updates.lines) {
                const totals = calculateTotals(updates.lines);
                updates = { ...updates, ...totals };
            }

            orders[index] = {
                ...orders[index],
                ...updates,
                updatedAt: new Date(),
            };

            setMockData(`purchase_orders_${COMPANY_ID}`, orders);
            return orders[index];
        }
    },

    /**
     * Approve purchase order
     */
    /**
     * Approve purchase order
     * Triggers auto-creation of draft GRN and pending payment
     */
    approvePurchaseOrder: async (poId: string) => {
        // 1. Update PO status
        const po = await PurchaseOrderService.updatePurchaseOrder(poId, {
            status: "APPROVED",
        });

        if (!po) {
            throw new Error("Failed to update purchase order");
        }

        // 2. Create draft GRN
        const draftGRN = await GRNService.createDraftGRN({
            poId: po.id,
            poNo: po.poNo,
            supplierId: po.supplierId,
            supplierName: po.supplierName || "",
            items: po.lines.map(line => ({
                itemId: line.itemId,
                itemName: line.itemName,
                qty: line.qty - line.receivedQty, // Remaining qty
                costPrice: line.price,
                lineTotal: (line.qty - line.receivedQty) * line.price
            })),
            createdBy: po.createdBy,
        });

        // 3. Create pending payment record
        const payment = await SupplierPaymentService.createSupplierPayment({
            supplierId: po.supplierId,
            supplierName: po.supplierName,
            paymentDate: new Date().toISOString().split('T')[0],
            amount: po.totalAmount,
            paymentMode: "BANK", // Default
            allocations: [], // Will be allocated when paid
            remarks: `Auto-created for PO ${po.poNo}`,
            createdBy: po.createdBy,
        });

        return {
            po,
            grn: draftGRN,
            payment
        };
    },

    /**
     * Update received quantity for a line
     */
    updateReceivedQty: async (poId: string, lineIndex: number, receivedQty: number) => {
        const po = await PurchaseOrderService.getPurchaseOrderById(poId);
        if (!po) {
            throw new Error("Purchase order not found");
        }

        const updatedLines = [...po.lines];
        updatedLines[lineIndex].receivedQty += receivedQty;

        // Check if all lines are fully received
        const allReceived = updatedLines.every((line: PurchaseOrderLine) => line.receivedQty >= line.qty);
        const partiallyReceived = updatedLines.some((line: PurchaseOrderLine) => line.receivedQty > 0);

        let newStatus: PurchaseOrderStatus = po.status;
        if (allReceived) {
            newStatus = "RECEIVED";
        } else if (partiallyReceived) {
            newStatus = "PARTIALLY_RECEIVED";
        }

        return PurchaseOrderService.updatePurchaseOrder(poId, {
            lines: updatedLines,
            status: newStatus,
        });
    },

    /**
     * Close purchase order
     */
    closePurchaseOrder: async (poId: string) => {
        return PurchaseOrderService.updatePurchaseOrder(poId, {
            status: "CLOSED",
        });
    },

    /**
     * Cancel purchase order
     */
    cancelPurchaseOrder: async (poId: string, reason?: string) => {
        const po = await PurchaseOrderService.getPurchaseOrderById(poId);
        if (!po) {
            throw new Error("Purchase order not found");
        }

        if (po.status === "RECEIVED" || po.status === "CLOSED") {
            throw new Error("Cannot cancel a received or closed purchase order");
        }

        if (po.lines.some(line => line.receivedQty > 0)) {
            throw new Error("Cannot cancel purchase order with received items");
        }

        return PurchaseOrderService.updatePurchaseOrder(poId, {
            status: "CANCELLED",
            remarks: reason ? `${po.remarks || ''}\nCancelled: ${reason}` : po.remarks,
        });
    },

    /**
     * Get purchase order summary
     */
    getPurchaseOrderSummary: async (): Promise<{
        totalOrders: number;
        draft: number;
        approved: number;
        received: number;
        totalValue: number;
    }> => {
        const orders = await PurchaseOrderService.getPurchaseOrders();
        return {
            totalOrders: orders.length,
            draft: orders.filter(o => o.status === "DRAFT").length,
            approved: orders.filter(o => o.status === "APPROVED").length,
            received: orders.filter(o => o.status === "RECEIVED").length,
            totalValue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
        };
    },
};
