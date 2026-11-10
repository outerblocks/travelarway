import { useState } from 'react';
import { Link } from '@/router';
import { useAuth } from '@/context/AuthContext';

export function OperatorSettingsPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setOk('');
    if (newPassword !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const response = await fetch('/api/auth/password/change', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const body = await response.json().catch(() => ({})) as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(body.error ?? 'Could not update password.');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirm('');
    setOk('Password updated.');
  };

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto max-w-md card p-6">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-brand-600">OIMS · settings</p>
        <h1 className="mt-2 text-xl font-bold text-ink">Account</h1>
        <p className="mt-1 text-sm text-neutral-500">{user?.email}</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="cur" className="input-label">Current password</label>
            <input id="cur" type="password" className="input-field" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
          </div>
          <div>
            <label htmlFor="nw" className="input-label">New password</label>
            <input id="nw" type="password" className="input-field" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
          </div>
          <div>
            <label htmlFor="cf" className="input-label">Confirm new password</label>
            <input id="cf" type="password" className="input-field" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          </div>
          {error && <p className="text-sm text-error-600">{error}</p>}
          {ok && <p className="text-sm text-brand-700">{ok}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? 'Saving…' : 'Update password'}</button>
        </form>
        <Link to="/operator/bus" className="mt-6 inline-block text-sm text-neutral-500">← Back to console</Link>
      </div>
    </div>
  );
}
