import { db } from "@/lib/firebase";
import { PostingEngineService } from "./PostingEngineService";

export type SupplierInvoiceStatus = "UNPAID" | "PARTLY_PAID" | "PAID";

export interface SupplierInvoiceLine {
    itemId?: string;
    itemName?: string;
    description: string;
    qty: number;
    price: number;
    taxRate: number;
    lineTotal: number;
    unit?: string;
}

export interface SupplierInvoice {
    id: string;
    invoiceNo: string; // SINV-0001
    supplierId: string;
    supplierName?: string;
    invoiceDate: string; // YYYY-MM-DD
    dueDate?: string;
    poId?: string; // Link to purchase order
    poNo?: string;
    grnId?: string; // Link to GRN
    grnNo?: string;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    status: SupplierInvoiceStatus;
    lines: SupplierInvoiceLine[];
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

// Generate invoice number
const generateInvoiceNo = (invoices: SupplierInvoice[]): string => {
    const count = invoices.length + 1;
    return `SINV-${String(count).padStart(4, '0')}`;
};

// Calculate totals
const calculateTotals = (lines: SupplierInvoiceLine[]) => {
    const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const taxAmount = lines.reduce((sum, line) => sum + (line.lineTotal * line.taxRate), 0);
    const totalAmount = subtotal + taxAmount;
    return { subtotal, taxAmount, totalAmount };
};

export const SupplierInvoiceService = {
    /**
     * Get all supplier invoices
     */
    getSupplierInvoices: async (filters?: {
        status?: SupplierInvoiceStatus;
        supplierId?: string;
        fromDate?: string;
        toDate?: string;
    }): Promise<SupplierInvoice[]> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            let invoices: SupplierInvoice[] = getMockData(`supplier_invoices_${COMPANY_ID}`) || [];

            // Apply filters
            if (filters?.status) {
                invoices = invoices.filter(i => i.status === filters.status);
            }
            if (filters?.supplierId) {
                invoices = invoices.filter(i => i.supplierId === filters.supplierId);
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
     * Get supplier invoice by ID
     */
    getSupplierInvoiceById: async (invoiceId: string): Promise<SupplierInvoice | null> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const invoices = getMockData(`supplier_invoices_${COMPANY_ID}`) || [];
            return invoices.find((i: SupplierInvoice) => i.id === invoiceId) || null;
        }
        return null;
    },

    /**
     * Create supplier invoice
     */
    createSupplierInvoice: async (data: Omit<SupplierInvoice, "id" | "invoiceNo" | "paidAmount" | "balanceAmount" | "status" | "isPosted" | "createdAt" | "updatedAt">) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const invoices = getMockData(`supplier_invoices_${COMPANY_ID}`) || [];

            // Calculate totals
            const totals = calculateTotals(data.lines);

            const newInvoice: SupplierInvoice = {
                ...data,
                ...totals,
                id: `SINV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                invoiceNo: generateInvoiceNo(invoices),
                paidAmount: 0,
                balanceAmount: totals.totalAmount,
                status: "UNPAID",
                isPosted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            invoices.push(newInvoice);
            setMockData(`supplier_invoices_${COMPANY_ID}`, invoices);
            return newInvoice;
        }
    },

    /**
     * Post supplier invoice to GL
     * Creates journal entry: DR: Inventory/Expense, CR: Accounts Payable
     */
    postSupplierInvoice: async (invoiceId: string) => {
        const invoice = await SupplierInvoiceService.getSupplierInvoiceById(invoiceId);
        if (!invoice) {
            throw new Error("Supplier invoice not found");
        }

        if (invoice.isPosted) {
            throw new Error("Invoice already posted");
        }

        // Post to GL
        await PostingEngineService.postPurchaseInvoice({
            invoiceId: invoice.id,
            invoiceNo: invoice.invoiceNo,
            date: invoice.invoiceDate,
            supplierId: invoice.supplierId,
            supplierName: invoice.supplierName || "",
            subtotal: invoice.subtotal,
            taxAmount: invoice.taxAmount,
            totalAmount: invoice.totalAmount,
            inventoryAmount: invoice.subtotal, // Assuming all goes to inventory
            expenseAmount: 0,
        });

        // Mark as posted
        return SupplierInvoiceService.updateSupplierInvoice(invoiceId, {
            isPosted: true,
        });
    },

    /**
     * Update supplier invoice
     */
    updateSupplierInvoice: async (invoiceId: string, updates: Partial<SupplierInvoice>) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const invoices = getMockData(`supplier_invoices_${COMPANY_ID}`) || [];
            const index = invoices.findIndex((i: SupplierInvoice) => i.id === invoiceId);

            if (index === -1) {
                throw new Error("Supplier invoice not found");
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

            setMockData(`supplier_invoices_${COMPANY_ID}`, invoices);
            return invoices[index];
        }
    },

    /**
     * Record payment against invoice
     */
    recordPayment: async (invoiceId: string, paymentAmount: number) => {
        const invoice = await SupplierInvoiceService.getSupplierInvoiceById(invoiceId);
        if (!invoice) {
            throw new Error("Supplier invoice not found");
        }

        const newPaidAmount = invoice.paidAmount + paymentAmount;
        const newBalanceAmount = invoice.totalAmount - newPaidAmount;

        let newStatus: SupplierInvoiceStatus = "UNPAID";
        if (newBalanceAmount <= 0) {
            newStatus = "PAID";
        } else if (newPaidAmount > 0) {
            newStatus = "PARTLY_PAID";
        }

        return SupplierInvoiceService.updateSupplierInvoice(invoiceId, {
            paidAmount: newPaidAmount,
            balanceAmount: newBalanceAmount,
            status: newStatus,
        });
    },

    /**
     * Get outstanding invoices for a supplier
     */
    getOutstandingInvoices: async (supplierId: string): Promise<SupplierInvoice[]> => {
        const invoices = await SupplierInvoiceService.getSupplierInvoices({ supplierId });
        return invoices.filter(i => i.balanceAmount > 0);
    },

    /**
     * Get total payables
     */
    getTotalPayables: async (): Promise<number> => {
        const invoices = await SupplierInvoiceService.getSupplierInvoices();
        return invoices.reduce((sum, i) => sum + i.balanceAmount, 0);
    },
};
