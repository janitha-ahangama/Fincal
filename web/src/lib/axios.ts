import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    headers: { 'Content-Type': 'application/json' },
});

// Attach Firebase ID token to every request
api.interceptors.request.use(async (config) => {
    // Try to get token from current user
    const user = auth.currentUser;

    // If no user, wait a bit or try to get it from firebase's internal management
    // However, in a Next.js client component environment with RootLayout waiting for auth,
    // auth.currentUser should be available by the time components mount.
    if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        console.warn('Axios Interceptor: No user found for request to', config.url);
    }
    return config;
});

export default api;
