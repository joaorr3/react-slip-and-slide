import { type ActionType, type BoxRef } from '@react-slip-and-slide/models';
import { useGesture } from '@use-gesture/react';
import { Lethargy } from 'lethargy-ts';
import { throttle } from 'lodash';
import React from 'react';
import { Context } from '../../../context';
import { mergeRefs } from '../../../utilities';
import { AnimatedBox } from '../../AnimatedBox';
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
    snap,
    intentionalDragThreshold,
    onDrag,
    onRelease,
    navigate,
    children,
  }: GestureContainerProps,
  ref: React.Ref<BoxRef>
): JSX.Element => {
  const {
    state: { OffsetX },
  } = Context.useDataContext<any>();

  const internalRef = React.useRef<BoxRef>(null);
  const refs = mergeRefs<BoxRef>([ref, internalRef]);

  const lethargy = React.useMemo(
    () =>
      new Lethargy({
        sensitivity: 2,
        inertiaDecay: 20,
        delay: 100,
        highVelocity: 100,
      }),
    []
  );

  const handleGesture = React.useCallback(
    ({ active, mx, dirX, vx, actionType }: HandleGesture) => {
      if (mx === 0) {
        onRelease({ offset: lastOffset.current, velocity: vx * 100 });
        return;
      }

      const dir = dirX < 0 ? 'left' : dirX > 0 ? 'right' : false;
      direction.current = dir;

      if (dir) {
        lastValidDirection.current = dir;
      }
      const offset = lastOffset.current + mx;

      isIntentionalDrag.current = Math.abs(mx) >= intentionalDragThreshold;
      isDragging.current = Math.abs(mx) !== 0;

      if (active) {
        onDrag(offset, actionType);
      } else {
        onRelease({ offset, velocity: vx * 100 });
      }
    },
    [
      direction,
      intentionalDragThreshold,
      isDragging,
      isIntentionalDrag,
      lastOffset,
      lastValidDirection,
      onDrag,
      onRelease,
    ]
  );

  const handleOnPressStart = () => {
    if (OffsetX.isAnimating && OffsetX.get() !== lastOffset.current) {
      lastOffset.current = OffsetX.get();
      OffsetX.stop();
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleOnWheel = React.useCallback(
    throttle(
      (dir: number) => {
        const direction = dir < 0 ? 'prev' : dir > 0 ? 'next' : false;

        if (direction) {
          navigate({ direction, actionType: 'wheelSnap' });
        }
      },
      200,
      { leading: true, trailing: false }
    ),
    [navigate]
  );

  useGesture(
    {
      onTouchStart: handleOnPressStart,
      onMouseDown: handleOnPressStart,
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
      onWheel: ({
        event,
        active,
        movement: [mx, my],
        direction: [dirX, dirY],
      }) => {
        const move = -mx || -my;
        const dir = dirX || dirY;

        if (snap) {
          if (lethargy.check(event)) {
            handleOnWheel(dir);
          }
        } else {
          handleGesture({
            active,
            mx: move,
            dirX: dir,
            vx: 0,
            actionType: 'wheel',
          });
        }
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
    <AnimatedBox
      ref={refs}
      willMeasure
      style={style}
      styles={{
        display: 'flex',
        position: 'relative',
        flexDirection: 'row',
        ...styles,
        touchAction: 'pan-y',
      }}
    >
      {children}
    </AnimatedBox>
  );
};

export const GestureContainer = React.forwardRef(GestureContainerComponent);
