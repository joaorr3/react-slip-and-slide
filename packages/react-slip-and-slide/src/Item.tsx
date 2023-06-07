import { type BoxRef, type ItemProps } from '@react-slip-and-slide/models';
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
    state: { itemDimensions, engineMode, loadingType },
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

  const multiModeStyles: CSSProperties = {
    position: 'absolute',
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    ...elementDimensionStyles(itemDimensions),
  };

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
