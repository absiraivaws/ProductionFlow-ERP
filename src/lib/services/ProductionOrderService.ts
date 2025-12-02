import { db } from "@/lib/firebase";
import { BOMService } from "./BOMService";
import { StockLedgerService } from "./StockLedgerService";
import { PostingEngineService } from "./PostingEngineService";

export type ProductionOrderStatus = "DRAFT" | "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface ProductionMaterialLine {
    rmItemId: string;
    rmItemName?: string;
    locationId: string;
    locationName?: string;
    plannedQty: number;
    issuedQty: number;
    unit?: string;
    unitCost?: number;
}

export interface ProductionOutputLine {
    fgItemId: string;
    fgItemName?: string;
    locationId: string;
    locationName?: string;
    qty: number;
    unit?: string;
    unitCost?: number;
}

export interface ProductionOrder {
    id: string;
    orderNo: string; // PROD-0001
    fgItemId: string; // Finished good to produce
    fgItemName?: string;
    bomId?: string; // Link to BOM used
    bomNo?: string;
    plannedQty: number;
    actualQty: number;
    status: ProductionOrderStatus;
    startDate: string; // YYYY-MM-DD
    endDate?: string; // YYYY-MM-DD
    materialLines: ProductionMaterialLine[];
    outputLines: ProductionOutputLine[];
    remarks?: string;
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

// Generate production order number
const generateOrderNo = (orders: ProductionOrder[]): string => {
    const count = orders.length + 1;
    return `PROD-${String(count).padStart(4, '0')}`;
};

export const ProductionOrderService = {
    /**
     * Get all production orders
     */
    getProductionOrders: async (filters?: {
        status?: ProductionOrderStatus;
        fgItemId?: string;
        fromDate?: string;
        toDate?: string;
    }): Promise<ProductionOrder[]> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            let orders: ProductionOrder[] = getMockData(`production_orders_${COMPANY_ID}`) || [];

            // Apply filters
            if (filters?.status) {
                orders = orders.filter(o => o.status === filters.status);
            }
            if (filters?.fgItemId) {
                orders = orders.filter(o => o.fgItemId === filters.fgItemId);
            }
            if (filters?.fromDate) {
                orders = orders.filter(o => o.startDate >= filters.fromDate!);
            }
            if (filters?.toDate) {
                orders = orders.filter(o => o.startDate <= filters.toDate!);
            }

            return orders.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        }
        return [];
    },

    /**
     * Get production order by ID
     */
    getProductionOrderById: async (orderId: string): Promise<ProductionOrder | null> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const orders = getMockData(`production_orders_${COMPANY_ID}`) || [];
            return orders.find((o: ProductionOrder) => o.id === orderId) || null;
        }
        return null;
    },

    /**
     * Create production order from BOM
     */
    createProductionOrder: async (data: {
        fgItemId: string;
        fgItemName?: string;
        plannedQty: number;
        startDate: string;
        outputLocationId: string;
        outputLocationName?: string;
        remarks?: string;
        createdBy: string;
    }) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));

            // Get active BOM for the finished good
            const bom = await BOMService.getActiveBOMByFGItem(data.fgItemId);

            if (!bom) {
                throw new Error(`No active BOM found for item ${data.fgItemName || data.fgItemId}`);
            }

            // Calculate material requirements from BOM
            const materialLines: ProductionMaterialLine[] = bom.lines.map(line => ({
                rmItemId: line.rmItemId,
                rmItemName: line.rmItemName,
                locationId: "", // To be set by user or default location
                locationName: "",
                plannedQty: line.qtyPerUnit * data.plannedQty,
                issuedQty: 0,
                unit: line.unit,
            }));

            const orders = getMockData(`production_orders_${COMPANY_ID}`) || [];

            const newOrder: ProductionOrder = {
                id: `PO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                orderNo: generateOrderNo(orders),
                fgItemId: data.fgItemId,
                fgItemName: data.fgItemName,
                bomId: bom.id,
                bomNo: bom.bomNo,
                plannedQty: data.plannedQty,
                actualQty: 0,
                status: "PLANNED",
                startDate: data.startDate,
                materialLines,
                outputLines: [],
                remarks: data.remarks,
                createdBy: data.createdBy,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            orders.push(newOrder);
            setMockData(`production_orders_${COMPANY_ID}`, orders);
            return newOrder;
        }
    },

    /**
     * Update production order
     */
    updateProductionOrder: async (orderId: string, updates: Partial<ProductionOrder>) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const orders = getMockData(`production_orders_${COMPANY_ID}`) || [];
            const index = orders.findIndex((o: ProductionOrder) => o.id === orderId);

            if (index === -1) {
                throw new Error("Production order not found");
            }

            orders[index] = {
                ...orders[index],
                ...updates,
                updatedAt: new Date(),
            };

            setMockData(`production_orders_${COMPANY_ID}`, orders);
            return orders[index];
        }
    },

    /**
     * Start production (change status to IN_PROGRESS)
     */
    startProduction: async (orderId: string) => {
        return ProductionOrderService.updateProductionOrder(orderId, {
            status: "IN_PROGRESS",
        });
    },

    /**
     * Issue materials to production
     * This creates stock ledger entries and GL postings
     */
    issueMaterials: async (orderId: string, issues: Array<{
        rmItemId: string;
        rmItemName: string;
        locationId: string;
        locationName: string;
        qty: number;
        unitCost: number;
    }>) => {
        if (USE_MOCK) {
            const order = await ProductionOrderService.getProductionOrderById(orderId);
            if (!order) {
                throw new Error("Production order not found");
            }

            if (order.status !== "IN_PROGRESS") {
                throw new Error("Production order must be IN_PROGRESS to issue materials");
            }

            // Check stock availability
            for (const issue of issues) {
                const available = await StockLedgerService.checkStockAvailability(
                    issue.rmItemId,
                    issue.locationId,
                    issue.qty
                );
                if (!available) {
                    throw new Error(`Insufficient stock for ${issue.rmItemName} at ${issue.locationName}`);
                }
            }

            // Post to GL and update stock ledger
            await PostingEngineService.postProductionIssue({
                issueId: `ISSUE-${orderId}`,
                issueNo: `ISSUE-${order.orderNo}`,
                date: new Date().toISOString().split('T')[0],
                productionOrderNo: order.orderNo,
                lines: issues.map(issue => ({
                    itemId: issue.rmItemId,
                    itemName: issue.rmItemName,
                    locationId: issue.locationId,
                    locationName: issue.locationName,
                    qty: issue.qty,
                    unitCost: issue.unitCost,
                    totalCost: issue.qty * issue.unitCost,
                })),
            });

            // Update material lines in production order
            const updatedMaterialLines = order.materialLines.map(line => {
                const issued = issues.find(i => i.rmItemId === line.rmItemId);
                if (issued) {
                    return {
                        ...line,
                        issuedQty: line.issuedQty + issued.qty,
                        unitCost: issued.unitCost,
                    };
                }
                return line;
            });

            await ProductionOrderService.updateProductionOrder(orderId, {
                materialLines: updatedMaterialLines,
            });

            return { success: true, message: "Materials issued successfully" };
        }
    },

    /**
     * Complete production
     * This creates stock ledger entries for finished goods and GL postings
     */
    completeProduction: async (orderId: string, output: {
        fgItemId: string;
        fgItemName: string;
        locationId: string;
        locationName: string;
        qty: number;
        unitCost: number;
    }) => {
        if (USE_MOCK) {
            const order = await ProductionOrderService.getProductionOrderById(orderId);
            if (!order) {
                throw new Error("Production order not found");
            }

            if (order.status !== "IN_PROGRESS") {
                throw new Error("Production order must be IN_PROGRESS to complete");
            }

            // Post to GL and update stock ledger
            await PostingEngineService.postProductionOutput({
                outputId: `OUTPUT-${orderId}`,
                outputNo: `OUTPUT-${order.orderNo}`,
                date: new Date().toISOString().split('T')[0],
                productionOrderNo: order.orderNo,
                lines: [{
                    itemId: output.fgItemId,
                    itemName: output.fgItemName,
                    locationId: output.locationId,
                    locationName: output.locationName,
                    qty: output.qty,
                    unitCost: output.unitCost,
                    totalCost: output.qty * output.unitCost,
                }],
            });

            // Update production order
            await ProductionOrderService.updateProductionOrder(orderId, {
                actualQty: output.qty,
                status: "COMPLETED",
                endDate: new Date().toISOString().split('T')[0],
                outputLines: [{
                    fgItemId: output.fgItemId,
                    fgItemName: output.fgItemName,
                    locationId: output.locationId,
                    locationName: output.locationName,
                    qty: output.qty,
                    unitCost: output.unitCost,
                }],
            });

            return { success: true, message: "Production completed successfully" };
        }
    },

    /**
     * Cancel production order
     */
    cancelProductionOrder: async (orderId: string, reason?: string) => {
        const order = await ProductionOrderService.getProductionOrderById(orderId);
        if (!order) {
            throw new Error("Production order not found");
        }

        if (order.status === "COMPLETED") {
            throw new Error("Cannot cancel a completed production order");
        }

        if (order.materialLines.some(line => line.issuedQty > 0)) {
            throw new Error("Cannot cancel production order with issued materials. Please create adjustment entries.");
        }

        return ProductionOrderService.updateProductionOrder(orderId, {
            status: "CANCELLED",
            remarks: reason ? `${order.remarks || ''}\nCancelled: ${reason}` : order.remarks,
        });
    },

    /**
     * Get production summary statistics
     */
    getProductionSummary: async (): Promise<{
        totalOrders: number;
        planned: number;
        inProgress: number;
        completed: number;
        cancelled: number;
    }> => {
        const orders = await ProductionOrderService.getProductionOrders();
        return {
            totalOrders: orders.length,
            planned: orders.filter(o => o.status === "PLANNED").length,
            inProgress: orders.filter(o => o.status === "IN_PROGRESS").length,
            completed: orders.filter(o => o.status === "COMPLETED").length,
            cancelled: orders.filter(o => o.status === "CANCELLED").length,
        };
    },
};
