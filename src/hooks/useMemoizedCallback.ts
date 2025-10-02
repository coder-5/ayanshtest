import { useCallback, useRef } from 'react';

export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  dependencies: any[]
): T {
  const ref = useRef<T>(callback);

  // Update the callback if dependencies change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoized = useCallback((...args: Parameters<T>) => {
    return ref.current(...args);
  }, dependencies) as T;

  // Keep the ref updated
  ref.current = callback;

  return memoized;
}