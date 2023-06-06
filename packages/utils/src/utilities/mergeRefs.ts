import type React from 'react';

export function mergeRefs<T = any>(
  refs: Array<
    | React.RefCallback<T>
    | React.RefObject<T>
    | React.MutableRefObject<T>
    | React.LegacyRef<T>
    | null
    | undefined
  >
): React.RefCallback<T> {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(value);
      } else if (ref !== null) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    });
  };
}
