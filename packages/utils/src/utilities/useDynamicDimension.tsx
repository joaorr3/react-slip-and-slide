import {
  type BaseDimensions,
  type BoxRef,
  type UseDynamicDimension,
} from '@react-slip-and-slide/models';
import { sumBy, times } from 'lodash';
import React from 'react';

export const useDynamicDimension = ({
  itemDimensionMode: mode,
  dataLength,
  onMeasure,
}: UseDynamicDimension) => {
  const itemRefs = React.useMemo<Array<React.RefObject<BoxRef>>>(() => {
    return times(dataLength, () => React.createRef());
  }, [dataLength]);

  const [itemDimensionMap, setItemDimensionMap] = React.useState<
    BaseDimensions[]
  >([]);

  const [itemWidthSum, setItemWidthSum] = React.useState<number>(0);

  const measure = React.useCallback(() => {
    return new Promise<BaseDimensions[]>((res) => {
      setImmediate(() => {
        const promises = itemRefs.map((ref) => ref.current?.measure());
        Promise.all(promises).then((measurements) => {
          res(
            measurements?.map((itemMeasurements) => ({
              width: itemMeasurements?.width || 0,
              height: itemMeasurements?.height || 0,
            }))
          );
        });
      });
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

  return { itemRefs, itemDimensionMap, itemWidthSum };
};
