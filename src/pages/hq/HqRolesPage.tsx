import { useEffect, useState } from 'react';
import { Panel, postJson } from '@/pages/hq/hq-ui';

export function HqRolesPage() {
  const [roles, setRoles] = useState<{ id: string; code: string; name: string; departmentName: string; permissions: string[] }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; code: string; name: string }[]>([]);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [roleId, setRoleId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [acceptPath, setAcceptPath] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    void Promise.all([
      fetch('/api/hims/org?view=roles', { credentials: 'same-origin' }).then((row) => row.json()),
      fetch('/api/hims/org?view=departments', { credentials: 'same-origin' }).then((row) => row.json()),
    ]).then(([roleBody, deptBody]) => {
      const nextRoles = (roleBody as { data?: typeof roles }).data ?? [];
      setRoles(nextRoles);
      setDepartments((deptBody as { data?: typeof departments }).data ?? []);
      setRoleId(nextRoles[0]?.id ?? '');
    });
  }, []);

  useEffect(() => {
    const selected = roles.find((row) => row.id === roleId);
    const match = departments.find((row) => selected?.departmentName && row.name === selected.departmentName);
    if (match) setDepartmentId(match.id);
  }, [roleId, roles, departments]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-neutral-500">Roles are data. Creating a role is not a code branch. Invitees set their own password.</p>
      {error ? <p className="text-sm text-error-600">{error}</p> : null}
      <Panel title="Invite HQ staff">
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <input className="rounded-md border px-3 py-2 text-sm" placeholder="Full name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          <input className="rounded-md border px-3 py-2 text-sm" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <select className="rounded-md border px-3 py-2 text-sm" value={roleId} onChange={(event) => setRoleId(event.target.value)}>
            {roles.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </select>
          <select className="rounded-md border px-3 py-2 text-sm" value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>
            {departments.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
          </select>
          <button
            type="button"
            className="btn-primary text-xs sm:col-span-2"
            onClick={() => {
              setError('');
              setAcceptPath('');
              void postJson('/api/hims/invites', { kind: 'hims', email, displayName, roleId, departmentId })
                .then((payload) => setAcceptPath(String((payload as { acceptPath?: string }).acceptPath ?? '')))
                .catch((caught: Error) => setError(caught.message));
            }}
          >
            Invite HQ staff
          </button>
        </div>
        {acceptPath ? <p className="px-4 pb-3 text-sm">Accept link (copy now): <code className="break-all text-xs">{acceptPath}</code></p> : null}
      </Panel>
      <Panel title="Seeded roles">
        <ul className="divide-y divide-neutral-100 px-4">
          {roles.map((row) => (
            <li key={row.id} className="py-2 text-sm">
              <span className="font-semibold">{row.name}</span> · {row.departmentName}
              <p className="text-xs text-neutral-500">{(row.permissions ?? []).join(', ')}</p>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
