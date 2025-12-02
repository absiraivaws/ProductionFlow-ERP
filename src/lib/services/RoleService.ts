import { db } from "@/lib/firebase";
import { collection, doc, setDoc, getDocs, updateDoc, deleteDoc } from "firebase/firestore";

export interface Permission {
    accounting: boolean;
    inventory: boolean;
    sales: boolean;
    settings: boolean;
}

export interface Role {
    id: string;
    name: string;
    permissions: Permission;
}

const USE_MOCK = process.env.NEXT_PUBLIC_FIREBASE_API_KEY === "mock-api-key" || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const COMPANY_ID = "default-company"; // Hardcoded for dev

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

export const RoleService = {
    getRoles: async (): Promise<Role[]> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const roles = getMockData(`roles_${COMPANY_ID}`);
            return roles || [];
        }
        // Firebase implementation would go here
        return [];
    },

    createRole: async (role: Omit<Role, "id">) => {
        const newRole = { ...role, id: Math.random().toString(36).substr(2, 9) };
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const roles = getMockData(`roles_${COMPANY_ID}`) || [];
            roles.push(newRole);
            setMockData(`roles_${COMPANY_ID}`, roles);
            return newRole;
        }
    },

    updateRole: async (roleId: string, updates: Partial<Role>) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const roles = getMockData(`roles_${COMPANY_ID}`) || [];
            const index = roles.findIndex((r: Role) => r.id === roleId);
            if (index !== -1) {
                roles[index] = { ...roles[index], ...updates };
                setMockData(`roles_${COMPANY_ID}`, roles);
            }
        }
    },

    deleteRole: async (roleId: string) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const roles = getMockData(`roles_${COMPANY_ID}`) || [];
            const filtered = roles.filter((r: Role) => r.id !== roleId);
            setMockData(`roles_${COMPANY_ID}`, filtered);
        }
    }
};
