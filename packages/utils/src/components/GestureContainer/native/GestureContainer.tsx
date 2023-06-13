import { type BoxRef } from '@react-slip-and-slide/models';
import React from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
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
  const panGesture = Gesture.Pan()
    .onUpdate(({ translationX, velocityX, state }) => {
      const dir = velocityX > 0 ? 'right' : velocityX < 0 ? 'left' : 'center';
      direction.current = dir;

      if (dir !== 'center') {
        lastValidDirection.current = dir;
      }

      isIntentionalDrag.current = Math.abs(translationX) >= 40;
      isDragging.current = state === 4;

      const offset = lastOffset.current + translationX;

      onDrag(offset, 'drag');
    })
    .onEnd(({ velocityX, translationX, state }) => {
      isDragging.current = state === 4;
      const offset = lastOffset.current + translationX;

      const unsignedVelocity = Math.abs(velocityX);
      const normalizedVelocity = velocityX / 12;
      const velocity = unsignedVelocity > 320 ? normalizedVelocity : 0;

      onRelease({ offset, velocity });
    });

  return (
    <GestureDetector gesture={panGesture}>
      <Wrapper ref={ref} willMeasure style={style} styles={styles}>
        {children}
      </Wrapper>
    </GestureDetector>
  );
};

export const GestureContainer = React.forwardRef(GestureContainerComponent);
