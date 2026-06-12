const API_BASE: string = ((import.meta.env.VITE_API_URL as string) || '').replace(/\/$/, '');

async function parseResponse(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  if (!text) return null;
  if (contentType.includes('application/json')) {
    try { return JSON.parse(text); } catch { return { message: text }; }
  }
  // Non-JSON body (e.g. Render HTML error page) — wrap in message
  try { return JSON.parse(text); } catch { return { message: text.slice(0, 200) }; }
}

export const api = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const token: string | null = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response: Response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error((data && data.message) || `Request failed (${response.status})`);
  }

  return data;
};
