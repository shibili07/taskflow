import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  personalAccessTokensApi,
  type PersonalAccessTokenSummary,
  type CreatedPersonalAccessToken,
} from '../lib/api';
import { formatDateDDMMYYYY } from '../lib/dateFormat';

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  return formatDateDDMMYYYY(iso);
}

export default function ApiTokens() {
  const { token } = useAuth();
  const [tokens, setTokens] = useState<PersonalAccessTokenSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdToken, setCreatedToken] = useState<CreatedPersonalAccessToken | null>(null);
  const [copied, setCopied] = useState(false);

  function loadTokens() {
    if (!token) return;
    setLoading(true);
    personalAccessTokensApi.list(token).then((res) => {
      setLoading(false);
      if (res.success && res.data) {
        setTokens(res.data);
      } else {
        setError((res as { message?: string }).message ?? 'Failed to load tokens');
      }
    });
  }

  useEffect(() => {
    loadTokens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !name.trim()) return;
    setCreating(true);
    setError('');
    setCopied(false);
    const days = expiresInDays.trim() ? Number(expiresInDays) : undefined;
    const res = await personalAccessTokensApi.create(
      { name: name.trim(), ...(days ? { expiresInDays: days } : {}) },
      token
    );
    setCreating(false);
    if (!res.success || !res.data) {
      setError((res as { message?: string }).message ?? 'Failed to create token');
      return;
    }
    setCreatedToken(res.data);
    setName('');
    setExpiresInDays('');
    loadTokens();
  }

  async function handleRevoke(id: string) {
    if (!token) return;
    if (!confirm('Revoke this token? Anything using it (e.g. an MCP connection) will stop working immediately.')) return;
    const res = await personalAccessTokensApi.revoke(id, token);
    if (!res.success) {
      setError((res as { message?: string }).message ?? 'Failed to revoke token');
      return;
    }
    setTokens((prev) => prev.filter((t) => t._id !== id));
  }

  async function handleCopy() {
    if (!createdToken) return;
    await navigator.clipboard.writeText(createdToken.token);
    setCopied(true);
  }

  return (
    <div className="w-full max-w-[96rem] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-[color:var(--text-primary)]">API tokens</h1>
        <Link to="/profile" className="text-sm text-[color:var(--accent)] hover:underline">
          Back to profile
        </Link>
      </div>

      <div className="rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--bg-surface)] p-6">
        <p className="text-sm text-[color:var(--text-muted)] mb-4">
          Personal access tokens let external tools — such as Claude via MCP — connect to TaskFlow on your behalf
          using the same permissions as your account. Treat tokens like passwords; anyone with a token can act as
          you.
        </p>

        {error && (
          <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
        )}

        {createdToken && (
          <div className="mb-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-2">
            <p className="text-sm text-emerald-400 font-medium">
              Token "{createdToken.name}" created. Copy it now — you won't be able to see it again.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded bg-[color:var(--bg-page)] border border-[color:var(--border-subtle)] text-xs break-all text-[color:var(--text-primary)]">
                {createdToken.token}
              </code>
              <button
                onClick={handleCopy}
                className="px-3 py-2 rounded-lg bg-[color:var(--accent)] text-white text-sm font-medium hover:opacity-90 whitespace-nowrap"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end mb-6">
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-[color:var(--text-muted)] mb-1">Token name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Claude MCP"
              maxLength={100}
              className="w-full px-3 py-2 rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--bg-page)] text-sm text-[color:var(--text-primary)]"
              required
            />
          </div>
          <div className="w-full sm:w-48">
            <label className="block text-xs font-medium text-[color:var(--text-muted)] mb-1">Expires in (days)</label>
            <input
              type="number"
              min={1}
              max={3650}
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              placeholder="Never"
              className="w-full px-3 py-2 rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--bg-page)] text-sm text-[color:var(--text-primary)]"
            />
          </div>
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="px-4 py-2 rounded-lg bg-[color:var(--accent)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
          >
            {creating ? 'Creating…' : 'Create token'}
          </button>
        </form>

        {loading ? (
          <p className="text-sm text-[color:var(--text-muted)]">Loading tokens…</p>
        ) : tokens.length === 0 ? (
          <p className="text-sm text-[color:var(--text-muted)]">No tokens yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-[color:var(--border-subtle)] rounded-lg overflow-hidden">
              <thead className="bg-[color:var(--bg-page)]">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-[color:var(--text-muted)]">Name</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-[color:var(--text-muted)]">Token</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-[color:var(--text-muted)]">Created</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-[color:var(--text-muted)]">Last used</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-[color:var(--text-muted)]">Expires</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((t) => (
                  <tr key={t._id} className="border-t border-[color:var(--border-subtle)]">
                    <td className="px-3 py-2 text-[color:var(--text-primary)] font-medium">{t.name}</td>
                    <td className="px-3 py-2 font-mono text-xs text-[color:var(--text-muted)]">{t.tokenPrefix}…</td>
                    <td className="px-3 py-2 text-[color:var(--text-muted)]">{formatDate(t.createdAt)}</td>
                    <td className="px-3 py-2 text-[color:var(--text-muted)]">{formatDate(t.lastUsedAt)}</td>
                    <td className="px-3 py-2 text-[color:var(--text-muted)]">{formatDate(t.expiresAt)}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => handleRevoke(t._id)}
                        className="text-xs text-red-400 hover:underline"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
