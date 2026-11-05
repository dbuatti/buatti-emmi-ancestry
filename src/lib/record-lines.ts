/**
 * Parse a record.md body into transcription lines.
 * Returns lines under the "## Transcription" section, each as {label, value, raw}.
 */
export interface TranscriptionLine {
  id: string;        // stable key: index in section
  label: string;     // e.g. "Cognome"
  value: string;     // e.g. "EMMI"
  raw: string;       // original full line text
  uncertain: boolean;// true if value contains [?]
}

/**
 * Split the body into sections by ## headers.
 */
function splitSections(body: string): { header: string; content: string }[] {
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
 */
export function parseTranscriptionLines(body: string): TranscriptionLine[] {
  const sections = splitSections(body);
  const transcriptionSection = sections.find((s) =>
    s.header.toLowerCase().includes('transcription')
  );
  if (!transcriptionSection) return [];

  const lines: TranscriptionLine[] = [];
  let idx = 0;
  for (const line of transcriptionSection.content) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Match bullet lines: "- Label: Value" or "- Label: "
    const m = trimmed.match(/^-\s*([^:]+?):\s*(.*)$/);
    if (m) {
      const label = m[1].trim();
      const value = m[2].trim();
      lines.push({
        id: `line-${idx++}`,
        label,
        value,
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
  const discSection = sections.find((s) =>
    s.header.toLowerCase().includes('discrepancy')
  );
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
