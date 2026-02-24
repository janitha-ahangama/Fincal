import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, ScrollView } from 'react-native';
import api from '../lib/axios';

const CATEGORIES = ['Food', 'Transport', 'Housing', 'Fuel', 'Entertainment', 'Health', 'Shopping', 'Utilities', 'Other'];

interface Budget { id: string; category: string; month: number; year: number; limitAmount: number; spent: number; usagePercent: number; alert: boolean; }

export default function BudgetsScreen() {
    const now = new Date();
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ category: 'Food', month: String(now.getMonth() + 1), year: String(now.getFullYear()), limitAmount: '' });

    const fetch_ = async () => { try { const r = await api.get(`/api/budgets?month=${now.getMonth() + 1}&year=${now.getFullYear()}`); setBudgets(r.data.budgets); } catch (e) { console.error(e); } finally { setLoading(false); } };
    useEffect(() => { fetch_(); }, []);

    const handleCreate = async () => {
        if (!form.limitAmount) { Alert.alert('Error', 'Limit amount is required'); return; }
        try { await api.post('/api/budgets', { ...form, month: Number(form.month), year: Number(form.year), limitAmount: Number(form.limitAmount) }); setShowModal(false); fetch_(); } catch (e: any) { Alert.alert('Error', e.response?.data?.message || 'Failed'); }
    };
    const handleDelete = async (id: string) => { Alert.alert('Delete', 'Delete this budget?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { await api.delete(`/api/budgets/${id}`); fetch_(); } }]); };
    const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
    const barColor = (pct: number) => pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#10b981';

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View><Text style={styles.heading}>Budgets</Text><Text style={styles.sub}>Monthly spending limits</Text></View>
                <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}><Text style={styles.addBtnText}>+ New</Text></TouchableOpacity>
            </View>
            <FlatList data={budgets} keyExtractor={b => b.id} refreshing={loading} onRefresh={fetch_} contentContainerStyle={{ paddingBottom: 32 }}
                ListEmptyComponent={<Text style={styles.empty}>No budgets yet. Create one!</Text>}
                renderItem={({ item }) => (
                    <View style={[styles.card, item.alert && styles.cardAlert]}>
                        <View style={styles.cardRow}>
                            <View><Text style={styles.cardTitle}>{item.category}</Text><Text style={styles.cardSub}>{item.month}/{item.year}</Text></View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.amounts}>{fmt(item.spent)} / {fmt(item.limitAmount)}</Text>
                                <TouchableOpacity onPress={() => handleDelete(item.id)}><Text style={styles.deleteText}>Delete</Text></TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.barBg}><View style={[styles.barFill, { width: `${Math.min(item.usagePercent, 100)}%` as any, backgroundColor: barColor(item.usagePercent) }]} /></View>
                        <View style={styles.cardFooter}>
                            <Text style={{ color: barColor(item.usagePercent), fontSize: 12, fontWeight: '600' }}>{item.usagePercent.toFixed(1)}% used</Text>
                            {item.alert && <Text style={styles.alertText}>⚠ Over 80% – review spending</Text>}
                        </View>
                    </View>
                )} />
            <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>New Budget</Text>
                        <Text style={styles.label}>Category</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                            {CATEGORIES.map(c => <TouchableOpacity key={c} style={[styles.chip, form.category === c && styles.chipActive]} onPress={() => setForm(f => ({ ...f, category: c }))}><Text style={[styles.chipText, form.category === c && { color: '#fff' }]}>{c}</Text></TouchableOpacity>)}
                        </ScrollView>
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}><Text style={styles.label}>Month</Text><TextInput style={styles.input} value={form.month} onChangeText={v => setForm(f => ({ ...f, month: v }))} keyboardType="numeric" placeholderTextColor="#4b5563" /></View>
                            <View style={{ width: 12 }} />
                            <View style={{ flex: 1 }}><Text style={styles.label}>Year</Text><TextInput style={styles.input} value={form.year} onChangeText={v => setForm(f => ({ ...f, year: v }))} keyboardType="numeric" placeholderTextColor="#4b5563" /></View>
                        </View>
                        <Text style={styles.label}>Limit Amount</Text>
                        <TextInput style={styles.input} value={form.limitAmount} onChangeText={v => setForm(f => ({ ...f, limitAmount: v }))} keyboardType="numeric" placeholder="0.00" placeholderTextColor="#4b5563" />
                        <TouchableOpacity style={styles.saveBtn} onPress={handleCreate}><Text style={styles.saveBtnText}>Create Budget</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
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
    card: { backgroundColor: '#111827', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#1f2937' },
    cardAlert: { borderColor: '#7f1d1d' },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    cardTitle: { color: '#fff', fontWeight: '600', fontSize: 15, marginBottom: 3 },
    cardSub: { color: '#6b7280', fontSize: 12 },
    amounts: { color: '#9ca3af', fontSize: 13, fontWeight: '600', marginBottom: 4 },
    deleteText: { color: '#ef4444', fontSize: 12 },
    barBg: { height: 6, backgroundColor: '#1f2937', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
    barFill: { height: 6, borderRadius: 3 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
    alertText: { color: '#ef4444', fontSize: 11, fontWeight: '600' },
    empty: { color: '#4b5563', textAlign: 'center', marginTop: 60, fontSize: 14 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalCard: { backgroundColor: '#111827', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 16 },
    label: { fontSize: 13, color: '#9ca3af', marginBottom: 8, fontWeight: '500' },
    input: { backgroundColor: '#1f2937', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 15, marginBottom: 14, borderWidth: 1, borderColor: '#374151' },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1f2937', marginRight: 8, borderWidth: 1, borderColor: '#374151' },
    chipActive: { backgroundColor: '#7c3aed', borderColor: '#8b5cf6' },
    chipText: { color: '#9ca3af', fontSize: 13 },
    row: { flexDirection: 'row' },
    saveBtn: { backgroundColor: '#7c3aed', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    cancelBtn: { alignItems: 'center', paddingVertical: 14 },
    cancelBtnText: { color: '#6b7280', fontSize: 14 },
});
