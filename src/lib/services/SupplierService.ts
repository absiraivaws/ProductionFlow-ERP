import { db } from "@/lib/firebase";

export interface Supplier {
    id: string;
    name: string;
    code: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    taxId?: string;
    paymentTerms?: string;
    creditLimit?: number;
    defaultCurrency?: string; // e.g., "USD", "EUR"
    isActive: boolean;
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

// Generate supplier code
const generateSupplierCode = (suppliers: Supplier[]): string => {
    const count = suppliers.length + 1;
    return `SUP-${String(count).padStart(4, '0')}`;
};

export const SupplierService = {
    /**
     * Get all suppliers
     */
    getSuppliers: async (activeOnly: boolean = false): Promise<Supplier[]> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            let suppliers: Supplier[] = getMockData(`suppliers_${COMPANY_ID}`) || [];

            if (activeOnly) {
                suppliers = suppliers.filter(s => s.isActive);
            }

            return suppliers.sort((a, b) => a.name.localeCompare(b.name));
        }
        return [];
    },

    /**
     * Get supplier by ID
     */
    getSupplierById: async (supplierId: string): Promise<Supplier | null> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const suppliers = getMockData(`suppliers_${COMPANY_ID}`) || [];
            return suppliers.find((s: Supplier) => s.id === supplierId) || null;
        }
        return null;
    },

    /**
     * Create supplier
     */
    createSupplier: async (data: Omit<Supplier, "id" | "code" | "createdAt" | "updatedAt">) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const suppliers = getMockData(`suppliers_${COMPANY_ID}`) || [];

            const newSupplier: Supplier = {
                ...data,
                id: `SUP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                code: generateSupplierCode(suppliers),
                defaultCurrency: data.defaultCurrency || "USD",
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            suppliers.push(newSupplier);
            setMockData(`suppliers_${COMPANY_ID}`, suppliers);
            return newSupplier;
        }
    },

    /**
     * Update supplier
     */
    updateSupplier: async (supplierId: string, updates: Partial<Supplier>) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const suppliers = getMockData(`suppliers_${COMPANY_ID}`) || [];
            const index = suppliers.findIndex((s: Supplier) => s.id === supplierId);

            if (index === -1) {
                throw new Error("Supplier not found");
            }

            suppliers[index] = {
                ...suppliers[index],
                ...updates,
                updatedAt: new Date(),
            };

            setMockData(`suppliers_${COMPANY_ID}`, suppliers);
            return suppliers[index];
        }
    },

    /**
     * Delete supplier
     */
    deleteSupplier: async (supplierId: string) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const suppliers = getMockData(`suppliers_${COMPANY_ID}`) || [];
            const filtered = suppliers.filter((s: Supplier) => s.id !== supplierId);
            setMockData(`suppliers_${COMPANY_ID}`, filtered);
        }
    },

    /**
     * Get supplier summary
     */
    getSupplierSummary: async (): Promise<{
        totalSuppliers: number;
        activeSuppliers: number;
        inactiveSuppliers: number;
    }> => {
        const suppliers = await SupplierService.getSuppliers();
        return {
            totalSuppliers: suppliers.length,
            activeSuppliers: suppliers.filter(s => s.isActive).length,
            inactiveSuppliers: suppliers.filter(s => !s.isActive).length,
        };
    },
};
