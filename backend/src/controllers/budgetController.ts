import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { Budget, Transaction } from '../types';

const BUDGETS_COL = 'budgets';

export const createBudget = async (req: Request, res: Response): Promise<void> => {
    const uid = req.user!.uid;
    const { category, month, year, limitAmount } = req.body;

    if (!category || !month || !year || !limitAmount) {
        res.status(400).json({ message: 'Missing required fields' });
        return;
    }

    try {
        // Check if budget already exists for this category/month/year
        const existing = await db
            .collection(BUDGETS_COL)
            .where('userId', '==', uid)
            .where('category', '==', category)
            .where('month', '==', Number(month))
            .where('year', '==', Number(year))
            .get();

        if (!existing.empty) {
            res.status(409).json({ message: 'Budget already exists for this category and period' });
            return;
        }

        const budget: Budget = {
            userId: uid,
            category,
            month: Number(month),
            year: Number(year),
            limitAmount: Number(limitAmount),
        };

        const ref = await db.collection(BUDGETS_COL).add(budget);
        res.status(201).json({ id: ref.id, ...budget });
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to create budget', error: error.message });
    }
};

export const getBudgets = async (req: Request, res: Response): Promise<void> => {
    const uid = req.user!.uid;
    const { month, year } = req.query;

    try {
        let query: FirebaseFirestore.Query = db.collection(BUDGETS_COL).where('userId', '==', uid);

        if (month) query = query.where('month', '==', Number(month));
        if (year) query = query.where('year', '==', Number(year));

        const snapshot = await query.get();
        const budgets = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as (Budget & { id: string })[];

        // Fetch transactions for the same period to calculate usage
        const txSnapshot = await db.collection('transactions').where('userId', '==', uid).get();
        const allTx = txSnapshot.docs.map((doc) => doc.data() as Transaction);

        const budgetsWithUsage = budgets.map((budget) => {
            const spent = allTx
                .filter((t) => {
                    const d = new Date(t.date);
                    return (
                        t.type === 'expense' &&
                        t.category === budget.category &&
                        d.getMonth() + 1 === budget.month &&
                        d.getFullYear() === budget.year
                    );
                })
                .reduce((sum, t) => sum + t.amount, 0);

            const usagePercent = budget.limitAmount > 0 ? (spent / budget.limitAmount) * 100 : 0;
            return {
                ...budget,
                spent,
                usagePercent: Number(usagePercent.toFixed(2)),
                alert: usagePercent > 80,
            };
        });

        res.status(200).json({ budgets: budgetsWithUsage });
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch budgets', error: error.message });
    }
};

export const updateBudget = async (req: Request, res: Response): Promise<void> => {
    const uid = req.user!.uid;
    const { id } = req.params;

    try {
        const doc = await db.collection(BUDGETS_COL).doc(id).get();

        if (!doc.exists || (doc.data() as Budget).userId !== uid) {
            res.status(404).json({ message: 'Budget not found' });
            return;
        }

        const updates = { ...req.body };
        delete updates.userId;
        delete updates.id;

        await db.collection(BUDGETS_COL).doc(id).update(updates);
        res.status(200).json({ message: 'Budget updated', id });
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to update budget', error: error.message });
    }
};

export const deleteBudget = async (req: Request, res: Response): Promise<void> => {
    const uid = req.user!.uid;
    const { id } = req.params;

    try {
        const doc = await db.collection(BUDGETS_COL).doc(id).get();

        if (!doc.exists || (doc.data() as Budget).userId !== uid) {
            res.status(404).json({ message: 'Budget not found' });
            return;
        }

        await db.collection(BUDGETS_COL).doc(id).delete();
        res.status(200).json({ message: 'Budget deleted', id });
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to delete budget', error: error.message });
    }
};
