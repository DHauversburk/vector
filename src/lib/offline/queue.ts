import { getDB } from './db';
import { encryptPayload, decryptPayload } from '../crypto';


export interface OfflineRequest {
    id?: number;
    type: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    body: any;
    timestamp: number;
    retryCount: number;
    lastAttempt?: number;
    status: 'pending' | 'failed' | 'syncing';
    error?: string;
    operationName: string;
}

export class OfflineQueue {
    static async enqueue(request: Omit<OfflineRequest, 'id' | 'timestamp' | 'retryCount' | 'status' | 'lastAttempt' | 'error'>): Promise<number> {
        const db = await getDB();
        
        // Encrypt the sensitive payload body before writing to disk
        const encryptedBody = await encryptPayload(request.body);

        const entry: OfflineRequest = {
            ...request,
            body: encryptedBody,
            timestamp: Date.now(),
            retryCount: 0,
            status: 'pending'
        };
        const id = await db.add('mutation_queue', entry);
        return id as number;
    }


    static async peek(): Promise<OfflineRequest | undefined> {
        const db = await getDB();
        const cursor = await db.transaction('mutation_queue').store.openCursor(null, 'next');
        if (cursor?.value) {
            cursor.value.body = await decryptPayload(cursor.value.body);
            return cursor.value;
        }
        return undefined;
    }

    static async getAll(): Promise<OfflineRequest[]> {
        const db = await getDB();
        const items = await db.getAllFromIndex('mutation_queue', 'by-timestamp');
        
        // Decrypt all payloads in memory
        for (const item of items) {
            item.body = await decryptPayload(item.body);
        }
        return items;
    }


    static async remove(id: number): Promise<void> {
        const db = await getDB();
        await db.delete('mutation_queue', id);
    }

    static async clear(): Promise<void> {
        const db = await getDB();
        await db.clear('mutation_queue');
    }

    static async getCount(): Promise<number> {
        const db = await getDB();
        return db.count('mutation_queue');
    }

    static async update(id: number, updates: Partial<OfflineRequest>): Promise<void> {
        const db = await getDB();
        const existing = await db.get('mutation_queue', id);
        if (existing) {
            await db.put('mutation_queue', { ...existing, ...updates });
        }
    }

    static async getById(id: number): Promise<OfflineRequest | undefined> {
        const db = await getDB();
        const entry = await db.get('mutation_queue', id);
        if (entry) {
            entry.body = await decryptPayload(entry.body);
            return entry;
        }
        return undefined;
    }
}
