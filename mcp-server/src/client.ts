const API_URL = (process.env.TASKFLOW_API_URL ?? 'http://localhost:5000/api').replace(/\/$/, '');
const API_TOKEN = process.env.TASKFLOW_API_TOKEN;
const ORGANIZATION_ID = process.env.TASKFLOW_ORGANIZATION_ID;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export class TaskflowApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'TaskflowApiError';
  }
}

export async function taskflowRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; query?: Record<string, string | number | undefined> } = {}
): Promise<T> {
  if (!API_TOKEN) {
    throw new Error('TASKFLOW_API_TOKEN environment variable is not set');
  }

  let url = `${API_URL}${path}`;
  if (options.query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${API_TOKEN}`,
  };
  if (ORGANIZATION_ID) {
    headers['X-Organization-Id'] = ORGANIZATION_ID;
  }

  const res = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const json = (await res.json().catch(() => ({}))) as ApiResponse<T>;

  if (!res.ok || json.success === false) {
    throw new TaskflowApiError(json.message ?? `Request failed with status ${res.status}`, res.status);
  }

  return json.data as T;
}
