import {
  type BoxRef,
  type Direction,
  type Edges,
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
  clampIndex,
  Context,
  displacement,
  GestureContainer,
  getCurrentDynamicIndex,
  getNextDynamicOffset,
  isInRange,
  LazyLoad,
  rubberband,
  Styled,
  to,
  typedMemo,
  useDynamicDimension,
  useIsFirstRender,
  useScreenDimensions,
  useSpringValue,
  useValueChangeReaction,
  type Interpolation,
} from '@react-slip-and-slide/utils';
import { clamp, debounce } from 'lodash';
import React from 'react';
import { Engine } from './Engine';

function ReactSlipAndSlideComponent<T extends object>(
  {
    // data,
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
      data,
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
      rangeOffsetPosition,
      engineMode,
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

  const OffsetX = useSpringValue(0, {
    config: {
      tension: 220,
      friction: 32,
      mass: 1,
    },
  });

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
      containerRef.current?.measure().then((m) => {
        setContainerDimensions({
          width: m.width,
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container, screenWidth]);

  const { itemRefs } = useDynamicDimension();

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

      // Refer to line 148
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
      }, 800),
    [onEdges]
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
        onRest: (x) => {
          onRest?.(x);
        },
      });
      if (actionType === 'release') {
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

        if (!infinite) {
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
      itemDimensionMode,
      loadingType,
      onChanged,
      onEdge,
      rangeOffsetPosition,
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

  const navigate = React.useCallback(
    ({ index: _index, direction: dir, immediate }: Navigate) => {
      let targetOffset = 0;

      if (_index) {
        targetOffset = getCurrentOffset({ index: _index });
      } else {
        if (itemDimensionMode === 'fixed') {
          const page = getCurrentIndex({ offset: OffsetX.get() });
          if (dir === 'next') {
            const nextPage = page + 1;
            targetOffset = -nextPage * itemWidth;
          } else if (dir === 'prev') {
            const prevPage = page - 1;
            targetOffset = -prevPage * itemWidth;
          }
        } else {
          const nextDir =
            dir === 'next' ? 'left' : dir === 'prev' ? 'right' : null;

          targetOffset = getNextDynamicOffset({
            offsetX: OffsetX.get(),
            ranges,
            lastValidDirection: nextDir,
            direction: direction.current,
            clampOffset,
            rangeOffsetPosition,
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
      springIt,
      getCurrentOffset,
      itemDimensionMode,
      getCurrentIndex,
      OffsetX,
      itemWidth,
      ranges,
      clampOffset,
      rangeOffsetPosition,
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
        const currIndx =
          getCurrentDynamicIndex(
            OffsetX.get(),
            ranges,
            lastValidDirection.current,
            direction.current,
            clampOffset,
            rangeOffsetPosition
          ) || 0;
        if (idx < currIndx) {
          navigate({ direction: 'prev' });
        } else if (idx > currIndx) {
          navigate({ direction: 'next' });
        }
      }
    },
    [
      OffsetX,
      clampOffset,
      dataLength,
      itemDimensionMode,
      navigate,
      pressToSlide,
      rangeOffsetPosition,
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
    <GestureContainer
      ref={containerRef}
      direction={direction}
      isDragging={isDragging}
      isIntentionalDrag={isIntentionalDrag}
      lastOffset={lastOffset}
      lastValidDirection={lastValidDirection}
      style={{
        opacity: Opacity,
      }}
      styles={{
        justifyContent: centered ? 'center' : 'flex-start',
        width: containerWidthProp || '100%',
        height: container.height || '100%',
        minHeight: container.height,
        overflow: overflowHidden ? 'hidden' : undefined,
      }}
      onDrag={drag}
      onRelease={release}
    >
      <Engine
        OffsetX={OffsetX}
        onSlidePress={handlePressToSlide}
        renderItem={renderItem}
      />
      {/* {engineMode === 'single' ? (
        <AnimatedBox
          style={{
            transform: [
              {
                translateX: OffsetX,
              },
            ],
          }}
          styles={{
            display: 'flex',
            flexDirection: 'row',
            width: itemWidth === 0 ? undefined : itemWidth,
            height: itemHeight === 0 ? undefined : itemHeight,
          }}
        >
          {data.map((props, i) => (
            <AnimatedBox
              ref={itemRefs[i]}
              styles={{
                width: itemWidth === 0 ? undefined : itemWidth,
                height: itemHeight === 0 ? undefined : itemHeight,
              }}
              web={{
                onDragStart: (e: any) => e.preventDefault(),
              }}
            >
              {renderItem({ item: props, index: i })}
            </AnimatedBox>
          ))}
        </AnimatedBox>
      ) : (
        <React.Fragment>
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
                  itemDimensionMode === 'fixed'
                    ? itemWidth
                    : ranges[i]?.width || 0
                }
                interpolators={interpolators || {}}
                dynamicOffset={ranges[i]?.range[rangeOffsetPosition] || 0}
                onPress={() => pressToSlide && handlePressToSlide(i)}
                offsetX={OffsetX.to((offsetX) =>
                  infinite ? offsetX % wrapperWidth : offsetX
                )}
                isLazy={loadingType === 'lazy'}
              />
            </LazyLoad>
          ))}
        </React.Fragment>
      )} */}
    </GestureContainer>
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
  const Opacity = useSpringValue(isLazy ? 0 : 1, {
    config: {
      tension: 220,
      friction: 32,
      mass: 1,
    },
  });

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

  const { scale, opacity } = React.useMemo(
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
        transform: [
          {
            translateX,
          },
          {
            scale: itemWidth ? scale : 1,
          },
        ],
        opacity: itemWidth ? opacity : 1,
      }}
      styles={{
        width: itemWidth === 0 ? undefined : itemWidth,
        height: itemHeight === 0 ? undefined : itemHeight,
      }}
      web={{
        onDragStart: (e: any) => e.preventDefault(),
      }}
    >
      <AnimatedBox
        styles={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
        }}
        style={{
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
