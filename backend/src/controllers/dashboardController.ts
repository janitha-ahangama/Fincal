import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { Transaction } from '../types';

export const getDashboard = async (req: Request, res: Response): Promise<void> => {
    const uid = req.user!.uid;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = prevDate.getMonth() + 1;
    const prevYear = prevDate.getFullYear();

    try {
        const snapshot = await db.collection('transactions').where('userId', '==', uid).get();
        const allTransactions = snapshot.docs.map((doc) => doc.data() as Transaction);

        const isCurrentMonth = (t: Transaction) => {
            const d = new Date(t.date);
            return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
        };

        const isPrevMonth = (t: Transaction) => {
            const d = new Date(t.date);
            return d.getMonth() + 1 === prevMonth && d.getFullYear() === prevYear;
        };

        const currentMonthTx = allTransactions.filter(isCurrentMonth);
        const prevMonthTx = allTransactions.filter(isPrevMonth);

        const totalIncome = currentMonthTx.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = currentMonthTx.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const netSavings = totalIncome - totalExpenses;
        const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(2) : '0.00';

        // Category breakdown for expenses
        const categoryBreakdown: Record<string, number> = {};
        currentMonthTx
            .filter((t) => t.type === 'expense')
            .forEach((t) => {
                categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
            });

        // Monthly trend – last 6 months
        const monthlyTrend: { month: string; income: number; expenses: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const m = d.getMonth() + 1;
            const y = d.getFullYear();
            const monthTx = allTransactions.filter((t) => {
                const td = new Date(t.date);
                return td.getMonth() + 1 === m && td.getFullYear() === y;
            });
            monthlyTrend.push({
                month: `${y}-${String(m).padStart(2, '0')}`,
                income: monthTx.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
                expenses: monthTx.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
            });
        }

        // Previous month totals for insights
        const prevIncome = prevMonthTx.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const prevExpenses = prevMonthTx.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

        // Overall Totals
        const overallIncome = allTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const overallExpenses = allTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const overallSavings = overallIncome - overallExpenses;

        // Recent transactions - sorted in memory for development ease
        const recentTransactions = allTransactions
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);

        res.status(200).json({
            currentMonth: { month: currentMonth, year: currentYear },
            totalIncome,
            totalExpenses,
            netSavings,
            savingsRate: Number(savingsRate),
            overallIncome,
            overallExpenses,
            overallSavings,
            categoryBreakdown,
            monthlyTrend,
            previousMonth: { income: prevIncome, expenses: prevExpenses },
            recentTransactions,
        });
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch dashboard data', error: error.message });
    }
};
