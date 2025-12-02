import { SalesInvoiceService, SalesInvoice } from "./SalesInvoiceService";
import { SupplierInvoiceService, SupplierInvoice } from "./SupplierInvoiceService";

export interface ARAgingBucket {
    customerId: string;
    customerName?: string;
    current: number; // 0-30 days
    days30: number; // 31-60 days
    days60: number; // 61-90 days
    days90Plus: number; // 90+ days
    total: number;
}

export interface APAgingBucket {
    supplierId: string;
    supplierName?: string;
    current: number; // 0-30 days
    days30: number; // 31-60 days
    days60: number; // 61-90 days
    days90Plus: number; // 90+ days
    total: number;
}

export interface ARAgingReport {
    buckets: ARAgingBucket[];
    totals: {
        current: number;
        days30: number;
        days60: number;
        days90Plus: number;
        total: number;
    };
    asOfDate: string;
}

export interface APAgingReport {
    buckets: APAgingBucket[];
    totals: {
        current: number;
        days30: number;
        days60: number;
        days90Plus: number;
        total: number;
    };
    asOfDate: string;
}

// Helper function to calculate days overdue
const getDaysOverdue = (invoiceDate: string, asOfDate: string): number => {
    const invoice = new Date(invoiceDate);
    const asOf = new Date(asOfDate);
    const diffTime = asOf.getTime() - invoice.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export const AgingReportService = {
    /**
     * Generate Accounts Receivable Aging Report
     * Shows outstanding customer invoices by age
     */
    getARAgingReport: async (asOfDate?: string): Promise<ARAgingReport> => {
        const reportDate = asOfDate || new Date().toISOString().split('T')[0];
        const invoices = await SalesInvoiceService.getSalesInvoices();

        // Filter to only outstanding invoices
        const outstandingInvoices = invoices.filter(inv => inv.balanceAmount > 0);

        // Group by customer
        const customerMap = new Map<string, ARAgingBucket>();

        for (const invoice of outstandingInvoices) {
            const daysOld = getDaysOverdue(invoice.invoiceDate, reportDate);
            const amount = invoice.balanceAmount;

            if (!customerMap.has(invoice.customerId)) {
                customerMap.set(invoice.customerId, {
                    customerId: invoice.customerId,
                    customerName: invoice.customerName,
                    current: 0,
                    days30: 0,
                    days60: 0,
                    days90Plus: 0,
                    total: 0,
                });
            }

            const bucket = customerMap.get(invoice.customerId)!;

            // Categorize by age
            if (daysOld <= 30) {
                bucket.current += amount;
            } else if (daysOld <= 60) {
                bucket.days30 += amount;
            } else if (daysOld <= 90) {
                bucket.days60 += amount;
            } else {
                bucket.days90Plus += amount;
            }

            bucket.total += amount;
        }

        const buckets = Array.from(customerMap.values());

        // Calculate totals
        const totals = {
            current: buckets.reduce((sum, b) => sum + b.current, 0),
            days30: buckets.reduce((sum, b) => sum + b.days30, 0),
            days60: buckets.reduce((sum, b) => sum + b.days60, 0),
            days90Plus: buckets.reduce((sum, b) => sum + b.days90Plus, 0),
            total: buckets.reduce((sum, b) => sum + b.total, 0),
        };

        return {
            buckets,
            totals,
            asOfDate: reportDate,
        };
    },

    /**
     * Generate Accounts Payable Aging Report
     * Shows outstanding supplier invoices by age
     */
    getAPAgingReport: async (asOfDate?: string): Promise<APAgingReport> => {
        const reportDate = asOfDate || new Date().toISOString().split('T')[0];
        const invoices = await SupplierInvoiceService.getSupplierInvoices();

        // Filter to only outstanding invoices
        const outstandingInvoices = invoices.filter(inv => inv.balanceAmount > 0);

        // Group by supplier
        const supplierMap = new Map<string, APAgingBucket>();

        for (const invoice of outstandingInvoices) {
            const daysOld = getDaysOverdue(invoice.invoiceDate, reportDate);
            const amount = invoice.balanceAmount;

            if (!supplierMap.has(invoice.supplierId)) {
                supplierMap.set(invoice.supplierId, {
                    supplierId: invoice.supplierId,
                    supplierName: invoice.supplierName,
                    current: 0,
                    days30: 0,
                    days60: 0,
                    days90Plus: 0,
                    total: 0,
                });
            }

            const bucket = supplierMap.get(invoice.supplierId)!;

            // Categorize by age
            if (daysOld <= 30) {
                bucket.current += amount;
            } else if (daysOld <= 60) {
                bucket.days30 += amount;
            } else if (daysOld <= 90) {
                bucket.days60 += amount;
            } else {
                bucket.days90Plus += amount;
            }

            bucket.total += amount;
        }

        const buckets = Array.from(supplierMap.values());

        // Calculate totals
        const totals = {
            current: buckets.reduce((sum, b) => sum + b.current, 0),
            days30: buckets.reduce((sum, b) => sum + b.days30, 0),
            days60: buckets.reduce((sum, b) => sum + b.days60, 0),
            days90Plus: buckets.reduce((sum, b) => sum + b.days90Plus, 0),
            total: buckets.reduce((sum, b) => sum + b.total, 0),
        };

        return {
            buckets,
            totals,
            asOfDate: reportDate,
        };
    },

    /**
     * Get AR/AP summary
     */
    getARAPSummary: async () => {
        const arReport = await AgingReportService.getARAgingReport();
        const apReport = await AgingReportService.getAPAgingReport();

        return {
            accountsReceivable: {
                total: arReport.totals.total,
                current: arReport.totals.current,
                overdue: arReport.totals.days30 + arReport.totals.days60 + arReport.totals.days90Plus,
            },
            accountsPayable: {
                total: apReport.totals.total,
                current: apReport.totals.current,
                overdue: apReport.totals.days30 + apReport.totals.days60 + apReport.totals.days90Plus,
            },
            netPosition: arReport.totals.total - apReport.totals.total,
        };
    },
};
