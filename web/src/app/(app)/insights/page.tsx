'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';

interface InsightsData {
    currentMonth: { month: number; year: number; expenses: number; income: number };
    previousMonth: { month: number; year: number; expenses: number; income: number };
    spendingChangePercent: number | null;
    incomeChangePercent: number | null;
    spendingTrend: 'increased' | 'decreased' | 'unchanged' | 'no_data';
    highestSpendingCategory: { category: string; amount: number } | null;
    categoryBreakdown: { current: Record<string, number>; previous: Record<string, number> };
}

export default function InsightsPage() {
    const [data, setData] = useState<InsightsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/insights').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
    }, []);

    const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
    const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>;

    const trend = data?.spendingTrend;
    const TrendIcon = trend === 'increased' ? TrendingUp : trend === 'decreased' ? TrendingDown : Minus;
    const trendColor = trend === 'increased' ? 'text-red-400' : trend === 'decreased' ? 'text-emerald-400' : 'text-gray-400';

    const allCategories = Array.from(new Set([...Object.keys(data?.categoryBreakdown.current || {}), ...Object.keys(data?.categoryBreakdown.previous || {})]));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Insights</h1>
                <p className="text-gray-400 text-sm mt-1">Month-over-month spending analysis</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Spending change */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <p className="text-sm text-gray-400 mb-2">Spending vs Last Month</p>
                    <div className={`flex items-center gap-2 ${trendColor}`}>
                        <TrendIcon className="w-6 h-6" />
                        <span className="text-3xl font-bold">
                            {data?.spendingChangePercent !== null ? `${Math.abs(data!.spendingChangePercent)}%` : 'N/A'}
                        </span>
                    </div>
                    <p className={`text-sm mt-2 capitalize ${trendColor}`}>{trend?.replace('_', ' ')}</p>
                </div>

                {/* Income change */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <p className="text-sm text-gray-400 mb-2">Income vs Last Month</p>
                    <div className={`flex items-center gap-2 ${(data?.incomeChangePercent ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {(data?.incomeChangePercent ?? 0) >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                        <span className="text-3xl font-bold">
                            {data?.incomeChangePercent !== null ? `${Math.abs(data!.incomeChangePercent ?? 0)}%` : 'N/A'}
                        </span>
                    </div>
                    <p className="text-sm mt-2 text-gray-500">{data?.incomeChangePercent !== null ? ((data!.incomeChangePercent ?? 0) >= 0 ? 'Increased' : 'Decreased') : 'No prior data'}</p>
                </div>

                {/* Highest category */}
                <div className={`bg-gray-900 border rounded-2xl p-6 ${data?.highestSpendingCategory ? 'border-amber-500/30' : 'border-gray-800'}`}>
                    <p className="text-sm text-gray-400 mb-2">Highest Spending Category</p>
                    {data?.highestSpendingCategory ? (
                        <>
                            <div className="flex items-center gap-2 text-amber-400">
                                <AlertCircle className="w-6 h-6" />
                                <span className="text-2xl font-bold">{data.highestSpendingCategory.category}</span>
                            </div>
                            <p className="text-gray-300 font-medium mt-2">{fmt(data.highestSpendingCategory.amount)}</p>
                        </>
                    ) : (
                        <p className="text-gray-500 text-sm mt-2">No expense data</p>
                    )}
                </div>
            </div>

            {/* Month comparison */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h2 className="font-semibold text-white mb-4">Monthly Comparison</h2>
                <div className="grid grid-cols-3 gap-4 mb-4 text-sm text-gray-400 font-medium border-b border-gray-800 pb-3">
                    <span>Category</span>
                    <span className="text-right">{data ? `${MONTH_NAMES[(data.previousMonth.month - 1)]} ${data.previousMonth.year}` : 'Prev'}</span>
                    <span className="text-right">{data ? `${MONTH_NAMES[(data.currentMonth.month - 1)]} ${data.currentMonth.year}` : 'Curr'}</span>
                </div>
                {allCategories.length === 0 && <p className="text-gray-500 text-sm text-center py-6">No data to compare</p>}
                {allCategories.map((cat) => {
                    const curr = data?.categoryBreakdown.current[cat] || 0;
                    const prev = data?.categoryBreakdown.previous[cat] || 0;
                    const changed = curr > prev;
                    return (
                        <div key={cat} className="grid grid-cols-3 gap-4 py-3 border-b border-gray-800/50 text-sm items-center">
                            <span className="text-gray-300">{cat}</span>
                            <span className="text-right text-gray-400">{fmt(prev)}</span>
                            <span className={`text-right font-medium ${curr > prev ? 'text-red-400' : curr < prev ? 'text-emerald-400' : 'text-gray-400'}`}>
                                {fmt(curr)} {curr !== prev && <span className="text-xs ml-1">{changed ? '▲' : '▼'}</span>}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
