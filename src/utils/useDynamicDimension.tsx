import { clamp, sumBy, times } from "lodash";
import React from "react";
import { Mode, ValidDirection } from "../ReactSlipAndSlide";

type ItemDimensionMap = {
  index: number;
  width: number;
  height: number;
};

type OnMeasureCallback = (args: { itemDimensionMap?: ItemDimensionMap[]; itemWidthSum?: number }) => void;

type DynamicRangeSum =
  | {
      index: number;
      width: number;
      range: { start: number; center: number; end: number };
    }
  | undefined;

type UseDynamicDimension = {
  mode: Mode;
  dataLength: number;
  onMeasure?: OnMeasureCallback;
};

type UseItemsRange = {
  mode: Mode;
  itemDimensionMap: ItemDimensionMap[];
  offsetX: number;
};

type NextDynamicOffset = {
  offsetX: number;
  ranges: DynamicRangeSum[];
  dir: ValidDirection | null;
  centered: boolean;
};

export const useDynamicDimension = ({ mode, dataLength, onMeasure }: UseDynamicDimension) => {
  const itemRefs = React.useMemo<Array<React.RefObject<HTMLDivElement>>>(() => {
    return times(dataLength, () => React.createRef());
  }, [dataLength]);

  const [itemDimensionMap, setItemDimensionMap] = React.useState<ItemDimensionMap[]>([]);
  const [itemWidthSum, setItemWidthSum] = React.useState<number>(0);

  const measure = React.useCallback(() => {
    return new Promise<ItemDimensionMap[]>((res) => {
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
    if (mode === "dynamic") {
      measure().then((_itemDimensionMap) => {
        setItemDimensionMap(_itemDimensionMap);
        onMeasure?.({ itemDimensionMap: _itemDimensionMap });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLength]);

  React.useEffect(() => {
    if (mode === "dynamic") {
      const sum = sumBy(itemDimensionMap, ({ width }) => width);
      setItemWidthSum(sum);
      onMeasure?.({ itemWidthSum: sum });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemDimensionMap]);

  if (mode === "fixed") {
    return { itemRefs: [], itemDimensionMap: [], itemWidthSum: 0 };
  }

  return { itemRefs, itemDimensionMap, itemWidthSum };
};

export const useItemsRange = ({ mode, itemDimensionMap, offsetX: _offsetX }: UseItemsRange) => {
  const ranges = React.useMemo(() => getDynamicRangeSum(itemDimensionMap), [itemDimensionMap]);

  if (mode === "fixed") {
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

export const getCurrentDynamicIndex = (_offsetX: number, ranges: DynamicRangeSum[]) => {
  const offsetX = Math.round(Math.abs(_offsetX));

  const index = ranges.findIndex((rangeSum) => {
    if (!rangeSum?.range) return false;
    const { start, end } = rangeSum.range;
    return offsetX >= start && offsetX < end;
  });

  return ranges.length ? index : 0;
};

export const getNextDynamicIndex = (_offsetX: number, ranges: DynamicRangeSum[], dir: ValidDirection | null) => {
  let finalIndex: number = 0;

  const index = getCurrentDynamicIndex(_offsetX, ranges);

  if (index >= 0) {
    if (dir === "left") {
      finalIndex = index + 1;
    } else if (dir === "right") {
      finalIndex = index - 1;
    }
  } else {
    finalIndex = ranges.length - 1;
  }

  return clamp(finalIndex, 0, ranges.length - 1);
};

export const getNextDynamicOffset = ({ offsetX, ranges, dir, centered }: NextDynamicOffset) => {
  const currIndex = getNextDynamicIndex(offsetX, ranges, dir);
  const alignment = centered ? "center" : "start";
  const MIN = ranges[0]?.range[alignment] || 0;
  const MAX = ranges[ranges.length - 1]?.range[alignment] || 0;
  const offset = ranges[currIndex]?.range[alignment] || 0;

  const off = clamp(offset, MIN, MAX);

  return -off;
};

const getDynamicRangeSum = (itemDimensionMap: ItemDimensionMap[]) => {
  let previousSum = 0;
  const range: DynamicRangeSum[] = [];

  itemDimensionMap.forEach(({ width }, index) => {
    range.push({
      index,
      width,
      range: {
        start: previousSum,
        center: previousSum + width / 2,
        end: previousSum + width,
      },
    });
    previousSum += width;
  });

  return range;
};
