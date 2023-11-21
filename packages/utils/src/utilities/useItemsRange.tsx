import { type UseItemsRange } from '@react-slip-and-slide/models';
import React from 'react';
import { getDynamicRangeSum } from './helpers';

/**
 *
 * @deprecated
 * use useDynamicDimension
 */
export const useItemsRange = ({
  itemDimensionMode,
  itemDimensionMap,
}: UseItemsRange) => {
  const ranges = React.useMemo(
    () => getDynamicRangeSum(itemDimensionMap),
    [itemDimensionMap]
  );

  if (itemDimensionMode === 'static') {
    return { ranges: [], currentIndex: 0 };
  }

  return { ranges };
};
