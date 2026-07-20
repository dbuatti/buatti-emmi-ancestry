import type { Person } from '@/types';

/**
 * Walk ancestors from a root person and collect all direct-line IDs
 * (ancestors + their spouses). Excludes siblings (same generation, different person).
 * Used by PedigreeChart and TreeConnected to dynamically determine who to display.
 */
export function collectAncestorIds(people: Person[], rootId: string): Set<string> {
  const root = people.find(p => p.id === rootId);
  if (!root) return new Set();

  const ids = new Set<string>([root.id]);
  let currentGen = [root];

  for (let g = 0; g < 8; g++) {
    const nextGen: Person[] = [];
    for (const p of currentGen) {
      for (const pid of p.parents) {
        if (!ids.has(pid)) {
          const parent = people.find(x => x.id === pid);
          if (parent) {
            ids.add(pid);
            nextGen.push(parent);
          }
        }
      }
    }
    if (nextGen.length === 0) break;
    currentGen = nextGen;
  }

  // Include spouses of everyone collected
  for (const id of [...ids]) {
    const p = people.find(x => x.id === id);
    if (p) {
      for (const sid of p.spouses) {
        if (!ids.has(sid) && people.some(x => x.id === sid)) {
          ids.add(sid);
        }
      }
    }
  }

  // Exclude siblings: people at the same or higher generation as root who aren't the root
  for (const id of [...ids]) {
    const p = people.find(x => x.id === id);
    if (p && p.generation >= root.generation && p.id !== rootId) {
      ids.delete(id);
    }
  }

  return ids;
}

/** Check if a person has enough data to be considered "identified" */
export function isIdentified(p: Person): boolean {
  const birth = p.birthDate || '';
  const hasBirth = birth.length > 0 && !/^Unknown/i.test(birth) && !/to be confirmed/i.test(birth);
  const hasDeath = !!p.deathDate || !!p.isLiving;
  const hasFamily = p.parents.length > 0 || p.children.length > 0;
  return hasBirth && hasDeath && hasFamily;
}

/** Clean a date string for display: strip parentheticals, shorten "Unknown — likely ..." */
export function cleanDate(d: string | undefined): string {
  if (!d) return '';
  const cleaned = d.replace(/\s*\(.*?\)\s*/g, '').trim();
  return cleaned.replace(/^Unknown\s*[—–-]\s*(likely\s+)?/i, '~');
}

/** Parse a flexible date string into a year (returns null if unparseable). */
function parseYear(d: string | undefined): number | null {
  if (!d) return null;
  const cleaned = d.replace(/\s*\(.*?\)\s*/g, '').trim();
  // Match a 4-digit year, possibly preceded by ~ or c. or circa
  const m = cleaned.match(/(?:~|c\.?\s*|circa\s*)?(\d{4})/);
  return m ? parseInt(m[1], 10) : null;
}

/**
 * Calculate age at death or current age.
 * Returns { age, estimated } or null if insufficient data.
 */
export function calculateAge(
  birthDate: string | undefined,
  deathDate?: string | undefined,
  isLiving?: boolean,
): { age: number; estimated: boolean } | null {
  const birthYear = parseYear(birthDate);
  if (birthYear === null) return null;

  let refYear: number | null = null;
  let estimated = false;

  if (isLiving) {
    refYear = new Date().getFullYear();
    estimated = true;
  } else if (deathDate) {
    refYear = parseYear(deathDate);
    // If death date is only a year, age is estimated
    if (deathDate && !/^\d{1,2}\s+\w+\s+\d{4}/.test(deathDate.replace(/\s*\(.*?\)\s*/g, '').trim())) {
      estimated = true;
    }
  }

  if (refYear === null) return null;
  if (refYear < birthYear) return null;

  return { age: refYear - birthYear, estimated };
}
