import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

export interface Company {
    id: string;
    name: string;
    address: string;
    phone: string;
    logoUrl?: string;
    currency: string;
    financialYearStart: string; // YYYY-MM-DD
    createdBy: string;
}

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

const USE_MOCK = process.env.NEXT_PUBLIC_FIREBASE_API_KEY === "mock-api-key" || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

export const CompanyService = {
    createCompany: async (companyId: string, data: Omit<Company, "id">) => {
        if (USE_MOCK) {
            console.log("Using mock storage for createCompany");
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 500));
            setMockData(`company_${companyId}`, { ...data, id: companyId });
            return;
        }

        try {
            await setDoc(doc(db, "companies", companyId), {
                ...data,
                id: companyId,
                createdAt: new Date(),
            });
        } catch (error) {
            console.warn("Firebase failed, using mock storage", error);
            setMockData(`company_${companyId}`, { ...data, id: companyId });
        }
    },

    getCompany: async (companyId: string): Promise<Company | null> => {
        if (USE_MOCK) {
            console.log("Using mock storage for getCompany");
            await new Promise(resolve => setTimeout(resolve, 500));
            return getMockData(`company_${companyId}`);
        }

        try {
            const docRef = doc(db, "companies", companyId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data() as Company;
            }
        } catch (error) {
            console.warn("Firebase failed, using mock storage", error);
            return getMockData(`company_${companyId}`);
        }
        return null;
    },

    updateCompany: async (companyId: string, data: Partial<Company>) => {
        if (USE_MOCK) {
            console.log("Using mock storage for updateCompany");
            await new Promise(resolve => setTimeout(resolve, 500));
            const current = getMockData(`company_${companyId}`) || {};
            setMockData(`company_${companyId}`, { ...current, ...data });
            return;
        }

        try {
            const docRef = doc(db, "companies", companyId);
            await updateDoc(docRef, data);
        } catch (error) {
            console.warn("Firebase failed, using mock storage", error);
            const current = getMockData(`company_${companyId}`) || {};
            setMockData(`company_${companyId}`, { ...current, ...data });
        }
    },
};
