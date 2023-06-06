import {
  type BoxRef,
  type ItemProps,
  type ReactSlipAndSlideProps,
} from '@react-slip-and-slide/models';
import {
  AnimatedBox,
  Box,
  Context,
  isInRange,
  LazyLoad,
  useDynamicDimension,
  useInterpolation,
  useSpringValue,
  type CSSProperties,
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
      itemDimensionMode,
      visibleItems,
      wrapperWidth,
      engineMode,
      centered,
    },
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

  /**
   * Infinite = false
   * EngineMode = 'single'
   * itemDimensionMode = 'fixed' | 'dynamic'
   */
  if (engineMode === 'single') {
    return (
      <Box
        styles={{
          // flex: 1,
          // display: 'flex',
          // flexDirection: 'row',
          transform:
            itemDimensionMode === 'dynamic' && centered
              ? `translateX(${itemWidth / 2}px)`
              : undefined,
        }}
      >
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
            alignItems: 'center',
            width: itemWidth === 0 ? undefined : itemWidth,
            height: itemHeight === 0 ? undefined : itemHeight,
            minHeight: itemHeight === 0 ? undefined : itemHeight,
          }}
        >
          {data.map((props, i) => (
            <LazyLoad key={i} render={shouldRender(i)}>
              <ItemBase
                ref={itemRefs[i]}
                index={i}
                item={props}
                engineMode={engineMode}
                renderItem={renderItem}
                itemHeight={itemHeight}
                itemWidth={itemWidth}
                onPress={() => onSlidePress(i)}
                OffsetX={OffsetX}
                isLazy={loadingType === 'lazy'}
              />
            </LazyLoad>
          ))}
        </AnimatedBox>
      </Box>
    );
  }

  /**
   * Infinite = true
   * EngineMode = 'multi'
   * itemDimensionMode = 'fixed'
   */
  return (
    <React.Fragment>
      {data.map((props, i) => (
        <LazyLoad key={i} render={shouldRender(i)}>
          <ItemBase
            ref={itemRefs[i]}
            index={i}
            item={props}
            engineMode={engineMode}
            renderItem={renderItem}
            itemHeight={itemHeight}
            itemWidth={itemWidth}
            onPress={() => onSlidePress(i)}
            OffsetX={OffsetX.to((offsetX) => offsetX % wrapperWidth)}
            isLazy={loadingType === 'lazy'}
          />
        </LazyLoad>
      ))}
    </React.Fragment>
  );
};

function ItemBaseComponent<T extends object>(
  {
    OffsetX,
    index,
    item,
    itemWidth,
    itemHeight,
    isLazy,
    engineMode,
    renderItem,
    onPress,
  }: ItemProps<T>,
  ref?: React.Ref<BoxRef>
) {
  const Opacity = useSpringValue(isLazy ? 0 : 1, {
    config: {
      tension: 220,
      friction: 32,
      mass: 1,
    },
  });

  React.useEffect(() => {
    if (isLazy) {
      Opacity.start({
        to: 1,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLazy]);

  const multiModeStyles: CSSProperties = {
    position: 'absolute',
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: itemWidth === 0 ? undefined : itemWidth,
    height: itemHeight === 0 ? undefined : itemHeight,
  };

  const { translateX, scale, opacity } = useInterpolation({
    index,
    OffsetX,
  });

  const memoRenderItem = React.useMemo(() => {
    return renderItem({ item, index });
  }, [index, item, renderItem]);

  return (
    <AnimatedBox
      willMeasure
      ref={ref}
      onPress={onPress}
      web={{
        onDragStart: (e: any) => e.preventDefault(),
      }}
      style={{
        transform: [
          {
            translateX: engineMode === 'multi' ? translateX : 0,
          },
          {
            scale,
          },
        ],
        opacity,
      }}
      styles={engineMode === 'multi' ? multiModeStyles : undefined}
    >
      <AnimatedBox
        styles={{
          display: 'flex',
          alignItems: 'center',
        }}
        style={{
          opacity: Opacity,
        }}
      >
        {memoRenderItem}
      </AnimatedBox>
    </AnimatedBox>
  );
}

export const ItemBase = React.forwardRef(ItemBaseComponent) as <
  T extends object
>(
  props: ItemProps<T> & {
    ref?: React.Ref<BoxRef>;
  }
) => ReturnType<typeof ItemBaseComponent>;
