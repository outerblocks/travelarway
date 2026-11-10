import { LoadingState } from '@/components/shared/States';

/** @deprecated Use LoadingState. Kept so existing imports keep the same loader. */
export function GenericResultsSkeleton({ count = 3 }: { count?: number }) {
  return <LoadingState count={count} />;
}
