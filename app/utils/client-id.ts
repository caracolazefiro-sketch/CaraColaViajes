'use client';

export function getOrCreateClientId(storageKey = 'caracola_client_id_v1'): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const existing = window.localStorage.getItem(storageKey);
    if (existing && existing.trim()) return existing;
    const id = `c_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(storageKey, id);
    return id;
  } catch {
    return undefined;
  }
}
