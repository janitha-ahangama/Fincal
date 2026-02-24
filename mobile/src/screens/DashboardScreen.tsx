import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { VictoryLine, VictoryChart, VictoryAxis, VictoryTheme, VictoryBar, VictoryPie } from 'victory-native';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

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
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <View style={[styles.statCard, { borderLeftColor: color }]}>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={styles.statValue}>{value}</Text>
        </View>
    );
}

const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

export default function DashboardScreen() {
    const { logout } = useAuth();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/dashboard').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
    }, []);

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#8b5cf6" /></View>;

    const pieData = data
        ? Object.entries(data.categoryBreakdown).map(([x, y]) => ({ x, y })).slice(0, 6)
        : [];

    const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
            <Text style={styles.heading}>Dashboard</Text>
            <Text style={styles.sub}>This month&apos;s overview</Text>

            <View style={styles.statsGrid}>
                <StatCard label="Income" value={fmt(data?.totalIncome || 0)} color="#10b981" />
                <StatCard label="Expenses" value={fmt(data?.totalExpenses || 0)} color="#ef4444" />
                <StatCard label="Savings" value={fmt(data?.netSavings || 0)} color="#8b5cf6" />
                <StatCard label="Rate" value={`${data?.savingsRate || 0}%`} color="#06b6d4" />
            </View>

            <View style={styles.overallContainer}>
                <Text style={styles.overallTitle}>LIFETIME OVERVIEW</Text>
                <View style={styles.overallGrid}>
                    <View style={styles.overallItem}>
                        <Text style={styles.overallLabel}>Income</Text>
                        <Text style={[styles.overallValue, { color: '#10b981' }]}>{fmt(data?.overallIncome || 0)}</Text>
                    </View>
                    <View style={styles.overallItem}>
                        <Text style={styles.overallLabel}>Expenses</Text>
                        <Text style={[styles.overallValue, { color: '#ef4444' }]}>{fmt(data?.overallExpenses || 0)}</Text>
                    </View>
                    <View style={styles.overallItem}>
                        <Text style={styles.overallLabel}>Savings</Text>
                        <Text style={[styles.overallValue, { color: '#8b5cf6' }]}>{fmt(data?.overallSavings || 0)}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.chart}>
                <Text style={styles.chartTitle}>Monthly Trend</Text>
                {data && data.monthlyTrend.length > 0 ? (
                    <VictoryChart theme={VictoryTheme.material} width={width - 48} height={200}>
                        <VictoryAxis style={{ tickLabels: { fill: '#6b7280', fontSize: 10 } }} tickFormat={(t: any) => t.slice(5)} />
                        <VictoryAxis dependentAxis style={{ tickLabels: { fill: '#6b7280', fontSize: 10 } }} />
                        <VictoryLine data={data.monthlyTrend} x="month" y="income" style={{ data: { stroke: '#10b981', strokeWidth: 2 } }} />
                        <VictoryLine data={data.monthlyTrend} x="month" y="expenses" style={{ data: { stroke: '#ef4444', strokeWidth: 2 } }} />
                    </VictoryChart>
                ) : <Text style={styles.empty}>No trend data</Text>}
            </View>

            {pieData.length > 0 && (
                <View style={styles.chart}>
                    <Text style={styles.chartTitle}>Spending by Category</Text>
                    <VictoryPie
                        data={pieData}
                        width={width - 48}
                        height={220}
                        colorScale={COLORS}
                        style={{ labels: { fill: '#9ca3af', fontSize: 10 } }}
                        innerRadius={50}
                    />
                </View>
            )}

            <View style={styles.chart}>
                <View style={styles.row}>
                    <Text style={styles.chartTitle}>Recent Transactions</Text>
                </View>
                {(data as any)?.recentTransactions && (data as any).recentTransactions.length > 0 ? (
                    (data as any).recentTransactions.map((t: any, i: number) => (
                        <View key={i} style={styles.txRow}>
                            <View>
                                <Text style={styles.txCategory}>{t.category}</Text>
                                <Text style={styles.txDate}>{t.date}</Text>
                            </View>
                            <Text style={[styles.txAmount, { color: t.type === 'income' ? '#10b981' : '#ef4444' }]}>
                                {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                            </Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.empty}>No recent transactions</Text>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#030712', paddingHorizontal: 16, paddingTop: 56 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#030712' },
    heading: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 4 },
    sub: { fontSize: 13, color: '#6b7280', marginBottom: 20 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
    statCard: { flex: 1, minWidth: '45%', backgroundColor: '#111827', borderRadius: 14, padding: 16, borderLeftWidth: 3 },
    statLabel: { fontSize: 12, color: '#6b7280', marginBottom: 6 },
    statValue: { fontSize: 20, fontWeight: '700', color: '#fff' },
    overallContainer: { backgroundColor: '#111827', borderRadius: 16, padding: 16, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: '#4b5563' },
    overallTitle: { fontSize: 10, fontWeight: '800', color: '#6b7280', marginBottom: 12, letterSpacing: 1 },
    overallGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    overallItem: { flex: 1 },
    overallLabel: { fontSize: 11, color: '#6b7280', marginBottom: 4 },
    overallValue: { fontSize: 16, fontWeight: '700' },
    chart: { backgroundColor: '#111827', borderRadius: 16, padding: 16, marginBottom: 16 },
    chartTitle: { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 8 },
    empty: { color: '#6b7280', fontSize: 13, textAlign: 'center', paddingVertical: 20 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
    txCategory: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 2 },
    txDate: { color: '#6b7280', fontSize: 11 },
    txAmount: { fontSize: 15, fontWeight: '700' },
});
