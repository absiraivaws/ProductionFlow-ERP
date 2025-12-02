import { db } from "@/lib/firebase";

export interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    creditLimit: number;
    isActive: boolean;
}

const USE_MOCK = process.env.NEXT_PUBLIC_FIREBASE_API_KEY === "mock-api-key" || !process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
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

export const CustomerService = {
    getCustomers: async (): Promise<Customer[]> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 500));
            return getMockData(`customers_${COMPANY_ID}`) || [];
        }
        return [];
    },

    createCustomer: async (customer: Omit<Customer, "id">) => {
        const newCustomer: Customer = {
            ...customer,
            id: Math.random().toString(36).substr(2, 9),
        };

        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const customers = getMockData(`customers_${COMPANY_ID}`) || [];
            customers.push(newCustomer);
            setMockData(`customers_${COMPANY_ID}`, customers);
            return newCustomer;
        }
    },

    updateCustomer: async (customerId: string, updates: Partial<Customer>) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const customers = getMockData(`customers_${COMPANY_ID}`) || [];
            const index = customers.findIndex((c: Customer) => c.id === customerId);
            if (index !== -1) {
                customers[index] = { ...customers[index], ...updates };
                setMockData(`customers_${COMPANY_ID}`, customers);
            }
        }
    },

    deleteCustomer: async (customerId: string) => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const customers = getMockData(`customers_${COMPANY_ID}`) || [];
            const filtered = customers.filter((c: Customer) => c.id !== customerId);
            setMockData(`customers_${COMPANY_ID}`, filtered);
        }
    },
};
