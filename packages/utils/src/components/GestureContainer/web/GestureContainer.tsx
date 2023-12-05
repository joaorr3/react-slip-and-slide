import { type ActionType, type BoxRef } from '@react-slip-and-slide/models';
import { useGesture } from '@use-gesture/react';
import { Lethargy } from 'lethargy-ts';
import { throttle } from 'lodash';
import React from 'react';
import { Context } from '../../../context';
import { mergeRefs } from '../../../utilities';
import { Wrapper } from '../../Styled';
import { type GestureContainerProps } from '../models';

type HandleGesture = {
  immediate: boolean;
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
    onDrag,
    onRelease,
    children,
  }: GestureContainerProps,
  ref: React.Ref<BoxRef>
): JSX.Element => {
  const {
    state: { OffsetX },
  } = Context.useDataContext<any>();

  const internalRef = React.useRef<BoxRef>(null);
  const refs = mergeRefs<BoxRef>([ref, internalRef]);
  const isPressing = React.useRef<boolean>(false);

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
    ({ immediate, active, mx, dirX, vx, actionType }: HandleGesture) => {
      const dir = dirX < 0 ? 'left' : dirX > 0 ? 'right' : 'center';
      direction.current = dir;

      if (dir !== 'center') {
        lastValidDirection.current = dir;
      }
      const offset = lastOffset.current + mx;

      isIntentionalDrag.current = Math.abs(mx) >= 40 || isPressing.current;
      isDragging.current = Math.abs(mx) !== 0;

      if (active || immediate) {
        onDrag(offset, actionType, immediate);
      } else {
        onRelease({ offset, velocity: vx * 100 });
        isPressing.current = false;
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

  const handleOnPressStart = () => {
    if (OffsetX.get() !== lastOffset.current) {
      isPressing.current = true;
      lastOffset.current = OffsetX.get();
      onDrag(lastOffset.current, 'drag', true);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleOnWheel = React.useCallback(
    throttle(
      (active: boolean, move: number, dir: number) => {
        handleGesture({
          immediate: active,
          active,
          mx: move,
          dirX: dir,
          vx: 0,
          actionType: 'wheelSnap',
        });
      },
      200,
      { leading: true, trailing: false }
    ),
    []
  );

  useGesture(
    {
      onTouchStart: handleOnPressStart,
      onMouseDown: handleOnPressStart,
      onDrag: ({
        active,
        down,
        movement: [mx],
        direction: [dirX],
        velocity: [vx],
      }) => {
        handleGesture({
          immediate: down,
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
            handleOnWheel(active, move, dir);
          }
        } else {
          handleGesture({
            immediate: active,
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
