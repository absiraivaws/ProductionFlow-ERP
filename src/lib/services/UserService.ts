import { db } from "@/lib/firebase";
import { collection, doc, setDoc, getDocs, updateDoc } from "firebase/firestore";

export interface User {
    id: string;
    name: string;
    email: string;
    roleId: string;
    status: "active" | "invited" | "inactive";
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

export const UserService = {
    getUsers: async (): Promise<User[]> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const users = getMockData(`users_${COMPANY_ID}`);
            return users || [];
        }
        return [];
    },

    inviteUser: async (user: Omit<User, "id" | "status">) => {
        const newUser = { ...user, id: Math.random().toString(36).substr(2, 9), status: "invited" };
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const users = getMockData(`users_${COMPANY_ID}`) || [];
            users.push(newUser);
            setMockData(`users_${COMPANY_ID}`, users);
            return newUser;
        }
    },

    updateUser: async (userId: string, updates: Partial<User>) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const users = getMockData(`users_${COMPANY_ID}`) || [];
            const index = users.findIndex((u: User) => u.id === userId);
            if (index !== -1) {
                users[index] = { ...users[index], ...updates };
                setMockData(`users_${COMPANY_ID}`, users);
            }
        }
    }
};
