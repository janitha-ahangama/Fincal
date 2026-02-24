export interface User {
    uid: string;
    name: string;
    email: string;
}

export type TransactionType = 'income' | 'expense';
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'other';

export interface Transaction {
    id?: string;
    userId: string;
    type: TransactionType;
    amount: number;
    category: string;
    date: string; // ISO date string
    paymentMethod: PaymentMethod | string;
    notes?: string;
    isRecurring: boolean;
    recurringId?: string;
    createdAt: string;
}

export interface RecurringTemplate {
    id?: string;
    userId: string;
    name: string;
    amount: number;
    category: string;
    type: TransactionType;
    frequency: RecurringFrequency;
    nextDueDate: string; // ISO date string
    autoGenerate: boolean;
    paymentMethod?: string;
    notes?: string;
}

export interface Budget {
    id?: string;
    userId: string;
    category: string;
    month: number; // 1-12
    year: number;
    limitAmount: number;
}

export interface AuthenticatedRequest extends Request {
    user?: {
        uid: string;
        email?: string;
        name?: string;
    };
}

// Extend Express Request
declare global {
    namespace Express {
        interface Request {
            user?: {
                uid: string;
                email?: string;
                name?: string;
            };
        }
    }
}
