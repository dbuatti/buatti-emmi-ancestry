/**
 * Per-person extras edited in the app (FamilySearch ID, other profiles, links, notes).
 * Stored in src/data/person-meta.json via POST /api/person-meta (local mode only)
 * and merged over familyData.ts — so the app never rewrites familyData.ts by hand.
 */
import type { Person } from '@/types';
import metaJson from '@/data/person-meta.json';

export interface PersonLink { label: string; url: string }
export interface AltProfile { id: string; note?: string }
export interface PersonNote { date: string; text: string }
export interface PersonMeta {
  familySearchId?: string;
  altFamilySearchIds?: AltProfile[];
  links?: PersonLink[];
  notes?: PersonNote[];
}

export const personMeta = metaJson as Record<string, PersonMeta>;

export function getMeta(personId: string): PersonMeta {
  return personMeta[personId] ?? {};
}

/** Person with app-edited extras applied (FamilySearch ID from meta wins). */
export function withMeta(person: Person): Person {
  const m = getMeta(person.id);
  return m.familySearchId ? { ...person, familySearchId: m.familySearchId } : person;
}

/** Accepts a FamilySearch person link or a bare ID; returns the ID or null. */
export function extractFamilySearchId(input: string): string | null {
  const s = input.trim();
  const fromUrl = s.match(/\/(?:tree\/)?person\/(?:details\/|about\/|sources\/|memories\/)?([A-Z0-9]{4}-[A-Z0-9]{2,4})\b/i);
  if (fromUrl) return fromUrl[1].toUpperCase();
  const bare = s.match(/^([A-Z0-9]{4}-[A-Z0-9]{2,4})$/i);
  return bare ? bare[1].toUpperCase() : null;
}

export async function savePersonMeta(personId: string, patch: Partial<PersonMeta>) {
  const res = await fetch('/api/person-meta', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ personId, patch }),
  });
  if (!res.ok) throw new Error(`Save failed (${res.status}) — is the app running locally?`);
  return res.json();
}
