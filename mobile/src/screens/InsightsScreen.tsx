import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../lib/axios';

interface InsightsData {
    currentMonth: { month: number; year: number; expenses: number; income: number };
    previousMonth: { month: number; year: number; expenses: number; income: number };
    spendingChangePercent: number | null;
    incomeChangePercent: number | null;
    spendingTrend: 'increased' | 'decreased' | 'unchanged' | 'no_data';
    highestSpendingCategory: { category: string; amount: number } | null;
    categoryBreakdown: { current: Record<string, number>; previous: Record<string, number> };
}

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function InsightsScreen() {
    const [data, setData] = useState<InsightsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { api.get('/api/insights').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false)); }, []);

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#8b5cf6" /></View>;

    if (!data) {
        return (
            <View style={styles.center}>
                <Text style={{ color: '#6b7280', marginBottom: 12 }}>Unable to load insights data.</Text>
                <Text style={{ color: '#4b5563', fontSize: 12, textAlign: 'center', paddingHorizontal: 40 }}>
                    Please check your internet connection and ensure the backend is running at {process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000'}
                </Text>
            </View>
        );
    }

    const trend = data.spendingTrend;
    const trendColor = trend === 'increased' ? '#ef4444' : trend === 'decreased' ? '#10b981' : '#6b7280';
    const trendIcon = trend === 'increased' ? '📈' : trend === 'decreased' ? '📉' : '➡️';

    const allCats = [...new Set([...Object.keys(data.categoryBreakdown?.current || {}), ...Object.keys(data.categoryBreakdown?.previous || {})])];

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={styles.heading}>Insights</Text>
            <Text style={styles.sub}>Month-over-month analysis</Text>

            <View style={styles.cards}>
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>Spending Change</Text>
                    <Text style={styles.cardIcon}>{trendIcon}</Text>
                    <Text style={[styles.cardValue, { color: trendColor }]}>
                        {data?.spendingChangePercent !== null ? `${Math.abs(data!.spendingChangePercent ?? 0)}%` : 'N/A'}
                    </Text>
                    <Text style={[styles.cardSub, { color: trendColor }]}>{trend?.replace('_', ' ') || ''}</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardLabel}>Income Change</Text>
                    <Text style={styles.cardIcon}>{(data?.incomeChangePercent ?? 0) >= 0 ? '📈' : '📉'}</Text>
                    <Text style={[styles.cardValue, { color: (data?.incomeChangePercent ?? 0) >= 0 ? '#10b981' : '#ef4444' }]}>
                        {data?.incomeChangePercent !== null ? `${Math.abs(data!.incomeChangePercent ?? 0)}%` : 'N/A'}
                    </Text>
                    <Text style={styles.cardSub}>{data?.incomeChangePercent !== null ? ((data!.incomeChangePercent ?? 0) >= 0 ? 'Increased' : 'Decreased') : 'No prior data'}</Text>
                </View>
            </View>

            {data?.highestSpendingCategory && (
                <View style={styles.highlight}>
                    <Text style={styles.highlightLabel}>⚠️ Highest Spending Category</Text>
                    <Text style={styles.highlightCat}>{data.highestSpendingCategory.category}</Text>
                    <Text style={styles.highlightAmount}>{fmt(data.highestSpendingCategory.amount)}</Text>
                </View>
            )}

            <View style={styles.table}>
                <Text style={styles.tableTitle}>Category Comparison</Text>
                <View style={styles.tableHeader}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>Category</Text>
                    <Text style={[styles.tableCell, styles.tableCellRight]}>{data ? MONTHS[data.previousMonth.month - 1] : 'Prev'}</Text>
                    <Text style={[styles.tableCell, styles.tableCellRight]}>{data ? MONTHS[data.currentMonth.month - 1] : 'Curr'}</Text>
                </View>
                {allCats.length === 0 && <Text style={styles.empty}>No data to compare</Text>}
                {allCats.map(cat => {
                    const curr = data?.categoryBreakdown.current[cat] || 0;
                    const prev = data?.categoryBreakdown.previous[cat] || 0;
                    return (
                        <View key={cat} style={styles.tableRow}>
                            <Text style={[styles.tableCell, { flex: 2, color: '#d1d5db' }]}>{cat}</Text>
                            <Text style={[styles.tableCell, styles.tableCellRight, { color: '#6b7280' }]}>{fmt(prev)}</Text>
                            <Text style={[styles.tableCell, styles.tableCellRight, { color: curr > prev ? '#ef4444' : curr < prev ? '#10b981' : '#6b7280', fontWeight: '600' }]}>{fmt(curr)}</Text>
                        </View>
                    );
                })}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#030712', paddingHorizontal: 16, paddingTop: 56 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#030712' },
    heading: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 4 },
    sub: { fontSize: 13, color: '#6b7280', marginBottom: 20 },
    cards: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    card: { flex: 1, backgroundColor: '#111827', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1f2937' },
    cardLabel: { fontSize: 12, color: '#6b7280', marginBottom: 8, textAlign: 'center' },
    cardIcon: { fontSize: 24, marginBottom: 8 },
    cardValue: { fontSize: 22, fontWeight: '800' },
    cardSub: { fontSize: 11, color: '#6b7280', marginTop: 4, textTransform: 'capitalize' },
    highlight: { backgroundColor: '#1c1917', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#78350f' },
    highlightLabel: { fontSize: 12, color: '#92400e', fontWeight: '600', marginBottom: 8 },
    highlightCat: { fontSize: 20, fontWeight: '800', color: '#fbbf24', marginBottom: 4 },
    highlightAmount: { fontSize: 16, color: '#d97706', fontWeight: '600' },
    table: { backgroundColor: '#111827', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#1f2937' },
    tableTitle: { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 12 },
    tableHeader: { flexDirection: 'row', marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
    tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#111827' },
    tableCell: { flex: 1, fontSize: 13, color: '#6b7280' },
    tableCellRight: { textAlign: 'right' },
    empty: { color: '#4b5563', textAlign: 'center', paddingVertical: 20, fontSize: 13 },
});
