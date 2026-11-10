import { IdentityNotConfiguredError, SessionRequiredError, requireIdentityLive } from '@/server/identity/live';
import { hasHimsDesk, hasOimsAssignment, sessionFromRequest, type AppSession } from '@/server/identity/sessions';
import { OimsForbiddenError } from '@/server/oims/repository';
import { HimsForbiddenError } from '@/server/hims/http';
import { refuseStaffUntilIdentityConfigured } from '@/server/staff-authz';

export async function requireAppSession(request: Request): Promise<AppSession> {
  requireIdentityLive();
  const session = await sessionFromRequest(request);
  if (!session) throw new SessionRequiredError();
  return session;
}

export async function requireOperatorStaff(request: Request, claimed?: string | null): Promise<{
  operatorId: string;
  userId: string;
}> {
  requireIdentityLive();
  const { operatorIdFromRequest } = await import('@/server/oims/session');
  const operatorId = operatorIdFromRequest(request);
  if (!operatorId) throw new OimsForbiddenError();
  if (claimed && claimed !== operatorId) throw new OimsForbiddenError();
  const session = await sessionFromRequest(request);
  if (!session) throw new OimsForbiddenError();
  if (!(await hasOimsAssignment(session.userId, operatorId))) throw new OimsForbiddenError();
  return { operatorId, userId: session.userId };
}

export async function requireOimsPermission(request: Request, permission: import('@/server/oims/permissions').OimsPermission): Promise<{
  operatorId: string;
  userId: string;
  mode: 'bus' | 'ferry';
}> {
  const staff = await requireOperatorStaff(request);
  const { loadOimsProfile } = await import('@/server/oims/org');
  const profile = await loadOimsProfile(staff.userId, staff.operatorId);
  if (!profile?.permissions.includes(permission)) throw new OimsForbiddenError();
  return { operatorId: staff.operatorId, userId: staff.userId, mode: profile.mode };
}

export async function requireHqStaff(request: Request, desk?: 'finance' | 'admin'): Promise<{
  desk: 'finance' | 'admin';
  userId: string;
}> {
  requireIdentityLive();
  const session = await sessionFromRequest(request);
  if (!session) throw new HimsForbiddenError();
  const { loadHqProfile } = await import('@/server/hims/org');
  const { himsDeskFromRequest } = await import('@/server/hims/session');
  const profile = await loadHqProfile(session.userId);
  if (!profile) throw new HimsForbiddenError();
  const cookieDesk = himsDeskFromRequest(request);
  const deskResolved = desk ?? cookieDesk ?? profile.desks[0] ?? (profile.permissions.includes('hq.approvals.decide') ? 'admin' : 'finance');
  if (desk && !profile.permissions.length) throw new HimsForbiddenError();
  if (desk === 'admin' && !profile.permissions.includes('hq.approvals.decide') && !profile.desks.includes('admin')) {
    throw new HimsForbiddenError();
  }
  if (desk === 'finance' && !profile.permissions.includes('hq.finance.propose') && !profile.desks.includes('finance') && !profile.permissions.includes('hq.finance.view')) {
    throw new HimsForbiddenError();
  }
  if (cookieDesk && !(await hasHimsDesk(session.userId, cookieDesk)) && !profile.permissions.length) {
    throw new HimsForbiddenError();
  }
  return { desk: deskResolved, userId: session.userId };
}

export async function requireHqPermission(request: Request, permission: import('@/server/hims/permissions').HqPermission): Promise<{
  userId: string;
  desk: 'finance' | 'admin';
}> {
  requireIdentityLive();
  const session = await sessionFromRequest(request);
  if (!session) throw new HimsForbiddenError();
  const { loadHqProfile } = await import('@/server/hims/org');
  const { legacyDeskForPermission } = await import('@/server/hims/permissions');
  const profile = await loadHqProfile(session.userId);
  if (!profile?.permissions.includes(permission)) throw new HimsForbiddenError();
  const mapped = legacyDeskForPermission(permission);
  const desk = mapped ?? profile.desks[0] ?? 'admin';
  return { userId: session.userId, desk };
}

export function staffClosedResponse(error: unknown): Response | null {
  if (error instanceof IdentityNotConfiguredError) return refuseStaffUntilIdentityConfigured();
  return null;
}
