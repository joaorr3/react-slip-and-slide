import {
  Interpolators,
  ItemProps,
  ItemDimensionMode,
  ReactSlipAndSlideProps,
  BoxRef,
} from "@react-slip-and-slide/models";
import {
  AnimatedBox,
  Box,
  displacement,
  isInRange,
  LazyLoad,
  Styled,
  useDynamicDimension,
  useItemsRange,
} from "@react-slip-and-slide/utils";
import React from "react";
import { Interpolation, SpringValue, to } from "react-spring";
import { useDataContext } from "./Context";

export type EngineMode = "multi" | "single";
export type LoadingType = "lazy" | "eager";

export type BaseEngineProps<T> = Pick<
  ReactSlipAndSlideProps<T>,
  "data" | "centered" | "interpolators" | "visibleItems" | "renderItem"
> & {
  engineMode: EngineMode;
  loadingType: LoadingType;
  OffsetX: SpringValue<number>;
  itemDimensions: {
    width: number;
    height?: number;
  };
  onPress?: (index: number) => void;
  onLayout?: (props: { wrapperWidth?: number }) => void;
};

export type EngineProps<T> = BaseEngineProps<T>;
export type EngineHookProps<T> = BaseEngineProps<T>;

function usePrepareEngine<T>({}: EngineHookProps<T>) {
  const {
    state: {
      data,
      dataLength,
      engineMode,
      itemDimensions: { height: itemHeight, width: itemWidth = 0 },
      loadingType,
      centered,
      visibleItems,
      infinite,
      itemDimensionMode,
      container,
      wrapperWidth,
      clampOffset,
    },
    actions: { setContainerDimensions, setWrapperWidth, setItemDimensionMap },
  } = useDataContext<T>();

  // const [wrapperWidth, _setWrapperWidth] = React.useState<number>(data.length * itemDimensions.width);

  const { itemRefs, itemDimensionMap, ranges } = useDynamicDimension({
    itemDimensionMode,
    dataLength,
    onMeasure: ({ itemWidthSum }) => {
      if (itemWidthSum) {
        setWrapperWidth(itemWidthSum);
      }
    },
  });

  React.useEffect(() => {
    if (itemDimensionMap.length > 0) {
      setItemDimensionMap(itemDimensionMap);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemDimensionMap]);

  console.log("ranges: ", ranges);

  return {
    itemRefs,
    ranges,
    wrapperWidth,
  };
}

export function Engine<T>(props: EngineProps<T>): JSX.Element {
  const {
    engineMode,
    data,
    loadingType,
    OffsetX,
    itemDimensions,
    visibleItems,
    centered,
    interpolators,
    onPress,
    onLayout,
    renderItem,
  } = props;

  const { itemRefs, ranges, wrapperWidth } = usePrepareEngine(props);

  const shouldRender = React.useCallback(
    (i: number) => {
      if (loadingType === "eager") {
        return true;
      }
      return isInRange(i, {
        dataLength: data.length,
        viewSize: itemDimensions.width,
        visibleItems: visibleItems || Math.round(data.length / 2),
        offsetX: OffsetX.get(),
      });
    },
    [OffsetX, data.length, itemDimensions.width, loadingType, visibleItems]
  );

  const boxRef = React.useRef<BoxRef>(null);

  React.useLayoutEffect(() => {
    boxRef.current?.measure().then((props) => {
      if (props) {
        onLayout?.({
          wrapperWidth: props.width,
        });
      }
    });
  }, [onLayout]);

  if (engineMode === "single") {
    return (
      <Styled.Wrapper
        ref={boxRef}
        willMeasure
        style={{
          translateX: OffsetX,
          border: "1px solid #0000ff",
        }}
      >
        {data.map((dataProps, i) => (
          <Box key={i} ref={itemRefs[i]} willMeasure>
            {renderItem({ item: dataProps, index: i })}
          </Box>
        ))}
      </Styled.Wrapper>
    );
  }

  // mode = fixed
  // engineMode = multi
  return (
    <React.Fragment>
      {data.map((dataProps, i) => (
        <LazyLoad key={i} render={shouldRender(i)}>
          <Item
            ref={itemRefs[i]}
            index={i}
            itemDimensionMode="fixed"
            item={dataProps}
            dataLength={data.length}
            onPress={() => onPress?.(i)}
            infinite
            itemHeight={itemDimensions.height}
            itemWidth={itemDimensions.width}
            interpolators={interpolators || {}}
            dynamicOffset={ranges[i]?.range[centered ? "center" : "start"] || 0}
            offsetX={OffsetX.to((offsetX) => offsetX % wrapperWidth)}
            isLazy={loadingType === "lazy"}
            renderItem={renderItem}
          />
        </LazyLoad>
      ))}
    </React.Fragment>
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
    itemDimensionMode,
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

  const keys = Object.entries(interpolators) as [keyof typeof interpolators, number][];

  const translateX: Interpolation<number, number> = React.useMemo(() => {
    if (itemDimensionMode === "fixed") {
      return x.to((val) => val / itemWidth).to([-1, 0, 1], [-itemWidth, 0, itemWidth]);
    }
    return to(offsetX, (x) => x + dynamicOffset);
  }, [dynamicOffset, itemWidth, itemDimensionMode, offsetX, x]);

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
    <Styled.FloatingItem
      ref={ref}
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
          width: "100%",
          height: "100%",
          opacity: Opacity,
        }}
      >
        {memoRenderItem}
      </AnimatedBox>
    </Styled.FloatingItem>
  );
}

export const Item = React.forwardRef(ItemComponent) as <T>(
  props: React.PropsWithChildren<ItemProps<T>> & {
    ref?: React.Ref<BoxRef>;
  }
) => ReturnType<typeof ItemComponent>;
