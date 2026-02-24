import { Request, Response } from 'express';
import { auth, db } from '../config/firebase';

// Register: create Firebase user + store profile in Firestore
export const register = async (req: Request, res: Response): Promise<void> => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        res.status(400).json({ message: 'Name, email, and password are required' });
        return;
    }

    try {
        const userRecord = await auth.createUser({ email, password, displayName: name });

        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            name,
            email,
            createdAt: new Date().toISOString(),
        });

        res.status(201).json({
            message: 'User registered successfully',
            uid: userRecord.uid,
        });
    } catch (error: any) {
        if (error.code === 'auth/email-already-exists') {
            res.status(409).json({ message: 'Email already in use' });
        } else {
            res.status(500).json({ message: 'Registration failed', error: error.message });
        }
    }
};

// Login: client handles Firebase login and sends ID token; backend verifies and returns user profile
export const login = async (req: Request, res: Response): Promise<void> => {
    const uid = req.user?.uid;

    if (!uid) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            res.status(404).json({ message: 'User profile not found' });
            return;
        }

        res.status(200).json({ user: userDoc.data() });
    } catch (error: any) {
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
};

// Logout: stateless – client discards token; backend can revoke refresh tokens
export const logout = async (req: Request, res: Response): Promise<void> => {
    const uid = req.user?.uid;

    if (!uid) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    try {
        await auth.revokeRefreshTokens(uid);
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error: any) {
        res.status(500).json({ message: 'Logout failed', error: error.message });
    }
};

// Get current user profile
export const getProfile = async (req: Request, res: Response): Promise<void> => {
    const uid = req.user?.uid;

    try {
        const userDoc = await db.collection('users').doc(uid!).get();
        if (!userDoc.exists) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.status(200).json({ user: userDoc.data() });
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
    }
};
