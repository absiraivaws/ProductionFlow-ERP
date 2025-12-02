import { db } from "@/lib/firebase";

export interface Item {
    id: string;
    name: string;
    sku: string;
    type: "RAW_MATERIAL" | "FINISHED_GOOD";
    unit: string; // e.g., "pcs", "kg", "ltr"
    costPrice: number;
    sellingPrice: number;
    currentStock: number;
    openingStockQty: number;
    openingStockValue: number;
    minimumStock?: number;
    isActive: boolean;
    trackingType: "NONE" | "BATCH" | "SERIAL";
}

const USE_MOCK = true; // Force mock for debugging
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

export const ItemService = {
    getItems: async (): Promise<Item[]> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const items = getMockData(`items_${COMPANY_ID}`) || [];

            // Deduplicate items by SKU (keep the first occurrence)
            const uniqueItems = items.reduce((acc: Item[], current: Item) => {
                const exists = acc.find(item => item.sku === current.sku);
                if (!exists) {
                    acc.push(current);
                }
                return acc;
            }, []);

            return uniqueItems;
        }
        return [];
    },

    createItem: async (item: Omit<Item, "id" | "currentStock" | "trackingType"> & { trackingType?: "NONE" | "BATCH" | "SERIAL" }) => {
        const newItem: Item = {
            trackingType: "NONE",
            ...item,
            id: Math.random().toString(36).substr(2, 9),
            currentStock: item.openingStockQty,
        };

        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const items = getMockData(`items_${COMPANY_ID}`) || [];
            items.push(newItem);
            setMockData(`items_${COMPANY_ID}`, items);
            return newItem;
        }

        return newItem;
    },

    updateItem: async (itemId: string, updates: Partial<Item>) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const items = getMockData(`items_${COMPANY_ID}`) || [];
            const index = items.findIndex((i: Item) => i.id === itemId);
            if (index !== -1) {
                items[index] = { ...items[index], ...updates };
                setMockData(`items_${COMPANY_ID}`, items);
            }
        }
    },

    deleteItem: async (itemId: string) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const items = getMockData(`items_${COMPANY_ID}`) || [];
            const filtered = items.filter((i: Item) => i.id !== itemId);
            setMockData(`items_${COMPANY_ID}`, filtered);
        }
    },

    /**
     * Create item with opening stock
     */
    createItemWithOpeningStock: async (item: Omit<Item, "id" | "createdAt" | "updatedAt"> & { openingStockQty: number, openingStockValue: number }) => {
        const newItem = await ItemService.createItem(item);

        if (newItem && item.openingStockQty > 0) {
            const { StockLedgerService } = await import("./StockLedgerService");
            await StockLedgerService.createEntry({
                itemId: newItem.id,
                itemName: newItem.name,
                locationId: "loc-main",
                locationName: "Main Store",
                txnDate: new Date().toISOString().split('T')[0],
                sourceType: "OPENING_BALANCE",
                sourceId: "OPBAL",
                qtyIn: item.openingStockQty,
                qtyOut: 0,
                unitCost: item.costPrice || 0,
                totalCost: item.openingStockValue,
                remarks: "Opening Stock Migration",
            });
        }

        return newItem;
    },

    updateStock: async (itemId: string, quantityChange: number) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const items = getMockData(`items_${COMPANY_ID}`) || [];
            const index = items.findIndex((i: Item) => i.id === itemId);
            if (index !== -1) {
                items[index].currentStock += quantityChange;
                setMockData(`items_${COMPANY_ID}`, items);
            }
        }
    },
};
