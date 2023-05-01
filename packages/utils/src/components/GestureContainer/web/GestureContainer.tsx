import { type BoxRef } from '@react-slip-and-slide/models';
import { useDrag } from '@use-gesture/react';
import React from 'react';
import { Wrapper } from '../../Styled';
import { type GestureContainerProps } from '../models';

export const GestureContainerComponent = (
  {
    style,
    styles,
    direction,
    lastValidDirection,
    lastOffset,
    isIntentionalDrag,
    isDragging,
    onDrag,
    onRelease,
    children,
  }: GestureContainerProps,
  ref: React.Ref<BoxRef>
): JSX.Element => {
  const containerBind = useDrag(
    ({ active, movement: [mx], direction: [dirX], velocity: [vx] }) => {
      const dir = dirX < 0 ? 'left' : dirX > 0 ? 'right' : 'center';
      direction.current = dir;

      if (dir !== 'center') {
        lastValidDirection.current = dir;
      }
      const offset = lastOffset.current + mx;

      isIntentionalDrag.current = Math.abs(mx) >= 40;
      isDragging.current = Math.abs(mx) !== 0;

      if (active) {
        onDrag(offset);
      } else {
        onRelease({ offset, velocity: vx * 100 });
      }
    },
    {
      filterTaps: true,
      axis: 'x',
    }
  );

  return (
    <Wrapper
      ref={ref}
      willMeasure
      {...containerBind()}
      style={style}
      styles={{
        ...styles,
        touchAction: 'pan-y',
      }}
    >
      {children}
    </Wrapper>
  );
};

export const GestureContainer = React.forwardRef(GestureContainerComponent);
