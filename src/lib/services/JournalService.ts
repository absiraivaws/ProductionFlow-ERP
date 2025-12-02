import { db } from "@/lib/firebase";
import { collection, doc, setDoc, getDocs, query, orderBy } from "firebase/firestore";

export interface JournalEntry {
    accountId: string;
    accountName?: string; // For display purposes
    debit: number;
    credit: number;
}

export interface Journal {
    id: string;
    date: string; // YYYY-MM-DD
    referenceNo: string;
    description: string;
    entries: JournalEntry[];
    totalDebit: number;
    totalCredit: number;
    createdBy: string;
    createdAt: Date;
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

// Generate journal reference number
const generateReferenceNo = (journals: Journal[]): string => {
    const count = journals.length + 1;
    return `JRNL-${String(count).padStart(5, '0')}`;
};

// Validate journal entries
const validateJournal = (entries: JournalEntry[]): { valid: boolean; error?: string } => {
    if (entries.length < 2) {
        return { valid: false, error: "Journal must have at least 2 entries" };
    }

    const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return { valid: false, error: `Debit (${totalDebit.toFixed(2)}) must equal Credit (${totalCredit.toFixed(2)})` };
    }

    // Check that no entry has both debit and credit
    for (const entry of entries) {
        if (entry.debit > 0 && entry.credit > 0) {
            return { valid: false, error: "An entry cannot have both debit and credit" };
        }
        if (entry.debit === 0 && entry.credit === 0) {
            return { valid: false, error: "An entry must have either debit or credit" };
        }
    }

    return { valid: true };
};

export const JournalService = {
    getJournals: async (): Promise<Journal[]> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const journals = getMockData(`journals_${COMPANY_ID}`) || [];
            return journals.sort((a: Journal, b: Journal) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
        }
        return [];
    },

    createJournal: async (data: Omit<Journal, "id" | "referenceNo" | "totalDebit" | "totalCredit" | "createdAt">) => {
        // Validate entries
        const validation = validateJournal(data.entries);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        const totalDebit = data.entries.reduce((sum, e) => sum + e.debit, 0);
        const totalCredit = data.entries.reduce((sum, e) => sum + e.credit, 0);

        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const journals = getMockData(`journals_${COMPANY_ID}`) || [];

            const newJournal: Journal = {
                ...data,
                id: Math.random().toString(36).substr(2, 9),
                referenceNo: generateReferenceNo(journals),
                totalDebit,
                totalCredit,
                createdAt: new Date(),
            };

            journals.push(newJournal);
            setMockData(`journals_${COMPANY_ID}`, journals);
            return newJournal;
        }
    },

    getJournalById: async (journalId: string): Promise<Journal | null> => {
        if (USE_MOCK) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const journals = getMockData(`journals_${COMPANY_ID}`) || [];
            return journals.find((j: Journal) => j.id === journalId) || null;
        }
        return null;
    },

    // Helper to validate before submission
    validateEntries: (entries: JournalEntry[]) => validateJournal(entries),
};
