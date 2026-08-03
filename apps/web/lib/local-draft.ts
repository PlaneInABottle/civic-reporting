'use client';

import {
  localDraftEnvelopeSchema,
  type LocalDraftEnvelope,
} from '@civic-reporting/contracts';

const databaseName = 'civic-reporting-local';
const storeName = 'drafts';
const activeDraftKey = 'active-report';

export interface SubmissionAttempt {
  idempotencyKey: string;
  correlationId: string;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) {
        request.result.createObjectStore(storeName);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transactStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const request = operation(transaction.objectStore(storeName));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function readLocalDraft(): Promise<LocalDraftEnvelope | null> {
  const value = await transactStore('readonly', (store) =>
    store.get(activeDraftKey),
  );
  const parsed = localDraftEnvelopeSchema.safeParse(value);
  if (!parsed.success) {
    return null;
  }
  if (Date.parse(parsed.data.expiresAt) <= Date.now()) {
    await clearLocalDraft();
    return null;
  }
  return parsed.data;
}

export async function writeLocalDraft(envelope: LocalDraftEnvelope) {
  const parsed = localDraftEnvelopeSchema.parse(envelope);
  await transactStore('readwrite', (store) =>
    store.put(parsed, activeDraftKey),
  );
}

export async function clearLocalDraft() {
  await transactStore('readwrite', (store) => store.delete(activeDraftKey));
}

export async function getOrCreateSubmissionAttempt(
  draftId: string,
): Promise<SubmissionAttempt> {
  const key = `submission:${draftId}`;
  const existing = await transactStore<SubmissionAttempt | undefined>(
    'readonly',
    (store) => store.get(key),
  );
  if (existing?.idempotencyKey && existing.correlationId) return existing;
  const created = {
    idempotencyKey: crypto.randomUUID(),
    correlationId: crypto.randomUUID(),
  };
  await transactStore('readwrite', (store) => store.put(created, key));
  return created;
}
