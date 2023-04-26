export const rubberband = (
  offset: number,
  multiplier = 2,
  [min, max]: [number, number]
) => {
  let overflow = 0;
  let edgeOffset = 0;

  if (offset < max) {
    // above
    overflow = offset - max;
    edgeOffset = max;
  } else if (offset > min) {
    // below
    overflow = offset - min;
    edgeOffset = min;
  } else {
    // in range
    return offset;
  }

  const elasticity = Math.pow(Math.abs(overflow), 0.5);
  const signedElasticity = overflow > 0 ? elasticity : -elasticity;
  return edgeOffset + signedElasticity * multiplier;
};
