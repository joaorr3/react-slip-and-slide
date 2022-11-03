import {
  ContainerDimensions,
  Direction,
  Interpolators,
  ItemProps,
  Mode,
  Navigate,
  ReactSlipAndSlideProps,
  ReactSlipAndSlideRef,
  SpringIt,
  ValidDirection,
} from "@react-slip-and-slide/models";
import {
  displacement,
  getCurrentDynamicIndex,
  getNextDynamicOffset,
  LazyLoad,
  rubberband,
  Styled,
  typedMemo,
  useDynamicDimension,
  useItemsRange,
  useScreenDimensions,
  isInRange,
  AnimatedBox,
} from "@react-slip-and-slide/utils";
import { useDrag } from "@use-gesture/react";
import { clamp } from "lodash";
import React from "react";
import { Interpolation, SpringValue, to } from "react-spring";

function ReactSlipAndSlideComponent<T>(
  {
    data,
    snap,
    centered,
    infinite: _infinite,
    containerWidth,
    overflowHidden = true,
    itemHeight,
    itemWidth = 0,
    pressToSlide,
    interpolators,
    animateStartup = true,
    rubberbandElasticity = 4,
    visibleItems = 0,
    renderItem,
    onChange,
    onEdges,
    onReady,
  }: ReactSlipAndSlideProps<T>,
  ref: React.Ref<ReactSlipAndSlideRef>
) {
  const mode: Mode = itemWidth && itemHeight ? "fixed" : "dynamic";
  const infinite = mode === "fixed" && !!_infinite;
  // LazyLoad only if necessary
  const eagerLoading = mode === "dynamic" || visibleItems === 0;

  const shouldAnimatedStartup = animateStartup && eagerLoading;

  const index = React.useRef(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, reRender] = React.useState<number>(0);
  const lastOffset = React.useRef(0);
  const [container, setContainerDimensions] = React.useState<ContainerDimensions>({
    width: containerWidth || 0,
    height: itemHeight || 0,
  });

  const [_wrapperWidth, _setWrapperWidth] = React.useState<number>(0);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const isDragging = React.useRef<boolean>(false);
  const direction = React.useRef<Direction>("center");
  const lastValidDirection = React.useRef<ValidDirection | null>(null);
  const isIntentionalDrag = React.useRef<boolean>(false);

  const OffsetX = React.useMemo(() => {
    return new SpringValue<number>(0, {
      config: {
        tension: 260,
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

  const { width } = useScreenDimensions();

  React.useEffect(() => {
    if (containerRef.current && (!containerWidth || !itemHeight)) {
      const { offsetWidth, clientWidth, offsetHeight, clientHeight } = containerRef.current;
      setContainerDimensions({
        width: containerWidth || offsetWidth || clientWidth,
        height: itemHeight || offsetHeight || clientHeight,
      });
    }
  }, [containerWidth, containerRef, itemHeight, width]);

  const { itemRefs, itemDimensionMap } = useDynamicDimension({
    mode,
    dataLength: data.length,
    onMeasure: ({ itemWidthSum }) => {
      if (itemWidthSum) {
        _setWrapperWidth(itemWidthSum);
      }
    },
  });

  const { ranges } = useItemsRange({ mode, itemDimensionMap, offsetX: OffsetX.get() });

  React.useEffect(() => {
    if (!itemHeight && itemDimensionMap.length) {
      setContainerDimensions((prev) => ({
        ...prev,
        height: itemDimensionMap[0].height,
      }));
    }
  }, [itemDimensionMap, itemHeight]);

  const processClampOffsets = React.useCallback(
    ({ wrapperWidth, sideMargins }: { wrapperWidth: number; sideMargins: number }) => {
      const MIN = 0;
      let MAX = -wrapperWidth + container.width;

      if (centered) {
        const _MAX_CENTERED = MAX - sideMargins * 2;
        MAX = _MAX_CENTERED;
      } else {
        // In this case i guess you don't need a slider.
        if (wrapperWidth < container.width) {
          MAX = MIN;
        }
      }

      return {
        MIN,
        MAX,
      };
    },
    [centered, container.width]
  );

  const { dataLength, wrapperWidth, clampOffset } = React.useMemo(() => {
    const wrapperWidth = mode === "fixed" ? data.length * itemWidth : _wrapperWidth;
    const sideMargins = (container.width - itemWidth) / 2;

    const { MIN, MAX } = processClampOffsets({ wrapperWidth, sideMargins });

    return {
      dataLength: data.length,
      wrapperWidth,
      sideMargins,
      halfItem: itemWidth / 2,
      clampOffset: {
        MIN,
        MAX,
      },
    };
  }, [_wrapperWidth, container.width, data.length, itemWidth, mode, processClampOffsets]);

  const clampReleaseOffset = React.useCallback(
    (offset: number) => {
      if (infinite && mode === "fixed") {
        return offset;
      }

      if (offset > clampOffset.MIN) {
        return clampOffset.MIN;
      } else if (offset < clampOffset.MAX) {
        return clampOffset.MAX;
      }
      return offset;
    },
    [clampOffset.MAX, clampOffset.MIN, infinite, mode]
  );

  const clampIndex = React.useCallback((index: number) => clamp(index, 0, dataLength - 1), [dataLength]);

  const processIndex = React.useCallback(
    ({ offset }: { offset: number }) => {
      const modIndex = (offset / itemWidth) % dataLength;
      return offset <= 0 ? Math.abs(modIndex) : Math.abs(modIndex > 0 ? dataLength - modIndex : 0);
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
      if (offset >= clampOffset.MIN) {
        return { start: true, end: false };
      } else if (offset <= clampOffset.MAX) {
        return { start: false, end: true };
      } else {
        return { start: false, end: false };
      }
    },
    [clampOffset.MAX, clampOffset.MIN]
  );

  const springIt = React.useCallback(
    ({ offset, immediate, actionType, onRest }: SpringIt) => {
      const clampedReleaseOffset = clampReleaseOffset(offset);
      OffsetX.start({
        to: actionType === "drag" || actionType === "correction" ? offset : clampedReleaseOffset,
        immediate: immediate || actionType === "drag",
        onRest: (x) => onRest?.(x),
      });
      if (actionType === "release") {
        lastOffset.current = clampedReleaseOffset;
        if (mode === "fixed") {
          index.current = clampIndex(getRelativeIndex({ offset: clampedReleaseOffset }));
        } else {
          index.current = getCurrentDynamicIndex(offset, ranges);
        }
        if (!eagerLoading) {
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
      eagerLoading,
      getRelativeIndex,
      infinite,
      mode,
      onChange,
      onEdges,
      ranges,
    ]
  );

  const getCurrentIndexByOffset = React.useCallback(
    (offset: number) => {
      let finalIndex: number = 0;
      const neutralIndex = (offset / wrapperWidth) * dataLength;

      const left = Math.ceil(neutralIndex);
      const right = Math.floor(neutralIndex);

      if (!snap) {
        return right;
      }

      switch (direction.current) {
        case "left":
          finalIndex = left;
          break;
        case "right":
          finalIndex = right;
          break;
        default:
          if (lastValidDirection.current === "left") {
            finalIndex = left;
          } else if (lastValidDirection.current === "right") {
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
      const offset = infinite ? x : rubberband(x, rubberbandElasticity, [clampOffset.MIN, clampOffset.MAX]);
      springIt({
        offset,
        actionType: "drag",
      });
    },
    [clampOffset, infinite, rubberbandElasticity, springIt]
  );

  const withSnap = React.useCallback(
    ({ offset }: { offset: number }) => {
      if (mode === "fixed") {
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
    [centered, checkEdges, clampOffset.MIN, getCurrentIndexByOffset, itemWidth, mode, ranges]
  );

  const withMomentum = React.useCallback(({ offset, v }: { offset: number; v: number }) => {
    const velocity = direction.current === "left" ? -v : direction.current === "right" ? v : 0;
    const momentumOffset = offset + velocity;
    return momentumOffset;
  }, []);

  const release = React.useCallback(
    ({ offset, v }: { offset: number; v: number }) => {
      let offsetX: number = 0;

      if (snap) {
        if (isIntentionalDrag.current) {
          offsetX = withSnap({ offset });
        } else {
          springIt({
            offset: lastOffset.current,
            actionType: "correction",
          });
          return;
        }
      } else {
        offsetX = withMomentum({ offset, v });
      }

      springIt({
        offset: offsetX,
        actionType: "release",
      });
    },
    [snap, springIt, withMomentum, withSnap]
  );

  const navigate = React.useCallback(
    ({ index: _index, direction, immediate }: Navigate) => {
      let targetOffset: number = 0;

      if (_index) {
        targetOffset = getCurrentOffset({ index: _index });
      } else {
        if (mode === "fixed") {
          const page = getCurrentIndex({ offset: OffsetX.get() });
          if (direction === "next") {
            const nextPage = page + 1;
            targetOffset = -nextPage * itemWidth;
          } else if (direction === "prev") {
            const prevPage = page - 1;
            targetOffset = -prevPage * itemWidth;
          }
        } else {
          targetOffset = getNextDynamicOffset({
            offsetX: OffsetX.get(),
            ranges,
            dir: direction === "next" ? "left" : direction === "prev" ? "right" : null,
            centered: !!centered,
          });
        }
      }
      springIt({
        offset: targetOffset,
        immediate,
        actionType: "release",
      });
    },
    [OffsetX, centered, getCurrentIndex, getCurrentOffset, itemWidth, mode, ranges, springIt]
  );

  const move = React.useCallback(
    (offset: number) => {
      springIt({
        offset: OffsetX.get() + offset,
        actionType: "release",
      });
    },
    [OffsetX, springIt]
  );

  const containerBind = useDrag(
    ({ active, movement: [mx], direction: [dirX], velocity: [vx] }) => {
      const dir = dirX < 0 ? "left" : dirX > 0 ? "right" : "center";
      direction.current = dir;

      if (dir !== "center") {
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
    }
  );

  const handlePressToSlide = React.useCallback(
    (idx: number) => {
      if (!pressToSlide || isDragging.current || isIntentionalDrag.current) {
        return;
      }

      if (mode === "fixed") {
        const prev = index.current === 0 && idx === dataLength - 1;
        const next = index.current === dataLength - 1 && idx === 0;
        const smaller = idx < index.current;
        const bigger = idx > index.current;

        if (prev) {
          navigate({ direction: "prev" });
        } else if (next) {
          navigate({ direction: "next" });
        } else if (smaller) {
          navigate({ direction: "prev" });
        } else if (bigger) {
          navigate({ direction: "next" });
        }
      } else {
        const currIndx = getCurrentDynamicIndex(OffsetX.get(), ranges);
        if (idx < currIndx) {
          navigate({ direction: "prev" });
        } else if (idx > currIndx) {
          navigate({ direction: "next" });
        }
      }
    },
    [OffsetX, dataLength, index, mode, navigate, pressToSlide, ranges]
  );

  //region FX
  React.useEffect(() => {
    if (shouldAnimatedStartup) {
      if (mode === "dynamic") {
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
    if (mode === "dynamic" && centered) {
      const alignment = centered ? "center" : "start";

      springIt({
        offset: -(ranges[0]?.range[alignment] || 0),
        actionType: "release",
        immediate: true,
      });
    }
  }, [centered, mode, ranges, springIt]);

  // Reset to new clampOffset.MAX if is at the end edge and page is resized
  React.useEffect(() => {
    const { end } = checkEdges({ offset: OffsetX.get() });
    if (end) {
      springIt({
        offset: clampOffset.MAX,
        actionType: "release",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clampOffset.MAX]);

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
      next: () => navigate({ direction: "next" }),
      previous: () => navigate({ direction: "prev" }),
      goTo: ({ index, animated }) => navigate({ index, immediate: !animated }),
      move,
    }),
    [move, navigate]
  );

  const shouldRender = React.useCallback(
    (i: number) => {
      if (eagerLoading) {
        return true;
      }
      return isInRange(i, {
        dataLength,
        viewSize: itemWidth,
        visibleItems: visibleItems || Math.round(dataLength / 2),
        offsetX: OffsetX.get(),
      });
    },
    [OffsetX, dataLength, eagerLoading, itemWidth, visibleItems]
  );

  return (
    <Styled.Wrapper
      ref={containerRef}
      className="wrapper"
      {...containerBind()}
      style={{
        opacity: Opacity,
        justifyContent: centered ? "center" : "flex-start",
        width: containerWidth || "100%",
        height: itemHeight || container.height || "100%",
        overflow: overflowHidden ? "hidden" : undefined,
      }}
    >
      {data.map((props, i) => (
        <LazyLoad key={i} render={shouldRender(i)}>
          <Item
            ref={itemRefs[i]}
            index={i}
            mode={mode}
            item={props}
            dataLength={dataLength}
            renderItem={renderItem}
            infinite={infinite}
            itemHeight={itemHeight}
            itemWidth={mode === "fixed" ? itemWidth : ranges[i]?.width || 0}
            interpolators={interpolators || {}}
            dynamicOffset={ranges[i]?.range[centered ? "center" : "start"] || 0}
            onPress={() => pressToSlide && handlePressToSlide(i)}
            offsetX={OffsetX.to((offsetX) => (infinite ? offsetX % wrapperWidth : offsetX))}
            isLazy={!eagerLoading}
          />
        </LazyLoad>
      ))}
    </Styled.Wrapper>
  );
}

function ItemComponent<T>(
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
    mode,
    isLazy,
    renderItem,
    onPress,
  }: React.PropsWithChildren<ItemProps<T>>,
  ref?: React.Ref<HTMLDivElement>
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

  const keys = Object.entries(interpolators) as [keyof typeof interpolators, number][];

  const translateX: Interpolation<number, number> = React.useMemo(() => {
    if (mode === "fixed") {
      return x.to((val) => val / itemWidth).to([-1, 0, 1], [-itemWidth, 0, itemWidth]);
    }
    return to(offsetX, (x) => x + dynamicOffset);
  }, [dynamicOffset, itemWidth, mode, offsetX, x]);

  const mapInterpolators = React.useMemo(
    () =>
      keys.reduce((acc, [key, val]) => {
        acc[key] = translateX.to((val) => val / itemWidth).to([-1, 0, 1], [val, 1, val], "clamp");
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
      onClick={onPress}
      style={{
        translateX,
        ...mapInterpolators,
        width: itemWidth === 0 ? undefined : itemWidth,
        height: itemHeight,
      }}
      onDragStart={(e) => e.preventDefault()}
    >
      <AnimatedBox
        style={{
          width: "100%",
          height: "100%",
          opacity: Opacity,
        }}
      >
        {memoRenderItem}
      </AnimatedBox>
    </Styled.Item>
  );
}

export const Item = React.forwardRef(ItemComponent) as <T>(
  props: React.PropsWithChildren<ItemProps<T>> & {
    ref?: React.Ref<HTMLDivElement>;
  }
) => ReturnType<typeof ItemComponent>;

export const ForwardReactSlipAndSlideRef = React.forwardRef(ReactSlipAndSlideComponent) as <T>(
  props: ReactSlipAndSlideProps<T> & {
    ref?: React.Ref<ReactSlipAndSlideRef>;
  }
) => ReturnType<typeof ReactSlipAndSlideComponent>;

export const ReactSlipAndSlide = typedMemo(ForwardReactSlipAndSlideRef);
