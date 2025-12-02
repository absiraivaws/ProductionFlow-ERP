import { db } from "@/lib/firebase";
import { ProductionOrderService } from "./ProductionOrderService";
import { SalesInvoiceService } from "./SalesInvoiceService";
import { StockLedgerService } from "./StockLedgerService";
import { JournalService } from "./JournalService";
import { ItemService } from "./ItemService";

export type SalesOrderStatus = "DRAFT" | "CONFIRMED" | "PARTIALLY_DELIVERED" | "DELIVERED" | "INVOICED" | "CLOSED" | "CANCELLED";

export interface SalesOrderLine {
    itemId: string;
    itemName?: string;
    qty: number;
    price: number;
    taxRate: number;
    lineTotal: number;
    deliveredQty: number;
    unit?: string;
}

export interface SalesOrder {
    id: string;
    orderNo: string; // SO-0001
    customerId: string;
    customerName?: string;
    orderDate: string; // YYYY-MM-DD
    deliveryDate?: string;
    status: SalesOrderStatus;
    paymentTerm: "CASH" | "CREDIT";
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    lines: SalesOrderLine[];
    remarks?: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    productionStatus?: "PENDING" | "IN_PROGRESS" | "COMPLETED";
    paymentStatus?: "UNPAID" | "PARTIAL" | "PAID";
    currency: string; // e.g., "USD", "EUR"
    exchangeRate: number; // 1.0 for base currency
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

// Generate order number
const generateOrderNo = (orders: SalesOrder[]): string => {
    const count = orders.length + 1;
    return `SO-${String(count).padStart(4, '0')}`;
};

// Calculate totals
const calculateTotals = (lines: SalesOrderLine[]) => {
    const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const taxAmount = lines.reduce((sum, line) => sum + (line.lineTotal * line.taxRate), 0);
    const totalAmount = subtotal + taxAmount;
    return { subtotal, taxAmount, totalAmount };
};

export const SalesOrderService = {
    /**
     * Get all sales orders
     */
    getSalesOrders: async (filters?: {
        status?: SalesOrderStatus;
        customerId?: string;
        fromDate?: string;
        toDate?: string;
    }): Promise<SalesOrder[]> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            let orders: SalesOrder[] = getMockData(`sales_orders_${COMPANY_ID}`) || [];

            // Apply filters
            if (filters?.status) {
                orders = orders.filter(o => o.status === filters.status);
            }
            if (filters?.customerId) {
                orders = orders.filter(o => o.customerId === filters.customerId);
            }
            if (filters?.fromDate) {
                orders = orders.filter(o => o.orderDate >= filters.fromDate!);
            }
            if (filters?.toDate) {
                orders = orders.filter(o => o.orderDate <= filters.toDate!);
            }

            return orders.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        }
        return [];
    },

    /**
     * Get sales order by ID
     */
    getSalesOrderById: async (orderId: string): Promise<SalesOrder | null> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const orders = getMockData(`sales_orders_${COMPANY_ID}`) || [];
            return orders.find((o: SalesOrder) => o.id === orderId) || null;
        }
        return null;
    },

    /**
     * Create sales order
     */
    createSalesOrder: async (data: Omit<SalesOrder, "id" | "orderNo" | "createdAt" | "updatedAt">) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const orders = getMockData(`sales_orders_${COMPANY_ID}`) || [];

            // Calculate totals
            const totals = calculateTotals(data.lines);

            const newOrder: SalesOrder = {
                ...data,
                ...totals,
                id: `SO-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                orderNo: generateOrderNo(orders),
                currency: data.currency || "USD",
                exchangeRate: data.exchangeRate || 1.0,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            orders.push(newOrder);
            setMockData(`sales_orders_${COMPANY_ID}`, orders);
            return newOrder;
        }
    },

    /**
     * Update sales order
     */
    updateSalesOrder: async (orderId: string, updates: Partial<SalesOrder>) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const orders = getMockData(`sales_orders_${COMPANY_ID}`) || [];
            const index = orders.findIndex((o: SalesOrder) => o.id === orderId);

            if (index === -1) {
                throw new Error("Sales order not found");
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

            setMockData(`sales_orders_${COMPANY_ID}`, orders);
            return orders[index];
        }
    },

    /**
     * Confirm sales order
     * Triggers production order and draft invoice creation
     */
    confirmSalesOrder: async (orderId: string) => {
        const order = await SalesOrderService.updateSalesOrder(orderId, {
            status: "CONFIRMED",
            productionStatus: "PENDING",
            paymentStatus: "UNPAID",
        });

        if (!order) return null;

        // 1. Trigger production creation
        await SalesOrderService.createProductionOrders(orderId);

        // 2. Create draft invoice
        const draftInvoice = await SalesInvoiceService.createSalesInvoice({
            customerId: order.customerId,
            customerName: order.customerName,
            invoiceDate: new Date().toISOString().split('T')[0],
            paymentTerm: order.paymentTerm,
            salesOrderId: order.id,
            salesOrderNo: order.orderNo,
            subtotal: order.subtotal,
            taxAmount: order.taxAmount,
            totalAmount: order.totalAmount,
            lines: order.lines.map((line: SalesOrderLine) => ({
                itemId: line.itemId,
                itemName: line.itemName,
                locationId: "LOC-001", // Default location
                qty: line.qty,
                price: line.price,
                taxRate: line.taxRate,
                lineTotal: line.lineTotal,
                unitCost: 0, // Should be fetched from item master
            })),
            status: "DRAFT",
            currency: order.currency || "USD",
            exchangeRate: order.exchangeRate || 1.0,
            createdBy: order.createdBy,
        });

        return {
            order,
            invoice: draftInvoice
        };
    },

    /**
     * Deliver sales order
     * Updates stock, finalizes invoice, and posts GL entries
     */
    deliverSalesOrder: async (orderId: string) => {
        const order = await SalesOrderService.getSalesOrderById(orderId);
        if (!order) throw new Error("Order not found");
        if (order.status === "DELIVERED") throw new Error("Order already delivered");

        const items = await ItemService.getItems();

        // Find linked invoice
        const invoices = await SalesInvoiceService.getSalesInvoices({ customerId: order.customerId });
        const invoice = invoices.find(i => i.salesOrderId === orderId);

        if (invoice) {
            // Process lines for batch/serial assignment
            const newLines: any[] = [];

            for (const line of invoice.lines) {
                const item = items.find(i => i.id === line.itemId);
                const tracking = item?.trackingType || "NONE";

                if (tracking === "BATCH") {
                    const batches = await StockLedgerService.getBatchBalances(line.itemId, line.locationId);
                    let remainingQty = line.qty;

                    for (const batch of batches) {
                        if (remainingQty <= 0) break;

                        const takeQty = Math.min(remainingQty, batch.qty);
                        newLines.push({
                            ...line,
                            qty: takeQty,
                            lineTotal: takeQty * line.price, // Recalculate total
                            batchNo: batch.batchNo,
                            expiryDate: batch.expiryDate
                        });
                        remainingQty -= takeQty;
                    }

                    if (remainingQty > 0) {
                        // Not enough batch stock, add remainder
                        newLines.push({
                            ...line,
                            qty: remainingQty,
                            lineTotal: remainingQty * line.price
                        });
                    }
                } else if (tracking === "SERIAL") {
                    const serials = await StockLedgerService.getAvailableSerials(line.itemId, line.locationId);
                    const pickedSerials = serials.slice(0, line.qty);

                    newLines.push({
                        ...line,
                        serialNos: pickedSerials
                    });
                } else {
                    newLines.push(line);
                }
            }

            // Update invoice with processed lines
            await SalesInvoiceService.updateSalesInvoice(invoice.id, {
                lines: newLines,
                status: "UNPAID"
            });

            // Post invoice (updates stock and GL)
            if (!invoice.isPosted) {
                await SalesInvoiceService.postSalesInvoice(invoice.id);
            }
        } else {
            // Fallback: Manual stock deduction and GL if no invoice exists
            for (const line of order.lines) {
                await StockLedgerService.createEntry({
                    itemId: line.itemId,
                    itemName: line.itemName || "",
                    locationId: "LOC-001", // Default location
                    txnDate: new Date().toISOString().split('T')[0],
                    sourceType: "SALES_INVOICE",
                    sourceId: order.id,
                    sourceNo: order.orderNo,
                    qtyIn: 0,
                    qtyOut: line.qty,
                    unitCost: 0,
                    totalCost: 0,
                    remarks: `Delivery for Order ${order.orderNo}`,
                });
            }

            // Post GL entries
            await JournalService.createJournal({
                date: new Date().toISOString().split('T')[0],
                description: `Sales Order ${order.orderNo} - ${order.customerName}`,
                entries: [
                    {
                        accountId: "1002", // Accounts Receivable
                        debit: order.totalAmount,
                        credit: 0
                    },
                    {
                        accountId: "4001", // Sales Revenue
                        debit: 0,
                        credit: order.totalAmount
                    }
                ],
                createdBy: order.createdBy,
            });
        }

        // Update SO status
        const updatedOrder = await SalesOrderService.updateSalesOrder(orderId, {
            status: "DELIVERED",
            lines: order.lines.map(l => ({ ...l, deliveredQty: l.qty }))
        });

        return updatedOrder;
    },

    /**
     * Create production orders for all items in a sales order
     */
    createProductionOrders: async (orderId: string) => {
        const order = await SalesOrderService.getSalesOrderById(orderId);
        if (!order) throw new Error("Order not found");

        const createdOrders = [];
        for (const line of order.lines) {
            try {
                // Create production order for each line item
                // Note: This assumes every item in the SO needs production. 
                // In a real app, we might check if it's a manufactured item.
                const prodOrder = await ProductionOrderService.createProductionOrder({
                    fgItemId: line.itemId,
                    fgItemName: line.itemName,
                    plannedQty: line.qty,
                    startDate: new Date().toISOString().split('T')[0],
                    outputLocationId: "LOC-001", // Default location
                    outputLocationName: "Main Store",
                    remarks: `Production for Quotation ${order.orderNo}`,
                    createdBy: "system",
                });
                createdOrders.push(prodOrder);
            } catch (error) {
                console.warn(`Failed to create production order for item ${line.itemName}:`, error);
                // Continue with other items or handle error as needed
            }
        }

        return createdOrders;
    },

    /**
     * Update delivered quantity for a line
     */
    updateDeliveredQty: async (orderId: string, lineIndex: number, deliveredQty: number) => {
        const order = await SalesOrderService.getSalesOrderById(orderId);
        if (!order) {
            throw new Error("Sales order not found");
        }

        const updatedLines = [...order.lines];
        updatedLines[lineIndex].deliveredQty += deliveredQty;

        // Check if all lines are fully delivered
        const allDelivered = updatedLines.every(line => line.deliveredQty >= line.qty);
        const partiallyDelivered = updatedLines.some(line => line.deliveredQty > 0);

        let newStatus: SalesOrderStatus = order.status;
        if (allDelivered) {
            newStatus = "DELIVERED";
        } else if (partiallyDelivered) {
            newStatus = "PARTIALLY_DELIVERED";
        }

        return SalesOrderService.updateSalesOrder(orderId, {
            lines: updatedLines,
            status: newStatus,
        });
    },

    /**
     * Mark as invoiced
     */
    markAsInvoiced: async (orderId: string) => {
        return SalesOrderService.updateSalesOrder(orderId, {
            status: "INVOICED",
        });
    },

    /**
     * Close sales order
     */
    closeSalesOrder: async (orderId: string) => {
        return SalesOrderService.updateSalesOrder(orderId, {
            status: "CLOSED",
        });
    },

    /**
     * Cancel sales order
     */
    cancelSalesOrder: async (orderId: string, reason?: string) => {
        const order = await SalesOrderService.getSalesOrderById(orderId);
        if (!order) {
            throw new Error("Sales order not found");
        }

        if (order.status === "INVOICED" || order.status === "CLOSED") {
            throw new Error("Cannot cancel an invoiced or closed sales order");
        }

        if (order.lines.some(line => line.deliveredQty > 0)) {
            throw new Error("Cannot cancel sales order with delivered items");
        }

        return SalesOrderService.updateSalesOrder(orderId, {
            status: "CANCELLED",
            remarks: reason ? `${order.remarks || ''}\nCancelled: ${reason}` : order.remarks,
        });
    },

    /**
     * Get sales order summary
     */
    getSalesOrderSummary: async (): Promise<{
        totalOrders: number;
        draft: number;
        confirmed: number;
        delivered: number;
        totalValue: number;
    }> => {
        const orders = await SalesOrderService.getSalesOrders();
        return {
            totalOrders: orders.length,
            draft: orders.filter(o => o.status === "DRAFT").length,
            confirmed: orders.filter(o => o.status === "CONFIRMED").length,
            delivered: orders.filter(o => o.status === "DELIVERED").length,
            totalValue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
        };
    },
};
