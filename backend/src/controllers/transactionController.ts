import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { Transaction } from '../types';

const COLLECTION = 'transactions';

// Add a transaction
export const createTransaction = async (req: Request, res: Response): Promise<void> => {
    const uid = req.user!.uid;
    const { type, amount, category, date, paymentMethod, notes, isRecurring, recurringId } = req.body;

    if (!type || !amount || !category || !date || !paymentMethod) {
        res.status(400).json({ message: 'Missing required fields' });
        return;
    }

    try {
        const transaction: Transaction = {
            userId: uid,
            type,
            amount: Number(amount),
            category,
            date,
            paymentMethod,
            notes: notes || '',
            isRecurring: Boolean(isRecurring),
            recurringId: recurringId || null,
            createdAt: new Date().toISOString(),
        };

        const ref = await db.collection(COLLECTION).add(transaction);
        console.log('Backend: Transaction created:', ref.id, 'for UID:', uid);
        res.status(201).json({ id: ref.id, ...transaction });
    } catch (error: any) {
        console.error('Backend: Failed to create transaction:', error);
        res.status(500).json({ message: 'Failed to create transaction', error: error.message });
    }
};

// Get transactions with optional filters: month, year, category, startDate, endDate
export const getTransactions = async (req: Request, res: Response): Promise<void> => {
    const uid = req.user!.uid;
    const { month, year, category, startDate, endDate } = req.query;

    try {
        let query: FirebaseFirestore.Query = db
            .collection(COLLECTION)
            .where('userId', '==', uid);

        const snapshot = await query.get();
        let transactions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as (Transaction & { id: string })[];

        // Sort in memory to avoid needing composite indexes during development
        transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Apply JS-side filters (Firestore range queries need composite indexes)
        if (month && year) {
            const m = Number(month);
            const y = Number(year);
            transactions = transactions.filter((t) => {
                const d = new Date(t.date);
                return d.getMonth() + 1 === m && d.getFullYear() === y;
            });
        }

        if (category) {
            transactions = transactions.filter((t) => t.category === category);
        }

        if (startDate) {
            transactions = transactions.filter((t) => new Date(t.date) >= new Date(startDate as string));
        }

        if (endDate) {
            transactions = transactions.filter((t) => new Date(t.date) <= new Date(endDate as string));
        }

        res.status(200).json({ transactions });
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch transactions', error: error.message });
    }
};

// Get single transaction
export const getTransactionById = async (req: Request, res: Response): Promise<void> => {
    const uid = req.user!.uid;
    const { id } = req.params;

    try {
        const doc = await db.collection(COLLECTION).doc(id).get();

        if (!doc.exists || (doc.data() as Transaction).userId !== uid) {
            res.status(404).json({ message: 'Transaction not found' });
            return;
        }

        res.status(200).json({ id: doc.id, ...doc.data() });
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch transaction', error: error.message });
    }
};

// Update transaction
export const updateTransaction = async (req: Request, res: Response): Promise<void> => {
    const uid = req.user!.uid;
    const { id } = req.params;

    try {
        const doc = await db.collection(COLLECTION).doc(id).get();

        if (!doc.exists || (doc.data() as Transaction).userId !== uid) {
            res.status(404).json({ message: 'Transaction not found' });
            return;
        }

        const updates = { ...req.body, updatedAt: new Date().toISOString() };
        delete updates.userId; // prevent userId override
        delete updates.id;

        await db.collection(COLLECTION).doc(id).update(updates);
        res.status(200).json({ message: 'Transaction updated', id });
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to update transaction', error: error.message });
    }
};

// Delete transaction
export const deleteTransaction = async (req: Request, res: Response): Promise<void> => {
    const uid = req.user!.uid;
    const { id } = req.params;

    try {
        const doc = await db.collection(COLLECTION).doc(id).get();

        if (!doc.exists || (doc.data() as Transaction).userId !== uid) {
            res.status(404).json({ message: 'Transaction not found' });
            return;
        }

        await db.collection(COLLECTION).doc(id).delete();
        res.status(200).json({ message: 'Transaction deleted', id });
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to delete transaction', error: error.message });
    }
};
