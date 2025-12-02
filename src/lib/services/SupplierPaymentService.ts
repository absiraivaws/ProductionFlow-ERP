import { db } from "@/lib/firebase";
import { PostingEngineService } from "./PostingEngineService";
import { SupplierInvoiceService } from "./SupplierInvoiceService";

export interface PaymentAllocation {
    invoiceId: string;
    invoiceNo?: string;
    invoiceAmount: number;
    outstandingAmount: number;
    paymentAmount: number;
}

export interface SupplierPayment {
    id: string;
    paymentNo: string; // SPAY-0001
    supplierId: string;
    supplierName?: string;
    paymentDate: string; // YYYY-MM-DD
    amount: number;
    paymentMode: "CASH" | "BANK" | "CHEQUE";
    bankAccountId?: string;
    bankAccountName?: string;
    referenceNo?: string; // Cheque number or transaction reference
    allocations: PaymentAllocation[];
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

// Generate payment number
const generatePaymentNo = (payments: SupplierPayment[]): string => {
    const count = payments.length + 1;
    return `SPAY-${String(count).padStart(4, '0')}`;
};

export const SupplierPaymentService = {
    /**
     * Get all supplier payments
     */
    getSupplierPayments: async (filters?: {
        supplierId?: string;
        fromDate?: string;
        toDate?: string;
    }): Promise<SupplierPayment[]> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            let payments: SupplierPayment[] = getMockData(`supplier_payments_${COMPANY_ID}`) || [];

            // Apply filters
            if (filters?.supplierId) {
                payments = payments.filter(p => p.supplierId === filters.supplierId);
            }
            if (filters?.fromDate) {
                payments = payments.filter(p => p.paymentDate >= filters.fromDate!);
            }
            if (filters?.toDate) {
                payments = payments.filter(p => p.paymentDate <= filters.toDate!);
            }

            return payments.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        }
        return [];
    },

    /**
     * Get supplier payment by ID
     */
    getSupplierPaymentById: async (paymentId: string): Promise<SupplierPayment | null> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const payments = getMockData(`supplier_payments_${COMPANY_ID}`) || [];
            return payments.find((p: SupplierPayment) => p.id === paymentId) || null;
        }
        return null;
    },

    /**
     * Create supplier payment
     */
    createSupplierPayment: async (data: Omit<SupplierPayment, "id" | "paymentNo" | "isPosted" | "createdAt" | "updatedAt">) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const payments = getMockData(`supplier_payments_${COMPANY_ID}`) || [];

            // Validate allocations
            const totalAllocated = data.allocations.reduce((sum, a) => sum + a.paymentAmount, 0);
            if (Math.abs(totalAllocated - data.amount) > 0.01) {
                throw new Error(`Total allocated (${totalAllocated}) must equal payment amount (${data.amount})`);
            }

            const newPayment: SupplierPayment = {
                ...data,
                id: `SPAY-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                paymentNo: generatePaymentNo(payments),
                isPosted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            payments.push(newPayment);
            setMockData(`supplier_payments_${COMPANY_ID}`, payments);
            return newPayment;
        }
    },

    /**
     * Post supplier payment to GL
     * Creates journal entry: DR: Accounts Payable, CR: Cash/Bank
     * Updates invoice payment status
     */
    postSupplierPayment: async (paymentId: string) => {
        const payment = await SupplierPaymentService.getSupplierPaymentById(paymentId);
        if (!payment) {
            throw new Error("Supplier payment not found");
        }

        if (payment.isPosted) {
            throw new Error("Payment already posted");
        }

        // Post to GL
        await PostingEngineService.postSupplierPayment({
            paymentId: payment.id,
            paymentNo: payment.paymentNo,
            date: payment.paymentDate,
            supplierId: payment.supplierId,
            supplierName: payment.supplierName || "",
            amount: payment.amount,
            paymentMode: payment.paymentMode,
            bankAccountId: payment.bankAccountId,
        });

        // Update invoice payment status
        for (const allocation of payment.allocations) {
            await SupplierInvoiceService.recordPayment(
                allocation.invoiceId,
                allocation.paymentAmount
            );
        }

        // Mark payment as posted
        return SupplierPaymentService.updateSupplierPayment(paymentId, {
            isPosted: true,
        });
    },

    /**
     * Update supplier payment
     */
    updateSupplierPayment: async (paymentId: string, updates: Partial<SupplierPayment>) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const payments = getMockData(`supplier_payments_${COMPANY_ID}`) || [];
            const index = payments.findIndex((p: SupplierPayment) => p.id === paymentId);

            if (index === -1) {
                throw new Error("Supplier payment not found");
            }

            payments[index] = {
                ...payments[index],
                ...updates,
                updatedAt: new Date(),
            };

            setMockData(`supplier_payments_${COMPANY_ID}`, payments);
            return payments[index];
        }
    },

    /**
     * Get total payments for a supplier
     */
    getTotalPaymentsBySupplier: async (supplierId: string): Promise<number> => {
        const payments = await SupplierPaymentService.getSupplierPayments({ supplierId });
        return payments.reduce((sum, p) => sum + p.amount, 0);
    },

    /**
     * Get payment summary
     */
    getPaymentSummary: async (): Promise<{
        totalPayments: number;
        totalAmount: number;
        cashPayments: number;
        bankPayments: number;
    }> => {
        const payments = await SupplierPaymentService.getSupplierPayments();
        return {
            totalPayments: payments.length,
            totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
            cashPayments: payments.filter(p => p.paymentMode === "CASH").reduce((sum, p) => sum + p.amount, 0),
            bankPayments: payments.filter(p => p.paymentMode === "BANK" || p.paymentMode === "CHEQUE").reduce((sum, p) => sum + p.amount, 0),
        };
    },
};
