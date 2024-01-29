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
import { clamp, defer, throttle } from 'lodash';
import React from 'react';
import { Context } from '../context';
import { Platform } from '../platform';
import { useSpringValue } from '../spring';
import { springConfigByActionType } from './config';
import {
  clampIndex,
  getCurrentDynamicIndex,
  getNextDynamicOffset,
  useIsFirstRender,
} from './helpers';
import { createRubberband } from './rubberband';
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
  | 'initialIndex'
  | 'loadingTime'
> & {
  instanceRef: React.Ref<ReactSlipAndSlideRef>;
};

export const useEngine = <T extends object>({
  snap,
  containerWidth: containerWidthProp,
  pressToSlide,
  rubberbandElasticity,
  instanceRef,
  initialIndex,
  loadingTime,
  animateStartup,
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
      isReady,
      shouldAnimatedStartup,
      initId,
      currentIndex,
    },
    actions: { setContainerDimensions, reInit, setCurrentIndex },
  } = Context.useDataContext<T>();

  const isFirstRender = useIsFirstRender();

  const index = React.useRef(currentIndex);

  const [_, reRender] = React.useState<number>(0);
  const lastOffset = React.useRef(0);

  const containerRef = React.useRef<BoxRef>(null);
  const isDragging = React.useRef<boolean>(false);
  const direction = React.useRef<Direction>(false);
  const lastValidDirection = React.useRef<ValidDirection | null>(null);
  const isIntentionalDrag = React.useRef<boolean>(false);

  const rubberband = React.useMemo(
    () =>
      createRubberband(
        [clampOffset.MAX, clampOffset.MIN],
        rubberbandElasticity
      ),
    [clampOffset.MAX, clampOffset.MIN, rubberbandElasticity]
  );

  const actionType = React.useRef<ActionType>('release');

  const Opacity = useSpringValue(shouldAnimatedStartup ? 0 : 1, {
    config: {
      tension: 220,
      friction: 32,
      mass: 1,
    },
  });

  const { width: screenWidth } = useScreenDimensions();

  React.useLayoutEffect(() => {
    defer(() => {
      containerRef.current?.measure().then(({ width, height }) => {
        setContainerDimensions({
          height: container.height || height,
          width: containerWidthProp || width,
        });
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container, screenWidth, initId]);

  const setActionType = (type: ActionType) => {
    actionType.current = type;
  };

  const checkActionType = React.useCallback((actionTypes: ActionType[]) => {
    return actionTypes.includes(actionType.current);
  }, []);

  const clampReleaseOffset = React.useCallback(
    (offset: number) => {
      if (infinite && itemDimensionMode === 'static') {
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

  const onCallbacks = React.useCallback(() => {
    if (currentIndex !== undefined) {
      onChange?.(currentIndex);
    }
    if (!infinite && !isFirstRender) {
      onEdges?.(checkEdges({ offset: lastOffset.current }));
    }
  }, [checkEdges, currentIndex, infinite, isFirstRender, onChange, onEdges]);

  const onEdge = React.useMemo(
    () =>
      throttle((edges: Edges) => {
        onEdges?.(edges);
      }, 120),
    [onEdges]
  );

  const clampIdx = React.useCallback(
    (idx: number) => {
      return clampIndex(idx, data);
    },
    [data]
  );

  const handleOnSpringStart = React.useCallback(() => {
    if (checkActionType(['navigate'])) {
      onEdge?.(checkEdges({ offset: lastOffset.current }));
    }
  }, [checkActionType, checkEdges, onEdge]);

  React.useEffect(() => {
    if (checkActionType(['release', 'navigate', 'correction', 'wheelSnap'])) {
      onCallbacks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const handleOnSpringRelease = React.useCallback(
    (clampedReleaseOffset: number) => {
      if (checkActionType(['release', 'navigate', 'ref', 'wheelSnap'])) {
        lastOffset.current = clampedReleaseOffset;
        if (itemDimensionMode === 'static') {
          index.current = clampIdx(
            getRelativeIndex({ offset: lastOffset.current })
          );
        } else {
          index.current = getCurrentDynamicIndex(
            lastOffset.current,
            ranges,
            lastValidDirection.current,
            direction.current,
            clampOffset,
            rangeOffsetPosition
          );
        }

        setCurrentIndex(index.current);

        if (loadingType === 'lazy') {
          reRender(index.current);
        }
      }
    },
    [
      checkActionType,
      clampIdx,
      clampOffset,
      getRelativeIndex,
      itemDimensionMode,
      loadingType,
      rangeOffsetPosition,
      ranges,
      setCurrentIndex,
    ]
  );

  const spring = React.useCallback(
    ({ offset, immediate, onRest }: Omit<SpringIt, 'actionType'>) => {
      const clampedReleaseOffset = clampReleaseOffset(offset);
      OffsetX.start({
        to: checkActionType(['drag', 'correction'])
          ? offset
          : clampedReleaseOffset,
        immediate: immediate || checkActionType(['drag', 'wheel']),
        onStart: () => {
          handleOnSpringStart();
        },
        onRest: (x) => {
          onRest?.(x);
        },
        config: springConfigByActionType[actionType.current],
      });

      handleOnSpringRelease(clampedReleaseOffset);
    },
    [
      clampReleaseOffset,
      OffsetX,
      checkActionType,
      handleOnSpringRelease,
      handleOnSpringStart,
    ]
  );

  const springIt = React.useCallback(
    ({ offset, immediate, actionType: type, onRest }: SpringIt) => {
      setActionType(type);
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

  const navigateByDirection = React.useCallback(
    (
      direction: Navigate['direction'],
      immediate?: boolean,
      actionType: ActionType = 'navigate'
    ) => {
      let targetOffset = lastOffset.current;
      if (itemDimensionMode === 'static') {
        const currentIndex = getCurrentIndex({ offset: OffsetX.get() });
        const nextIndex = nextIndexByDirection(currentIndex, direction);
        targetOffset = -nextIndex * itemWidth;
      } else {
        if (currentIndex !== undefined) {
          const nextIndex = clampIdx(
            nextIndexByDirection(currentIndex, direction)
          );

          targetOffset = -ranges[nextIndex].range[rangeOffsetPosition];
        }
      }

      springIt({
        offset: targetOffset,
        actionType,
        immediate,
      });
    },
    [
      OffsetX,
      clampIdx,
      currentIndex,
      getCurrentIndex,
      itemDimensionMode,
      itemWidth,
      rangeOffsetPosition,
      ranges,
      springIt,
    ]
  );

  const drag = React.useCallback(
    (x: number, actionType: ActionType) => {
      const offset = infinite ? x : rubberband(x);

      if (Platform.is('web')) {
        onEdge?.(checkEdges({ offset }));
      }

      springIt({
        offset,
        actionType,
      });
    },
    [checkEdges, infinite, onEdge, rubberband, springIt]
  );

  const withSnap = React.useCallback(
    ({ offset }: { offset: number }) => {
      if (itemDimensionMode === 'static') {
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
      isDragging.current = false;

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

  const navigateByIndex = React.useCallback(
    (
      idx: number,
      immediate?: boolean,
      actionType: ActionType = 'navigate',
      alignCentered = false
    ) => {
      const nextIndex = clampIdx(idx);
      let targetOffset = lastOffset.current;
      let currentItemWidth = itemWidth;
      if (itemDimensionMode === 'static') {
        targetOffset = getCurrentOffset({ index: nextIndex });
      } else {
        if (ranges.length) {
          currentItemWidth = ranges[nextIndex].width;
          targetOffset = -ranges[nextIndex].range[rangeOffsetPosition];
        }
      }

      if (alignCentered && !centered) {
        targetOffset =
          targetOffset + container.width / 2 - currentItemWidth / 2;
      }

      springIt({
        offset: targetOffset,
        actionType,
        immediate,
      });
    },
    [
      centered,
      clampIdx,
      container.width,
      getCurrentOffset,
      itemDimensionMode,
      itemWidth,
      rangeOffsetPosition,
      ranges,
      springIt,
    ]
  );

  /**
   * Depends on `isReady`
   */
  const navigate = React.useCallback(
    ({
      index,
      direction,
      immediate,
      actionType = 'navigate',
      alignCentered,
    }: Navigate) => {
      if (!isReady) {
        return;
      }

      if (index !== undefined) {
        navigateByIndex(index, immediate, actionType, alignCentered);
      } else if (direction) {
        navigateByDirection(direction, immediate, actionType);
      }
    },
    [isReady, navigateByIndex, navigateByDirection]
  );

  const initialNavigation = React.useCallback(() => {
    if (initialIndex !== 0) {
      const alignCentered =
        typeof initialIndex === 'object' ? initialIndex.centered : undefined;

      navigate({ index: currentIndex, immediate: true, alignCentered });
    }
  }, [currentIndex, initialIndex, navigate]);

  /**
   * Depends on `isReady`
   */
  const move = React.useCallback(
    (offset: number) => {
      if (!isReady) {
        return;
      }

      springIt({
        offset: OffsetX.get() + offset,
        actionType: 'navigate',
      });
    },
    [OffsetX, isReady, springIt]
  );

  /**
   * Depends on `isReady`
   */
  const goTo = React.useCallback(
    ({
      index,
      animated = true,
      centered,
    }: Parameters<ReactSlipAndSlideRef['goTo']>[0]) => {
      if (!isReady) {
        return;
      }

      navigateByIndex(index, !animated, 'ref', centered);
    },
    [isReady, navigateByIndex]
  );

  const getOffset = React.useCallback(
    ({ current, target }: { current: number; target: number }) => {
      if (Math.abs(target - current) >= dataLength / 2) {
        const off = current > dataLength / 2 ? dataLength : -dataLength;
        return off + (target - current);
      }
      return target - current;
    },
    [dataLength]
  );

  const handlePressToSlide = React.useCallback(
    (_index: number) => {
      if (!pressToSlide || isDragging.current) {
        return;
      }

      if (!OffsetX.isAnimating) {
        const res = getOffset({ target: _index, current: currentIndex });
        move(-(itemWidth * res));
      }
    },
    [
      OffsetX.isAnimating,
      currentIndex,
      getOffset,
      itemWidth,
      move,
      pressToSlide,
    ]
  );

  const handleOnItemPress = React.useCallback(
    (idx: number) => {
      if (currentIndex !== undefined) {
        handlePressToSlide(idx);
        onItemPress?.({ currentIndex: currentIndex, pressedItemIndex: idx });
      }
    },
    [currentIndex, handlePressToSlide, onItemPress]
  );

  //region FX

  // If we're ready but opacity is 0? (agnostic)
  React.useEffect(() => {
    if (isReady) {
      initialNavigation();
      defer(() => {
        onReady?.(true);
      });

      /**
       * This logic is a bit tricky:
       * If we explicitly get an animateStartup={false} we honor that config, but..
       * We will still animate the startup if:
       * - itemDimensionMode is dynamic (item dimensions props were not provided)
       * - initialIndex is defined (we need to navigate to that initialIndex on startup)
       * In those cases we will immediately run the animation.
       * By doing this we avoid a flicker when there's a need to navigate or take measurements on initialization.
       */
      if (shouldAnimatedStartup) {
        Opacity.start({
          to: 1,
          delay: loadingTime,
          immediate: !animateStartup,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  // Fixes initial offset when: mode === dynamic and centered is true
  // I think this isn't needed anymore, but let's leave it here just in case.
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

  //endregion

  React.useImperativeHandle<ReactSlipAndSlideRef, ReactSlipAndSlideRef>(
    instanceRef,
    () => ({
      reinitialize: reInit,
      next: () => navigate({ direction: 'next' }),
      previous: () => navigate({ direction: 'prev' }),
      goTo,
      move,
    })
  );

  return {
    handlers: {
      onDrag: drag,
      onRelease: release,
      onItemPress: handleOnItemPress,
      navigate,
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
