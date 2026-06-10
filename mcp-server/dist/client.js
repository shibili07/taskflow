const API_URL = (process.env.TASKFLOW_API_URL ?? 'http://localhost:5000/api').replace(/\/$/, '');
const API_TOKEN = process.env.TASKFLOW_API_TOKEN;
const ORGANIZATION_ID = process.env.TASKFLOW_ORGANIZATION_ID;
export class TaskflowApiError extends Error {
    status;
    constructor(message, status) {
        super(message);
        this.status = status;
        this.name = 'TaskflowApiError';
    }
}
export async function taskflowRequest(path, options = {}) {
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
        if (qs)
            url += `?${qs}`;
    }
    const headers = {
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
    const json = (await res.json().catch(() => ({})));
    if (!res.ok || json.success === false) {
        throw new TaskflowApiError(json.message ?? `Request failed with status ${res.status}`, res.status);
    }
    return json.data;
}
//# sourceMappingURL=client.js.map