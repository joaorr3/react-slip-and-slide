import { type Interpolators } from '@react-slip-and-slide/models';
import React from 'react';
import { Context } from '../context';
import { to, type Interpolation } from '../spring';
import { displacement } from './displacement';

type UseInterpolation = {
  index: number;
};

export const useInterpolation = <T extends object>({
  index,
}: UseInterpolation) => {
  const {
    state: {
      dataLength,
      itemDimensions: { width: itemWidth },
      infinite,
      itemDimensionMode,
      ranges,
      interpolators,
      rangeOffsetPosition,
      engineMode,
      wrapperWidth,
      OffsetX: ContextOffsetX,
    },
  } = Context.useDataContext<T>();

  const dynamicOffset = ranges[index]?.range[rangeOffsetPosition] || 0;

  const interpolatorsKeys = Object.entries(interpolators || {}) as [
    keyof Interpolators<number>,
    number
  ][];

  const getTranslateX = React.useCallback((): Interpolation<number, number> => {
    const OffsetX =
      engineMode === 'single'
        ? ContextOffsetX
        : ContextOffsetX.to((offsetX) => offsetX % wrapperWidth);

    const x = displacement({
      OffsetX,
      dataLength,
      index,
      itemWidth,
      infinite,
    });

    if (itemDimensionMode === 'static') {
      return x
        .to((val) => val / itemWidth)
        .to([-1, 0, 1], [-itemWidth, 0, itemWidth]);
    }

    return to(OffsetX, (x) => x + dynamicOffset);
  }, [
    ContextOffsetX,
    dataLength,
    dynamicOffset,
    engineMode,
    index,
    infinite,
    itemDimensionMode,
    itemWidth,
    wrapperWidth,
  ]);

  const { scale, opacity, translateX } = React.useMemo(() => {
    // Compute translateX and interpolations only if needed
    if (itemWidth && (interpolatorsKeys.length || engineMode === 'multi')) {
      const translateX = getTranslateX();

      const { scale = 1, opacity = 1 } = interpolatorsKeys.reduce(
        (acc, [key, val]) => {
          acc[key] = translateX
            .to((val) => val / itemWidth)
            .to([-1, 0, 1], [val, 1, val], 'clamp');
          return acc;
        },
        {} as Interpolators<Interpolation<number, any>>
      );

      return {
        translateX,
        scale,
        opacity,
      };
    }
    return {
      translateX: 0,
      scale: 1,
      opacity: 1,
    };
  }, [engineMode, getTranslateX, itemWidth, interpolatorsKeys]);

  return {
    translateX,
    scale,
    opacity,
  };
};
