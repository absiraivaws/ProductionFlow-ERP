import { db } from "@/lib/firebase";

export interface BOMLine {
    rmItemId: string; // Raw material item ID
    rmItemName?: string; // For display
    qtyPerUnit: number; // Quantity required per 1 unit of finished good
    unit?: string; // Unit of measure
}

export interface BOM {
    id: string;
    bomNo: string; // BOM number (e.g., BOM-001)
    fgItemId: string; // Finished good item ID
    fgItemName?: string; // For display
    versionNo: number;
    status: "ACTIVE" | "INACTIVE" | "DRAFT";
    remarks?: string;
    lines: BOMLine[];
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

// Generate BOM number
const generateBOMNo = (boms: BOM[]): string => {
    const count = boms.length + 1;
    return `BOM-${String(count).padStart(4, '0')}`;
};

export const BOMService = {
    /**
     * Get all BOMs
     */
    getBOMs: async (): Promise<BOM[]> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const boms = getMockData(`boms_${COMPANY_ID}`) || [];
            return boms.sort((a: BOM, b: BOM) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        }
        return [];
    },

    /**
     * Get BOM by ID
     */
    getBOMById: async (bomId: string): Promise<BOM | null> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const boms = getMockData(`boms_${COMPANY_ID}`) || [];
            return boms.find((b: BOM) => b.id === bomId) || null;
        }
        return null;
    },

    /**
     * Get active BOM for a finished good item
     */
    getActiveBOMByFGItem: async (fgItemId: string): Promise<BOM | null> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const boms = getMockData(`boms_${COMPANY_ID}`) || [];
            const activeBOMs = boms.filter((b: BOM) =>
                b.fgItemId === fgItemId && b.status === "ACTIVE"
            );

            // Return the latest version
            if (activeBOMs.length > 0) {
                return activeBOMs.sort((a: BOM, b: BOM) => b.versionNo - a.versionNo)[0];
            }
        }
        return null;
    },

    /**
     * Get all BOMs for a finished good item (all versions)
     */
    getBOMsByFGItem: async (fgItemId: string): Promise<BOM[]> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const boms = getMockData(`boms_${COMPANY_ID}`) || [];
            return boms.filter((b: BOM) => b.fgItemId === fgItemId)
                .sort((a: BOM, b: BOM) => b.versionNo - a.versionNo);
        }
        return [];
    },

    /**
     * Create a new BOM
     */
    createBOM: async (data: Omit<BOM, "id" | "bomNo" | "createdAt" | "updatedAt">) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const boms = getMockData(`boms_${COMPANY_ID}`) || [];

            // Validate: Check if there's already an active BOM for this FG item
            const existingActiveBOM = boms.find((b: BOM) =>
                b.fgItemId === data.fgItemId && b.status === "ACTIVE"
            );

            if (existingActiveBOM && data.status === "ACTIVE") {
                throw new Error(`An active BOM already exists for this item. Please deactivate BOM ${existingActiveBOM.bomNo} first.`);
            }

            const newBOM: BOM = {
                ...data,
                id: `BOM-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                bomNo: generateBOMNo(boms),
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            boms.push(newBOM);
            setMockData(`boms_${COMPANY_ID}`, boms);
            return newBOM;
        }
    },

    /**
     * Update BOM
     */
    updateBOM: async (bomId: string, updates: Partial<BOM>) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const boms = getMockData(`boms_${COMPANY_ID}`) || [];
            const index = boms.findIndex((b: BOM) => b.id === bomId);

            if (index === -1) {
                throw new Error("BOM not found");
            }

            // If activating this BOM, deactivate others for the same FG item
            if (updates.status === "ACTIVE") {
                const fgItemId = boms[index].fgItemId;
                boms.forEach((b: BOM, i: number) => {
                    if (b.fgItemId === fgItemId && i !== index && b.status === "ACTIVE") {
                        b.status = "INACTIVE";
                        b.updatedAt = new Date();
                    }
                });
            }

            boms[index] = {
                ...boms[index],
                ...updates,
                updatedAt: new Date(),
            };

            setMockData(`boms_${COMPANY_ID}`, boms);
            return boms[index];
        }
    },

    /**
     * Activate a BOM (deactivates other versions)
     */
    activateBOM: async (bomId: string) => {
        return BOMService.updateBOM(bomId, { status: "ACTIVE" });
    },

    /**
     * Deactivate a BOM
     */
    deactivateBOM: async (bomId: string) => {
        return BOMService.updateBOM(bomId, { status: "INACTIVE" });
    },

    /**
     * Delete a BOM (only if DRAFT)
     */
    deleteBOM: async (bomId: string) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const boms = getMockData(`boms_${COMPANY_ID}`) || [];
            const bom = boms.find((b: BOM) => b.id === bomId);

            if (!bom) {
                throw new Error("BOM not found");
            }

            if (bom.status !== "DRAFT") {
                throw new Error("Only DRAFT BOMs can be deleted. Please deactivate instead.");
            }

            const filtered = boms.filter((b: BOM) => b.id !== bomId);
            setMockData(`boms_${COMPANY_ID}`, filtered);
        }
    },

    /**
     * Calculate total material cost for a BOM
     */
    calculateBOMCost: async (bomId: string, itemPrices: Record<string, number>): Promise<number> => {
        const bom = await BOMService.getBOMById(bomId);
        if (!bom) return 0;

        let totalCost = 0;
        for (const line of bom.lines) {
            const itemCost = itemPrices[line.rmItemId] || 0;
            totalCost += itemCost * line.qtyPerUnit;
        }

        return totalCost;
    },

    /**
     * Validate BOM (check if all materials are available)
     */
    validateBOM: (bom: BOM): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];

        if (!bom.fgItemId) {
            errors.push("Finished good item is required");
        }

        if (!bom.lines || bom.lines.length === 0) {
            errors.push("At least one material line is required");
        }

        bom.lines.forEach((line, index) => {
            if (!line.rmItemId) {
                errors.push(`Line ${index + 1}: Material is required`);
            }
            if (line.qtyPerUnit <= 0) {
                errors.push(`Line ${index + 1}: Quantity must be greater than 0`);
            }
        });

        return {
            valid: errors.length === 0,
            errors,
        };
    },
};
