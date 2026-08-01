/** Client-side fetch helper for the { data, error } shape every app/api route returns. */
export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error ?? `Request to ${url} failed`);
  }
  return json.data as T;
}
