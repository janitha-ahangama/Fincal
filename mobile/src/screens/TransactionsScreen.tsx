import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, ScrollView } from 'react-native';
import api from '../lib/axios';

const CATEGORIES = ['Food', 'Transport', 'Housing', 'Fuel', 'Entertainment', 'Health', 'Shopping', 'Utilities', 'Salary', 'Freelance', 'Investment', 'Other'];

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

interface FormState {
    type: 'income' | 'expense';
    amount: string;
    category: string;
    date: string;
    paymentMethod: string;
    notes: string;
    isRecurring: boolean;
}

const emptyForm = (): FormState => ({ type: 'expense', amount: '', category: 'Other', date: new Date().toISOString().split('T')[0], paymentMethod: 'card', notes: '', isRecurring: false });

export default function TransactionsScreen() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Transaction | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm());

    const fetch_ = async () => {
        try { const r = await api.get('/api/transactions'); setTransactions(r.data.transactions); }
        catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { fetch_(); }, []);

    const handleSave = async () => {
        if (!form.amount) { Alert.alert('Error', 'Amount is required'); return; }
        try {
            const payload = { ...form, amount: Number(form.amount) };
            if (editing) { await api.put(`/api/transactions/${editing.id}`, payload); }
            else { await api.post('/api/transactions', payload); }
            setShowModal(false); fetch_();
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id: string) => {
        Alert.alert('Delete', 'Delete this transaction?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => { await api.delete(`/api/transactions/${id}`); fetch_(); } },
        ]);
    };

    const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.heading}>Transactions</Text>
                    <Text style={styles.sub}>Your income & expenses</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={() => { setEditing(null); setForm(emptyForm()); setShowModal(true); }}>
                    <Text style={styles.addBtnText}>+ Add</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={transactions}
                keyExtractor={(t) => t.id}
                refreshing={loading}
                onRefresh={fetch_}
                contentContainerStyle={{ paddingBottom: 32 }}
                ListEmptyComponent={<Text style={styles.empty}>No transactions yet. Tap + Add to start!</Text>}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.item}
                        onLongPress={() => handleDelete(item.id)}
                        onPress={() => { setEditing(item); setForm({ type: item.type, amount: String(item.amount), category: item.category, date: item.date, paymentMethod: item.paymentMethod, notes: item.notes, isRecurring: item.isRecurring }); setShowModal(true); }}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={styles.itemCategory}>{item.category}</Text>
                            <Text style={styles.itemDate}>{item.date} · {item.paymentMethod}</Text>
                            {item.notes ? <Text style={styles.itemNotes}>{item.notes}</Text> : null}
                        </View>
                        <Text style={[styles.itemAmount, { color: item.type === 'income' ? '#10b981' : '#ef4444' }]}>
                            {item.type === 'income' ? '+' : '-'}{fmt(item.amount)}
                        </Text>
                    </TouchableOpacity>
                )}
            />

            <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>{editing ? 'Edit Transaction' : 'New Transaction'}</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.label}>Type</Text>
                            <View style={styles.typeRow}>
                                {(['income', 'expense'] as const).map(t => (
                                    <TouchableOpacity key={t} style={[styles.typeBtn, form.type === t && (t === 'income' ? styles.typeBtnIncomeActive : styles.typeBtnExpenseActive)]}
                                        onPress={() => setForm(f => ({ ...f, type: t }))}>
                                        <Text style={[styles.typeBtnText, form.type === t && { color: '#fff' }]}>{t}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <Text style={styles.label}>Amount</Text>
                            <TextInput style={styles.input} value={form.amount} onChangeText={v => setForm(f => ({ ...f, amount: v }))} keyboardType="numeric" placeholder="0.00" placeholderTextColor="#4b5563" />
                            <Text style={styles.label}>Date</Text>
                            <TextInput style={styles.input} value={form.date} onChangeText={v => setForm(f => ({ ...f, date: v }))} placeholder="YYYY-MM-DD" placeholderTextColor="#4b5563" />
                            <Text style={styles.label}>Category</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                                {CATEGORIES.map(c => (
                                    <TouchableOpacity key={c} onPress={() => setForm(f => ({ ...f, category: c }))}
                                        style={[styles.chip, form.category === c && styles.chipActive]}>
                                        <Text style={[styles.chipText, form.category === c && styles.chipTextActive]}>{c}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <Text style={styles.label}>Notes</Text>
                            <TextInput style={styles.input} value={form.notes} onChangeText={v => setForm(f => ({ ...f, notes: v }))} placeholder="Optional..." placeholderTextColor="#4b5563" />
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                                <Text style={styles.saveBtnText}>{editing ? 'Save Changes' : 'Add Transaction'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#030712', paddingHorizontal: 16, paddingTop: 56 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    heading: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 4 },
    sub: { fontSize: 13, color: '#6b7280' },
    addBtn: { backgroundColor: '#7c3aed', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    item: { backgroundColor: '#111827', borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#1f2937' },
    itemCategory: { color: '#fff', fontWeight: '600', fontSize: 15, marginBottom: 3 },
    itemDate: { color: '#6b7280', fontSize: 12 },
    itemNotes: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
    itemAmount: { fontWeight: '700', fontSize: 16 },
    empty: { color: '#4b5563', textAlign: 'center', marginTop: 60, fontSize: 14 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalCard: { backgroundColor: '#111827', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 16 },
    label: { fontSize: 13, color: '#9ca3af', marginBottom: 8, fontWeight: '500' },
    input: { backgroundColor: '#1f2937', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 15, marginBottom: 14, borderWidth: 1, borderColor: '#374151' },
    typeRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#374151' },
    typeBtnIncomeActive: { backgroundColor: '#065f46', borderColor: '#10b981' },
    typeBtnExpenseActive: { backgroundColor: '#7f1d1d', borderColor: '#ef4444' },
    typeBtnText: { color: '#9ca3af', fontWeight: '600', textTransform: 'capitalize' },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1f2937', marginRight: 8, borderWidth: 1, borderColor: '#374151' },
    chipActive: { backgroundColor: '#7c3aed', borderColor: '#8b5cf6' },
    chipText: { color: '#9ca3af', fontSize: 13 },
    chipTextActive: { color: '#fff' },
    saveBtn: { backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    cancelBtn: { alignItems: 'center', paddingVertical: 14 },
    cancelBtnText: { color: '#6b7280', fontSize: 14 },
});
