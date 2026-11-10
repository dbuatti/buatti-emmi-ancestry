/**
 * Person-name suggestion matching for transcriptions.
 *
 * Old rule ("every name part appears anywhere") cross-contaminated:
 * "Emidio Pica" + "Ezio Buatti" in one document suggested "Emidio Buatti".
 * New rule: a surname+given pair must appear ADJACENT (either order), or the
 * full name as a phrase. Precision over recall — a missed suggestion costs
 * one dropdown use; a wrong one erodes trust in every suggestion.
 */

function norm(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-zà-ÿ\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function nameParts(personName: string): { given: string[]; surnames: string[] } {
  const clean = norm(personName.replace(/\([^)]*\)/g, ' '));
  const tokens = clean.split(' ').filter((t) => t.length > 0);
  if (tokens.length === 0) return { given: [], surnames: [] };
  // Act order is often Surname Givenname; person records store Givenname Surname.
  // Surname = last token (suffixes stripped); everything else is given names.
  const core = tokens.filter((t) => !/^(sr|jr|ii|iii|iv|senior|junior)$/.test(t));
  if (core.length === 0) return { given: [], surnames: [] };
  const surnames = [core[core.length - 1]];
  const given = core.slice(0, -1).filter((t) => t.length > 2);
  return { given, surnames };
}

/**
 * Should this person be suggested from this transcription text?
 * True when the full name appears as a phrase, or any surname+given
 * pair is adjacent (either order: "Remo Chiappini" or "Chiappini, Remo").
 */
export function suggestPerson(personName: string, transcriptionText: string): boolean {
  const { given, surnames } = nameParts(personName);
  if (surnames.length === 0 || given.length === 0) return false;
  const text = ` ${norm(transcriptionText)} `;
  const full = `${given.join(' ')} ${surnames[0]}`;
  if (text.includes(` ${full} `)) return true;
  const reversed = `${surnames[0]} ${given.join(' ')}`;
  if (text.includes(` ${reversed} `)) return true;
  for (const g of given) {
    if (g.length <= 2) continue;
    const a = `${surnames[0]} ${g}`;
    const b = `${g} ${surnames[0]}`;
    if (text.includes(` ${a} `) || text.includes(` ${b} `)) return true;
  }
  return false;
}
