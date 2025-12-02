import { JournalService } from "./JournalService";
import { ItemService } from "./ItemService";
import { InvoiceService } from "./InvoiceService";
import { GRNService } from "./GRNService";
import { CustomerService } from "./CustomerService";

export interface DashboardMetrics {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    inventoryValue: number;
    totalCustomers: number;
    totalInvoices: number;
    recentInvoices: any[];
    recentGRNs: any[];
    lowStockItems: any[];
}

export const DashboardService = {
    getMetrics: async (): Promise<DashboardMetrics> => {
        // Fetch all data
        const [journals, items, invoices, grns, customers] = await Promise.all([
            JournalService.getJournals(),
            ItemService.getItems(),
            InvoiceService.getInvoices(),
            GRNService.getGRNs(),
            CustomerService.getCustomers(),
        ]);

        // Calculate revenue (credit to sales revenue account 4001)
        let totalRevenue = 0;
        journals.forEach(journal => {
            journal.entries.forEach(entry => {
                if (entry.accountId === "4001" || entry.accountId === "4002") {
                    totalRevenue += entry.credit;
                }
            });
        });

        // Calculate expenses (debit to expense accounts 5001-5004)
        let totalExpenses = 0;
        journals.forEach(journal => {
            journal.entries.forEach(entry => {
                if (entry.accountId?.startsWith("5")) {
                    totalExpenses += entry.debit;
                }
            });
        });

        // Calculate inventory value
        const inventoryValue = items.reduce((sum, item) =>
            sum + (item.currentStock * item.costPrice), 0
        );

        // Get low stock items (less than 10 units)
        const lowStockItems = items
            .filter(item => item.currentStock < 10)
            .sort((a, b) => a.currentStock - b.currentStock)
            .slice(0, 5);

        // Get recent transactions
        const recentInvoices = invoices.slice(0, 5);
        const recentGRNs = grns.slice(0, 5);

        return {
            totalRevenue,
            totalExpenses,
            netProfit: totalRevenue - totalExpenses,
            inventoryValue,
            totalCustomers: customers.length,
            totalInvoices: invoices.length,
            recentInvoices,
            recentGRNs,
            lowStockItems,
        };
    },
};
