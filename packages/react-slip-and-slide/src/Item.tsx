import {
  type BaseDimensions,
  type BoxRef,
  type ItemProps,
} from '@react-slip-and-slide/models';
import {
  AnimatedBox,
  Context,
  elementDimensionStyles,
  useInterpolation,
  useSpringValue,
  type CSSProperties,
} from '@react-slip-and-slide/utils';
import React from 'react';

function ItemBaseComponent<T extends object>(
  { index, item, renderItem, onPress }: ItemProps<T>,
  ref?: React.Ref<BoxRef>
) {
  const {
    state: { itemDimensions, engineMode, loadingType, itemDimensionMode },
  } = Context.useDataContext<T>();

  const isLazy = loadingType === 'lazy';

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

  const itemStyles = React.useRef<CSSProperties>({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  });

  if (engineMode === 'multi') {
    itemStyles.current = {
      ...itemStyles.current,
      position: 'absolute',
      flexShrink: 0,
      ...elementDimensionStyles(itemDimensions),
    };
  }

  if (itemDimensionMode === 'static') {
    itemStyles.current = {
      ...itemStyles.current,
      ...elementDimensionStyles(itemDimensions),
    };
  }

  const { translateX, scale, opacity } = useInterpolation({ index });

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
      styles={itemStyles.current}
    >
      <LazyLayout isLazy={isLazy} itemDimensions={itemDimensions}>
        {memoRenderItem}
      </LazyLayout>
    </AnimatedBox>
  );
}

export const LazyLayout = ({
  isLazy,
  itemDimensions,
  children,
}: React.PropsWithChildren<{
  isLazy: boolean;
  itemDimensions: Required<BaseDimensions>;
}>): JSX.Element => {
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

  if (isLazy) {
    return (
      <AnimatedBox
        styles={{
          display: 'flex',
          alignItems: 'center',
          ...elementDimensionStyles(itemDimensions),
          width: '100%',
        }}
        style={{
          opacity: Opacity,
        }}
      >
        {children}
      </AnimatedBox>
    );
  }
  return <React.Fragment>{children}</React.Fragment>;
};

export const ItemBase = React.forwardRef(ItemBaseComponent) as <
  T extends object
>(
  props: ItemProps<T> & {
    ref?: React.Ref<BoxRef>;
  }
) => ReturnType<typeof ItemBaseComponent>;
