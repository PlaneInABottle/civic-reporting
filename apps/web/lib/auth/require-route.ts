import {
  authorizeRoute,
  safeNextPath,
  type AuthorizationRequirement,
} from '@civic-reporting/domain';
import { redirect } from 'next/navigation';
import { getActorContext } from './get-actor-context';

export async function requireRoute(
  requirement: AuthorizationRequirement,
  requestedPath: string,
) {
  const context = await getActorContext();
  const result = authorizeRoute(context, requirement);

  if (!result.allowed) {
    if (result.reason === 'authentication_required') {
      redirect(
        `/sign-in?next=${encodeURIComponent(safeNextPath(requestedPath))}`,
      );
    }
    redirect(
      `/access-denied?reason=${result.reason}&next=${encodeURIComponent(
        safeNextPath(requestedPath),
      )}`,
    );
  }

  return context;
}
