import { useLayoutEffect } from 'react';

/** Marks a parent overlay while a lazy route chunk is loading. */
export function ChunkLoadingSignal({ onChange }) {
  useLayoutEffect(() => {
    onChange(true);
    return () => onChange(false);
  }, [onChange]);
  return null;
}
