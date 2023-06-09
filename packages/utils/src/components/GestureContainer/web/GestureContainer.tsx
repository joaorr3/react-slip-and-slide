import { type ActionType, type BoxRef } from '@react-slip-and-slide/models';
import { useGesture } from '@use-gesture/react';
import { mergeRefs } from '../../../utilities';

import React from 'react';
import { Wrapper } from '../../Styled';
import { type GestureContainerProps } from '../models';

type HandleGesture = {
  active: boolean;
  mx: number;
  dirX: number;
  vx: number;
  actionType: ActionType;
};

export const GestureContainerComponent = (
  {
    style,
    styles,
    direction,
    lastValidDirection,
    lastOffset,
    isIntentionalDrag,
    isDragging,
    useWheel,
    onDrag,
    onRelease,
    children,
  }: GestureContainerProps,
  ref: React.Ref<BoxRef>
): JSX.Element => {
  const internalRef = React.useRef<BoxRef>(null);
  const refs = mergeRefs<BoxRef>([ref, internalRef]);

  const handleGesture = React.useCallback(
    ({ active, mx, dirX, vx, actionType }: HandleGesture) => {
      const dir = dirX < 0 ? 'left' : dirX > 0 ? 'right' : 'center';
      direction.current = dir;

      if (dir !== 'center') {
        lastValidDirection.current = dir;
      }
      const offset = lastOffset.current + mx;

      isIntentionalDrag.current = Math.abs(mx) >= 40;
      isDragging.current = Math.abs(mx) !== 0;

      if (active) {
        onDrag(offset, actionType);
      } else {
        onRelease({ offset, velocity: vx * 100 });
      }
    },
    [
      direction,
      isDragging,
      isIntentionalDrag,
      lastOffset,
      lastValidDirection,
      onDrag,
      onRelease,
    ]
  );

  useGesture(
    {
      onDrag: ({
        active,
        movement: [mx],
        direction: [dirX],
        velocity: [vx],
      }) => {
        handleGesture({
          active,
          mx,
          dirX,
          vx,
          actionType: 'drag',
        });
      },
      onWheel: ({ active, movement: [mx, my] }) => {
        const move = -mx || -my;
        handleGesture({
          active,
          mx: move,
          dirX: 0,
          vx: 0,
          actionType: 'wheel',
        });
      },
    },
    {
      target: internalRef,
      wheel: {
        enabled: !!useWheel,
        preventDefault: true,
        eventOptions: { passive: false },
      },
      drag: { filterTaps: true, axis: 'x' },
    }
  );

  return (
    <Wrapper
      ref={refs}
      willMeasure
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
