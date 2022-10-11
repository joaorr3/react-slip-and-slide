import { FluidValue } from "@react-spring/shared";
import {
  animated,
  AnimationResult,
  Interpolation,
  SpringValue,
} from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { clamp, flatten, range } from "lodash";
import React, { CSSProperties } from "react";
import { displacement } from "./utils/displacement";
import { useScreenDimensions } from "./utils/useScreenDimensions";

type ReactSlipAndSlideRef = {
  next: () => void;
  previous: () => void;
  goTo: (params: { index: number; animated?: boolean }) => void;
};

type ValidDirection = "left" | "right";
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
  pressToSlide?: boolean;
  containerWidth?: number;
  itemWidth: number;
  itemHeight: number;
  interpolators?: Interpolators<number>;
  renderItem: RenderItem<T>;
  onChange?: (index: number) => void;
};

type ItemProps<T> = {
  item: T;
  dataLength: number;
  index: number;
  offsetX: FluidValue<number>;
  infinite: boolean;
  itemWidth: number;
  itemHeight: number;
  interpolators: Interpolators<number>;
  renderItem: RenderItem<T>;
  onPress?: () => void;
};

function ReactSlipAndSlideComponent<T>(
  {
    data: _data,
    snap,
    centered,
    infinite,
    containerWidth: _containerWidth,
    itemHeight,
    itemWidth,
    pressToSlide,
    interpolators,
    renderItem,
    onChange,
  }: ReactSlipAndSlideProps<T>,
  ref: React.Ref<ReactSlipAndSlideRef>
) {
  const [index, setIndex] = React.useState(0);
  const prevIndex = React.useRef(0);
  const [lastOffset, setLastOffset] = React.useState(0);
  const [containerWidth, setContainerWidth] = React.useState<number>(
    _containerWidth || 0
  );

  const containerRef = React.useRef<HTMLDivElement>(null);
  const isDragging = React.useRef<boolean>(false);
  const direction = React.useRef<Direction>("center");
  const lastValidDirection = React.useRef<ValidDirection | null>(null);
  const isIntentionalDrag = React.useRef<boolean>(false);

  const { width } = useScreenDimensions();

  React.useEffect(() => {
    if (!_containerWidth && containerRef.current) {
      const { offsetWidth, clientWidth } = containerRef.current;
      setContainerWidth(offsetWidth || clientWidth);
    }
  }, [_containerWidth, containerRef, width]);

  const data = React.useMemo(() => {
    const wrapperWidth = _data.length * itemWidth;
    const shouldAddClones = wrapperWidth <= containerWidth || _data.length <= 4;
    const amountOfClones = Math.round(containerWidth / wrapperWidth) + 1;

    if (infinite && shouldAddClones) {
      const newData = flatten(range(0, amountOfClones).map(() => _data));
      return _data.concat(newData);
    }
    return _data;
  }, [_data, containerWidth, infinite, itemWidth]);

  const { OffsetX, dataLength, wrapperWidth, sideMargins } =
    React.useMemo(() => {
      return {
        dataLength: data.length,
        wrapperWidth: data.length * itemWidth,
        sideMargins: (containerWidth - itemWidth) / 2,
        halfItem: itemWidth / 2,
        containerWidth,
        OffsetX: new SpringValue<number>(0, {
          config: {
            tension: 260,
            friction: 32,
            mass: 1,
          },
        }),
      };
    }, [containerWidth, data.length, itemWidth]);

  const clampReleaseOffset = React.useCallback(
    (offset: number) => {
      if (infinite) {
        return offset;
      }

      const MIN = 0;

      const MAX = -wrapperWidth + containerWidth;
      const MAX_CENTERED = MAX - sideMargins * 2;

      const _MAX = centered ? MAX_CENTERED : MAX;

      if (offset > MIN) {
        return MIN;
      } else if (offset < _MAX) {
        return _MAX;
      }
      return offset;
    },
    [centered, containerWidth, infinite, sideMargins, wrapperWidth]
  );

  const clampIndex = React.useCallback(
    (index: number) => clamp(index, 0, dataLength - 1),
    [dataLength]
  );

  const processIndex = React.useCallback(
    ({ offset }: { offset: number }) => {
      const modIndex = (offset / itemWidth) % dataLength;
      return offset <= 0
        ? Math.abs(modIndex)
        : Math.abs(modIndex > 0 ? dataLength - modIndex : 0);
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
    [infinite, processIndex, itemWidth]
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

  const springIt = React.useCallback(
    ({ offset, immediate, actionType, onRest }: SpringIt) => {
      const clampedReleaseOffset = clampReleaseOffset(offset);
      // const { actionType: clampActionType, value } = clampDragOffset(offset);
      OffsetX.start({
        to:
          actionType === "drag" || actionType === "correction"
            ? offset
            : clampedReleaseOffset,
        immediate: immediate || actionType === "drag", // && clampActionType === "drag"),
        onRest: (x) => onRest?.(x),
      });
      if (actionType === "release") {
        setLastOffset(clampedReleaseOffset);
        setIndex(
          clampIndex(getRelativeIndex({ offset: clampedReleaseOffset }))
        );
      }
    },
    [OffsetX, clampIndex, clampReleaseOffset, getRelativeIndex]
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
      return finalOffset;
    },
    [getCurrentIndexByOffset, itemWidth]
  );

  const withMomentum = React.useCallback(
    ({ offset, v }: { offset: number; v: number }) => {
      const velocity =
        direction.current === "left"
          ? -v
          : direction.current === "right"
          ? v
          : 0;
      const momentumOffset = offset + velocity;
      return momentumOffset;
    },
    []
  );

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
        const page = getCurrentIndex({ offset: OffsetX.get() });
        if (direction === "next") {
          const nextPage = page + 1;
          targetOffset = -nextPage * itemWidth;
        } else if (direction === "prev") {
          const prevPage = page - 1;
          targetOffset = -prevPage * itemWidth;
        }
      }
      springIt({
        offset: targetOffset,
        immediate,
        actionType: "release",
      });
    },
    [OffsetX, getCurrentIndex, getCurrentOffset, itemWidth, springIt]
  );

  //region FX

  React.useEffect(() => {
    if (index !== prevIndex.current) {
      onChange?.(index);
    }
  }, [index, onChange]);

  React.useEffect(() => {
    navigate?.({ index, immediate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerWidth]);

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
    }),
    [navigate]
  );

  // const b = useDrag(({dragging,event}) => {});

  const containerBind = useDrag(
    ({ active, movement: [mx], direction: [dirX], velocity: [vx] }) => {
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
    }
  );

  const handlePressToSlide = React.useCallback(
    (idx: number) => {
      if (!pressToSlide || isDragging.current || isIntentionalDrag.current) {
        return;
      }
      const prev = index === 0 && idx === dataLength - 1;
      const smaller = idx < index;
      const next = index === dataLength - 1 && idx === 0;
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
    },
    [dataLength, index, navigate, pressToSlide]
  );

  return (
    <animated.div
      ref={containerRef}
      className="wrapper"
      {...containerBind()}
      style={{
        display: "flex",
        justifyContent: centered ? "center" : "flex-start",
        position: "relative",
        overflow: "hidden",
        flexDirection: "row",
        width: _containerWidth || "100%",
        height: itemHeight || "100%",
        touchAction: "none",
      }}
    >
      {data.map((props, i) => (
        <Item
          key={i}
          index={i}
          item={props}
          dataLength={dataLength}
          renderItem={renderItem}
          infinite={!!infinite}
          itemHeight={itemHeight}
          itemWidth={itemWidth}
          interpolators={interpolators || {}}
          onPress={() => pressToSlide && handlePressToSlide(i)}
          offsetX={OffsetX.to((offsetX) =>
            infinite ? offsetX % wrapperWidth : offsetX
          )}
        />
      ))}
    </animated.div>
  );
}

