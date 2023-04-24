import {
  DynamicRangeSum,
  ItemDimension,
  NextDynamicOffset,
  ValidDirection,
  TypedMemo,
  IsInRange,
} from "@react-slip-and-slide/models";
import { clamp } from "lodash";
import React from "react";

export const typedMemo: TypedMemo = React.memo;

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

export const getDynamicRangeSum = (itemDimensionMap: ItemDimension[]) => {
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

export const isInRange = (index: number, { dataLength, viewSize, offsetX, visibleItems }: IsInRange) => {
  const upperAmount = Math.round(visibleItems / 2);
  const lowerAmount = visibleItems - upperAmount;

  const fixedIndex = Math.round(-offsetX / viewSize);
  const currentIndex = fixedIndex < 0 ? (fixedIndex % dataLength) + dataLength : fixedIndex;

  const lowerRange = [
    (currentIndex + dataLength - lowerAmount) % dataLength,
    (currentIndex + dataLength - 1) % dataLength,
  ];

  const upperRange = [currentIndex % dataLength, (currentIndex + upperAmount) % dataLength];

  if ((lowerRange[0] < dataLength && lowerRange[0] > lowerRange[1]) || upperRange[0] > upperRange[1]) {
    lowerRange[1] = dataLength - 1;
    upperRange[0] = 0;
  }

  const isInLowerRange = index >= lowerRange[0] && index <= lowerRange[1];
  const isInUpperRange = index >= upperRange[0] && index <= upperRange[1];

  if (isInLowerRange || isInUpperRange) {
    return true;
  }

  return false;
};

export const usePreviousValue = <T>(value: T) => {
  const ref = React.useRef<T>(value);

  React.useEffect(() => {
    ref.current = value;
  });

  return ref.current;
};

export const useIsFirstRender = () => {
  const isFirst = React.useRef<boolean>(true);

  if (isFirst.current) {
    isFirst.current = false;
    return true;
  }

  return isFirst.current;
};
