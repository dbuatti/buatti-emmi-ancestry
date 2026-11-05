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
