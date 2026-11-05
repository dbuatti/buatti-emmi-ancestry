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
