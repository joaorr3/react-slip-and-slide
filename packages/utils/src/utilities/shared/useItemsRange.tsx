import { type UseItemsRange } from '@react-slip-and-slide/models';
import React from 'react';
import { getDynamicRangeSum } from './helpers';

export const useItemsRange = ({
  mode,
  itemDimensionMap,
  offsetX: _offsetX,
}: UseItemsRange) => {
  const ranges = React.useMemo(
    () => getDynamicRangeSum(itemDimensionMap),
    [itemDimensionMap]
  );

  if (mode === 'fixed') {
    return { ranges: [], currentIndex: 0 };
  }

  const offsetX = Math.abs(_offsetX);
  const index = ranges.findIndex((rangeSum) => {
    if (!rangeSum?.range) return false;
    const { start, end } = rangeSum.range;
    return offsetX >= start && offsetX < end;
  });

  return { ranges, currentIndex: index };
};
