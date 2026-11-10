import { useEffect, useState } from 'react';
import { Logo } from '@/components/ui/Logo';

export function AcceptInvitePage() {
  const token = new URLSearchParams(window.location.search).get('token') ?? '';
  const [preview, setPreview] = useState<{ email: string; operatorName: string; mode: string } | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('This invitation link is missing a token.');
      return;
    }
    void fetch(`/api/auth/invite?token=${encodeURIComponent(token)}`, { credentials: 'same-origin' })
      .then(async (response) => {
        const body = await response.json() as { error?: string; email?: string; operatorName?: string; mode?: string };
        if (!response.ok) throw new Error(body.error ?? 'invalid_invite');
        setPreview({ email: body.email!, operatorName: body.operatorName!, mode: body.mode! });
      })
      .catch((caught: Error) => setError(caught.message));
  }, [token]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setError('');
    if (!displayName || !password) {
      setError('Name and password are required.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 10) {
      setError('Use at least 10 characters, with a letter and a number.');
      return;
    }
    setLoading(true);
    const response = await fetch('/api/auth/invite', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ token, password, displayName }),
    });
    const body = await response.json().catch(() => ({})) as { error?: string; consolePath?: string };
    if (!response.ok) {
      setLoading(false);
      setError(body.error ?? 'Could not accept the invitation.');
      return;
    }
    window.location.assign('/operator/settings');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-[400px] card p-6 sm:p-8">
        <Logo size="lg" />
        <h1 className="mt-6 text-center font-display text-page font-bold text-ink">Set up your operator account</h1>
        {preview && (
          <p className="mt-2 text-center text-body text-neutral-500">
            {preview.operatorName} ({preview.mode}) · {preview.email}
          </p>
        )}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="invite_name" className="input-label">Full name</label>
            <input id="invite_name" className="input-field" value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoComplete="name" />
          </div>
          <div>
            <label htmlFor="invite_password" className="input-label">Password</label>
            <input id="invite_password" type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </div>
          <div>
            <label htmlFor="invite_confirm" className="input-label">Confirm password</label>
            <input id="invite_confirm" type="password" className="input-field" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          </div>
          {error && <p className="text-body text-error-600">{error}</p>}
          <button type="submit" disabled={loading || !preview} className="btn-primary w-full">
            {loading ? 'Saving…' : 'Save password and open console'}
          </button>
        </form>
      </div>
    </div>
  );
}
