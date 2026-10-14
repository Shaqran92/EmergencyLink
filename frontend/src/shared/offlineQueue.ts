/**
 * @file offlineQueue.ts
 * @description Local persistent queue for offline event synchronization (README §7.13 & §17)
 */

import { apiRequest } from './api';

export interface OfflineEvent {
  clientEventId: string;
  type: 'ambulance.status.update' | 'resource.update' | 'emergency.create';
  clientTimestamp: string;
  payload: Record<string, any>;
  baseVersion?: number | null;
}

const STORAGE_KEY = 'emergencylink_offline_events_queue';

export function getOfflineQueue(): OfflineEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function createClientEventId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
    (Number(c) ^ (Math.random() * 16 >> Number(c) / 4)).toString(16)
  );
}

export function enqueueOfflineEvent(event: Omit<OfflineEvent, 'clientEventId' | 'clientTimestamp'>): OfflineEvent {
  const item: OfflineEvent = {
    ...event,
    clientEventId: createClientEventId(),
    clientTimestamp: new Date().toISOString()
  };

  const queue = getOfflineQueue();
  queue.push(item);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn('Failed to store offline event in localStorage', err);
  }

  return item;
}

export function clearOfflineQueue(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export async function flushOfflineQueue(): Promise<{ processed: number; failed: number }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { processed: 0, failed: 0 };

  try {
    const response = await apiRequest<{ results: Array<{ clientEventId: string; status: string }> }>('/sync/events', {
      method: 'POST',
      body: JSON.stringify({ events: queue })
    });

    const completedIds = new Set(
      response.results
        .filter((result) => ['applied', 'duplicate'].includes(result.status))
        .map((result) => result.clientEventId)
    );
    const remaining = queue.filter((event) => !completedIds.has(event.clientEventId));
    if (remaining.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    } else {
      clearOfflineQueue();
    }

    return {
      processed: completedIds.size,
      failed: queue.length - completedIds.size
    };
  } catch (err) {
    console.error('Failed to flush offline queue to server:', err);
    return { processed: 0, failed: queue.length };
  }
}

// Attach automatic listener when back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    void flushOfflineQueue();
  });
}
