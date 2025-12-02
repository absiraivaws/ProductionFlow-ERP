import { db } from "@/lib/firebase";
import { PostingEngineService } from "./PostingEngineService";

export interface CustomerReceipt {
    id: string;
    receiptNo: string; // RCP-0001
    customerId: string;
    customerName?: string;
    paymentDate: string; // YYYY-MM-DD
    amount: number;
    paymentMode: "CASH" | "BANK" | "CHEQUE" | "ONLINE";
    bankAccountId?: string;
    allocations?: Array<{
        invoiceId: string;
        invoiceNo: string;
        amount: number;
    }>;
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

// Generate receipt number
const generateReceiptNo = (receipts: CustomerReceipt[]): string => {
    const count = receipts.length + 1;
    return `RCP-${String(count).padStart(4, '0')}`;
};

export const CustomerReceiptService = {
    /**
     * Get all customer receipts
     */
    getCustomerReceipts: async (filters?: {
        customerId?: string;
        fromDate?: string;
        toDate?: string;
    }): Promise<CustomerReceipt[]> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            let receipts: CustomerReceipt[] = getMockData(`customer_receipts_${COMPANY_ID}`) || [];

            // Apply filters
            if (filters?.customerId) {
                receipts = receipts.filter(r => r.customerId === filters.customerId);
            }
            if (filters?.fromDate) {
                receipts = receipts.filter(r => r.paymentDate >= filters.fromDate!);
            }
            if (filters?.toDate) {
                receipts = receipts.filter(r => r.paymentDate <= filters.toDate!);
            }

            return receipts.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        }
        return [];
    },

    /**
     * Get receipt by ID
     */
    getCustomerReceiptById: async (receiptId: string): Promise<CustomerReceipt | null> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const receipts = getMockData(`customer_receipts_${COMPANY_ID}`) || [];
            return receipts.find((r: CustomerReceipt) => r.id === receiptId) || null;
        }
        return null;
    },

    /**
     * Create customer receipt
     * Automatically posts to GL (DR: Cash/Bank, CR: Accounts Receivable)
     */
    createCustomerReceipt: async (data: Omit<CustomerReceipt, "id" | "receiptNo" | "isPosted" | "createdAt" | "updatedAt">) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const receipts = getMockData(`customer_receipts_${COMPANY_ID}`) || [];

            const newReceipt: CustomerReceipt = {
                ...data,
                id: `RCP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                receiptNo: generateReceiptNo(receipts),
                isPosted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            receipts.push(newReceipt);
            setMockData(`customer_receipts_${COMPANY_ID}`, receipts);

            // Auto-post to GL
            await CustomerReceiptService.postCustomerReceipt(newReceipt.id);

            return newReceipt;
        }
    },

    /**
     * Post customer receipt to GL
     * Creates: DR: Cash/Bank, CR: Accounts Receivable
     */
    postCustomerReceipt: async (receiptId: string) => {
        const receipt = await CustomerReceiptService.getCustomerReceiptById(receiptId);
        if (!receipt) {
            throw new Error("Customer receipt not found");
        }

        if (receipt.isPosted) {
            throw new Error("Receipt already posted");
        }

        // Post to GL using PostingEngineService
        await PostingEngineService.postCustomerReceipt({
            receiptId: receipt.id,
            receiptNo: receipt.receiptNo,
            date: receipt.paymentDate,
            customerId: receipt.customerId,
            customerName: receipt.customerName || "",
            amount: receipt.amount,
            paymentMode: receipt.paymentMode,
            bankAccountId: receipt.bankAccountId,
        });

        // Mark as posted
        return CustomerReceiptService.updateCustomerReceipt(receiptId, {
            isPosted: true,
        });
    },

    /**
     * Update customer receipt
     */
    updateCustomerReceipt: async (receiptId: string, updates: Partial<CustomerReceipt>) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const receipts = getMockData(`customer_receipts_${COMPANY_ID}`) || [];
            const index = receipts.findIndex((r: CustomerReceipt) => r.id === receiptId);

            if (index === -1) {
                throw new Error("Customer receipt not found");
            }

            receipts[index] = {
                ...receipts[index],
                ...updates,
                updatedAt: new Date(),
            };

            setMockData(`customer_receipts_${COMPANY_ID}`, receipts);
            return receipts[index];
        }
    },
};
