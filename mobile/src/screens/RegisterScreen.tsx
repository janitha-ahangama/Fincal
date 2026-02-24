import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen() {
    const { register } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!name || !email || !password) { Alert.alert('Error', 'All fields are required'); return; }
        setLoading(true);
        try { await register(name, email, password); }
        catch (e: any) { Alert.alert('Registration Failed', e.message); }
        finally { setLoading(false); }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.inner}>
                <Text style={styles.logo}>FinCal</Text>
                <Text style={styles.subtitle}>Create your account</Text>
                <View style={styles.card}>
                    {[
                        { label: 'Full Name', value: name, set: setName, placeholder: 'John Doe', secure: false, keyboardType: 'default' as const },
                        { label: 'Email', value: email, set: setEmail, placeholder: 'you@example.com', secure: false, keyboardType: 'email-address' as const },
                        { label: 'Password', value: password, set: setPassword, placeholder: '••••••••', secure: true, keyboardType: 'default' as const },
                    ].map(({ label, value, set, placeholder, secure, keyboardType }, i) => (
                        <View key={label} style={i > 0 ? { marginTop: 16 } : {}}>
                            <Text style={styles.label}>{label}</Text>
                            <TextInput style={styles.input} value={value} onChangeText={set} placeholder={placeholder} placeholderTextColor="#4b5563" secureTextEntry={!!secure} keyboardType={keyboardType} autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'} />
                        </View>
                    ))}
                    <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading}>
                        <Text style={styles.buttonText}>{loading ? 'Creating account...' : 'Create Account'}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#030712' },
    inner: { justifyContent: 'center', padding: 24, paddingTop: 80 },
    logo: { fontSize: 36, fontWeight: '800', textAlign: 'center', color: '#8b5cf6', marginBottom: 8 },
    subtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 32 },
    card: { backgroundColor: '#111827', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#1f2937' },
    label: { fontSize: 13, color: '#9ca3af', marginBottom: 8, fontWeight: '500' },
    input: { backgroundColor: '#1f2937', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#374151' },
    button: { marginTop: 24, borderRadius: 12, paddingVertical: 15, backgroundColor: '#7c3aed', alignItems: 'center' },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
