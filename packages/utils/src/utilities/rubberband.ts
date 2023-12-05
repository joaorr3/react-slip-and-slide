import { clamp } from 'lodash';

const scale = ({ size, multiplier }: { size: number; multiplier: number }) => {
  return (offset: number) => {
    if (size === 0 || Math.abs(size) === Infinity) {
      return Math.pow(offset, multiplier * 5);
    }
    return (offset * size * multiplier) / (size + multiplier * offset);
  };
};

export const createRubberband = (
  [min, max]: [number, number],
  multiplier = 0.15
) => {
  const size = max - min;

  const rub = scale({ size, multiplier });

  return (offset: number) => {
    if (multiplier === 0) {
      return clamp(offset, min, max);
    }

    switch (true) {
      case offset < min:
        return -rub(min - offset) + min;
      case offset > max:
        return +rub(offset - max) + max;
      default:
        return offset;
    }
  };
};
