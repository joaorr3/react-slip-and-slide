import {
  type BoxRef,
  type Interpolators,
  type ItemProps,
  type ReactSlipAndSlideProps,
} from '@react-slip-and-slide/models';
import {
  AnimatedBox,
  Context,
  displacement,
  isInRange,
  LazyLoad,
  Styled,
  to,
  useDynamicDimension,
  useSpringValue,
  type Interpolation,
  type SpringValue,
} from '@react-slip-and-slide/utils';
import React from 'react';

export type EngineProps<T extends object> = {
  OffsetX: SpringValue<number>;
  onSlidePress: (index: number) => void;
} & Pick<ReactSlipAndSlideProps<T>, 'renderItem'>;

export const Engine = <T extends object>({
  OffsetX,
  onSlidePress,
  renderItem,
}: EngineProps<T>): JSX.Element => {
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

  const { itemRefs } = useDynamicDimension();

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

  if (engineMode === 'single') {
    return (
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
    );
  }

  return (
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
              itemDimensionMode === 'fixed' ? itemWidth : ranges[i]?.width || 0
            }
            interpolators={interpolators || {}}
            dynamicOffset={ranges[i]?.range[rangeOffsetPosition] || 0}
            onPress={() => onSlidePress(i)}
            offsetX={OffsetX.to((offsetX) =>
              infinite ? offsetX % wrapperWidth : offsetX
            )}
            isLazy={loadingType === 'lazy'}
          />
        </LazyLoad>
      ))}
    </React.Fragment>
  );
};

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
