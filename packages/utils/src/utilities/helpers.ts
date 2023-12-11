import {
  type BaseDimensions,
  type BoxMeasurements,
  type ClampOffset,
  type Direction,
  type DynamicRangeSum,
  type IsInRange,
  type ItemDimensionMode,
  type NextDynamicOffset,
  type RangeOffsetPosition,
  type TypedMemo,
  type ValidDirection,
} from '@react-slip-and-slide/models';
import { dequal } from 'dequal';
import { clamp } from 'lodash';
import React from 'react';
import { type CSSProperties } from '../styled-components';

export const typedMemo: TypedMemo = React.memo;

export function getCurrentDynamicIndex(
  _input: number,
  ranges: DynamicRangeSum[],
  validDirection: ValidDirection | null,
  direction: Direction,
  clampOffset: ClampOffset,
  rangeOffsetPosition: RangeOffsetPosition
) {
  let finalIndex = 0;

  const input = Math.abs(clamp(_input, clampOffset.MAX, clampOffset.MIN));

  const index = ranges.findIndex((item) => {
    return item.range.start <= input && input <= item.range.end;
  });

  if (index === -1) {
    return finalIndex;
  }

  const item = ranges[index];
  const itemOffset = item.range[rangeOffsetPosition];
  const offset = input;

  if (offset > itemOffset && validDirection === 'left') {
    finalIndex = item.index + 1;
  } else if (offset < itemOffset && validDirection === 'right') {
    finalIndex = item.index - 1;
  } else {
    finalIndex = item.index;
  }

  if (!direction) {
    finalIndex = item.index;
  }

  return clampIndex(finalIndex, ranges);
}

export const getNextDynamicOffset = ({
  offsetX,
  ranges,
  lastValidDirection,
  direction,
  clampOffset,
  rangeOffsetPosition,
}: NextDynamicOffset) => {
  const currIndex = getCurrentDynamicIndex(
    offsetX,
    ranges,
    lastValidDirection,
    direction,
    clampOffset,
    rangeOffsetPosition
  );

  const offset = ranges[currIndex]?.range[rangeOffsetPosition] || 0;

  return -offset;
};

export const clampIndex = <T>(index: number, data: T[]) =>
  clamp(index, 0, data.length - 1);

export const getDynamicRangeSum = (itemDimensionMap: BoxMeasurements[]) => {
  let previousSum = 0;
  const range: DynamicRangeSum[] = [];
  itemDimensionMap.forEach(({ width = 0 }, index) => {
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

export const isInRange = (
  index: number,
  { dataLength, viewSize, offsetX, visibleItems }: IsInRange
) => {
  const upperAmount = Math.round(visibleItems / 2);
  const lowerAmount = visibleItems - upperAmount;

  const fixedIndex = Math.round(-offsetX / viewSize);
  const currentIndex =
    fixedIndex < 0 ? (fixedIndex % dataLength) + dataLength : fixedIndex;

  const lowerRange = [
    (currentIndex + dataLength - lowerAmount) % dataLength,
    (currentIndex + dataLength - 1) % dataLength,
  ];

  const upperRange = [
    currentIndex % dataLength,
    (currentIndex + upperAmount) % dataLength,
  ];

  if (
    (lowerRange[0] < dataLength && lowerRange[0] > lowerRange[1]) ||
    upperRange[0] > upperRange[1]
  ) {
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

export const processClampOffsets = ({
  wrapperWidth,
  sideMargins,
  centered,
  containerWidth,
  itemDimensionMode,
  ranges,
}: {
  wrapperWidth: number;
  sideMargins: number;
  centered: boolean;
  containerWidth: number;
  itemDimensionMode: ItemDimensionMode;
  ranges: DynamicRangeSum[];
}) => {
  let MIN = 0;
  let MAX = 0;

  if (itemDimensionMode === 'static') {
    MAX = -wrapperWidth + containerWidth;

    if (centered) {
      const _MAX_CENTERED = MAX - sideMargins * 2;
      MAX = _MAX_CENTERED;
    }
  } else {
    const position = centered ? 'center' : 'start';
    const firstDynamicOffset = -(ranges[0]?.range[position] || 0);

    const sideMargins = !centered
      ? (containerWidth - (ranges[ranges.length - 1]?.width || 0)) / 2
      : 0;

    const initialCorrection =
      itemDimensionMode === 'dynamic' && centered ? firstDynamicOffset : 0;

    MIN = initialCorrection;
    MAX = -ranges[ranges.length - 1]?.range[position] + sideMargins * 2 || 0;
  }

  // In this case i guess you don't need a slider.
  if (wrapperWidth < containerWidth && !centered) {
    MAX = MIN;
  }

  return {
    MIN,
    MAX,
  };
};

export function useValueChangeReaction<T>(
  prop: T,
  cb?: (next: T) => void
): void {
  const prevProp = usePreviousValue(prop);
  const deps: React.DependencyList = [cb, prevProp, prop];

  React.useEffect(() => {
    if (!dequal(prop, prevProp)) {
      cb?.(prop);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export const derive = <T>(fn: () => T): T => fn();

export const elementDimensionStyles = ({
  width,
  height,
}: Required<BaseDimensions>): Pick<
  CSSProperties,
  'width' | 'height' | 'minWidth' | 'minHeight'
> => {
  return {
    width: width === 0 ? undefined : width,
    minWidth: width === 0 ? undefined : width,
    height: height === 0 ? undefined : height,
    minHeight: height === 0 ? undefined : height,
  };
};
