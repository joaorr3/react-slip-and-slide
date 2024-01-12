import { type BoxRef } from '@react-slip-and-slide/models';
import React from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Context } from '../../../context';
import { AnimatedBox } from '../../AnimatedBox';
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
    intentionalDragThreshold,
    onDrag,
    onRelease,
    children,
  }: GestureContainerProps,
  ref: React.Ref<BoxRef>
): JSX.Element => {
  const {
    state: { OffsetX },
  } = Context.useDataContext<any>();

  const handleOnPressStart = () => {
    if (OffsetX.isAnimating && OffsetX.get() !== lastOffset.current) {
      lastOffset.current = OffsetX.get();
      OffsetX.stop();
    }
  };

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .onTouchesDown(handleOnPressStart)
    .onUpdate(({ translationX, velocityX, state }) => {
      const dir = velocityX > 0 ? 'right' : velocityX < 0 ? 'left' : false;
      direction.current = dir;

      if (dir) {
        lastValidDirection.current = dir;
      }

      isIntentionalDrag.current =
        Math.abs(translationX) >= intentionalDragThreshold;
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
      <AnimatedBox
        ref={ref}
        willMeasure
        style={style}
        styles={{
          display: 'flex',
          position: 'relative',
          flexDirection: 'row',
          ...styles,
        }}
      >
        {children}
      </AnimatedBox>
    </GestureDetector>
  );
};

export const GestureContainer = React.forwardRef(GestureContainerComponent);
