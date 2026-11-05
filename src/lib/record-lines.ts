/**
 * Parse a record.md body into transcription lines with per-line English translations.
 * Format:
 *   - Italian label: value
 *     en: English label: value
 *   - Next Italian line...
 *
 * Returns lines under the "## Transcription" section.
 */
export interface TranscriptionLine {
  id: string;        // stable key: index in section
  label: string;     // Italian label (e.g. "Cognome")
  value: string;     // Italian value (e.g. "EMMI")
  enLabel?: string;  // English label (e.g. "Surname")
  enValue?: string;  // English value (e.g. "Emmi")
  raw: string;       // original full Italian line text
  uncertain: boolean;// true if value contains [?]
}

/**
 * Split the body into sections by ## headers.
 */
function splitSections(body: string): { header: string; content: string[] }[] {
  const lines = body.split('\n');
  const sections: { header: string; content: string[] }[] = [];
  let current: { header: string; content: string[] } | null = null;

  for (const line of lines) {
    const m = line.match(/^##\s+(.+)$/);
    if (m) {
      if (current) sections.push(current);
      current = { header: m[1].trim(), content: [] };
    } else if (current) {
      current.content.push(line);
    }
  }
  if (current) sections.push(current);
  return sections;
}

/**
 * Extract transcription lines from the body.
 * Looks for the section whose header starts with "Transcription".
 * Each "- Label: Value" line may be followed by an indented "en: Label: Value" line.
 */
export function parseTranscriptionLines(body: string): TranscriptionLine[] {
  const sections = splitSections(body);
  const transcriptionSection = sections.find((s) =>
    s.header.toLowerCase().includes('transcription')
  );
  if (!transcriptionSection) return [];

  const lines: TranscriptionLine[] = [];
  let idx = 0;
  const content = transcriptionSection.content;

  for (let i = 0; i < content.length; i++) {
    const line = content[i];
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Match Italian bullet lines: "- Label: Value"
    const m = trimmed.match(/^-\s*([^:]+?):\s*(.*)$/);
    if (m) {
      const label = m[1].trim();
      const value = m[2].trim();

      // Check next line for English translation: indented "en: Label: Value"
      let enLabel: string | undefined;
      let enValue: string | undefined;
      if (i + 1 < content.length) {
        const nextLine = content[i + 1];
        const enMatch = nextLine.match(/^\s+en:\s*([^:]+?):\s*(.*)$/);
        if (enMatch) {
          enLabel = enMatch[1].trim();
          enValue = enMatch[2].trim();
          i++; // consume the en line
        }
      }

      lines.push({
        id: `line-${idx++}`,
        label,
        value,
        enLabel,
        enValue,
        raw: trimmed,
        uncertain: value.includes('[?]'),
      });
    }
  }
  return lines;
}

/**
 * Extract discrepancies from the body.
 */
export function parseDiscrepancies(body: string): string[] {
  const sections = splitSections(body);
  // Match both "Discrepancy" and "Discrepancies" — note that the singular
  // "discrepancy" is NOT a substring of the plural "discrepancies"
  // (discrepanc-ies vs discrepanc-y), so match on the shared stem.
  const discSection = sections.find((s) => /^discrepanc/i.test(s.header.trim()));
  if (!discSection) return [];

  const items: string[] = [];
  for (const line of discSection.content) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ')) {
      items.push(trimmed.slice(2));
    }
  }
  return items;
}
