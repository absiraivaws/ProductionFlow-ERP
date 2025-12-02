import { db } from "@/lib/firebase";

export type LocationType = "MAIN_STORE" | "PRODUCTION_STORE" | "FINISHED_GOODS_STORE" | "OTHER";

export interface Location {
    id: string;
    code: string;
    name: string;
    type: LocationType;
    description?: string;
    isActive: boolean;
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

// Default locations
const getDefaultLocations = (): Location[] => [
    {
        id: "LOC-001",
        code: "MAIN",
        name: "Main Store",
        type: "MAIN_STORE",
        description: "Primary warehouse for raw materials and general inventory",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: "LOC-002",
        code: "PROD",
        name: "Production Store",
        type: "PRODUCTION_STORE",
        description: "Work-in-progress and production area",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: "LOC-003",
        code: "FG",
        name: "Finished Goods Store",
        type: "FINISHED_GOODS_STORE",
        description: "Warehouse for finished products ready for sale",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];

export const LocationService = {
    getLocations: async (): Promise<Location[]> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            let locations = getMockData(`locations_${COMPANY_ID}`);

            // Initialize with default locations if empty
            if (!locations || locations.length === 0) {
                locations = getDefaultLocations();
                setMockData(`locations_${COMPANY_ID}`, locations);
            }

            return locations.filter((loc: Location) => loc.isActive);
        }
        return [];
    },

    getAllLocations: async (): Promise<Location[]> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            let locations = getMockData(`locations_${COMPANY_ID}`);

            if (!locations || locations.length === 0) {
                locations = getDefaultLocations();
                setMockData(`locations_${COMPANY_ID}`, locations);
            }

            return locations;
        }
        return [];
    },

    getLocationById: async (locationId: string): Promise<Location | null> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const locations = getMockData(`locations_${COMPANY_ID}`) || [];
            return locations.find((loc: Location) => loc.id === locationId) || null;
        }
        return null;
    },

    createLocation: async (location: Omit<Location, "id" | "createdAt" | "updatedAt">) => {
        const newLocation: Location = {
            ...location,
            id: `LOC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const locations = getMockData(`locations_${COMPANY_ID}`) || [];

            // Check for duplicate code
            if (locations.some((loc: Location) => loc.code === newLocation.code)) {
                throw new Error(`Location code ${newLocation.code} already exists`);
            }

            locations.push(newLocation);
            setMockData(`locations_${COMPANY_ID}`, locations);
            return newLocation;
        }
    },

    updateLocation: async (locationId: string, updates: Partial<Location>) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const locations = getMockData(`locations_${COMPANY_ID}`) || [];
            const index = locations.findIndex((loc: Location) => loc.id === locationId);

            if (index !== -1) {
                locations[index] = {
                    ...locations[index],
                    ...updates,
                    updatedAt: new Date(),
                };
                setMockData(`locations_${COMPANY_ID}`, locations);
                return locations[index];
            }
            throw new Error("Location not found");
        }
    },

    deactivateLocation: async (locationId: string) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const locations = getMockData(`locations_${COMPANY_ID}`) || [];
            const index = locations.findIndex((loc: Location) => loc.id === locationId);

            if (index !== -1) {
                locations[index].isActive = false;
                locations[index].updatedAt = new Date();
                setMockData(`locations_${COMPANY_ID}`, locations);
            }
        }
    },

    seedDefaultLocations: async () => {
        if (USE_MOCK) {
            const locations = getDefaultLocations();
            setMockData(`locations_${COMPANY_ID}`, locations);
            return locations;
        }
    },
};
