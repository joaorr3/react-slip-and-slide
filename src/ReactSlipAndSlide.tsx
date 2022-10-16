import { FluidValue } from "@react-spring/shared";
import { AnimationResult, Interpolation, SpringValue } from "react-spring";
import { useDrag } from "@use-gesture/react";
import { clamp } from "lodash";
import React, { CSSProperties } from "react";
import { to } from "react-spring";
import * as Styled from "./styles";
import { displacement } from "./utils/displacement";
import {
  getCurrentDynamicIndex,
  getNextDynamicOffset,
  useDynamicDimension,
  useItemsRange,
} from "./utils/useDynamicDimension";
import { useScreenDimensions } from "./utils/useScreenDimensions";

export type ReactSlipAndSlideRef = {
  next: () => void;
  previous: () => void;
  goTo: (params: { index: number; animated?: boolean }) => void;
};

export type ValidDirection = "left" | "right";
type Direction = ValidDirection | "center";
type ActionType = "drag" | "release" | "correction";
type SpringIt = {
  offset: number;
  immediate?: boolean;
  onRest?: (x: AnimationResult<SpringValue<number>>) => void;
  actionType: ActionType;
};
type Navigate = {
  index?: number;
  direction?: "next" | "prev";
  immediate?: boolean;
};

type RenderItemProps<T> = {
  item: T;
  index: number;
};

type RenderItem<T> = (props: RenderItemProps<T>) => JSX.Element;

type Interpolators<T> = {
  [key in keyof CSSProperties]: T;
};

export type ReactSlipAndSlideProps<T> = {
  data: T[];
  snap?: boolean;
  centered?: boolean;
  infinite?: boolean;
  /**
   * Useful in some edge cases.
   * For ex, if you have a big container, small items and a small data.length.
   * @default undefined
   */
  // clonesNumber?: number;
  pressToSlide?: boolean;
  containerWidth?: number;
  /**
   * If itemWidth is not provided it's assumed that infinite feature is turned off.
   * Also, be aware that if itemWidth is undefined some extra work is required and that could be expensive.
   */
  itemWidth?: number;
  itemHeight?: number;
  interpolators?: Interpolators<number>;
  /**
   * Animates opacity on start up
   * @default true
   */
  animateStartup?: boolean;
  renderItem: RenderItem<T>;
  onChange?: (index: number) => void;
  onEdges?: (props: { start: boolean; end: boolean }) => void;
  onReady?: (ready: boolean) => void;
};

type ItemProps<T> = {
  item: T;
  dataLength: number;
  index: number;
  offsetX: FluidValue<number>;
  infinite: boolean;
  itemWidth: number;
  itemHeight?: number;
  interpolators: Interpolators<number>;
  dynamicOffset: number;
  mode: Mode;
  renderItem: RenderItem<T>;
  onPress?: () => void;
};

type ContainerDimensions = {
  width: number;
  height: number;
};

export type Mode = "dynamic" | "fixed";

