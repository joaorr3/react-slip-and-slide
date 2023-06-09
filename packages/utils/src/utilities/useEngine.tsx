import {
  type ActionType,
  type BoxRef,
  type Direction,
  type Edges,
  type Navigate,
  type ReactSlipAndSlideProps,
  type ReactSlipAndSlideRef,
  type SpringIt,
  type ValidDirection,
} from '@react-slip-and-slide/models';
import { clamp, debounce, defer } from 'lodash';
import React from 'react';
import { Context } from '../context';
import { useSpringValue } from '../spring';
import {
  clampIndex,
  getCurrentDynamicIndex,
  getNextDynamicOffset,
  useIsFirstRender,
  useValueChangeReaction,
} from './helpers';
import { rubberband } from './rubberband';
import { useScreenDimensions } from './useScreenDimensions';

type UseEngineIn<T extends object> = Pick<
  ReactSlipAndSlideProps<T>,
  | 'snap'
  | 'containerWidth'
  | 'pressToSlide'
  | 'animateStartup'
  | 'rubberbandElasticity'
  | 'onChange'
  | 'onEdges'
  | 'onReady'
  | 'onItemPress'
> & {
  instanceRef: React.Ref<ReactSlipAndSlideRef>;
};

export const useEngine = <T extends object>({
  snap,
  containerWidth: containerWidthProp,
  pressToSlide,
  animateStartup = true,
  rubberbandElasticity = 4,
  instanceRef,
  onChange,
  onEdges,
  onReady,
  onItemPress,
}: UseEngineIn<T>) => {
  const {
    state: {
      data,
      dataLength,
      itemDimensions: { width: itemWidth },
      loadingType,
      centered,
      infinite,
      itemDimensionMode,
      container,
      wrapperWidth,
      clampOffset,
      ranges,
      rangeOffsetPosition,
      momentumMultiplier,
      OffsetX,
    },
    actions: { setContainerDimensions },
  } = Context.useDataContext<T>();

  const shouldAnimatedStartup = animateStartup && loadingType === 'eager';

  const isFirstRender = useIsFirstRender();

  const index = React.useRef(0);

  const [_, reRender] = React.useState<number>(0);
  const lastOffset = React.useRef(0);

  const containerRef = React.useRef<BoxRef>(null);
  const isDragging = React.useRef<boolean>(false);
  const direction = React.useRef<Direction>('center');
  const lastValidDirection = React.useRef<ValidDirection | null>(null);
  const isIntentionalDrag = React.useRef<boolean>(false);
  const actionType = React.useRef<ActionType | undefined>();

  const Opacity = useSpringValue(shouldAnimatedStartup ? 0 : 1, {
    config: {
      tension: 220,
      friction: 32,
      mass: 1,
    },
  });

  const { width: screenWidth } = useScreenDimensions();

  React.useLayoutEffect(() => {
    if (!containerWidthProp) {
      defer(() => {
        containerRef.current?.measure().then(({ width }) => {
          setContainerDimensions({
            ...container,
            width,
          });
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container, screenWidth]);

  const clampReleaseOffset = React.useCallback(
    (offset: number) => {
      if (infinite && itemDimensionMode === 'fixed') {
        return offset;
      }

      // This is inverted because next slides === negative translation
      return clamp(offset, clampOffset.MAX, clampOffset.MIN);
    },
    [clampOffset.MAX, clampOffset.MIN, infinite, itemDimensionMode]
  );

  const processIndex = React.useCallback(
    ({ offset }: { offset: number }) => {
      if (itemWidth) {
        const modIndex = (offset / itemWidth) % dataLength;
        return offset <= 0
          ? Math.abs(modIndex)
          : Math.abs(modIndex > 0 ? dataLength - modIndex : 0);
      }
      return 0;
    },
    [dataLength, itemWidth]
  );

  const getCurrentIndex = React.useCallback(
    ({ offset }: { offset: number }) => {
      if (infinite) {
        return -Math.round(offset / itemWidth);
      }

      return Math.round(processIndex({ offset }));
    },
    [infinite, itemWidth, processIndex]
  );

  const getRelativeIndex = React.useCallback(
    ({ offset }: { offset: number }) => {
      // get the index relative to its original position in data[]
      // ensure the first item on the left is equal to dataLength and not 1.
      // [1,2,3,4][1,2,3,4][1,2,3,4] - origin
      // [4,3,2,1][-0,-1,-2,-3][-0,-1,-2,-3] - wrong
      // [0,1,2,3][0,1,2,3][0,1,2,3] - corrected
      // floor the index to ensure it's correct when in free scroll mode (!snap)
      return Math.floor(processIndex({ offset }));
    },
    [processIndex]
  );

  const getCurrentOffset = React.useCallback(
    ({ index }: { index: number }) => {
      const finalOffset = -index * itemWidth;
      return finalOffset;
    },
    [itemWidth]
  );

  const checkEdges = React.useCallback(
    ({ offset }: { offset: number }) => {
      let start = false;
      let end = false;

      if (offset >= clampOffset.MIN) {
        start = true;
      } else if (offset <= clampOffset.MAX) {
        end = true;
      } else {
        start = false;
        end = false;
      }

      if (clampOffset.MIN === clampOffset.MAX) {
        start = true;
        end = true;
      }

      return { start, end };
    },
    [clampOffset]
  );

  const onChanged = React.useMemo(
    () =>
      debounce((index: number) => {
        onChange?.(index);
      }, 800),
    [onChange]
  );

  const onEdge = React.useMemo(
    () =>
      debounce((edges: Edges) => {
        onEdges?.(edges);
      }, 50),
    [onEdges]
  );

  const spring = React.useCallback(
    ({ offset, immediate, onRest }: SpringIt) => {
      const clampedReleaseOffset = clampReleaseOffset(offset);
      OffsetX.start({
        to:
          actionType.current === 'drag' || actionType.current === 'correction'
            ? offset
            : clampedReleaseOffset,
        immediate:
          immediate ||
          actionType.current === 'drag' ||
          actionType.current === 'wheel',
        onRest: (x) => {
          onRest?.(x);
        },
      });
      if (actionType.current === 'release') {
        lastOffset.current = clampedReleaseOffset;
        if (itemDimensionMode === 'fixed') {
          index.current = clampIndex(
            getRelativeIndex({ offset: clampedReleaseOffset }),
            data
          );
        } else {
          index.current = getCurrentDynamicIndex(
            offset,
            ranges,
            lastValidDirection.current,
            direction.current,
            clampOffset,
            rangeOffsetPosition
          );
        }

        if (loadingType === 'lazy') {
          reRender(index.current);
        }

        onChanged(index.current);

        if (!infinite && !isFirstRender) {
          onEdge?.(checkEdges({ offset }));
        }
      }
    },
    [
      OffsetX,
      checkEdges,
      clampOffset,
      clampReleaseOffset,
      data,
      getRelativeIndex,
      infinite,
      isFirstRender,
      itemDimensionMode,
      loadingType,
      onChanged,
      onEdge,
      rangeOffsetPosition,
      ranges,
    ]
  );

  const springIt = React.useCallback(
    ({
      offset,
      immediate,
      actionType: _actionType,
      onRest,
    }: SpringIt & { actionType: ActionType }) => {
      actionType.current = _actionType;
      spring({ offset, immediate, onRest });
    },
    [spring]
  );

  const getCurrentIndexByOffset = React.useCallback(
    (offset: number) => {
      let finalIndex = 0;
      const neutralIndex = (offset / wrapperWidth) * dataLength;

      const left = Math.ceil(neutralIndex);
      const right = Math.floor(neutralIndex);

      if (!snap) {
        return right;
      }

      switch (direction.current) {
        case 'left':
          finalIndex = left;
          break;
        case 'right':
          finalIndex = right;
          break;
        default:
          if (lastValidDirection.current === 'left') {
            finalIndex = left;
          } else if (lastValidDirection.current === 'right') {
            finalIndex = right;
          }
          break;
      }

      return finalIndex;
    },
    [dataLength, snap, wrapperWidth]
  );

  const drag = React.useCallback(
    (x: number, actionType: ActionType) => {
      const offset =
        infinite || actionType === 'wheel'
          ? x
          : rubberband(x, rubberbandElasticity, [
              clampOffset.MIN,
              clampOffset.MAX,
            ]);

      springIt({
        offset,
        actionType,
      });
    },
    [clampOffset, infinite, rubberbandElasticity, springIt]
  );

  const withSnap = React.useCallback(
    ({ offset }: { offset: number }) => {
      if (itemDimensionMode === 'fixed') {
        const page = getCurrentIndexByOffset(-offset);
        const finalOffset = -page * itemWidth;

        return finalOffset;
      } else {
        const nextDynamicOffset = getNextDynamicOffset({
          offsetX: offset,
          ranges,
          lastValidDirection: lastValidDirection.current,
          direction: direction.current,
          clampOffset,
          rangeOffsetPosition,
        });

        return nextDynamicOffset;
      }
    },
    [
      clampOffset,
      getCurrentIndexByOffset,
      itemDimensionMode,
      itemWidth,
      rangeOffsetPosition,
      ranges,
    ]
  );

  const withMomentum = React.useCallback(
    ({ offset, v }: { offset: number; v: number }) => {
      const multiplier = -(1 + momentumMultiplier);
      const baseVelocity = -Math.abs(v);

      const velocity =
        direction.current === 'left'
          ? -(baseVelocity * multiplier)
          : direction.current === 'right'
          ? baseVelocity * multiplier
          : 0;
      const momentumOffset = offset + velocity;
      return momentumOffset;
    },
    [momentumMultiplier]
  );

  const release = React.useCallback(
    ({ offset, velocity: v }: { offset: number; velocity: number }) => {
      let offsetX = 0;

      if (snap) {
        if (isIntentionalDrag.current) {
          offsetX = withSnap({ offset });
        } else {
          springIt({
            offset: lastOffset.current,
            actionType: 'correction',
          });
          return;
        }
      } else {
        offsetX = withMomentum({ offset, v });
      }

      springIt({
        offset: offsetX,
        actionType: 'release',
      });
    },
    [snap, springIt, withMomentum, withSnap]
  );

  const nextIndexByDirection = (
    index: number,
    direction: Navigate['direction']
  ) => {
    if (direction === 'next') {
      return index + 1;
    } else if (direction === 'prev') {
      return index - 1;
    }
    return index;
  };

  const navigateByIndex = React.useCallback(
    (index: number, immediate?: boolean) => {
      let targetOffset = lastOffset.current;
      if (itemDimensionMode === 'fixed') {
        targetOffset = getCurrentOffset({ index });
      } else {
        targetOffset = -ranges[index].range[rangeOffsetPosition];
      }
      springIt({
        offset: targetOffset,
        actionType: 'release',
        immediate,
      });
    },
    [getCurrentOffset, itemDimensionMode, rangeOffsetPosition, ranges, springIt]
  );

  const navigateByDirection = React.useCallback(
    (direction: Navigate['direction'], immediate?: boolean) => {
      let targetOffset = lastOffset.current;
      if (itemDimensionMode === 'fixed') {
        const currentIndex = getCurrentIndex({ offset: OffsetX.get() });
        const nextIndex = nextIndexByDirection(currentIndex, direction);
        targetOffset = -nextIndex * itemWidth;
      } else {
        const nextIndex = nextIndexByDirection(index.current, direction);
        targetOffset = -ranges[nextIndex].range[rangeOffsetPosition];
      }
      springIt({
        offset: targetOffset,
        actionType: 'release',
        immediate,
      });
    },
    [
      OffsetX,
      getCurrentIndex,
      itemDimensionMode,
      itemWidth,
      rangeOffsetPosition,
      ranges,
      springIt,
    ]
  );

  const navigate = React.useCallback(
    ({ index, direction, immediate }: Navigate) => {
      if (index !== undefined) {
        navigateByIndex(index, immediate);
      } else if (direction) {
        navigateByDirection(direction, immediate);
      }
    },
    [navigateByIndex, navigateByDirection]
  );

  const move = React.useCallback(
    (offset: number) => {
      springIt({
        offset: OffsetX.get() + offset,
        actionType: 'release',
      });
    },
    [OffsetX, springIt]
  );

  const handlePressToSlide = React.useCallback(
    (index: number) => {
      if (!pressToSlide || isDragging.current || isIntentionalDrag.current) {
        return;
      }

      navigate({ index });
    },
    [navigate, pressToSlide]
  );

  const handleOnItemPress = React.useCallback(
    (idx: number) => {
      handlePressToSlide(idx);

      onItemPress?.({ currentIndex: index.current, pressedItemIndex: idx });
    },
    [handlePressToSlide, onItemPress]
  );

  //region FX
  React.useEffect(() => {
    if (shouldAnimatedStartup) {
      if (itemDimensionMode === 'dynamic') {
        if (ranges.length && container.height) {
          Opacity.start({
            to: 1,
            onRest: () => {
              onReady?.(true);
            },
          });
        }
      } else {
        Opacity.start({
          to: 1,
          delay: 100,
          onRest: () => {
            onReady?.(true);
          },
        });
      }
    } else {
      onReady?.(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Opacity, container.height, ranges.length, shouldAnimatedStartup]);

  // Fixes initial offset when: mode === dynamic and centered is true
  React.useEffect(() => {
    if (itemDimensionMode === 'dynamic' && centered) {
      const firstDynamicOffset = -(ranges[0]?.range[rangeOffsetPosition] || 0);

      springIt({
        offset: firstDynamicOffset,
        actionType: 'release',
        immediate: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centered, itemDimensionMode, ranges]);

  // Reset to new clampOffset.MAX if is at the end edge and page is resized
  React.useEffect(() => {
    const { end } = checkEdges({ offset: OffsetX.get() });
    if (end) {
      springIt({
        offset: clampOffset.MAX,
        actionType: 'release',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clampOffset.MAX]);

  // Check edges if the window is resized
  React.useEffect(() => {
    if (!isFirstRender) {
      onEdges?.(checkEdges({ offset: OffsetX.get() }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenWidth, clampOffset.MAX]);

  React.useEffect(() => {
    onEdges?.(checkEdges({ offset: OffsetX.get() }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useValueChangeReaction(containerWidthProp, (width) => {
    setContainerDimensions({
      width,
    });
  });

  //endregion

  React.useImperativeHandle<ReactSlipAndSlideRef, ReactSlipAndSlideRef>(
    instanceRef,
    () => ({
      next: () => navigate({ direction: 'next' }),
      previous: () => navigate({ direction: 'prev' }),
      goTo: ({ index, animated }) => navigate({ index, immediate: !animated }),
      move,
    }),
    [move, navigate]
  );

  return {
    handlers: {
      onDrag: drag,
      onRelease: release,
      onItemPress: handleOnItemPress,
    },
    state: {
      container,
      centered,
    },
    signals: {
      direction,
      isDragging,
      isIntentionalDrag,
      lastOffset,
      lastValidDirection,
      actionType,
    },
    containerRef,
    Opacity,
  };
};
