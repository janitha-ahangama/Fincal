'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Plus, Trash2, Pencil, X } from 'lucide-react';

const CATEGORIES = ['Food', 'Transport', 'Fuel', 'Housing', 'Entertainment', 'Health', 'Shopping', 'Utilities', 'Salary', 'Freelance', 'Investment', 'Other'];
const FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'];

interface Template {
    id: string;
    name: string;
    type: 'income' | 'expense';
    amount: number;
    category: string;
    frequency: string;
    nextDueDate: string;
    autoGenerate: boolean;
}

interface FormState {
    name: string;
    type: 'income' | 'expense';
    amount: number;
    category: string;
    frequency: string;
    nextDueDate: string;
    autoGenerate: boolean;
}

export default function RecurringPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Template | null>(null);
    const [form, setForm] = useState<FormState>({ name: '', type: 'expense', amount: 0, category: 'Other', frequency: 'monthly', nextDueDate: new Date().toISOString().split('T')[0], autoGenerate: true });

    const fetch_ = async () => {
        try { const r = await api.get('/api/recurring'); setTemplates(r.data.templates); }
        catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { fetch_(); }, []);

    const openCreate = () => { setEditing(null); setForm({ name: '', type: 'expense', amount: 0, category: 'Other', frequency: 'monthly', nextDueDate: new Date().toISOString().split('T')[0], autoGenerate: true }); setShowModal(true); };
    const openEdit = (t: Template) => { setEditing(t); setForm({ name: t.name, type: t.type, amount: t.amount, category: t.category, frequency: t.frequency, nextDueDate: t.nextDueDate, autoGenerate: t.autoGenerate }); setShowModal(true); };

    const handleSave = async () => {
        try {
            if (editing) { await api.put(`/api/recurring/${editing.id}`, form); }
            else { await api.post('/api/recurring', form); }
            setShowModal(false); fetch_();
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this recurring template?')) return;
        await api.delete(`/api/recurring/${id}`); fetch_();
    };

    const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Recurring Payments</h1>
                    <p className="text-gray-400 text-sm mt-1">Templates that auto-generate transactions</p>
                </div>
                <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white rounded-xl font-medium text-sm transition-all">
                    <Plus className="w-4 h-4" /> New Template
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {templates.length === 0 && (
                        <p className="col-span-3 text-gray-500 text-center py-12">No recurring templates yet.</p>
                    )}
                    {templates.map((t) => (
                        <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3 hover:border-gray-700 transition">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="font-semibold text-white">{t.name}</p>
                                    <p className="text-xs text-gray-500 capitalize">{t.category} · {t.frequency}</p>
                                </div>
                                <span className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>{t.type === 'income' ? '+' : '-'}{fmt(t.amount)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Next due: <span className="text-gray-300">{t.nextDueDate}</span></span>
                                <span className={`px-2 py-0.5 rounded-full ${t.autoGenerate ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-700 text-gray-500'}`}>{t.autoGenerate ? 'Auto' : 'Manual'}</span>
                            </div>
                            <div className="flex gap-2 pt-1">
                                <button onClick={() => openEdit(t)} className="flex-1 py-1.5 text-xs rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center justify-center gap-1 transition"><Pencil className="w-3 h-3" /> Edit</button>
                                <button onClick={() => handleDelete(t.id)} className="flex-1 py-1.5 text-xs rounded-lg bg-gray-800 hover:bg-red-500/20 text-gray-300 hover:text-red-400 flex items-center justify-center gap-1 transition"><Trash2 className="w-3 h-3" /> Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-white">{editing ? 'Edit Template' : 'New Recurring Template'}</h2>
                            <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-500 hover:text-white" /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <label className="text-sm text-gray-400 mb-1 block">Name</label>
                                <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" placeholder="e.g. Netflix Subscription" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-sm text-gray-400 mb-1 block">Type</label>
                                <div className="flex gap-2">
                                    {(['income', 'expense'] as const).map(t => (
                                        <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))} className={`flex-1 py-2 rounded-xl text-sm font-medium capitalize transition ${form.type === t ? (t === 'income' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white') : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{t}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Amount</label>
                                <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: Number(e.target.value) }))} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Frequency</label>
                                <select value={form.frequency} onChange={(e) => setForm(f => ({ ...f, frequency: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                                    {FREQUENCIES.map(freq => <option key={freq} className="capitalize">{freq}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Category</label>
                                <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400 mb-1 block">Next Due Date</label>
                                <input type="date" value={form.nextDueDate} onChange={(e) => setForm(f => ({ ...f, nextDueDate: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                            </div>
                            <div className="col-span-2 flex items-center gap-3">
                                <input type="checkbox" id="auto" checked={form.autoGenerate} onChange={(e) => setForm(f => ({ ...f, autoGenerate: e.target.checked }))} className="w-4 h-4 rounded accent-violet-500" />
                                <label htmlFor="auto" className="text-sm text-gray-400">Auto-generate transactions</label>
                            </div>
                        </div>
                        <button onClick={handleSave} className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white transition-all">
                            {editing ? 'Save Changes' : 'Create Template'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
