import type { RecordFrontMatter } from '@/types/record';

/**
 * Human title for a record: "Egidio Emmi — birth, 1870" instead of the
 * folder id "1870_Linguaglossa_birth_Emmi-Egidio_atto31".
 * `nameOf` turns a person id into a display name (falls back to the id).
 */
export function recordTitle(
  fm: Pick<RecordFrontMatter, 'type' | 'people' | 'year' | 'date'>,
  id: string,
  nameOf: (personId: string) => string,
): string {
  const people = (fm.people ?? []).map(nameOf).filter(Boolean);
  const kind = (fm.type || '').replace(/\s+(record|certificate)$/i, '').trim().toLowerCase();
  const year = fm.year || fm.date?.match(/\b(1[5-9]\d{2}|20\d{2})\b/)?.[1] || id.match(/^(\d{4})/)?.[1] || '';
  // No people linked yet: fall back to the name part of the id ("Emmi-Egidio" → "Egidio Emmi")
  let who = people.length > 2 ? `${people.slice(0, 2).join(', ')} +${people.length - 2}` : people.join(' & ');
  if (!who) {
    const part = id.split('_').find((seg) => /^[A-Z][a-zà-ù]+(-[A-Z][a-zà-ù]+)+$/.test(seg));
    if (part) who = part.split('-').reverse().join(' ');
  }
  const what = [kind, year].filter(Boolean).join(', ');
  if (who && what) return `${who} — ${what}`;
  return who || what || id;
}
