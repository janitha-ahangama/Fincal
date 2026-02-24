import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) { Alert.alert('Error', 'Please enter email and password'); return; }
        setLoading(true);
        try { await login(email, password); }
        catch (e: any) { Alert.alert('Login Failed', e.message); }
        finally { setLoading(false); }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.inner}>
                <Text style={styles.logo}>FinCal</Text>
                <Text style={styles.subtitle}>Track your finances with clarity</Text>

                <View style={styles.card}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor="#4b5563" keyboardType="email-address" autoCapitalize="none" />

                    <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
                    <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor="#4b5563" secureTextEntry={true} />

                    <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
                        <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#030712' },
    inner: { flex: 1, justifyContent: 'center', padding: 24 },
    logo: { fontSize: 36, fontWeight: '800', textAlign: 'center', color: '#8b5cf6', marginBottom: 8 },
    subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 32 },
    card: { backgroundColor: '#111827', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#1f2937' },
    label: { fontSize: 13, color: '#9ca3af', marginBottom: 8, fontWeight: '500' },
    input: { backgroundColor: '#1f2937', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#374151' },
    button: { marginTop: 20, borderRadius: 12, paddingVertical: 15, backgroundColor: '#7c3aed', alignItems: 'center' },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
