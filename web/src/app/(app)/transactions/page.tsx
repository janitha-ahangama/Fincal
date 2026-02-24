'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Plus, Trash2, Pencil, X } from 'lucide-react';

const CATEGORIES = ['Food', 'Transport', 'Fuel', 'Housing', 'Entertainment', 'Health', 'Shopping', 'Utilities', 'Other'];
const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'other'];

interface Transaction {
    id: string;
    type: 'income' | 'expense';
    amount: number;
    category: string;
    date: string;
    paymentMethod: string;
    notes: string;
    isRecurring: boolean;
}

const empty = (): Omit<Transaction, 'id'> => ({
    type: 'expense',
    amount: 0,
    category: 'Other',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'card',
    notes: '',
    isRecurring: false,
});

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Transaction | null>(null);
    const [form, setForm] = useState(empty());

    const fetchTransactions = async () => {
        try {
            const res = await api.get('/api/transactions');
            setTransactions(res.data.transactions);
        } catch (e: unknown) {
            console.error('Fetch error:', e);
        }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchTransactions(); }, []);

    const openCreate = () => { setEditing(null); setForm(empty()); setShowModal(true); };
    const openEdit = (t: Transaction) => { setEditing(t); setForm({ type: t.type, amount: t.amount, category: t.category, date: t.date, paymentMethod: t.paymentMethod, notes: t.notes, isRecurring: t.isRecurring }); setShowModal(true); };

    const handleSave = async () => {
        try {
            if (editing) {
                await api.put(`/api/transactions/${editing.id}`, form);
            } else {
                await api.post('/api/transactions', form);
            }
            setShowModal(false);
            fetchTransactions();
        } catch (e: unknown) {
            console.error('Save error:', e);
            const err = e as { response?: { data?: { message?: string } }; message?: string };
            alert(`Failed to save transaction: ${err.response?.data?.message || err.message}`);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this transaction?')) return;
        try {
            await api.delete(`/api/transactions/${id}`);
            fetchTransactions();
        } catch (e: unknown) {
            console.error('Delete error:', e);
            const err = e as { response?: { data?: { message?: string } }; message?: string };
            alert(`Failed to delete transaction: ${err.response?.data?.message || err.message}`);
        }
    };

    const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Transactions</h1>
                    <p className="text-gray-400 text-sm mt-1">Manage all your income and expenses</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white rounded-xl font-medium text-sm transition-all"
                >
                    <Plus className="w-4 h-4" /> Add Transaction
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-800 text-gray-400 text-left">
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Notes</th>
                                <th className="px-6 py-4">Payment</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4" />
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length === 0 && (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No transactions yet. Add one!</td></tr>
                            )}
                            {transactions.map((t) => (
                                <tr key={t.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                                    <td className="px-6 py-4 text-gray-300">{t.date}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-gray-800 px-2 py-1 rounded-md text-gray-300">{t.category}</span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 max-w-xs truncate">{t.notes || '—'}</td>
                                    <td className="px-6 py-4 text-gray-400 capitalize">{t.paymentMethod.replace('_', ' ')}</td>
                                    <td className={`px-6 py-4 text-right font-semibold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 justify-end">
                                            <button onClick={() => openEdit(t)} className="text-gray-500 hover:text-violet-400 transition"><Pencil className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(t.id)} className="text-gray-500 hover:text-red-400 transition"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">{editing ? 'Edit Transaction' : 'New Transaction'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {/* Type */}
                            <div className="col-span-2">
                                <label className="text-sm text-gray-400 mb-1 block">Type</label>
                                <div className="flex gap-2">
                                    {(['income', 'expense'] as const).map((t) => (
                                        <button key={t} onClick={() => setForm((f) => ({ ...f, type: t }))}
                                            className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition ${form.type === t ? (t === 'income' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white') : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Amount</label>
                                <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                            </div>

                            {/* Date */}
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Date</label>
                                <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Category</label>
                                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                                </select>
                            </div>

                            {/* Payment Method */}
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Payment</label>
                                <select value={form.paymentMethod} onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                                    {PAYMENT_METHODS.map((p) => <option key={p} value={p}>{p.replace('_', ' ')}</option>)}
                                </select>
                            </div>

                            {/* Notes */}
                            <div className="col-span-2">
                                <label className="text-sm text-gray-400 mb-1 block">Notes</label>
                                <input type="text" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                                    placeholder="Optional note..."
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                            </div>

                            {/* Recurring */}
                            <div className="col-span-2 flex items-center gap-3">
                                <input type="checkbox" id="recurring" checked={form.isRecurring} onChange={(e) => setForm((f) => ({ ...f, isRecurring: e.target.checked }))}
                                    className="w-4 h-4 rounded accent-violet-500" />
                                <label htmlFor="recurring" className="text-sm text-gray-400">Mark as recurring</label>
                            </div>
                        </div>

                        <button onClick={handleSave}
                            className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white transition-all">
                            {editing ? 'Save Changes' : 'Add Transaction'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
