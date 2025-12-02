import { db } from "@/lib/firebase";

export interface ItemCategory {
    id: string;
    code: string;
    name: string;
    description?: string;
    // Link to COA accounts for automatic GL posting
    inventoryAccountId?: string; // Asset account for inventory
    cogsAccountId?: string; // Expense account for COGS
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const USE_MOCK = true; // Force mock for debugging
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

// Default categories
const getDefaultCategories = (): ItemCategory[] => [
    {
        id: "CAT-001",
        code: "RM",
        name: "Raw Materials",
        description: "Raw materials used in production",
        inventoryAccountId: "1300", // Raw Material Inventory
        cogsAccountId: "5001", // COGS
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: "CAT-002",
        code: "FG",
        name: "Finished Goods",
        description: "Finished products ready for sale",
        inventoryAccountId: "1320", // Finished Goods Inventory
        cogsAccountId: "5001", // COGS
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: "CAT-003",
        code: "PKG",
        name: "Packaging Materials",
        description: "Packaging and labeling materials",
        inventoryAccountId: "1300", // Raw Material Inventory
        cogsAccountId: "5001", // COGS
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: "CAT-004",
        code: "SVC",
        name: "Services",
        description: "Service items (non-inventory)",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];

export const ItemCategoryService = {
    getCategories: async (): Promise<ItemCategory[]> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            let categories = getMockData(`item_categories_${COMPANY_ID}`);

            // Initialize with default categories if empty
            if (!categories || categories.length === 0) {
                categories = getDefaultCategories();
                setMockData(`item_categories_${COMPANY_ID}`, categories);
            }

            return categories.filter((cat: ItemCategory) => cat.isActive);
        }
        return [];
    },

    getAllCategories: async (): Promise<ItemCategory[]> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            let categories = getMockData(`item_categories_${COMPANY_ID}`);

            if (!categories || categories.length === 0) {
                categories = getDefaultCategories();
                setMockData(`item_categories_${COMPANY_ID}`, categories);
            }

            return categories;
        }
        return [];
    },

    getCategoryById: async (categoryId: string): Promise<ItemCategory | null> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const categories = getMockData(`item_categories_${COMPANY_ID}`) || [];
            return categories.find((cat: ItemCategory) => cat.id === categoryId) || null;
        }
        return null;
    },

    createCategory: async (category: Omit<ItemCategory, "id" | "createdAt" | "updatedAt">) => {
        const newCategory: ItemCategory = {
            ...category,
            id: `CAT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const categories = getMockData(`item_categories_${COMPANY_ID}`) || [];

            // Check for duplicate code
            if (categories.some((cat: ItemCategory) => cat.code === newCategory.code)) {
                throw new Error(`Category code ${newCategory.code} already exists`);
            }

            categories.push(newCategory);
            setMockData(`item_categories_${COMPANY_ID}`, categories);
            return newCategory;
        }
    },

    updateCategory: async (categoryId: string, updates: Partial<ItemCategory>) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const categories = getMockData(`item_categories_${COMPANY_ID}`) || [];
            const index = categories.findIndex((cat: ItemCategory) => cat.id === categoryId);

            if (index !== -1) {
                categories[index] = {
                    ...categories[index],
                    ...updates,
                    updatedAt: new Date(),
                };
                setMockData(`item_categories_${COMPANY_ID}`, categories);
                return categories[index];
            }
            throw new Error("Category not found");
        }
    },

    deactivateCategory: async (categoryId: string) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const categories = getMockData(`item_categories_${COMPANY_ID}`) || [];
            const index = categories.findIndex((cat: ItemCategory) => cat.id === categoryId);

            if (index !== -1) {
                categories[index].isActive = false;
                categories[index].updatedAt = new Date();
                setMockData(`item_categories_${COMPANY_ID}`, categories);
            }
        }
    },

    seedDefaultCategories: async () => {
        if (USE_MOCK) {
            const categories = getDefaultCategories();
            setMockData(`item_categories_${COMPANY_ID}`, categories);
            return categories;
        }
    },
};
