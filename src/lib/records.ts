import type { RecordData, RecordFrontMatter, RecordLink, WorkflowStep } from '@/types/record';

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
  const frontMatter = parseYaml(fmYaml) as unknown as RecordFrontMatter;

  // Parse links (list of {label, url}) manually from YAML text
  const links: RecordLink[] = [];
  const lines = fmYaml.split('\n');
  let inLinks = false;
  let currentLink: Partial<RecordLink> | null = null;
  for (const line of lines) {
    if (line.startsWith('links:')) {
      inLinks = true;
      continue;
    }
    if (!inLinks) continue;
    // Stop if we hit a non-indented key
    if (line.trim() && !line.startsWith(' ')) {
      inLinks = false;
      if (currentLink) links.push(currentLink as RecordLink);
      currentLink = null;
      continue;
    }
    const trimmed = line.trim();
    if (trimmed.startsWith('- ')) {
      if (currentLink) links.push(currentLink as RecordLink);
      currentLink = {};
      const pair = readYamlPair(trimmed.slice(2));
      if (pair) assignLinkField(currentLink, pair[0], pair[1]);
    } else if (currentLink) {
      const pair = readYamlPair(trimmed);
      if (pair) assignLinkField(currentLink, pair[0], pair[1]);
    }
  }
  if (currentLink) links.push(currentLink as RecordLink);

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
      image_link: frontMatter.image_link ? String(frontMatter.image_link) : '',
      links: links.length > 0 ? links : (frontMatter.links as RecordLink[]),
    },
    body: body.trim(),
  };
}

/**
 * Split a "key: value" YAML line, unquoting the value.
 */
function readYamlPair(text: string): [string, string] | null {
  const colonIdx = text.indexOf(':');
  if (colonIdx === -1) return null;
  const key = text.slice(0, colonIdx).trim();
  const rawValue = text.slice(colonIdx + 1).trim();
  return [key, unquoteYaml(rawValue)];
}

/**
 * Remove surrounding quotes from a scalar value.
 */
function unquoteYaml(value: string): string {
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    try {
      return JSON.parse(value);
    } catch {
      return value.slice(1, -1);
    }
  }
  if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'");
  }
  return value;
}

function assignLinkField(link: Partial<RecordLink>, key: string, value: string) {
  if (key === 'label') link.label = value;
  else if (key === 'url') link.url = value;
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
    translated_by: '',
    filed: false,
    transcribed: false,
    verified: false,
    in_app: false,
    on_familysearch: false,
    image_link: '',
    links: [],
  };
}

/**
 * Simple YAML parser for the flat key: value format used in record.md front matter.
 */
function parseYaml(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  let lastKey = '';
  for (const line of yaml.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    // Block list item ("- value") belonging to the previous key
    if (trimmed.startsWith('- ') && lastKey) {
      const prev = result[lastKey];
      const list = Array.isArray(prev) ? prev : [];
      list.push(trimmed.slice(2).trim());
      result[lastKey] = list;
      continue;
    }
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;
    const key = trimmed.slice(0, colonIdx).trim();
    lastKey = key;
    let value = trimmed.slice(colonIdx + 1).trim();
    // YAML null (unquoted `null` or `~`) means "no value" — never show the word "null"
    if (value === 'null' || value === '~') value = '';
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
  if (!fm.filed) return 0; // nothing done yet: the next step is filing
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
