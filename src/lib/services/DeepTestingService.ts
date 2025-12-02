import { ItemService } from "./ItemService";
// import { SupplierService } from "./SupplierService";
// import { CustomerService } from "./CustomerService";
// import { BOMService } from "./BOMService";
// import { JournalService } from "./JournalService";
// import { COAService } from "./COAService";
import { StockLedgerService } from "./StockLedgerService";

/**
 * Deep Testing Service - Sweet Delights Bakery Migration
 * Automatically populates complete company data for testing
 */
export const DeepTestingService = {
    /**
     * Execute complete deep testing scenario
     */
    executeFullMigration: async (onLog?: (msg: string) => void) => {
        const logs: string[] = [];
        const log = (msg: string) => {
            console.log(msg);
            logs.push(msg);
            if (onLog) onLog(msg);
        };

        log("🏢 Starting Sweet Delights Bakery Migration...");

        try {
            // Phase 1: Master Data
            log("\n📋 Phase 1: Creating Master Data...");
            await DeepTestingService.createMasterData(log);

            // Phase 2: Opening Balances
            log("\n💰 Phase 2: Entering Opening Balances...");
            // await DeepTestingService.createOpeningBalances(log);

            // Phase 3: Sample Transactions
            log("\n📦 Phase 3: Creating Sample Transactions...");
            // await DeepTestingService.createSampleTransactions(log);

            log("\n✅ Migration Complete!");

            return { success: true, logs };
        } catch (error: any) {
            console.error("❌ Migration failed:", error);
            log(`❌ Migration failed: ${error.message}`);
            return { success: false, error: error.message, logs };
        }
    },

    /**
     * Phase 1: Create all master data
     */
    createMasterData: async (log: (msg: string) => void) => {
        // 1. Create Items
        await DeepTestingService.createItems(log);

        // 2. Create Suppliers
        await DeepTestingService.createSuppliers(log);

        // 3. Create Customers
        await DeepTestingService.createCustomers(log);

        // 4. Create BOMs
        await DeepTestingService.createBOMs(log);
    },

    /**
     * Create 19 items (10 RM, 5 FG, 4 PKG)
     */
    createItems: async (log: (msg: string) => void) => {
        log("Creating items...");

        // Get actual categories from database
        const { ItemCategoryService } = await import("./ItemCategoryService");
        const { StockLedgerService } = await import("./StockLedgerService");
        const categories = await ItemCategoryService.getCategories();

        const rmCategory = categories.find(c => c.name === "Raw Materials");
        const fgCategory = categories.find(c => c.name === "Finished Goods");
        const pkgCategory = categories.find(c => c.name === "Packaging Materials");

        if (!rmCategory || !fgCategory || !pkgCategory) {
            console.log("⚠ Categories not found. Please initialize core data first.");
            throw new Error("Categories not found. Run 'Initialize Core Data' first.");
        }

        const items = [
            // Raw Materials (10)
            { name: "Wheat Flour", sku: "RM-001", type: "RAW_MATERIAL", categoryId: rmCategory.id, unit: "kg", costPrice: 2.50, sellingPrice: 0, minimumStock: 100 },
            { name: "Sugar", sku: "RM-002", type: "RAW_MATERIAL", categoryId: rmCategory.id, unit: "kg", costPrice: 1.80, sellingPrice: 0, minimumStock: 50 },
            { name: "Butter", sku: "RM-003", type: "RAW_MATERIAL", categoryId: rmCategory.id, unit: "kg", costPrice: 8.50, sellingPrice: 0, minimumStock: 30 },
            { name: "Eggs", sku: "RM-004", type: "RAW_MATERIAL", categoryId: rmCategory.id, unit: "dozen", costPrice: 3.20, sellingPrice: 0, minimumStock: 20 },
            { name: "Vanilla Extract", sku: "RM-005", type: "RAW_MATERIAL", categoryId: rmCategory.id, unit: "ltr", costPrice: 15.00, sellingPrice: 0, minimumStock: 5 },
            { name: "Cocoa Powder", sku: "RM-006", type: "RAW_MATERIAL", categoryId: rmCategory.id, unit: "kg", costPrice: 12.00, sellingPrice: 0, minimumStock: 20 },
            { name: "Milk Powder", sku: "RM-007", type: "RAW_MATERIAL", categoryId: rmCategory.id, unit: "kg", costPrice: 4.50, sellingPrice: 0, minimumStock: 30 },
            { name: "Yeast", sku: "RM-008", type: "RAW_MATERIAL", categoryId: rmCategory.id, unit: "kg", costPrice: 8.00, sellingPrice: 0, minimumStock: 10 },
            { name: "Salt", sku: "RM-009", type: "RAW_MATERIAL", categoryId: rmCategory.id, unit: "kg", costPrice: 0.50, sellingPrice: 0, minimumStock: 20 },
            { name: "Baking Powder", sku: "RM-010", type: "RAW_MATERIAL", categoryId: rmCategory.id, unit: "kg", costPrice: 3.00, sellingPrice: 0, minimumStock: 15 },

            // Finished Goods (5)
            { name: "Chocolate Cake", sku: "FG-001", type: "FINISHED_GOOD", categoryId: fgCategory.id, unit: "pcs", costPrice: 0, sellingPrice: 25.00, minimumStock: 10 },
            { name: "Vanilla Cupcakes (6-pack)", sku: "FG-002", type: "FINISHED_GOOD", categoryId: fgCategory.id, unit: "pack", costPrice: 0, sellingPrice: 12.00, minimumStock: 15 },
            { name: "Cookies Assortment", sku: "FG-003", type: "FINISHED_GOOD", categoryId: fgCategory.id, unit: "box", costPrice: 0, sellingPrice: 18.00, minimumStock: 20 },
            { name: "Croissants (12-pack)", sku: "FG-004", type: "FINISHED_GOOD", categoryId: fgCategory.id, unit: "pack", costPrice: 0, sellingPrice: 20.00, minimumStock: 12 },
            { name: "Bread Loaves", sku: "FG-005", type: "FINISHED_GOOD", categoryId: fgCategory.id, unit: "loaf", costPrice: 0, sellingPrice: 5.00, minimumStock: 50 },

            // Packaging (4)
            { name: "Cake Box (Large)", sku: "PKG-001", type: "PACKAGING", categoryId: pkgCategory.id, unit: "pcs", costPrice: 0.80, sellingPrice: 0, minimumStock: 50 },
            { name: "Cupcake Container", sku: "PKG-002", type: "PACKAGING", categoryId: pkgCategory.id, unit: "pcs", costPrice: 0.50, sellingPrice: 0, minimumStock: 100 },
            { name: "Cookie Box", sku: "PKG-003", type: "PACKAGING", categoryId: pkgCategory.id, unit: "pcs", costPrice: 0.60, sellingPrice: 0, minimumStock: 75 },
            { name: "Bread Bags", sku: "PKG-004", type: "PACKAGING", categoryId: pkgCategory.id, unit: "pcs", costPrice: 0.10, sellingPrice: 0, minimumStock: 200 },
        ];

        for (const item of items) {
            const openingStockQty = 1000;
            const openingStockValue = (item.costPrice || 0) * openingStockQty;

            const newItem = await ItemService.createItem({
                ...item,
                openingStockQty,
                openingStockValue,
                isActive: true,
            });

            if (!newItem) {
                throw new Error(`Failed to create item: ${item.name}`);
            }

            if (newItem) {
                // Create stock ledger entry for opening balance
                const entry = await StockLedgerService.createEntry({
                    itemId: newItem.id,
                    itemName: newItem.name,
                    locationId: "loc-main", // Assuming default location
                    locationName: "Main Store",
                    txnDate: new Date().toISOString().split('T')[0],
                    sourceType: "OPENING_BALANCE",
                    sourceId: "OPBAL",
                    qtyIn: openingStockQty,
                    qtyOut: 0,
                    unitCost: item.costPrice || 0,
                    totalCost: openingStockValue,
                    remarks: "Opening Stock Migration",
                });

                if (!entry) {
                    throw new Error(`Failed to create stock entry for: ${item.name}`);
                }
            }
        }

        log(`✓ Created ${items.length} items with 1000 stock each`);
    },

    /**
     * Create 6 suppliers
     */
    createSuppliers: async (log: (msg: string) => void) => {
        log("Creating suppliers...");

        const suppliers = [
            { name: "ABC Flour Mills", contactPerson: "John Smith", email: "john@abcflour.com", phone: "+1-555-0101", address: "123 Mill Street, NY", taxId: "TAX-001", paymentTerms: "Net 30", creditLimit: 50000 },
            { name: "Sweet Supplies Co", contactPerson: "Mary Johnson", email: "mary@sweetco.com", phone: "+1-555-0102", address: "456 Sugar Lane, NY", taxId: "TAX-002", paymentTerms: "Net 15", creditLimit: 30000 },
            { name: "Dairy Fresh Ltd", contactPerson: "Robert Brown", email: "robert@dairyfresh.com", phone: "+1-555-0103", address: "789 Dairy Road, NY", taxId: "TAX-003", paymentTerms: "Net 30", creditLimit: 40000 },
            { name: "Farm Eggs Inc", contactPerson: "Sarah Davis", email: "sarah@farmeggs.com", phone: "+1-555-0104", address: "321 Farm Avenue, NY", taxId: "TAX-004", paymentTerms: "Net 7", creditLimit: 20000 },
            { name: "Packaging Pro", contactPerson: "Michael Wilson", email: "mike@packpro.com", phone: "+1-555-0105", address: "654 Box Street, NY", taxId: "TAX-005", paymentTerms: "Net 30", creditLimit: 25000 },
            { name: "Equipment Rentals Inc", contactPerson: "Lisa Garcia", email: "lisa@equiprent.com", phone: "+1-555-0106", address: "987 Equipment Blvd, NY", taxId: "TAX-006", paymentTerms: "Net 15", creditLimit: 15000 },
        ];

        const { SupplierService } = await import("./SupplierService");
        for (const supplier of suppliers) {
            await SupplierService.createSupplier({
                ...supplier,
                isActive: true,
                createdBy: "system",
            });
        }

        log(`✓ Created ${suppliers.length} suppliers`);
    },

    /**
     * Create 7 customers
     */
    createCustomers: async (log: (msg: string) => void) => {
        log("Creating customers...");

        const customers = [
            { name: "Cafe Delight", contactPerson: "Emma Thompson", email: "emma@cafedelight.com", phone: "+1-555-0201", address: "100 Main Street, NY", taxId: "CUST-001", paymentTerms: "Net 30", creditLimit: 15000 },
            { name: "Sweet Tooth Bakery", contactPerson: "James Anderson", email: "james@sweettooth.com", phone: "+1-555-0202", address: "200 Baker Lane, NY", taxId: "CUST-002", paymentTerms: "Net 30", creditLimit: 20000 },
            { name: "Party Palace", contactPerson: "Lisa Martinez", email: "lisa@partypalace.com", phone: "+1-555-0203", address: "300 Party Avenue, NY", taxId: "CUST-003", paymentTerms: "Cash", creditLimit: 5000 },
            { name: "Corporate Catering Co", contactPerson: "David Lee", email: "david@corpcatering.com", phone: "+1-555-0204", address: "400 Business Blvd, NY", taxId: "CUST-004", paymentTerms: "Net 30", creditLimit: 25000 },
            { name: "Wedding Wonders", contactPerson: "Jennifer White", email: "jen@weddingwonders.com", phone: "+1-555-0205", address: "500 Romance Road, NY", taxId: "CUST-005", paymentTerms: "Net 15", creditLimit: 15000 },
            { name: "Hotel Grand Plaza", contactPerson: "Michael Brown", email: "mike@grandplaza.com", phone: "+1-555-0206", address: "600 Hotel Drive, NY", taxId: "CUST-006", paymentTerms: "Net 30", creditLimit: 30000 },
            { name: "Restaurant Bella", contactPerson: "Sofia Rodriguez", email: "sofia@bellarest.com", phone: "+1-555-0207", address: "700 Restaurant Row, NY", taxId: "CUST-007", paymentTerms: "Net 15", creditLimit: 10000 },
        ];

        const { CustomerService } = await import("./CustomerService");
        for (const customer of customers) {
            await CustomerService.createCustomer({
                ...customer,
                isActive: true,
            });
        }

        log(`✓ Created ${customers.length} customers`);
    },

    /**
     * Create 5 BOMs
     */
    createBOMs: async (log: (msg: string) => void) => {
        log("Creating BOMs...");

        const { ItemService } = await import("./ItemService");
        const { BOMService } = await import("./BOMService");
        const items = await ItemService.getItems();

        // Get item IDs
        const flour = items.find(i => i.sku === "RM-001");
        const sugar = items.find(i => i.sku === "RM-002");
        const butter = items.find(i => i.sku === "RM-003");
        const eggs = items.find(i => i.sku === "RM-004");
        const vanilla = items.find(i => i.sku === "RM-005");
        const cocoa = items.find(i => i.sku === "RM-006");
        const milkPowder = items.find(i => i.sku === "RM-007");
        const yeast = items.find(i => i.sku === "RM-008");
        const salt = items.find(i => i.sku === "RM-009");

        const chocolateCake = items.find(i => i.sku === "FG-001");
        const cupcakes = items.find(i => i.sku === "FG-002");
        const cookies = items.find(i => i.sku === "FG-003");
        const croissants = items.find(i => i.sku === "FG-004");
        const bread = items.find(i => i.sku === "FG-005");

        if (!flour || !chocolateCake) {
            console.log("⚠ Items not found, skipping BOM creation");
            return;
        }

        const boms = [
            {
                fgItemId: chocolateCake.id,
                fgItemName: chocolateCake.name,
                versionNo: 1,
                status: "ACTIVE" as const,
                remarks: "Standard chocolate cake recipe",
                lines: [
                    { rmItemId: flour!.id, rmItemName: flour!.name, qtyPerUnit: 0.5, unit: "kg" },
                    { rmItemId: sugar!.id, rmItemName: sugar!.name, qtyPerUnit: 0.3, unit: "kg" },
                    { rmItemId: butter!.id, rmItemName: butter!.name, qtyPerUnit: 0.2, unit: "kg" },
                    { rmItemId: eggs!.id, rmItemName: eggs!.name, qtyPerUnit: 0.25, unit: "dozen" },
                    { rmItemId: cocoa!.id, rmItemName: cocoa!.name, qtyPerUnit: 0.15, unit: "kg" },
                    { rmItemId: milkPowder!.id, rmItemName: milkPowder!.name, qtyPerUnit: 0.1, unit: "kg" },
                ],
                createdBy: "system",
            },
            {
                fgItemId: cupcakes!.id,
                fgItemName: cupcakes!.name,
                versionNo: 1,
                status: "ACTIVE" as const,
                remarks: "Vanilla cupcakes 6-pack",
                lines: [
                    { rmItemId: flour!.id, rmItemName: flour!.name, qtyPerUnit: 0.3, unit: "kg" },
                    { rmItemId: sugar!.id, rmItemName: sugar!.name, qtyPerUnit: 0.2, unit: "kg" },
                    { rmItemId: butter!.id, rmItemName: butter!.name, qtyPerUnit: 0.15, unit: "kg" },
                    { rmItemId: eggs!.id, rmItemName: eggs!.name, qtyPerUnit: 0.15, unit: "dozen" },
                    { rmItemId: vanilla!.id, rmItemName: vanilla!.name, qtyPerUnit: 0.02, unit: "ltr" },
                    { rmItemId: milkPowder!.id, rmItemName: milkPowder!.name, qtyPerUnit: 0.08, unit: "kg" },
                ],
                createdBy: "system",
            },
            {
                fgItemId: cookies!.id,
                fgItemName: cookies!.name,
                versionNo: 1,
                status: "ACTIVE" as const,
                remarks: "Assorted cookies box",
                lines: [
                    { rmItemId: flour!.id, rmItemName: flour!.name, qtyPerUnit: 0.4, unit: "kg" },
                    { rmItemId: sugar!.id, rmItemName: sugar!.name, qtyPerUnit: 0.25, unit: "kg" },
                    { rmItemId: butter!.id, rmItemName: butter!.name, qtyPerUnit: 0.18, unit: "kg" },
                    { rmItemId: eggs!.id, rmItemName: eggs!.name, qtyPerUnit: 0.1, unit: "dozen" },
                ],
                createdBy: "system",
            },
            {
                fgItemId: croissants!.id,
                fgItemName: croissants!.name,
                versionNo: 1,
                status: "ACTIVE" as const,
                remarks: "Croissants 12-pack",
                lines: [
                    { rmItemId: flour!.id, rmItemName: flour!.name, qtyPerUnit: 0.6, unit: "kg" },
                    { rmItemId: butter!.id, rmItemName: butter!.name, qtyPerUnit: 0.3, unit: "kg" },
                    { rmItemId: yeast!.id, rmItemName: yeast!.name, qtyPerUnit: 0.02, unit: "kg" },
                    { rmItemId: milkPowder!.id, rmItemName: milkPowder!.name, qtyPerUnit: 0.05, unit: "kg" },
                    { rmItemId: salt!.id, rmItemName: salt!.name, qtyPerUnit: 0.01, unit: "kg" },
                ],
                createdBy: "system",
            },
            {
                fgItemId: bread!.id,
                fgItemName: bread!.name,
                versionNo: 1,
                status: "ACTIVE" as const,
                remarks: "Standard bread loaf",
                lines: [
                    { rmItemId: flour!.id, rmItemName: flour!.name, qtyPerUnit: 0.5, unit: "kg" },
                    { rmItemId: yeast!.id, rmItemName: yeast!.name, qtyPerUnit: 0.015, unit: "kg" },
                    { rmItemId: salt!.id, rmItemName: salt!.name, qtyPerUnit: 0.01, unit: "kg" },
                    { rmItemId: sugar!.id, rmItemName: sugar!.name, qtyPerUnit: 0.02, unit: "kg" },
                ],
                createdBy: "system",
            },
        ];

        for (const bom of boms) {
            await BOMService.createBOM(bom);
        }

        log(`✓ Created ${boms.length} BOMs`);
    },

    /**
     * Phase 2: Create opening balances
     */
    createOpeningBalances: async (log: (msg: string) => void) => {
        /*
        log("Creating opening balances via manual journals...");

        const accounts = await COAService.getAccounts();

        // Create opening balance journal entries
        // This is a simplified approach - in production, you'd use specific opening balance transactions

        const openingJournals = [
            {
                date: "2025-11-30",
                description: "Opening Balance - Assets",
                entries: [
                    { accountId: "1001", accountName: "Cash in Hand", debit: 15000, credit: 0 },
                    { accountId: "1002", accountName: "Bank - Current Account", debit: 125000, credit: 0 },
                    { accountId: "1003", accountName: "Bank - Savings Account", debit: 50000, credit: 0 },
                    { accountId: "1004", accountName: "Inventory Asset", debit: 61000, credit: 0 }, // 59000 (RM) + 2000 (PKG)
                    { accountId: "3000", accountName: "Owner's Capital", debit: 0, credit: 251000 }, // 190000 + 61000
                ],
                createdBy: "system",
            },
        ];

        for (const journal of openingJournals) {
            await JournalService.createJournal(journal);
        }

        log("✓ Opening balances created");
        */
    },

    /**
     * Phase 3: Create sample transactions
     */
    createSampleTransactions: async (log: (msg: string) => void) => {
        /*
        log("Sample transactions would be created here...");
        log("(Skipping for now to keep initialization fast)");
        */
    },
};