function Item<T>({
  offsetX,
  dataLength,
  index,
  infinite,
  itemWidth,
  itemHeight,
  item,
  interpolators,
  renderItem,
  onPress,
}: React.PropsWithChildren<ItemProps<T>>) {
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

  const mapInterpolators = React.useMemo(
    () =>
      keys.reduce((acc, [key, val]) => {
        acc[key] = x
          .to((val) => val / itemWidth)
          .to([-1, 0, 1], [val, 1, val], "clamp");
        return acc;
      }, {} as Interpolators<Interpolation<number, any>>),
    [itemWidth, keys, x]
  );

  return (
    <animated.div
      onClick={onPress}
      style={{
        translateX: x
          .to((val) => val / itemWidth)
          .to([-1, 0, 1], [-itemWidth, 0, itemWidth]),
        ...mapInterpolators,
        position: "absolute",
        width: itemWidth,
        height: itemHeight,
        flexShrink: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
      onDragStart={(e) => e.preventDefault()}
    >
      {renderItem({ item, index })}
    </animated.div>
  );
}

export const ReactSlipAndSlide = React.forwardRef(
  ReactSlipAndSlideComponent
) as <T>(
  props: ReactSlipAndSlideProps<T> & {
    ref?: React.Ref<ReactSlipAndSlideRef>;
  }
) => ReturnType<typeof ReactSlipAndSlideComponent>;
