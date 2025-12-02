import { db } from "@/lib/firebase";
import { ItemService } from "./ItemService";
import { JournalService } from "./JournalService";

export interface InvoiceItem {
    itemId: string;
    itemName?: string;
    qty: number;
    sellingPrice: number;
    costPrice?: number; // For COGS calculation
    lineTotal: number;
}

export interface Invoice {
    id: string;
    invoiceNo: string;
    date: string;
    customerId: string;
    customerName: string;
    items: InvoiceItem[];
    invoiceTotal: number;
    paymentType: "cash" | "credit";
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

const generateInvoiceNo = (invoices: Invoice[]): string => {
    const count = invoices.length + 1;
    return `INV-${String(count).padStart(5, '0')}`;
};

export const InvoiceService = {
    getInvoices: async (): Promise<Invoice[]> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const invoices = getMockData(`invoices_${COMPANY_ID}`) || [];
            return invoices.sort((a: Invoice, b: Invoice) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
        }
        return [];
    },

    createInvoice: async (data: Omit<Invoice, "id" | "invoiceNo" | "invoiceTotal" | "createdAt">) => {
        const invoiceTotal = data.items.reduce((sum, item) => sum + item.lineTotal, 0);
        const totalCOGS = data.items.reduce((sum, item) => sum + ((item.costPrice || 0) * item.qty), 0);

        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const invoices = getMockData(`invoices_${COMPANY_ID}`) || [];

            const newInvoice: Invoice = {
                ...data,
                id: Math.random().toString(36).substr(2, 9),
                invoiceNo: generateInvoiceNo(invoices),
                invoiceTotal,
                createdAt: new Date(),
            };

            // Reduce stock for each item
            for (const item of data.items) {
                await ItemService.updateStock(item.itemId, -item.qty); // Negative for reduction
            }

            // Post accounting entries
            // 1. Revenue Recognition: Debit Cash/AR, Credit Sales Revenue
            const revenueEntries = [
                {
                    accountId: data.paymentType === "cash" ? "1001" : "1003", // Cash or AR
                    debit: invoiceTotal,
                    credit: 0,
                },
                {
                    accountId: "4001", // Sales Revenue
                    debit: 0,
                    credit: invoiceTotal,
                },
            ];

            await JournalService.createJournal({
                date: data.date,
                description: `Sales Invoice ${newInvoice.invoiceNo} - ${data.customerName}`,
                entries: revenueEntries,
                createdBy: data.createdBy,
            });

            // 2. COGS Recognition: Debit COGS, Credit Inventory
            if (totalCOGS > 0) {
                const cogsEntries = [
                    {
                        accountId: "5001", // COGS
                        debit: totalCOGS,
                        credit: 0,
                    },
                    {
                        accountId: "1004", // Inventory
                        debit: 0,
                        credit: totalCOGS,
                    },
                ];

                await JournalService.createJournal({
                    date: data.date,
                    description: `COGS for Invoice ${newInvoice.invoiceNo}`,
                    entries: cogsEntries,
                    createdBy: data.createdBy,
                });
            }

            invoices.push(newInvoice);
            setMockData(`invoices_${COMPANY_ID}`, invoices);
            return newInvoice;
        }
    },
};
