import { ItemService } from "./ItemService";
import { SupplierService } from "./SupplierService";
import { CustomerService } from "./CustomerService";
import { BOMService } from "./BOMService";
import { PurchaseOrderService } from "./PurchaseOrderService";
import { SalesOrderService } from "./SalesOrderService";
import { ProductionOrderService } from "./ProductionOrderService";

/**
 * Test Data Initialization Service
 * Creates comprehensive sample data across all modules for testing
 */
export const TestDataService = {
    /**
     * Initialize all test data
     */
    initializeAllTestData: async () => {
        console.log("🚀 Starting test data initialization...");

        try {
            // 1. Create Items (10 items: 5 RM, 3 FG, 2 PKG)
            await TestDataService.createTestItems();

            // 2. Create Suppliers (5 suppliers)
            await TestDataService.createTestSuppliers();

            // 3. Create Customers (5 customers)
            await TestDataService.createTestCustomers();

            // 4. Create BOMs (3 BOMs for finished goods)
            await TestDataService.createTestBOMs();

            // 5. Create Purchase Orders (5 POs)
            await TestDataService.createTestPurchaseOrders();

            // 6. Create Sales Orders (5 SOs)
            await TestDataService.createTestSalesOrders();

            // 7. Create Production Orders (3 POs)
            await TestDataService.createTestProductionOrders();

            console.log("✅ Test data initialization complete!");
            return { success: true };
        } catch (error: any) {
            console.error("❌ Test data initialization failed:", error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Create test items
     */
    createTestItems: async () => {
        console.log("Creating test items...");

        const items = [
            // Raw Materials
            { name: "Wheat Flour", sku: "RM-001", type: "RAW_MATERIAL" as const, categoryId: "cat-rm", unit: "kg", costPrice: 2.50, sellingPrice: 0, currentStock: 0, minimumStock: 100, isActive: true },
            { name: "Sugar", sku: "RM-002", type: "RAW_MATERIAL" as const, categoryId: "cat-rm", unit: "kg", costPrice: 1.80, sellingPrice: 0, currentStock: 0, minimumStock: 50, isActive: true },
            { name: "Butter", sku: "RM-003", type: "RAW_MATERIAL" as const, categoryId: "cat-rm", unit: "kg", costPrice: 8.50, sellingPrice: 0, currentStock: 0, minimumStock: 30, isActive: true },
            { name: "Eggs", sku: "RM-004", type: "RAW_MATERIAL" as const, categoryId: "cat-rm", unit: "dozen", costPrice: 3.20, sellingPrice: 0, currentStock: 0, minimumStock: 20, isActive: true },
            { name: "Vanilla Extract", sku: "RM-005", type: "RAW_MATERIAL" as const, categoryId: "cat-rm", unit: "ltr", costPrice: 15.00, sellingPrice: 0, currentStock: 0, minimumStock: 5, isActive: true },

            // Finished Goods
            { name: "Chocolate Cake", sku: "FG-001", type: "FINISHED_GOOD" as const, categoryId: "cat-fg", unit: "pcs", costPrice: 0, sellingPrice: 25.00, currentStock: 0, minimumStock: 10, isActive: true },
            { name: "Vanilla Cupcakes (6-pack)", sku: "FG-002", type: "FINISHED_GOOD" as const, categoryId: "cat-fg", unit: "pack", costPrice: 0, sellingPrice: 12.00, currentStock: 0, minimumStock: 15, isActive: true },
            { name: "Cookies Assortment", sku: "FG-003", type: "FINISHED_GOOD" as const, categoryId: "cat-fg", unit: "box", costPrice: 0, sellingPrice: 18.00, currentStock: 0, minimumStock: 20, isActive: true },

            // Packaging
            { name: "Cake Box (Large)", sku: "PKG-001", type: "PACKAGING", categoryId: "cat-pkg", unit: "pcs", costPrice: 0.80, sellingPrice: 0, currentStock: 0, minimumStock: 50, isActive: true },
            { name: "Cupcake Container", sku: "PKG-002", type: "PACKAGING", categoryId: "cat-pkg", unit: "pcs", costPrice: 0.50, sellingPrice: 0, currentStock: 0, minimumStock: 100, isActive: true },
        ];

        for (const item of items) {
            await ItemService.createItem({
                ...item,
                openingStockQty: 0,
                openingStockValue: 0,
            });
        }

        console.log(`✓ Created ${items.length} items`);
    },

    /**
     * Create test suppliers
     */
    createTestSuppliers: async () => {
        console.log("Creating test suppliers...");

        const suppliers = [
            { name: "ABC Flour Mills", contactPerson: "John Smith", email: "john@abcflour.com", phone: "+1-555-0101", address: "123 Mill Street", taxId: "TAX-001", paymentTerms: "Net 30", creditLimit: 50000, isActive: true },
            { name: "Sweet Supplies Co", contactPerson: "Mary Johnson", email: "mary@sweetco.com", phone: "+1-555-0102", address: "456 Sugar Lane", taxId: "TAX-002", paymentTerms: "Net 15", creditLimit: 30000, isActive: true },
            { name: "Dairy Fresh Ltd", contactPerson: "Robert Brown", email: "robert@dairyfresh.com", phone: "+1-555-0103", address: "789 Dairy Road", taxId: "TAX-003", paymentTerms: "Net 30", creditLimit: 40000, isActive: true },
            { name: "Farm Eggs Inc", contactPerson: "Sarah Davis", email: "sarah@farmeggs.com", phone: "+1-555-0104", address: "321 Farm Avenue", taxId: "TAX-004", paymentTerms: "Net 7", creditLimit: 20000, isActive: true },
            { name: "Packaging Pro", contactPerson: "Michael Wilson", email: "mike@packpro.com", phone: "+1-555-0105", address: "654 Box Street", taxId: "TAX-005", paymentTerms: "Net 30", creditLimit: 25000, isActive: true },
        ];

        for (const supplier of suppliers) {
            await SupplierService.createSupplier({
                createdBy: "system",
                ...supplier,
            });
        }

        console.log(`✓ Created ${suppliers.length} suppliers`);
    },

    /**
     * Create test customers
     */
    createTestCustomers: async () => {
        console.log("Creating test customers...");

        const customers = [
            { name: "Cafe Delight", contactPerson: "Emma Thompson", email: "emma@cafedelight.com", phone: "+1-555-0201", address: "100 Main Street", taxId: "CUST-001", paymentTerms: "Net 15", creditLimit: 10000, isActive: true },
            { name: "Sweet Tooth Bakery", contactPerson: "James Anderson", email: "james@sweettooth.com", phone: "+1-555-0202", address: "200 Baker Lane", taxId: "CUST-002", paymentTerms: "Net 30", creditLimit: 15000, isActive: true },
            { name: "Party Palace", contactPerson: "Lisa Martinez", email: "lisa@partypalace.com", phone: "+1-555-0203", address: "300 Party Avenue", taxId: "CUST-003", paymentTerms: "Cash", creditLimit: 5000, isActive: true },
            { name: "Corporate Catering Co", contactPerson: "David Lee", email: "david@corpcatering.com", phone: "+1-555-0204", address: "400 Business Blvd", taxId: "CUST-004", paymentTerms: "Net 30", creditLimit: 20000, isActive: true },
            { name: "Wedding Wonders", contactPerson: "Jennifer White", email: "jen@weddingwonders.com", phone: "+1-555-0205", address: "500 Romance Road", taxId: "CUST-005", paymentTerms: "Net 15", creditLimit: 12000, isActive: true },
        ];

        for (const customer of customers) {
            await CustomerService.createCustomer({
                createdBy: "system",
                ...customer,
            });
        }

        console.log(`✓ Created ${customers.length} customers`);
    },

    /**
     * Create test BOMs
     */
    createTestBOMs: async () => {
        console.log("Creating test BOMs...");

        const items = await ItemService.getItems();

        // Get item IDs
        const flour = items.find(i => i.sku === "RM-001");
        const sugar = items.find(i => i.sku === "RM-002");
        const butter = items.find(i => i.sku === "RM-003");
        const eggs = items.find(i => i.sku === "RM-004");
        const vanilla = items.find(i => i.sku === "RM-005");
        const chocolateCake = items.find(i => i.sku === "FG-001");
        const cupcakes = items.find(i => i.sku === "FG-002");
        const cookies = items.find(i => i.sku === "FG-003");

        if (!flour || !sugar || !butter || !eggs || !vanilla || !chocolateCake || !cupcakes || !cookies) {
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
                    { rmItemId: flour.id, rmItemName: flour.name, qtyPerUnit: 0.5, unit: "kg" },
                    { rmItemId: sugar.id, rmItemName: sugar.name, qtyPerUnit: 0.3, unit: "kg" },
                    { rmItemId: butter.id, rmItemName: butter.name, qtyPerUnit: 0.2, unit: "kg" },
                    { rmItemId: eggs.id, rmItemName: eggs.name, qtyPerUnit: 0.25, unit: "dozen" },
                ],
            },
            {
                fgItemId: cupcakes.id,
                fgItemName: cupcakes.name,
                versionNo: 1,
                status: "ACTIVE" as const,
                remarks: "Vanilla cupcakes 6-pack",
                lines: [
                    { rmItemId: flour.id, rmItemName: flour.name, qtyPerUnit: 0.3, unit: "kg" },
                    { rmItemId: sugar.id, rmItemName: sugar.name, qtyPerUnit: 0.2, unit: "kg" },
                    { rmItemId: butter.id, rmItemName: butter.name, qtyPerUnit: 0.15, unit: "kg" },
                    { rmItemId: vanilla.id, rmItemName: vanilla.name, qtyPerUnit: 0.02, unit: "ltr" },
                ],
            },
            {
                fgItemId: cookies.id,
                fgItemName: cookies.name,
                versionNo: 1,
                status: "ACTIVE" as const,
                remarks: "Assorted cookies box",
                lines: [
                    { rmItemId: flour.id, rmItemName: flour.name, qtyPerUnit: 0.4, unit: "kg" },
                    { rmItemId: sugar.id, rmItemName: sugar.name, qtyPerUnit: 0.25, unit: "kg" },
                    { rmItemId: butter.id, rmItemName: butter.name, qtyPerUnit: 0.18, unit: "kg" },
                ],
            },
        ];

        for (const bom of boms) {
            const bomWithCreator = { ...bom, createdBy: "system" };
            await BOMService.createBOM(bomWithCreator);
        }

        console.log(`✓ Created ${boms.length} BOMs`);
    },

    /**
     * Create test purchase orders
     */
    createTestPurchaseOrders: async () => {
        console.log("Creating test purchase orders...");

        const items = await ItemService.getItems();
        const suppliers = await SupplierService.getSuppliers();

        if (suppliers.length === 0 || items.length === 0) {
            console.log("⚠ No suppliers or items found, skipping PO creation");
            return;
        }

        const flour = items.find(i => i.sku === "RM-001");
        const sugar = items.find(i => i.sku === "RM-002");
        const butter = items.find(i => i.sku === "RM-003");

        if (!flour || !sugar || !butter) return;

        const pos = [
            {
                supplierId: suppliers[0].id,
                supplierName: suppliers[0].name,
                poDate: "2025-11-01",
                deliveryDate: "2025-11-15",
                status: "APPROVED" as const,
                subtotal: 0,
                taxAmount: 0,
                totalAmount: 0,
                lines: [
                    { itemId: flour.id, itemName: flour.name, locationId: "loc-main", locationName: "Main Store", qty: 100, price: 2.50, taxRate: 0.05, lineTotal: 250, receivedQty: 0, unit: "kg" },
                    { itemId: sugar.id, itemName: sugar.name, locationId: "loc-main", locationName: "Main Store", qty: 50, price: 1.80, taxRate: 0.05, lineTotal: 90, receivedQty: 0, unit: "kg" },
                ],
                remarks: "Monthly stock replenishment",
            },
            {
                supplierId: suppliers[2].id,
                supplierName: suppliers[2].name,
                poDate: "2025-11-05",
                deliveryDate: "2025-11-20",
                status: "APPROVED" as const,
                subtotal: 0,
                taxAmount: 0,
                totalAmount: 0,
                lines: [
                    { itemId: butter.id, itemName: butter.name, locationId: "loc-main", locationName: "Main Store", qty: 30, price: 8.50, taxRate: 0.05, lineTotal: 255, receivedQty: 0, unit: "kg" },
                ],
                remarks: "Dairy products order",
            },
        ];

        for (const po of pos) {
            await PurchaseOrderService.createPurchaseOrder({
                ...po,
                currency: "USD",
                exchangeRate: 1.0,
                createdBy: "system",
            });
        }

        console.log(`✓ Created ${pos.length} purchase orders`);
    },

    /**
     * Create test sales orders
     */
    createTestSalesOrders: async () => {
        console.log("Creating test sales orders...");

        const items = await ItemService.getItems();
        const customers = await CustomerService.getCustomers();

        if (customers.length === 0 || items.length === 0) {
            console.log("⚠ No customers or items found, skipping SO creation");
            return;
        }

        const cake = items.find(i => i.sku === "FG-001");
        const cupcakes = items.find(i => i.sku === "FG-002");
        const cookies = items.find(i => i.sku === "FG-003");

        if (!cake || !cupcakes || !cookies) return;

        const sos = [
            {
                customerId: customers[0].id,
                customerName: customers[0].name,
                orderDate: "2025-11-10",
                deliveryDate: "2025-11-12",
                paymentTerm: "CREDIT" as const,
                status: "CONFIRMED" as const,
                subtotal: 0,
                taxAmount: 0,
                totalAmount: 0,
                lines: [
                    { itemId: cake.id, itemName: cake.name, qty: 5, price: 25.00, taxRate: 0.05, lineTotal: 125, deliveredQty: 0, unit: "pcs" },
                    { itemId: cupcakes.id, itemName: cupcakes.name, qty: 10, price: 12.00, taxRate: 0.05, lineTotal: 120, deliveredQty: 0, unit: "pack" },
                ],
                remarks: "Weekly order for cafe",
            },
            {
                customerId: customers[3].id,
                customerName: customers[3].name,
                orderDate: "2025-11-12",
                deliveryDate: "2025-11-15",
                paymentTerm: "CREDIT" as const,
                status: "CONFIRMED" as const,
                subtotal: 0,
                taxAmount: 0,
                totalAmount: 0,
                lines: [
                    { itemId: cookies.id, itemName: cookies.name, qty: 20, price: 18.00, taxRate: 0.05, lineTotal: 360, deliveredQty: 0, unit: "box" },
                ],
                remarks: "Corporate event order",
            },
        ];

        for (const so of sos) {
            await SalesOrderService.createSalesOrder({
                ...so,
                currency: "USD",
                exchangeRate: 1.0,
                createdBy: "system",
            });
        }

        console.log(`✓ Created ${sos.length} sales orders`);
    },

    /**
     * Create test production orders
     */
    createTestProductionOrders: async () => {
        console.log("Creating test production orders...");

        const items = await ItemService.getItems();

        if (items.length === 0) {
            console.log("⚠ No items found, skipping production order creation");
            return;
        }

        const cake = items.find(i => i.sku === "FG-001");
        const cupcakes = items.find(i => i.sku === "FG-002");

        if (!cake || !cupcakes) return;

        const productionOrders = [
            {
                fgItemId: cake.id,
                fgItemName: cake.name,
                plannedQty: 10,
                startDate: "2025-11-15",
                status: "DRAFT" as const,
                sourceLocationId: "loc-production",
                sourceLocationName: "Production Store",
                outputLocationId: "loc-fg",
                outputLocationName: "Finished Goods Store",
                remarks: "Weekly production batch",
            },
            {
                fgItemId: cupcakes.id,
                fgItemName: cupcakes.name,
                plannedQty: 20,
                startDate: "2025-11-16",
                status: "DRAFT" as const,
                sourceLocationId: "loc-production",
                sourceLocationName: "Production Store",
                outputLocationId: "loc-fg",
                outputLocationName: "Finished Goods Store",
                remarks: "High demand item",
            },
        ];

        for (const po of productionOrders) {
            const poWithCreator = { ...po, createdBy: "system" };
            await ProductionOrderService.createProductionOrder(poWithCreator);
        }

        console.log(`✓ Created ${productionOrders.length} production orders`);
    },
};
