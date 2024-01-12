import {
  type BoxMeasurements,
  type BoxRef,
} from '@react-slip-and-slide/models';
import React, { CSSProperties } from 'react';
import { type BoxProps } from '../models';

export const BoxBase = (
  {
    children,
    styles,
    willMeasure,
    onPress,
    onPressStart,
    web,
    native: _,
    style,
  }: BoxProps & { style?: CSSProperties },
  ref: React.Ref<BoxRef>
): JSX.Element => {
  const divRef = React.useRef<HTMLDivElement>(null);

  React.useImperativeHandle<BoxRef, BoxRef>(ref, () => ({
    measure: () => {
      return new Promise<BoxMeasurements>((res) => {
        if (willMeasure && divRef.current) {
          const { width, height } = divRef.current.getBoundingClientRect();
          res({
            width: divRef.current.offsetWidth || width,
            height: divRef.current.offsetHeight || height,
          });
        } else {
          res({ width: 0, height: 0 });
        }
      });
    },
    addEventListener: (type, listener, options) => {
      divRef.current?.addEventListener(type, listener, options);
    },
    removeEventListener: (type, listener, options) => {
      divRef.current?.removeEventListener(type, listener, options);
    },
    dispatchEvent: (e) => !!divRef.current?.dispatchEvent(e),
  }));

  return (
    <div
      ref={divRef}
      onClick={onPress}
      {...web}
      style={{
        ...styles,
        ...web?.style,
        ...style,
      }}
      onMouseDown={onPressStart}
      onTouchStart={onPressStart}
    >
      {children}
    </div>
  );
};

export const Box = React.forwardRef(BoxBase);
