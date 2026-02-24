'use client';

import { useEffect, useState } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import api from '@/lib/axios';

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6'];

interface DashboardData {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    savingsRate: number;
    overallIncome: number;
    overallExpenses: number;
    overallSavings: number;
    categoryBreakdown: Record<string, number>;
    monthlyTrend: { month: string; income: number; expenses: number }[];
    recentTransactions: any[];
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
    return (
        <div className={`bg-gray-900 border border-gray-800 rounded-2xl p-6 relative overflow-hidden`}>
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 ${color}`} />
            <p className="text-sm text-gray-400 font-medium">{label}</p>
            <p className="text-3xl font-bold text-white mt-2">{value}</p>
            {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
    );
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/dashboard')
            .then((res) => {
                setData(res.data);
            })
            .catch((err) => {
                console.error('Web Dashboard: API Error:', err);
            })
            .finally(() => setLoading(false));
    }, []);

    const fmt = (n: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const pieData = data
        ? Object.entries(data.categoryBreakdown).map(([name, value]) => ({ name, value }))
        : [];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-gray-400 text-sm mt-1">Your financial overview for this month</p>
            </div>

            {/* Monthly Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard label="Monthly Income" value={fmt(data?.totalIncome || 0)} color="bg-emerald-500" />
                <StatCard label="Monthly Expenses" value={fmt(data?.totalExpenses || 0)} color="bg-red-500" />
                <StatCard label="Monthly Savings" value={fmt(data?.netSavings || 0)} color="bg-violet-500" />
                <StatCard
                    label="Savings Rate"
                    value={`${data?.savingsRate || 0}%`}
                    sub="of monthly income"
                    color="bg-cyan-500"
                />
            </div>

            {/* Overall Stats */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-gray-400 mb-6 uppercase tracking-wider">Lifetime Overview</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Overall Income</p>
                        <p className="text-2xl font-bold text-emerald-400">{fmt(data?.overallIncome || 0)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Overall Expenses</p>
                        <p className="text-2xl font-bold text-red-400">{fmt(data?.overallExpenses || 0)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Total Savings</p>
                        <p className="text-2xl font-bold text-violet-400">{fmt(data?.overallSavings || 0)}</p>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Monthly Trend */}
                <div className="xl:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <h2 className="font-semibold text-white mb-6">Monthly Trend</h2>
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={data?.monthlyTrend || []}>
                            <defs>
                                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="expensesGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                            <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 12 }} />
                            <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                                labelStyle={{ color: '#f9fafb' }}
                            />
                            <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#incomeGrad)" strokeWidth={2} />
                            <Area type="monotone" dataKey="expenses" stroke="#ef4444" fill="url(#expensesGrad)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>                </div>

                {/* Category Breakdown */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <h2 className="font-semibold text-white mb-6">Spending by Category</h2>
                    {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                                    {pieData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-gray-500 text-sm text-center mt-10">No expense data</p>
                    )}
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-800 flex items-center justify-between">
                    <h2 className="font-semibold text-white">Recent Transactions</h2>
                    <a href="/transactions" className="text-sm text-violet-400 hover:text-violet-300 font-medium transition">View All</a>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-gray-400 text-left border-b border-gray-800/50">
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Notes</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {((data as any)?.recentTransactions || []).length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">No transactions yet.</td></tr>
                            ) : (
                                (data as any)?.recentTransactions.map((t: any, i: number) => (
                                    <tr key={i} className="border-b border-gray-800/30 last:border-0 hover:bg-gray-800/20 transition">
                                        <td className="px-6 py-4 text-gray-300">{t.date}</td>
                                        <td className="px-6 py-4"><span className="bg-gray-800 px-2 py-1 rounded-md text-gray-300 text-xs">{t.category}</span></td>
                                        <td className="px-6 py-4 text-gray-400 truncate max-w-[150px]">{t.notes || '—'}</td>
                                        <td className={`px-6 py-4 text-right font-semibold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
