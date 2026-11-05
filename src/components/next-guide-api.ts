export async function callApi(
  recordId: string,
  section: string,
  content: string
) {
  const res = await fetch(`/api/update-record/${recordId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ section, content }),
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export async function callApiOpenInFinder(recordId: string, file?: string) {
  const res = await fetch(`/api/open-in-finder/${recordId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file }),
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export async function callApiUpdateLinks(recordId: string, links: { label: string; url: string }[]) {
  const res = await fetch(`/api/update-record-links/${recordId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ links }),
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

/**
 * Save (or clear) what the Next card knows about one life event.
 * `patch: null` deletes the entry entirely.
 */
export async function callApiEventOverride(key: string, patch: Record<string, unknown> | null) {
  const res = await fetch('/api/event-override', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, patch }),
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

/** Create records/<id>/record.md for a document found online. */
export async function callApiCreateRecord(input: {
  personName: string;
  eventType: string;
  note?: string;
  place?: string;
  url: string;
}) {
  const res = await fetch('/api/create-record', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? `API error: ${res.status}`);
  }
  return data as { ok: boolean; id: string };
}

/** Save (or clear) a person-level skip (skipped_on). patch null clears. */
export async function callApiPersonSkip(personId: string, skippedOn: string | null) {
  const res = await fetch('/api/person-skip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ personId, skippedOn }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? `API error: ${res.status}`);
  }
  return data as { ok: boolean };
}

/** Reveal ~/Downloads/FAMILY TREE/_inbox in Finder. */
export async function callApiOpenInbox() {
  const res = await fetch('/api/open-inbox', { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error ?? `API error: ${res.status}`);
  }
  return data as { ok: boolean; path: string };
}
