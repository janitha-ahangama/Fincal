import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { Transaction } from '../types';

export const getInsights = async (req: Request, res: Response): Promise<void> => {
    const uid = req.user!.uid;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = prevDate.getMonth() + 1;
    const prevYear = prevDate.getFullYear();

    try {
        const snapshot = await db.collection('transactions').where('userId', '==', uid).get();
        const allTx = snapshot.docs.map((doc) => doc.data() as Transaction);

        const filterByMonth = (m: number, y: number) =>
            allTx.filter((t) => {
                const d = new Date(t.date);
                return d.getMonth() + 1 === m && d.getFullYear() === y;
            });

        const currentTx = filterByMonth(currentMonth, currentYear);
        const prevTx = filterByMonth(prevMonth, prevYear);

        const sum = (txs: Transaction[], type: 'income' | 'expense') =>
            txs.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);

        const currentExpenses = sum(currentTx, 'expense');
        const prevExpenses = sum(prevTx, 'expense');
        const currentIncome = sum(currentTx, 'income');
        const prevIncome = sum(prevTx, 'income');

        const spendingChange =
            prevExpenses > 0
                ? Number((((currentExpenses - prevExpenses) / prevExpenses) * 100).toFixed(2))
                : null;

        const incomeChange =
            prevIncome > 0
                ? Number((((currentIncome - prevIncome) / prevIncome) * 100).toFixed(2))
                : null;

        // Highest spending category this month
        const categoryMap: Record<string, number> = {};
        currentTx
            .filter((t) => t.type === 'expense')
            .forEach((t) => {
                categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
            });

        const highestCategory =
            Object.entries(categoryMap).sort(([, a], [, b]) => b - a)[0] || null;

        // Category comparison MoM
        const prevCategoryMap: Record<string, number> = {};
        prevTx
            .filter((t) => t.type === 'expense')
            .forEach((t) => {
                prevCategoryMap[t.category] = (prevCategoryMap[t.category] || 0) + t.amount;
            });

        res.status(200).json({
            currentMonth: { month: currentMonth, year: currentYear, expenses: currentExpenses, income: currentIncome },
            previousMonth: { month: prevMonth, year: prevYear, expenses: prevExpenses, income: prevIncome },
            spendingChangePercent: spendingChange,
            incomeChangePercent: incomeChange,
            spendingTrend: spendingChange === null ? 'no_data' : spendingChange > 0 ? 'increased' : spendingChange < 0 ? 'decreased' : 'unchanged',
            highestSpendingCategory: highestCategory ? { category: highestCategory[0], amount: highestCategory[1] } : null,
            categoryBreakdown: { current: categoryMap, previous: prevCategoryMap },
        });
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch insights', error: error.message });
    }
};