function ReactSlipAndSlideComponent<T>(
  {
    data,
    snap,
    centered,
    infinite: _infinite,
    containerWidth,
    itemHeight,
    itemWidth = 0,
    pressToSlide,
    interpolators,
    animateStartup = true,
    renderItem,
    onChange,
    onEdges,
    onReady,
  }: ReactSlipAndSlideProps<T>,
  ref: React.Ref<ReactSlipAndSlideRef>
) {
  const mode: Mode = itemWidth && itemHeight ? "fixed" : "dynamic";
  const infinite = mode === "fixed" && !!_infinite;

  const [index, setIndex] = React.useState(0);
  const prevIndex = React.useRef(0);
  const [lastOffset, setLastOffset] = React.useState(0);
  const [container, setContainerDimensions] = React.useState<ContainerDimensions>({
    width: containerWidth || 0,
    height: itemHeight || 0,
  });
  const [edges, setEdges] = React.useState<{ start: boolean; end: boolean }>({
    start: false,
    end: false,
  });

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
    return new SpringValue<number>(animateStartup ? 0 : 1, {
      config: {
        tension: 260,
        friction: 32,
        mass: 1,
      },
    });
  }, [animateStartup]);

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

  const [_wrapperWidth, _setWrapperWidth] = React.useState<number>(0);

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

  const { dataLength, wrapperWidth, clampOffset } = React.useMemo(() => {
    const wrapperWidth = mode === "fixed" ? data.length * itemWidth : _wrapperWidth;
    const sideMargins = (container.width - itemWidth) / 2;

    const MIN = 0;
    const _MAX = -wrapperWidth + container.width;
    const _MAX_CENTERED = _MAX - sideMargins * 2;
    const MAX = centered ? _MAX_CENTERED : _MAX;

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
  }, [_wrapperWidth, centered, container.width, data.length, itemWidth, mode]);

  const clampReleaseOffset = React.useCallback(
    (offset: number) => {
      if (infinite && mode === "fixed") {
        return offset;
      }

      if (offset > clampOffset.MIN) {
        return clampOffset.MIN;
      } else if (offset < clampOffset.MAX) {
        if (wrapperWidth < container.width) {
          return clampOffset.MIN;
        }
        return clampOffset.MAX;
      }
      return offset;
    },
    [clampOffset.MAX, clampOffset.MIN, container.width, infinite, mode, wrapperWidth]
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
        setLastOffset(clampedReleaseOffset);
        if (mode === "fixed") {
          setIndex(clampIndex(getRelativeIndex({ offset: clampedReleaseOffset })));
        } else {
          setIndex(getCurrentDynamicIndex(offset, ranges));
        }
        if (!infinite) {
          setEdges(checkEdges({ offset }));
        }
      }
    },
    [OffsetX, checkEdges, clampIndex, clampReleaseOffset, getRelativeIndex, infinite, mode, ranges]
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

  const drag = (x: number) => {
    springIt({
      offset: x,
      actionType: "drag",
    });
  };

  const withSnap = React.useCallback(
    ({ offset }: { offset: number }) => {
      const page = getCurrentIndexByOffset(-offset);
      const finalOffset = -page * itemWidth;
      if (mode === "fixed") {
        return finalOffset;
      } else {
        return getNextDynamicOffset({
          offsetX: offset,
          ranges,
          dir: lastValidDirection.current,
          centered: !!centered,
        });
      }
    },
    [centered, getCurrentIndexByOffset, itemWidth, mode, ranges]
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
            offset: lastOffset,
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
    [lastOffset, snap, springIt, withMomentum, withSnap]
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

  //region FX
  React.useEffect(() => {
    if (animateStartup) {
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
  }, [container.height, ranges.length]);

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

  React.useEffect(() => {
    if (index !== prevIndex.current) {
      onChange?.(index);
    }
  }, [index, onChange]);

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => onEdges?.(edges), [edges]);

  React.useEffect(() => {
    if (!infinite) {
      navigate({ index: 0, immediate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [infinite]);

  React.useEffect(() => {
    prevIndex.current = index;
  });

  //endregion

  React.useImperativeHandle<ReactSlipAndSlideRef, ReactSlipAndSlideRef>(
    ref,
    () => ({
      next: () => navigate({ direction: "next" }),
      previous: () => navigate({ direction: "prev" }),
      goTo: ({ index, animated }) => navigate({ index, immediate: !animated }),
      // TODO: () => increaseOffset()
    }),
    [navigate]
  );

  const containerBind = useDrag(({ active, movement: [mx], direction: [dirX], velocity: [vx] }) => {
    const dir = dirX < 0 ? "left" : dirX > 0 ? "right" : "center";
    direction.current = dir;

    if (dir !== "center") {
      lastValidDirection.current = dir;
    }
    const offset = lastOffset + mx;

    isIntentionalDrag.current = Math.abs(mx) >= 40;
    isDragging.current = Math.abs(mx) !== 0;

    if (active) {
      drag(offset);
    } else {
      release({ offset, v: vx * 100 });
    }
  });

  const handlePressToSlide = React.useCallback(
    (idx: number) => {
      if (!pressToSlide || isDragging.current || isIntentionalDrag.current) {
        return;
      }

      if (mode === "fixed") {
        const prev = index === 0 && idx === dataLength - 1;
        const next = index === dataLength - 1 && idx === 0;
        const smaller = idx < index;
        const bigger = idx > index;

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

  return (
    <Styled.Wrapper
      ref={containerRef}
      className="wrapper"
      {...containerBind()}
      style={{
        opacity: Opacity,
        justifyContent: centered ? "center" : "flex-start",
        width: containerWidth || "100%",
        height: container.height || "100%",
      }}
    >
      {data.map((props, i) => (
        <Item
          ref={itemRefs[i]}
          key={i}
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
        />
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
    renderItem,
    onPress,
  }: React.PropsWithChildren<ItemProps<T>>,
  ref?: React.Ref<HTMLDivElement>
) {
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
      {renderItem({ item, index })}
    </Styled.Item>
  );
}

export const Item = React.forwardRef(ItemComponent) as <T>(
  props: React.PropsWithChildren<ItemProps<T>> & {
    ref?: React.Ref<HTMLDivElement>;
  }
) => ReturnType<typeof ItemComponent>;

export const ReactSlipAndSlide = React.forwardRef(ReactSlipAndSlideComponent) as <T>(
  props: ReactSlipAndSlideProps<T> & {
    ref?: React.Ref<ReactSlipAndSlideRef>;
  }
) => ReturnType<typeof ReactSlipAndSlideComponent>;
