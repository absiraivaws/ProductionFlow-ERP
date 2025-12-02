import { db } from "@/lib/firebase";
import { PostingEngineService } from "./PostingEngineService";
import { StockLedgerService } from "./StockLedgerService";

export type SalesInvoiceStatus = "DRAFT" | "UNPAID" | "PARTLY_PAID" | "PAID";

export interface SalesInvoiceLine {
    itemId: string;
    itemName?: string;
    locationId: string;
    locationName?: string;
    qty: number;
    price: number;
    taxRate: number;
    lineTotal: number;
    unitCost: number; // For COGS calculation
    unit?: string;
    batchNo?: string;
    serialNos?: string[];
    expiryDate?: string;
}

export interface SalesInvoice {
    id: string;
    invoiceNo: string; // INV-0001
    customerId: string;
    customerName?: string;
    invoiceDate: string; // YYYY-MM-DD
    dueDate?: string;
    salesOrderId?: string; // Link to sales order
    salesOrderNo?: string;
    paymentTerm: "CASH" | "CREDIT";
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    status: SalesInvoiceStatus;
    lines: SalesInvoiceLine[];
    remarks?: string;
    isPosted: boolean; // Has GL posting been done
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

// Generate invoice number
const generateInvoiceNo = (invoices: SalesInvoice[]): string => {
    const count = invoices.length + 1;
    return `INV-${String(count).padStart(4, '0')}`;
};

// Calculate totals
const calculateTotals = (lines: SalesInvoiceLine[]) => {
    const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const taxAmount = lines.reduce((sum, line) => sum + (line.lineTotal * line.taxRate), 0);
    const totalAmount = subtotal + taxAmount;
    return { subtotal, taxAmount, totalAmount };
};

export const SalesInvoiceService = {
    /**
     * Get all sales invoices
     */
    getSalesInvoices: async (filters?: {
        status?: SalesInvoiceStatus;
        customerId?: string;
        paymentTerm?: "CASH" | "CREDIT";
        fromDate?: string;
        toDate?: string;
    }): Promise<SalesInvoice[]> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            let invoices: SalesInvoice[] = getMockData(`sales_invoices_${COMPANY_ID}`) || [];

            // Apply filters
            if (filters?.status) {
                invoices = invoices.filter(i => i.status === filters.status);
            }
            if (filters?.customerId) {
                invoices = invoices.filter(i => i.customerId === filters.customerId);
            }
            if (filters?.paymentTerm) {
                invoices = invoices.filter(i => i.paymentTerm === filters.paymentTerm);
            }
            if (filters?.fromDate) {
                invoices = invoices.filter(i => i.invoiceDate >= filters.fromDate!);
            }
            if (filters?.toDate) {
                invoices = invoices.filter(i => i.invoiceDate <= filters.toDate!);
            }

            return invoices.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        }
        return [];
    },

    /**
     * Get sales invoice by ID
     */
    getSalesInvoiceById: async (invoiceId: string): Promise<SalesInvoice | null> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const invoices = getMockData(`sales_invoices_${COMPANY_ID}`) || [];
            return invoices.find((i: SalesInvoice) => i.id === invoiceId) || null;
        }
        return null;
    },

    /**
     * Create sales invoice
     */
    createSalesInvoice: async (data: Omit<SalesInvoice, "id" | "invoiceNo" | "paidAmount" | "balanceAmount" | "isPosted" | "createdAt" | "updatedAt">) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const invoices = getMockData(`sales_invoices_${COMPANY_ID}`) || [];

            // Calculate totals
            const totals = calculateTotals(data.lines);

            // For cash sales, mark as paid immediately
            const paidAmount = data.paymentTerm === "CASH" ? totals.totalAmount : 0;
            const balanceAmount = totals.totalAmount - paidAmount;
            const status: SalesInvoiceStatus = data.paymentTerm === "CASH" ? "PAID" : "UNPAID";

            const newInvoice: SalesInvoice = {
                ...data,
                ...totals,
                id: `INV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                invoiceNo: generateInvoiceNo(invoices),
                paidAmount,
                balanceAmount,
                status: data.status || status,
                isPosted: false,
                currency: data.currency || "USD",
                exchangeRate: data.exchangeRate || 1.0,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            invoices.push(newInvoice);
            setMockData(`sales_invoices_${COMPANY_ID}`, invoices);
            return newInvoice;
        }
    },

    /**
     * Post sales invoice to GL
     * Creates journal entries for sales and COGS
     * Updates stock ledger
     */
    postSalesInvoice: async (invoiceId: string) => {
        const invoice = await SalesInvoiceService.getSalesInvoiceById(invoiceId);
        if (!invoice) {
            throw new Error("Sales invoice not found");
        }

        if (invoice.isPosted) {
            throw new Error("Invoice already posted");
        }

        // Check stock availability
        for (const line of invoice.lines) {
            const available = await StockLedgerService.checkStockAvailability(
                line.itemId,
                line.locationId,
                line.qty
            );
            if (!available) {
                throw new Error(`Insufficient stock for ${line.itemName} at ${line.locationName}`);
            }
        }

        // Post to GL (creates sales entry and COGS entry)
        await PostingEngineService.postSalesInvoice({
            invoiceId: invoice.id,
            invoiceNo: invoice.invoiceNo,
            date: invoice.invoiceDate,
            customerId: invoice.customerId,
            customerName: invoice.customerName || "",
            paymentTerm: invoice.paymentTerm,
            subtotal: invoice.subtotal,
            taxAmount: invoice.taxAmount,
            totalAmount: invoice.totalAmount,
            lines: invoice.lines.map(line => ({
                itemId: line.itemId,
                itemName: line.itemName || "",
                locationId: line.locationId,
                qty: line.qty,
                unitCost: line.unitCost,
                totalCost: line.qty * line.unitCost,
                batchNo: line.batchNo,
                serialNos: line.serialNos,
                expiryDate: line.expiryDate,
            })),
        });

        // Mark as posted
        return SalesInvoiceService.updateSalesInvoice(invoiceId, {
            isPosted: true,
        });
    },

    /**
     * Update sales invoice
     */
    updateSalesInvoice: async (invoiceId: string, updates: Partial<SalesInvoice>) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const invoices = getMockData(`sales_invoices_${COMPANY_ID}`) || [];
            const index = invoices.findIndex((i: SalesInvoice) => i.id === invoiceId);

            if (index === -1) {
                throw new Error("Sales invoice not found");
            }

            // Recalculate totals if lines are updated
            if (updates.lines) {
                const totals = calculateTotals(updates.lines);
                updates = { ...updates, ...totals };
            }

            invoices[index] = {
                ...invoices[index],
                ...updates,
                updatedAt: new Date(),
            };

            setMockData(`sales_invoices_${COMPANY_ID}`, invoices);
            return invoices[index];
        }
    },

    /**
     * Record payment against invoice
     */
    recordPayment: async (invoiceId: string, paymentAmount: number) => {
        const invoice = await SalesInvoiceService.getSalesInvoiceById(invoiceId);
        if (!invoice) {
            throw new Error("Sales invoice not found");
        }

        const newPaidAmount = invoice.paidAmount + paymentAmount;
        const newBalanceAmount = invoice.totalAmount - newPaidAmount;

        let newStatus: SalesInvoiceStatus = "UNPAID";
        if (newBalanceAmount <= 0) {
            newStatus = "PAID";
        } else if (newPaidAmount > 0) {
            newStatus = "PARTLY_PAID";
        }

        return SalesInvoiceService.updateSalesInvoice(invoiceId, {
            paidAmount: newPaidAmount,
            balanceAmount: newBalanceAmount,
            status: newStatus,
        });
    },

    /**
     * Get outstanding invoices for a customer
     */
    getOutstandingInvoices: async (customerId: string): Promise<SalesInvoice[]> => {
        const invoices = await SalesInvoiceService.getSalesInvoices({ customerId });
        return invoices.filter(i => i.balanceAmount > 0);
    },

    /**
     * Get total receivables
     */
    getTotalReceivables: async (): Promise<number> => {
        const invoices = await SalesInvoiceService.getSalesInvoices();
        return invoices.reduce((sum, i) => sum + i.balanceAmount, 0);
    },
};
