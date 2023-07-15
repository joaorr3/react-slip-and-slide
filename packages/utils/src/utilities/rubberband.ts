import { bound } from './utils';

export const rubberband = (
  offset: number,
  multiplier = 2,
  [min, max]: [number, number]
) => {
  if (offset <= max && offset >= min) {
    return offset;
  }

  const isBelow = offset < min;
  const isAbove = offset > max;
  const overflow = isAbove ? offset - max : isBelow ? offset - min : 0;
  const safeMultiplier = bound({ value: multiplier, lower: 1, upper: 10 });
  const res = offset - overflow / safeMultiplier;
  return res;
};
