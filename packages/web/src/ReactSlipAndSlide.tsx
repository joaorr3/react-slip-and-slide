import {
  BoxRef,
  Direction,
  Navigate,
  ReactSlipAndSlideProps,
  ReactSlipAndSlideRef,
  SpringIt,
  ValidDirection,
} from "@react-slip-and-slide/models";
import {
  getCurrentDynamicIndex,
  getNextDynamicOffset,
  rubberband,
  Styled,
  typedMemo,
  useIsFirstRender,
  usePreviousValue,
  useScreenDimensions,
} from "@react-slip-and-slide/utils";
import { useDrag } from "@use-gesture/react";
import { clamp } from "lodash";
import React from "react";
import { SpringValue } from "react-spring";
import { DataProvider, initializeContextData, useDataContext } from "./Context";
import { Engine } from "./Engine";

function ReactSlipAndSlideComponent<T>(
  {
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
      itemDimensions: { width: itemWidth = 0 },
      loadingType,
      centered,
      infinite,
      itemDimensionMode,
      container,
      wrapperWidth,
      clampOffset,
      ranges,
    },
    actions: { setContainerDimensions },
  } = useDataContext<T>();

  const isFirstRender = useIsFirstRender();

  const index = React.useRef(0);
  const [, reRender] = React.useState<number>(0);
  const lastOffset = React.useRef(0);

  const containerRef = React.useRef<BoxRef>(null);
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
    const initialOpacity = animateStartup ? 0 : 1;
    return new SpringValue<number>(initialOpacity, {
      config: {
        tension: 260,
        friction: 32,
        mass: 1,
      },
    });
  }, [animateStartup]);

  const { width: screenWidth } = useScreenDimensions();

  // If containerWidthProp if undefined or 0 the fallback is 100% and we need to measure it
  React.useLayoutEffect(() => {
    if (!containerWidthProp) {
      containerRef.current?.measure().then((m) => {
        console.log("m: ", m);
        setContainerDimensions({
          width: m.width,
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [container, screenWidth]);

  const clampReleaseOffset = React.useCallback(
    (offset: number) => {
      if (infinite && itemDimensionMode === "fixed") {
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

  const clampIndex = React.useCallback((index: number) => clamp(index, 0, dataLength - 1), [dataLength]);

  const processIndex = React.useCallback(
    ({ offset }: { offset: number }) => {
      if (itemWidth) {
        const modIndex = (offset / itemWidth) % dataLength;
        return offset <= 0 ? Math.abs(modIndex) : Math.abs(modIndex > 0 ? dataLength - modIndex : 0);
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
        to: actionType === "drag" || actionType === "correction" ? offset : clampedReleaseOffset,
        immediate: immediate || actionType === "drag",
        onRest: (x) => onRest?.(x),
      });
      if (actionType === "release") {
        lastOffset.current = clampedReleaseOffset;
        if (itemDimensionMode === "fixed") {
          index.current = clampIndex(getRelativeIndex({ offset: clampedReleaseOffset }));
        } else {
          index.current = getCurrentDynamicIndex(offset, ranges);
        }
        if (loadingType === "lazy") {
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
      if (itemDimensionMode === "fixed") {
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
    [centered, checkEdges, clampOffset.MIN, getCurrentIndexByOffset, itemWidth, itemDimensionMode, ranges]
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
        if (itemDimensionMode === "fixed") {
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
    [OffsetX, centered, getCurrentIndex, getCurrentOffset, itemWidth, itemDimensionMode, ranges, springIt]
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
      axis: "x",
    }
  );

  const handlePressToSlide = React.useCallback(
    (idx: number) => {
      if (!pressToSlide || isDragging.current || isIntentionalDrag.current) {
        return;
      }

      if (itemDimensionMode === "fixed") {
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
    [OffsetX, dataLength, index, itemDimensionMode, navigate, pressToSlide, ranges]
  );

  //region FX
  React.useEffect(() => {
    if (animateStartup) {
      if (itemDimensionMode === "dynamic") {
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
  }, [Opacity, container.height, ranges.length, animateStartup]);

  // Fixes initial offset when: mode === dynamic and centered is true
  React.useEffect(() => {
    if (itemDimensionMode === "dynamic" && centered) {
      const alignment = centered ? "center" : "start";

      springIt({
        offset: -(ranges[0]?.range[alignment] || 0),
        actionType: "release",
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
        actionType: "release",
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

  // Check containerWidthProp
  const prevContainerWidth = usePreviousValue(containerWidthProp);
  React.useEffect(() => {
    if (containerWidthProp && containerWidthProp !== prevContainerWidth) {
      setContainerDimensions({
        width: containerWidthProp,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerWidthProp]);

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

  return (
    <Styled.Wrapper
      ref={containerRef}
      willMeasure
      {...containerBind()}
      styles={{
        justifyContent: centered ? "center" : "flex-start",
        width: containerWidthProp || "100%",
        height: container.height || "100%",
        overflow: overflowHidden ? "hidden" : undefined,
        touchAction: "pan-y",
      }}
      style={{
        opacity: Opacity,
      }}
    >
      <Engine OffsetX={OffsetX} renderItem={renderItem} onPress={(i) => pressToSlide && handlePressToSlide(i)} />
    </Styled.Wrapper>
  );
}

export const ForwardReactSlipAndSlideRef = React.forwardRef(ReactSlipAndSlideComponent) as <T>(
  props: ReactSlipAndSlideProps<T> & {
    ref?: React.Ref<ReactSlipAndSlideRef>;
  }
) => ReturnType<typeof ReactSlipAndSlideComponent>;

function ReactSlipAndSlideWithContext<T>(props: ReactSlipAndSlideProps<T>, ref: React.Ref<ReactSlipAndSlideRef>) {
  return (
    <DataProvider initialData={initializeContextData<T>(props)}>
      <ForwardReactSlipAndSlideRef ref={ref} {...props} />
    </DataProvider>
  );
}

export const ForwardReactSlipAndSlideWithContextRef = React.forwardRef(ReactSlipAndSlideWithContext) as <T>(
  props: ReactSlipAndSlideProps<T> & {
    ref?: React.Ref<ReactSlipAndSlideRef>;
  }
) => ReturnType<typeof ReactSlipAndSlideWithContext>;

export const ReactSlipAndSlide = typedMemo(ForwardReactSlipAndSlideWithContextRef);
