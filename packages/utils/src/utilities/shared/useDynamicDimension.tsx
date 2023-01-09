import type { BoxMeasurements, BoxRef, UseDynamicDimension } from "@react-slip-and-slide/models";
import { sumBy, times } from "lodash";
import React from "react";
import { getDynamicRangeSum } from "./helpers";

const processMeasurements = (measurements: (BoxMeasurements | undefined)[]) =>
  measurements.map((m) => ({
    width: m?.width || 0,
    height: m?.height || 0,
  }));

export const useDynamicDimension = ({ itemDimensionMode, dataLength, onMeasure }: UseDynamicDimension) => {
  const itemRefs = React.useMemo<Array<React.RefObject<BoxRef>>>(() => {
    return times(dataLength, () => React.createRef());
  }, [dataLength]);

  const [itemDimensionMap, setItemDimensionMap] = React.useState<BoxMeasurements[]>([]);
  const [itemWidthSum, setItemWidthSum] = React.useState<number>(0);

  const measure = React.useCallback(() => {
    return new Promise<BoxMeasurements[]>((res) => {
      setTimeout(() => {
        const promises = itemRefs.map((ref) => ref.current?.measure());
        Promise.all(promises).then((measurements) => {
          res(processMeasurements(measurements));
        });
      }, 200);
    });
  }, [itemRefs]);

  React.useEffect(() => {
    if (itemDimensionMode === "dynamic") {
      measure().then((_itemDimensionMap) => {
        setItemDimensionMap(_itemDimensionMap);
        onMeasure?.({ itemDimensionMap: _itemDimensionMap });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLength]);

  React.useEffect(() => {
    if (itemDimensionMode === "dynamic" && itemDimensionMap.length > 0) {
      const sum = sumBy(itemDimensionMap, (map) => map?.width || 0);
      setItemWidthSum(sum);
      onMeasure?.({ itemWidthSum: sum });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemDimensionMap]);

  const ranges = React.useMemo(() => getDynamicRangeSum(itemDimensionMap), [itemDimensionMap]);

  if (itemDimensionMode === "fixed") {
    return { itemRefs: [], itemDimensionMap: [], ranges: [], itemWidthSum: 0 };
  }

  return { itemRefs, itemDimensionMap, ranges, itemWidthSum };
};
