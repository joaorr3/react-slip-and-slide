import {
  type BoxRef,
  type Direction,
  type Interpolators,
  type ItemProps,
  type Navigate,
  type ReactSlipAndSlideProps,
  type ReactSlipAndSlideRef,
  type SpringIt,
  type ValidDirection,
} from '@react-slip-and-slide/models';
import {
  AnimatedBox,
  Context,
  displacement,
  getCurrentDynamicIndex,
  getNextDynamicOffset,
  isInRange,
  LazyLoad,
  rubberband,
  Styled,
  typedMemo,
  useDynamicDimension,
  useIsFirstRender,
  useScreenDimensions,
  useValueChangeReaction,
} from '@react-slip-and-slide/utils';
import { useDrag } from '@use-gesture/react';
import { clamp } from 'lodash';
import React from 'react';
import { SpringValue, to, type Interpolation } from 'react-spring';

function ReactSlipAndSlideComponent<T extends object>(
  {
    data,
    snap,
    containerWidth: containerWidthProp,
    overflowHidden = true,
    pressToSlide,
    animateStartup = true,
    rubberbandElasticity = 4,
    renderItem,
    onChange,
    onEdges,
    onReady,
  }: ReactSlipAndSlideProps<T>,
  ref: React.Ref<ReactSlipAndSlideRef>
) {
  const {
    state: {
      dataLength,
      itemDimensions: { width: itemWidth, height: itemHeight },
      loadingType,
      centered,
      infinite,
      itemDimensionMode,
      container,
      wrapperWidth,
      clampOffset,
      ranges,
      interpolators,
      visibleItems,
    },
    actions: { setContainerDimensions, setWrapperWidth },
  } = Context.useDataContext();

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

  const OffsetX = React.useMemo(() => {
    return new SpringValue<number>(0, {
      config: {
        tension: 220,
        friction: 32,
        mass: 1,
      },
    });
  }, []);

  const Opacity = React.useMemo(() => {
    const initialOpacity = shouldAnimatedStartup ? 0 : 1;
    return new SpringValue<number>(initialOpacity, {
      config: {
        tension: 260,
        friction: 32,
        mass: 1,
      },
    });
  }, [shouldAnimatedStartup]);

  const { width: screenWidth } = useScreenDimensions();

  React.useLayoutEffect(() => {
    if (!containerWidthProp) {
      containerRef.current?.measure().then((m) => {
        setContainerDimensions({
          width: m.width,
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container, screenWidth]);

  const { itemRefs } = useDynamicDimension({
    itemDimensionMode,
    dataLength: data.length,
    onMeasure: ({ itemWidthSum }) => {
      if (itemWidthSum) {
        setWrapperWidth(itemWidthSum);
      }
    },
  });

  const clampReleaseOffset = React.useCallback(
    (offset: number) => {
      if (infinite && itemDimensionMode === 'fixed') {
        return offset;
      }

      if (offset > clampOffset.MIN) {
        return clampOffset.MIN;
      } else if (offset < clampOffset.MAX) {
        return clampOffset.MAX;
      }
      return offset;
    },
    [clampOffset.MAX, clampOffset.MIN, infinite, itemDimensionMode]
  );

  const clampIndex = React.useCallback(
    (index: number) => clamp(index, 0, dataLength - 1),
    [dataLength]
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

      // Refer to line 148
      if (clampOffset.MIN === clampOffset.MAX) {
        start = true;
        end = true;
      }

      return { start, end };
    },
    [clampOffset]
  );

  const springIt = React.useCallback(
    ({ offset, immediate, actionType, onRest }: SpringIt) => {
      const clampedReleaseOffset = clampReleaseOffset(offset);
      OffsetX.start({
        to:
          actionType === 'drag' || actionType === 'correction'
            ? offset
            : clampedReleaseOffset,
        immediate: immediate || actionType === 'drag',
        onRest: (x) => onRest?.(x),
      });
      if (actionType === 'release') {
        lastOffset.current = clampedReleaseOffset;
        if (itemDimensionMode === 'fixed') {
          index.current = clampIndex(
            getRelativeIndex({ offset: clampedReleaseOffset })
          );
        } else {
          index.current = getCurrentDynamicIndex(offset, ranges);
        }
        if (loadingType === 'lazy') {
          reRender(index.current);
        }
        onChange?.(index.current);

        if (!infinite) {
          onEdges?.(checkEdges({ offset }));
        }
      }
    },
    [
      OffsetX,
      checkEdges,
      clampIndex,
      clampReleaseOffset,
      getRelativeIndex,
      infinite,
      itemDimensionMode,
      loadingType,
      onChange,
      onEdges,
      ranges,
    ]
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
    (x: number) => {
      const offset = infinite
        ? x
        : rubberband(x, rubberbandElasticity, [
            clampOffset.MIN,
            clampOffset.MAX,
          ]);
      springIt({
        offset,
        actionType: 'drag',
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
        const edges = checkEdges({ offset });
        return getNextDynamicOffset({
          offsetX: edges.start ? clampOffset.MIN : offset,
          ranges,
          dir: lastValidDirection.current,
          centered: !!centered,
        });
      }
    },
    [
      centered,
      checkEdges,
      clampOffset.MIN,
      getCurrentIndexByOffset,
      itemDimensionMode,
      itemWidth,
      ranges,
    ]
  );

  const withMomentum = React.useCallback(
    ({ offset, v }: { offset: number; v: number }) => {
      // make this a prop
      const multiplier = 1.6;
      const velocity =
        direction.current === 'left'
          ? -(v * multiplier)
          : direction.current === 'right'
          ? v * multiplier
          : 0;
      const momentumOffset = offset + velocity;
      return momentumOffset;
    },
    []
  );

  const release = React.useCallback(
    ({ offset, v }: { offset: number; v: number }) => {
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

  const navigate = React.useCallback(
    ({ index: _index, direction, immediate }: Navigate) => {
      let targetOffset = 0;

      if (_index) {
        targetOffset = getCurrentOffset({ index: _index });
      } else {
        if (itemDimensionMode === 'fixed') {
          const page = getCurrentIndex({ offset: OffsetX.get() });
          if (direction === 'next') {
            const nextPage = page + 1;
            targetOffset = -nextPage * itemWidth;
          } else if (direction === 'prev') {
            const prevPage = page - 1;
            targetOffset = -prevPage * itemWidth;
          }
        } else {
          targetOffset = getNextDynamicOffset({
            offsetX: OffsetX.get(),
            ranges,
            dir:
              direction === 'next'
                ? 'left'
                : direction === 'prev'
                ? 'right'
                : null,
            centered: !!centered,
          });
        }
      }
      springIt({
        offset: targetOffset,
        immediate,
        actionType: 'release',
      });
    },
    [
      OffsetX,
      centered,
      getCurrentIndex,
      getCurrentOffset,
      itemWidth,
      itemDimensionMode,
      ranges,
      springIt,
    ]
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

  const containerBind = useDrag(
    ({ active, movement: [mx], direction: [dirX], velocity: [vx] }) => {
      const dir = dirX < 0 ? 'left' : dirX > 0 ? 'right' : 'center';
      direction.current = dir;

      if (dir !== 'center') {
        lastValidDirection.current = dir;
      }
      const offset = lastOffset.current + mx;

      isIntentionalDrag.current = Math.abs(mx) >= 40;
      isDragging.current = Math.abs(mx) !== 0;

      if (active) {
        drag(offset);
      } else {
        release({ offset, v: vx * 100 });
      }
    },
    {
      filterTaps: true,
      axis: 'x',
    }
  );

  const handlePressToSlide = React.useCallback(
    (idx: number) => {
      if (!pressToSlide || isDragging.current || isIntentionalDrag.current) {
        return;
      }

      if (itemDimensionMode === 'fixed') {
        const prev = index.current === 0 && idx === dataLength - 1;
        const next = index.current === dataLength - 1 && idx === 0;
        const smaller = idx < index.current;
        const bigger = idx > index.current;

        if (prev) {
          navigate({ direction: 'prev' });
        } else if (next) {
          navigate({ direction: 'next' });
        } else if (smaller) {
          navigate({ direction: 'prev' });
        } else if (bigger) {
          navigate({ direction: 'next' });
        }
      } else {
        const currIndx = getCurrentDynamicIndex(OffsetX.get(), ranges);
        if (idx < currIndx) {
          navigate({ direction: 'prev' });
        } else if (idx > currIndx) {
          navigate({ direction: 'next' });
        }
      }
    },
    [
      OffsetX,
      dataLength,
      index,
      itemDimensionMode,
      navigate,
      pressToSlide,
      ranges,
    ]
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
      const alignment = centered ? 'center' : 'start';

      springIt({
        offset: -(ranges[0]?.range[alignment] || 0),
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

  useValueChangeReaction(containerWidthProp, (width) => {
    setContainerDimensions({
      width,
    });
  });

  React.useEffect(() => {
    if (!infinite) {
      navigate({ index: 0, immediate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [infinite]);

  //endregion

  React.useImperativeHandle<ReactSlipAndSlideRef, ReactSlipAndSlideRef>(
    ref,
    () => ({
      next: () => navigate({ direction: 'next' }),
      previous: () => navigate({ direction: 'prev' }),
      goTo: ({ index, animated }) => navigate({ index, immediate: !animated }),
      move,
    }),
    [move, navigate]
  );

  const shouldRender = React.useCallback(
    (i: number) => {
      if (loadingType === 'eager') {
        return true;
      }
      return isInRange(i, {
        dataLength,
        viewSize: itemWidth,
        visibleItems: visibleItems || Math.round(dataLength / 2),
        offsetX: OffsetX.get(),
      });
    },
    [OffsetX, dataLength, itemWidth, loadingType, visibleItems]
  );

  return (
    <Styled.Wrapper
      ref={containerRef}
      willMeasure
      {...containerBind()}
      style={{
        opacity: Opacity,
        justifyContent: centered ? 'center' : 'flex-start',
        width: containerWidthProp || '100%',
        height: itemHeight || container.height || '100%',
        overflow: overflowHidden ? 'hidden' : undefined,
        touchAction: 'pan-y',
      }}
    >
      {data.map((props, i) => (
        <LazyLoad key={i} render={shouldRender(i)}>
          <Item<T>
            ref={itemRefs[i]}
            index={i}
            itemDimensionMode={itemDimensionMode}
            item={props}
            dataLength={dataLength}
            renderItem={renderItem}
            infinite={infinite}
            itemHeight={itemHeight}
            itemWidth={
              itemDimensionMode === 'fixed' ? itemWidth : ranges[i]?.width || 0
            }
            interpolators={interpolators || {}}
            dynamicOffset={ranges[i]?.range[centered ? 'center' : 'start'] || 0}
            onPress={() => pressToSlide && handlePressToSlide(i)}
            offsetX={OffsetX.to((offsetX) =>
              infinite ? offsetX % wrapperWidth : offsetX
            )}
            isLazy={loadingType === 'lazy'}
          />
        </LazyLoad>
      ))}
    </Styled.Wrapper>
  );
}

function ItemComponent<T extends object>(
  {
    offsetX,
    dataLength,
    index,
    infinite,
    itemWidth,
    itemHeight,
    item,
    interpolators,
    dynamicOffset,
    itemDimensionMode: mode,
    isLazy,
    renderItem,
    onPress,
  }: React.PropsWithChildren<ItemProps<T>>,
  ref?: React.Ref<BoxRef>
) {
  const Opacity = React.useMemo(() => {
    return new SpringValue<number>(isLazy ? 0 : 1, {
      config: {
        tension: 260,
        friction: 32,
        mass: 1,
      },
    });
  }, [isLazy]);

  const x = displacement({
    offsetX,
    dataLength,
    index,
    itemWidth,
    infinite,
  });

  const keys = Object.entries(interpolators) as [
    keyof typeof interpolators,
    number
  ][];

  const translateX: Interpolation<number, number> = React.useMemo(() => {
    if (mode === 'fixed') {
      return x
        .to((val) => val / itemWidth)
        .to([-1, 0, 1], [-itemWidth, 0, itemWidth]);
    }
    return to(offsetX, (x) => x + dynamicOffset);
  }, [dynamicOffset, itemWidth, mode, offsetX, x]);

  const mapInterpolators = React.useMemo(
    () =>
      keys.reduce((acc, [key, val]) => {
        acc[key] = translateX
          .to((val) => val / itemWidth)
          .to([-1, 0, 1], [val, 1, val], 'clamp');
        return acc;
      }, {} as Interpolators<Interpolation<number, any>>),
    [itemWidth, keys, translateX]
  );

  React.useEffect(() => {
    if (isLazy) {
      Opacity.start({
        to: 1,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLazy]);

  const memoRenderItem = React.useMemo(() => {
    return renderItem({ item, index });
  }, [index, item, renderItem]);

  return (
    <Styled.Item
      ref={ref}
      willMeasure
      onPress={onPress}
      style={{
        translateX,
        ...mapInterpolators,
        width: itemWidth === 0 ? undefined : itemWidth,
        height: itemHeight,
      }}
      web={{
        onDragStart: (e: any) => e.preventDefault(),
      }}
    >
      <AnimatedBox
        style={{
          width: '100%',
          height: '100%',
          opacity: Opacity,
        }}
      >
        {memoRenderItem}
      </AnimatedBox>
    </Styled.Item>
  );
}

export const Item = React.forwardRef(ItemComponent) as <T extends object>(
  props: React.PropsWithChildren<ItemProps<T>> & {
    ref?: React.Ref<BoxRef>;
  }
) => ReturnType<typeof ItemComponent>;

export const ForwardReactSlipAndSlideRef = React.forwardRef(
  ReactSlipAndSlideComponent
) as <T extends object>(
  props: ReactSlipAndSlideProps<T> & {
    ref?: React.Ref<ReactSlipAndSlideRef>;
  }
) => ReturnType<typeof ReactSlipAndSlideComponent>;

function ReactSlipAndSlideWithContext<T extends object>(
  props: ReactSlipAndSlideProps<T>,
  ref: React.Ref<ReactSlipAndSlideRef>
) {
  return (
    <Context.DataProvider initialData={Context.initializeContextData<T>(props)}>
      <ForwardReactSlipAndSlideRef ref={ref} {...props} />
    </Context.DataProvider>
  );
}

const ForwardReactSlipAndSlideWithContextRef = React.forwardRef(
  ReactSlipAndSlideWithContext
) as <T extends object>(
  props: ReactSlipAndSlideProps<T> & {
    ref?: React.Ref<ReactSlipAndSlideRef>;
  }
) => ReturnType<typeof ReactSlipAndSlideWithContext>;

export const ReactSlipAndSlide = typedMemo(
  ForwardReactSlipAndSlideWithContextRef
);
