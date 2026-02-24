'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
    const { register } = useAuth();
    const router = useRouter();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(name, email, password);
            router.push('/dashboard');
        } catch (err: unknown) {
            const error = err as { message?: string };
            setError(error.message || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
            <div className="w-full max-w-md px-6">
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                        FinCal
                    </h1>
                    <p className="mt-2 text-gray-400">Create your account</p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl space-y-5"
                >
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {[
                        { label: 'Full Name', type: 'text', value: name, set: setName, placeholder: 'John Doe' },
                        { label: 'Email', type: 'email', value: email, set: setEmail, placeholder: 'you@example.com' },
                        { label: 'Password', type: 'password', value: password, set: setPassword, placeholder: '••••••••' },
                    ].map(({ label, type, value, set, placeholder }) => (
                        <div key={label}>
                            <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
                            <input
                                type={type}
                                required
                                value={value}
                                onChange={(e) => set(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                                placeholder={placeholder}
                            />
                        </div>
                    ))}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl font-semibold bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>

                    <p className="text-center text-sm text-gray-400">
                        Already have an account?{' '}
                        <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium">
                            Sign in
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
