import type { RecordData, RecordFrontMatter, WorkflowStep } from '@/types/record';

/**
 * Parse YAML front matter from a raw markdown string.
 * Returns the front matter object and the body text.
 */
export function parseRecordMarkdown(raw: string): RecordData {
  const frontMatterMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!frontMatterMatch) {
    return {
      frontMatter: defaultFrontMatter(),
      body: raw,
    };
  }

  const [, fmYaml, body] = frontMatterMatch;
  const frontMatter = parseYaml(fmYaml) as RecordFrontMatter;

  return {
    frontMatter: {
      ...defaultFrontMatter(),
      ...frontMatter,
      people: Array.isArray(frontMatter.people) ? frontMatter.people : [],
      filed: frontMatter.filed ?? false,
      transcribed: frontMatter.transcribed ?? false,
      verified: frontMatter.verified ?? false,
      in_app: frontMatter.in_app ?? false,
      on_familysearch: frontMatter.on_familysearch ?? false,
    },
    body: body.trim(),
  };
}

function defaultFrontMatter(): RecordFrontMatter {
  return {
    id: '',
    type: '',
    date: '',
    place: '',
    comune: '',
    register: '',
    year: '',
    atto: '',
    people: [],
    source_office: '',
    protocol: '',
    transcribed_by: '',
    filed: false,
    transcribed: false,
    verified: false,
    in_app: false,
    on_familysearch: false,
  };
}

/**
 * Simple YAML parser for the flat key: value format used in record.md front matter.
 */
function parseYaml(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const line of yaml.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;
    const key = trimmed.slice(0, colonIdx).trim();
    let value = trimmed.slice(colonIdx + 1).trim();
    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    // Parse booleans
    if (value === 'true') {
      result[key] = true;
    } else if (value === 'false') {
      result[key] = false;
    } else if (value.startsWith('[') && value.endsWith(']')) {
      // Parse array like [person1, person2]
      const inner = value.slice(1, -1).trim();
      if (inner) {
        result[key] = inner.split(',').map(s => s.trim());
      } else {
        result[key] = [];
      }
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Get the current workflow step (1-5) based on front matter booleans.
 * Returns the highest step that is true, or 1 if only filed is true.
 */
export function getWorkflowStep(fm: RecordFrontMatter): WorkflowStep {
  if (fm.on_familysearch) return 'on_familysearch';
  if (fm.in_app) return 'in_app';
  if (fm.verified) return 'verified';
  if (fm.transcribed) return 'transcribed';
  return 'filed';
}

/**
 * Get the step number (1-5) for display.
 */
export function getWorkflowStepNumber(fm: RecordFrontMatter): number {
  const step = getWorkflowStep(fm);
  const steps: WorkflowStep[] = ['filed', 'transcribed', 'verified', 'in_app', 'on_familysearch'];
  return steps.indexOf(step) + 1;
}

/**
 * Resolve the local image path for a record.
 * In dev mode, images live in records-local/<id>/.
 * In production, no images are served.
 */
export function resolveLocalImagePath(recordId: string): string | null {
  if (import.meta.env.DEV) {
    return `/records-local/${recordId}/`;
  }
  return null;
}
