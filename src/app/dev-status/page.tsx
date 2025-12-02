"use client";

import { useState, useEffect } from "react";
import { Loader2, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { LocationService } from "@/lib/services/LocationService";
import { ItemCategoryService } from "@/lib/services/ItemCategoryService";
import { COAService } from "@/lib/services/COAService";
import { AccountBalanceService } from "@/lib/services/AccountBalanceService";
import { StockLedgerService } from "@/lib/services/StockLedgerService";

export default function DevStatusPage() {
    const [status, setStatus] = useState<{
        locations: { loaded: boolean; count: number; error?: string };
        categories: { loaded: boolean; count: number; error?: string };
        accounts: { loaded: boolean; count: number; error?: string };
        accountBalances: { loaded: boolean; count: number; error?: string };
        stockBalances: { loaded: boolean; count: number; error?: string };
    }>({
        locations: { loaded: false, count: 0 },
        categories: { loaded: false, count: 0 },
        accounts: { loaded: false, count: 0 },
        accountBalances: { loaded: false, count: 0 },
        stockBalances: { loaded: false, count: 0 },
    });
    const [loading, setLoading] = useState(true);

    const [logs, setLogs] = useState<string[]>([]);

    const loadStatus = async () => {
        setLoading(true);

        // Helper to safe load
        const safeLoad = async (loader: () => Promise<any>, key: keyof typeof status) => {
            try {
                const result = await loader();
                setStatus(prev => ({
                    ...prev,
                    [key]: { loaded: true, count: Array.isArray(result) ? result.length : 0 },
                }));
            } catch (error: any) {
                console.error(`Error loading ${key}:`, error);
                setStatus(prev => ({
                    ...prev,
                    [key]: { loaded: false, count: 0, error: error?.message || String(error) },
                }));
            }
        };

        try {
            await Promise.all([
                safeLoad(() => LocationService.getLocations(), "locations"),
                safeLoad(() => ItemCategoryService.getCategories(), "categories"),
                safeLoad(() => COAService.getAccounts(), "accounts"),
                safeLoad(() => AccountBalanceService.getAllBalances(), "accountBalances"),
                safeLoad(() => StockLedgerService.getAllStockBalances(), "stockBalances"),
                // Also load items to check if items are created
                (async () => {
                    try {
                        const { ItemService } = await import("@/lib/services/ItemService");
                        const items = await ItemService.getItems();
                        // We don't have items in status, so just log it or add to logs?
                        // Let's add a temporary state for items count if I could, but I can't change state type easily.
                        // I'll just log it to console or alert?
                        // I'll add it to logs.
                        setLogs(prev => [...prev, `Items count: ${items.length}`]);
                    } catch (e) { }
                })()
            ]);
        } finally {
            setLoading(false);
        }
    };

    const initializeData = async () => {
        setLoading(true);
        try {
            // Seed default data
            await LocationService.seedDefaultLocations();
            await ItemCategoryService.seedDefaultCategories();
            await COAService.seedDefaultAccounts();

            // Initialize account balances from COA
            const accounts = await COAService.getAccounts();
            await AccountBalanceService.initializeFromCOA(accounts);

            // Reload status
            await loadStatus();
        } catch (error) {
            console.error("Error initializing data:", error);
        } finally {
            setLoading(false);
        }
    };

    const initializeTestData = async () => {
        if (!confirm("This will create sample data (10 items, 5 suppliers, 5 customers, BOMs, orders). Continue?")) return;

        setLoading(true);
        try {
            const { TestDataService } = await import("@/lib/services/TestDataService");
            const result = await TestDataService.initializeAllTestData();

            if (result.success) {
                alert("✅ Test data created successfully! Check Items, Suppliers, Customers, BOMs, and Orders.");
            } else {
                alert(`❌ Error: ${result.error}`);
            }

            await loadStatus();
        } catch (error: any) {
            console.error("Error initializing test data:", error);
            alert(`❌ Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const initializeBakeryMigration = async (skipConfirm = false) => {
        if (!skipConfirm && !confirm("Proceed with migration?")) return;

        setLoading(true);
        setLogs([]);
        try {
            const { DeepTestingService } = await import("@/lib/services/DeepTestingService");
            const result = await DeepTestingService.executeFullMigration((msg) => {
                setLogs(prev => [...prev, msg]);
            });

            setLogs(prev => [...prev, "Result: " + JSON.stringify(result)]);
            // setLogs(prev => [...prev, ...(result.logs || [])]); // No need to append logs again if we stream them

            if (result.success) {
                setLogs(prev => [...prev, "✅ Migration Success"]);
                await loadStatus();
            } else {
                setLogs(prev => [...prev, `❌ Migration Failed: ${result.error}`]);
            }
        } catch (error: any) {
            setLogs(prev => [...prev, `❌ Exception: ${error.message}`]);
        } finally {
            setLoading(false);
        }
    };

    const handleRecalculateStock = async () => {
        setLoading(true);
        try {
            const { StockLedgerService } = await import("@/lib/services/StockLedgerService");
            await StockLedgerService.recalculateAllBalances();
            alert("Stock balances recalculated successfully!");
            await loadStatus();
        } catch (error: any) {
            console.error("Error recalculating stock:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDebugStorage = async () => {
        const ledger = localStorage.getItem("stock_ledger_default-company");
        const items = localStorage.getItem("items_default-company");
        const balances = localStorage.getItem("stock_balances_default-company");

        const { BOMService } = await import("@/lib/services/BOMService");
        const boms = await BOMService.getBOMs();

        console.log("--- DEBUG STORAGE ---");
        console.log("Items:", items ? JSON.parse(items).length : "null");
        console.log("Ledger Entries:", ledger ? JSON.parse(ledger).length : "null");
        console.log("Balances:", balances ? JSON.parse(balances).length : "null");
        console.log("BOMs:", boms.length);
        console.log(boms);
        console.log("--- END DEBUG ---");

        setLogs(prev => [
            ...prev,
            `Items: ${items ? JSON.parse(items).length : "null"}`,
            `Ledger: ${ledger ? JSON.parse(ledger).length : "null"}`,
            `Balances: ${balances ? JSON.parse(balances).length : "null"}`
        ]);
    };

    useEffect(() => {
        loadStatus();

        // Auto-trigger migration if query param is present
        const params = new URLSearchParams(window.location.search);
        if (params.get("migrate") === "true") {
            initializeBakeryMigration(true);
        }
    }, []);

    const handleVerifyWorkflow = async () => {
        try {
            const { SalesOrderService } = await import("@/lib/services/SalesOrderService");
            const { ProductionOrderService } = await import("@/lib/services/ProductionOrderService");
            const { ItemService } = await import("@/lib/services/ItemService");
            const { CustomerService } = await import("@/lib/services/CustomerService");

            // 1. Get Data
            const items = await ItemService.getItems();
            const croissant = items.find(i => i.name === "Croissants (12-pack)");
            if (!croissant) throw new Error("Croissant item not found");

            const customers = await CustomerService.getCustomers();
            const customer = customers[0];
            if (!customer) throw new Error("No customers found");

            // 2. Create Quotation
            const order = await SalesOrderService.createSalesOrder({
                customerId: customer.id,
                customerName: customer.name,
                orderDate: new Date().toISOString().split('T')[0],
                paymentTerm: "CREDIT",
                lines: [{
                    itemId: croissant.id,
                    itemName: croissant.name,
                    qty: 10,
                    price: 20,
                    taxRate: 0,
                    lineTotal: 200,
                    deliveredQty: 0
                }],
                subtotal: 200,
                taxAmount: 0,
                totalAmount: 200,
                status: "DRAFT",
                createdBy: "test-script",
                currency: "USD",
                exchangeRate: 1.0
            });

            if (!order) {
                throw new Error("Failed to create sales order");
            }

            console.log("Created Order:", order.id);

            // 3. Confirm & Produce
            await SalesOrderService.confirmSalesOrder(order.id);
            console.log("Confirmed Order");

            // 4. Verify Production Order
            const prodOrders = await ProductionOrderService.getProductionOrders();
            const createdProdOrder = prodOrders.find(po => po.fgItemId === croissant.id && po.plannedQty === 10);

            if (createdProdOrder) {
                alert(`SUCCESS! Production Order Created: ${createdProdOrder.orderNo}`);
            } else {
                alert("FAILURE! Production Order NOT found.");
            }

        } catch (error: any) {
            console.error(error);
            alert("Test Failed: " + error.message);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-slate-900">Development Status (Debug)</h1>
                <div className="flex gap-3">
                    <button onClick={loadStatus} className="px-4 py-2 bg-blue-600 text-white rounded">Refresh</button>
                    <button onClick={handleVerifyWorkflow} className="px-4 py-2 bg-green-600 text-white rounded">Verify Workflow</button>
                    <button onClick={handleRecalculateStock} className="px-4 py-2 bg-purple-600 text-white rounded">Recalculate Stock</button>
                    <button onClick={handleDebugStorage} className="px-4 py-2 bg-gray-600 text-white rounded">Debug Storage</button>
                    <button onClick={() => initializeBakeryMigration(false)} className="px-4 py-2 bg-amber-600 text-white rounded">Load Bakery Migration</button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded border border-slate-200">
                    <h2 className="text-xl font-bold mb-4">Counts</h2>
                    <ul className="space-y-2">
                        <li>Locations: {status.locations.count} ({status.locations.loaded ? "Loaded" : "Loading..."}) {status.locations.error}</li>
                        <li>Categories: {status.categories.count} ({status.categories.loaded ? "Loaded" : "Loading..."}) {status.categories.error}</li>
                        <li>Accounts: {status.accounts.count} ({status.accounts.loaded ? "Loaded" : "Loading..."}) {status.accounts.error}</li>
                        <li>Account Balances: {status.accountBalances.count} ({status.accountBalances.loaded ? "Loaded" : "Loading..."}) {status.accountBalances.error}</li>
                        <li>Stock Balances: {status.stockBalances.count} ({status.stockBalances.loaded ? "Loaded" : "Loading..."}) {status.stockBalances.error}</li>
                    </ul>
                </div>
                <div className="p-4 bg-slate-900 text-green-400 rounded border border-slate-800 h-96 overflow-auto font-mono text-xs">
                    <h2 className="text-xl font-bold mb-4 text-white">Logs</h2>
                    {logs.map((log, i) => (
                        <div key={i}>{log}</div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const StatusCard = ({ title, data }: { title: string; data: { loaded: boolean; count: number; error?: string } }) => (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {data.loaded ? (
                <CheckCircle className="text-green-500" size={24} />
            ) : (
                <XCircle className="text-red-500" size={24} />
            )}
        </div>
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-slate-500">Status:</span>
                <span className={`font-medium ${data.loaded ? "text-green-600" : "text-red-600"}`}>
                    {data.loaded ? "Loaded" : "Not Loaded"}
                </span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-slate-500">Count:</span>
                <span className="font-medium text-slate-900">{data.count}</span>
            </div>
            {data.error && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                    {data.error}
                </div>
            )}
        </div>
    </div>
);
