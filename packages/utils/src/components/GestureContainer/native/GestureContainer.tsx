import { type BoxRef } from '@react-slip-and-slide/models';
import React from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Context } from '../../../context';
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
  const {
    state: { OffsetX },
  } = Context.useDataContext<any>();

  const isPressStart = React.useRef<boolean>(false);

  const panGesture = Gesture.Pan()
    .onUpdate(({ translationX, velocityX, state }) => {
      const dir = velocityX > 0 ? 'right' : velocityX < 0 ? 'left' : 'center';
      direction.current = dir;

      if (dir !== 'center') {
        lastValidDirection.current = dir;
      }

      isIntentionalDrag.current =
        Math.abs(translationX) >= 40 || isPressStart.current;
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
      isPressStart.current = false;
    });

  const handleOnPressStart = () => {
    if (OffsetX.isAnimating && OffsetX.get() !== lastOffset.current) {
      lastOffset.current = OffsetX.get();
      OffsetX.stop();
    }
  };

  return (
    <GestureDetector gesture={panGesture}>
      <Wrapper
        ref={ref}
        willMeasure
        style={style}
        styles={styles}
        onPressStart={handleOnPressStart}
      >
        {children}
      </Wrapper>
    </GestureDetector>
  );
};

export const GestureContainer = React.forwardRef(GestureContainerComponent);
