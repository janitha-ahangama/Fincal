'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';
import { Plus, Trash2, AlertTriangle, X } from 'lucide-react';

const CATEGORIES = ['Food', 'Transport', 'Fuel', 'Housing', 'Entertainment', 'Health', 'Shopping', 'Utilities', 'Other'];

interface Budget {
    id: string;
    category: string;
    month: number;
    year: number;
    limitAmount: number;
    spent: number;
    usagePercent: number;
    alert: boolean;
}

export default function BudgetsPage() {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const now = useMemo(() => new Date(), []);
    const [form, setForm] = useState({ category: 'Food', month: now.getMonth() + 1, year: now.getFullYear(), limitAmount: 0 });

    const fetch_ = useCallback(async () => {
        try {
            const month = now.getMonth() + 1;
            const year = now.getFullYear();
            const r = await api.get(`/api/budgets?month=${month}&year=${year}`);
            setBudgets(r.data.budgets);
        }
        catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [now]);

    useEffect(() => {
        fetch_();
    }, [fetch_]);

    const handleCreate = async () => {
        try { await api.post('/api/budgets', form); setShowModal(false); fetch_(); }
        catch (e) { console.error(e); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this budget?')) return;
        await api.delete(`/api/budgets/${id}`); fetch_();
    };

    const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
    const barColor = (pct: number) => pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Budgets</h1>
                    <p className="text-gray-400 text-sm mt-1">Monthly spending limits by category</p>
                </div>
                <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white rounded-xl font-medium text-sm transition-all">
                    <Plus className="w-4 h-4" /> New Budget
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {budgets.length === 0 && <p className="col-span-3 text-gray-500 text-center py-12">No budgets for this month. Create one!</p>}
                    {budgets.map((b) => (
                        <div key={b.id} className={`bg-gray-900 border rounded-2xl p-5 space-y-4 transition ${b.alert ? 'border-red-500/40' : 'border-gray-800 hover:border-gray-700'}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-white">{b.category}</p>
                                        {b.alert && <AlertTriangle className="w-4 h-4 text-red-400" />}
                                    </div>
                                    <p className="text-xs text-gray-500">{b.month}/{b.year}</p>
                                </div>
                                <button onClick={() => handleDelete(b.id)} className="text-gray-600 hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-400">{fmt(b.spent)} spent</span>
                                    <span className="text-gray-300 font-medium">{fmt(b.limitAmount)} limit</span>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-500 ${barColor(b.usagePercent)}`} style={{ width: `${Math.min(b.usagePercent, 100)}%` }} />
                                </div>
                                <div className="flex justify-between mt-1.5">
                                    <span className={`text-xs font-medium ${b.alert ? 'text-red-400' : 'text-gray-500'}`}>{b.usagePercent.toFixed(1)}% used</span>
                                    {b.alert && <span className="text-xs text-red-400 font-medium">Over 80% – review spending!</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">New Budget</h2>
                            <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-500 hover:text-white" /></button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Category</label>
                                <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm text-gray-400 mb-1 block">Month</label>
                                    <input type="number" min="1" max="12" value={form.month} onChange={(e) => setForm(f => ({ ...f, month: Number(e.target.value) }))} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400 mb-1 block">Year</label>
                                    <input type="number" value={form.year} onChange={(e) => setForm(f => ({ ...f, year: Number(e.target.value) }))} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Limit Amount</label>
                                <input type="number" min="0" step="0.01" value={form.limitAmount} onChange={(e) => setForm(f => ({ ...f, limitAmount: Number(e.target.value) }))} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                            </div>
                        </div>
                        <button onClick={handleCreate} className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white transition-all">Create Budget</button>
                    </div>
                </div>
            )}
        </div>
    );
}
