'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/lib/axios';

interface Transaction {
    id: string;
    type: 'income' | 'expense';
    amount: number;
    date: string;
}

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const fetchTransactions = useCallback(async () => {
        try {
            // Fetch for the current month. The API supports month/year params
            const res = await api.get(`/api/transactions?month=${month + 1}&year=${year}`);
            setTransactions(res.data.transactions);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [month, year]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const monthName = currentDate.toLocaleString('default', { month: 'long' });

    // Aggregate expenses by day
    const expensesByDay = transactions.reduce((acc, t) => {
        if (t.type === 'expense') {
            // Parse YYYY-MM-DD safely without timezone shifts
            const day = parseInt(t.date.split('-')[2], 10);
            acc[day] = (acc[day] || 0) + t.amount;
        }
        return acc;
    }, {} as Record<number, number>);

    const fmt = (n: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Expense Calendar</h1>
                    <p className="text-gray-400 text-sm mt-1">Visualize your daily spending</p>
                </div>
                <div className="flex items-center gap-4 bg-gray-900 border border-gray-800 p-1 rounded-xl">
                    <button onClick={prevMonth} className="p-2 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-semibold text-white px-2 min-w-[120px] text-center">
                        {monthName} {year}
                    </span>
                    <button onClick={nextMonth} className="p-2 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-px bg-gray-800 border border-gray-800 rounded-2xl overflow-hidden">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="bg-gray-900 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {day}
                    </div>
                ))}

                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-gray-950/50 min-h-[120px]" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const amount = expensesByDay[day] || 0;
                    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

                    return (
                        <div key={day} className={`bg-gray-900 min-h-[120px] p-3 border-t border-gray-800/50 flex flex-col justify-between group cursor-pointer hover:bg-gray-800/40 transition-colors ${isToday ? 'ring-1 ring-inset ring-violet-500/50 bg-violet-500/5' : ''}`}>
                            <div className="flex items-center justify-between">
                                <span className={`text-sm font-medium ${isToday ? 'text-violet-400' : 'text-gray-400'}`}>
                                    {day}
                                </span>
                            </div>
                            {amount > 0 && (
                                <div className="mt-auto">
                                    <p className="text-xs font-bold text-red-400 drop-shadow-sm">
                                        {fmt(amount)}
                                    </p>
                                    <div className="mt-1 h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-red-400/60"
                                            style={{ width: `${Math.min((amount / 500) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-wrap gap-8 items-center justify-center">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-violet-500 rounded-full" />
                    <span className="text-xs text-gray-400">Current Day</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full" />
                    <span className="text-xs text-gray-400">Spending Amount</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-10 h-1 bg-red-400/60 rounded-full" />
                    <span className="text-xs text-gray-400">Daily Threshold (Visualizer)</span>
                </div>
            </div>
        </div>
    );
}
