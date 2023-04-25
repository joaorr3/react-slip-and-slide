import {
  type ItemDimension,
  type UseDynamicDimension,
} from '@react-slip-and-slide/models';
import { sumBy, times } from 'lodash';
import React from 'react';

export const useDynamicDimension = ({
  mode,
  dataLength,
  onMeasure,
}: UseDynamicDimension) => {
  const itemRefs = React.useMemo<Array<React.RefObject<HTMLDivElement>>>(() => {
    return times(dataLength, () => React.createRef());
  }, [dataLength]);

  const [itemDimensionMap, setItemDimensionMap] = React.useState<
    ItemDimension[]
  >([]);
  const [itemWidthSum, setItemWidthSum] = React.useState<number>(0);

  const measure = React.useCallback(() => {
    return new Promise<ItemDimension[]>((res) => {
      setTimeout(() => {
        res(
          itemRefs.map((ref, index) => {
            return {
              index,
              width: ref.current?.offsetWidth ?? 0,
              height: ref.current?.offsetHeight ?? 0,
            };
          })
        );
      }, 200);
    });
  }, [itemRefs]);

  React.useEffect(() => {
    if (mode === 'dynamic') {
      measure().then((_itemDimensionMap) => {
        setItemDimensionMap(_itemDimensionMap);
        onMeasure?.({ itemDimensionMap: _itemDimensionMap });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLength]);

  React.useEffect(() => {
    if (mode === 'dynamic') {
      const sum = sumBy(itemDimensionMap, ({ width }) => width);
      setItemWidthSum(sum);
      onMeasure?.({ itemWidthSum: sum });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemDimensionMap]);

  if (mode === 'fixed') {
    return { itemRefs: [], itemDimensionMap: [], itemWidthSum: 0 };
  }

  return { itemRefs, itemDimensionMap, itemWidthSum };
};
