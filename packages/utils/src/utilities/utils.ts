type Bound = {
  value: number;
  lower?: number;
  upper?: number;
};

export const bound = ({ value, lower = 0, upper = 0 }: Bound): number => {
  if (lower > upper) {
    [lower, upper] = [upper, lower];
  }

  return Math.max(lower || value, Math.min(value, upper || value));
};
