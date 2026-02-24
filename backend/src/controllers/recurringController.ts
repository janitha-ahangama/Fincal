import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { RecurringTemplate, Transaction } from '../types';

const TEMPLATES_COL = 'recurringTemplates';
const TRANSACTIONS_COL = 'transactions';

function advanceDate(dateStr: string, frequency: string): string {
    const date = new Date(dateStr);
    switch (frequency) {
        case 'daily':
            date.setDate(date.getDate() + 1);
            break;
        case 'weekly':
            date.setDate(date.getDate() + 7);
            break;
        case 'monthly':
            date.setMonth(date.getMonth() + 1);
            break;
        case 'yearly':
            date.setFullYear(date.getFullYear() + 1);
            break;
    }
    return date.toISOString().split('T')[0];
}

// Auto-generate overdue transactions for a template
async function processTemplate(templateId: string, template: RecurringTemplate): Promise<void> {
    if (!template.autoGenerate) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let nextDue = new Date(template.nextDueDate);
    nextDue.setHours(0, 0, 0, 0);

    const batch = db.batch();
    let advanced = false;

    while (nextDue <= today) {
        const transaction: Transaction = {
            userId: template.userId,
            type: template.type,
            amount: template.amount,
            category: template.category,
            date: nextDue.toISOString().split('T')[0],
            paymentMethod: template.paymentMethod || 'other',
            notes: template.notes || `Auto-generated from recurring: ${template.name}`,
            isRecurring: true,
            recurringId: templateId,
            createdAt: new Date().toISOString(),
        };

        const ref = db.collection(TRANSACTIONS_COL).doc();
        batch.set(ref, transaction);

        const newDateStr = advanceDate(nextDue.toISOString(), template.frequency);
        nextDue = new Date(newDateStr);
        nextDue.setHours(0, 0, 0, 0);
        advanced = true;
    }

    if (advanced) {
        await batch.commit();
        await db.collection(TEMPLATES_COL).doc(templateId).update({
            nextDueDate: nextDue.toISOString().split('T')[0],
        });
    }
}

export const createTemplate = async (req: Request, res: Response): Promise<void> => {
    const uid = req.user!.uid;
    const { name, amount, category, type, frequency, nextDueDate, autoGenerate, paymentMethod, notes } = req.body;

    if (!name || !amount || !category || !type || !frequency || !nextDueDate) {
        res.status(400).json({ message: 'Missing required fields' });
        return;
    }

    try {
        const template: RecurringTemplate = {
            userId: uid,
            name,
            amount: Number(amount),
            category,
            type,
            frequency,
            nextDueDate,
            autoGenerate: Boolean(autoGenerate ?? true),
            paymentMethod: paymentMethod || 'other',
            notes: notes || '',
        };

        const ref = await db.collection(TEMPLATES_COL).add(template);
        res.status(201).json({ id: ref.id, ...template });
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to create template', error: error.message });
    }
};

export const getTemplates = async (req: Request, res: Response): Promise<void> => {
    const uid = req.user!.uid;

    try {
        const snapshot = await db.collection(TEMPLATES_COL).where('userId', '==', uid).get();
        const templates = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as (RecurringTemplate & { id: string })[];

        // Auto-generate overdue transactions
        await Promise.all(templates.map((t) => processTemplate(t.id!, t)));

        // Re-fetch to get updated nextDueDates
        const updated = await db.collection(TEMPLATES_COL).where('userId', '==', uid).get();
        const result = updated.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        res.status(200).json({ templates: result });
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch templates', error: error.message });
    }
};

export const updateTemplate = async (req: Request, res: Response): Promise<void> => {
    const uid = req.user!.uid;
    const { id } = req.params;

    try {
        const doc = await db.collection(TEMPLATES_COL).doc(id).get();

        if (!doc.exists || (doc.data() as RecurringTemplate).userId !== uid) {
            res.status(404).json({ message: 'Template not found' });
            return;
        }

        const updates = { ...req.body, updatedAt: new Date().toISOString() };
        delete updates.userId;
        delete updates.id;

        await db.collection(TEMPLATES_COL).doc(id).update(updates);
        res.status(200).json({ message: 'Template updated', id });
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to update template', error: error.message });
    }
};

export const deleteTemplate = async (req: Request, res: Response): Promise<void> => {
    const uid = req.user!.uid;
    const { id } = req.params;

    try {
        const doc = await db.collection(TEMPLATES_COL).doc(id).get();

        if (!doc.exists || (doc.data() as RecurringTemplate).userId !== uid) {
            res.status(404).json({ message: 'Template not found' });
            return;
        }

        await db.collection(TEMPLATES_COL).doc(id).delete();
        res.status(200).json({ message: 'Template deleted', id });
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to delete template', error: error.message });
    }
};
