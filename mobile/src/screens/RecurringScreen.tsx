import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, ScrollView, Switch } from 'react-native';
import api from '../lib/axios';

const CATEGORIES = ['Food', 'Transport', 'Housing', 'Entertainment', 'Health', 'Shopping', 'Utilities', 'Fuel', 'Salary', 'Freelance', 'Investment', 'Other'];
const FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'];

interface Template { id: string; name: string; type: 'income' | 'expense'; amount: number; category: string; frequency: string; nextDueDate: string; autoGenerate: boolean; }

interface FormState {
    name: string;
    type: 'income' | 'expense';
    amount: string;
    category: string;
    frequency: string;
    nextDueDate: string;
    autoGenerate: boolean;
}

export default function RecurringScreen() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState<FormState>({ name: '', type: 'expense', amount: '', category: 'Other', frequency: 'monthly', nextDueDate: new Date().toISOString().split('T')[0], autoGenerate: true });

    const fetch_ = async () => { try { const r = await api.get('/api/recurring'); setTemplates(r.data.templates); } catch (e) { console.error(e); } finally { setLoading(false); } };
    useEffect(() => { fetch_(); }, []);

    const handleCreate = async () => {
        if (!form.name || !form.amount) { Alert.alert('Error', 'Name and amount are required'); return; }
        try { await api.post('/api/recurring', { ...form, amount: Number(form.amount) }); setShowModal(false); fetch_(); } catch (e) { console.error(e); }
    };
    const handleDelete = async (id: string) => { Alert.alert('Delete', 'Delete this template?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { await api.delete(`/api/recurring/${id}`); fetch_(); } }]); };
    const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View><Text style={styles.heading}>Recurring</Text><Text style={styles.sub}>Auto-generated templates</Text></View>
                <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}><Text style={styles.addBtnText}>+ New</Text></TouchableOpacity>
            </View>
            <FlatList data={templates} keyExtractor={t => t.id} refreshing={loading} onRefresh={fetch_} contentContainerStyle={{ paddingBottom: 32 }}
                ListEmptyComponent={<Text style={styles.empty}>No recurring templates yet.</Text>}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>{item.name}</Text>
                            <Text style={styles.cardSub}>{item.category} · {item.frequency} · Next: {item.nextDueDate}</Text>
                            <View style={[styles.badge, { backgroundColor: item.autoGenerate ? '#064e3b' : '#1f2937' }]}><Text style={[styles.badgeText, { color: item.autoGenerate ? '#6ee7b7' : '#6b7280' }]}>{item.autoGenerate ? 'Auto' : 'Manual'}</Text></View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.amount, { color: item.type === 'income' ? '#10b981' : '#ef4444' }]}>{item.type === 'income' ? '+' : '-'}{fmt(item.amount)}</Text>
                            <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ marginTop: 8 }}><Text style={styles.deleteText}>Delete</Text></TouchableOpacity>
                        </View>
                    </View>
                )} />
            <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>New Recurring Template</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.label}>Name</Text>
                            <TextInput style={styles.input} value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Netflix" placeholderTextColor="#4b5563" />
                            <Text style={styles.label}>Type</Text>
                            <View style={styles.typeRow}>
                                {(['income', 'expense'] as const).map(t => (
                                    <TouchableOpacity key={t} style={[styles.typeBtn, form.type === t && (t === 'income' ? styles.typeBtnIncome : styles.typeBtnExpense)]} onPress={() => setForm(f => ({ ...f, type: t }))}>
                                        <Text style={[styles.typeBtnText, form.type === t && { color: '#fff' }]}>{t}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <Text style={styles.label}>Amount</Text>
                            <TextInput style={styles.input} value={form.amount} onChangeText={v => setForm(f => ({ ...f, amount: v }))} keyboardType="numeric" placeholder="0.00" placeholderTextColor="#4b5563" />
                            <Text style={styles.label}>Frequency</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                                {FREQUENCIES.map(freq => <TouchableOpacity key={freq} style={[styles.chip, form.frequency === freq && styles.chipActive]} onPress={() => setForm(f => ({ ...f, frequency: freq }))}><Text style={[styles.chipText, form.frequency === freq && { color: '#fff' }]}>{freq}</Text></TouchableOpacity>)}
                            </ScrollView>
                            <Text style={styles.label}>Category</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                                {CATEGORIES.map(c => <TouchableOpacity key={c} style={[styles.chip, form.category === c && styles.chipActive]} onPress={() => setForm(f => ({ ...f, category: c }))}><Text style={[styles.chipText, form.category === c && { color: '#fff' }]}>{c}</Text></TouchableOpacity>)}
                            </ScrollView>
                            <Text style={styles.label}>Next Due Date</Text>
                            <TextInput style={styles.input} value={form.nextDueDate} onChangeText={v => setForm(f => ({ ...f, nextDueDate: v }))} placeholder="YYYY-MM-DD" placeholderTextColor="#4b5563" />
                            <View style={styles.switchRow}><Text style={styles.label}>Auto-generate transactions</Text><Switch value={form.autoGenerate} onValueChange={v => setForm(f => ({ ...f, autoGenerate: v }))} trackColor={{ false: '#374151', true: '#7c3aed' }} /></View>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleCreate}><Text style={styles.saveBtnText}>Create Template</Text></TouchableOpacity>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
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
    card: { backgroundColor: '#111827', borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#1f2937' },
    cardTitle: { color: '#fff', fontWeight: '600', fontSize: 15, marginBottom: 3 },
    cardSub: { color: '#6b7280', fontSize: 12, marginBottom: 8 },
    badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    badgeText: { fontSize: 11, fontWeight: '600' },
    amount: { fontWeight: '700', fontSize: 16 },
    deleteText: { color: '#ef4444', fontSize: 12 },
    empty: { color: '#4b5563', textAlign: 'center', marginTop: 60, fontSize: 14 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalCard: { backgroundColor: '#111827', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 16 },
    label: { fontSize: 13, color: '#9ca3af', marginBottom: 8, fontWeight: '500' },
    input: { backgroundColor: '#1f2937', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 15, marginBottom: 14, borderWidth: 1, borderColor: '#374151' },
    typeRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#374151' },
    typeBtnIncome: { backgroundColor: '#065f46', borderColor: '#10b981' },
    typeBtnExpense: { backgroundColor: '#7f1d1d', borderColor: '#ef4444' },
    typeBtnText: { color: '#9ca3af', fontWeight: '600', textTransform: 'capitalize' },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1f2937', marginRight: 8, borderWidth: 1, borderColor: '#374151' },
    chipActive: { backgroundColor: '#7c3aed', borderColor: '#8b5cf6' },
    chipText: { color: '#9ca3af', fontSize: 13 },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    saveBtn: { backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    cancelBtn: { alignItems: 'center', paddingVertical: 14 },
    cancelBtnText: { color: '#6b7280', fontSize: 14 },
});
