import {
  type BoxMeasurements,
  type BoxRef,
} from '@react-slip-and-slide/models';
import React from 'react';
import {
  Pressable,
  View,
  type LayoutChangeEvent,
  type ViewStyle,
} from 'react-native';
import { cssToNativeStyle } from '../../../utilities';
import { type BoxProps } from '../models';

export const BoxBase = (
  {
    children,
    styles,
    willMeasure,
    onPress,
    onPressStart,
    native,
    web: _,
    style,
    ...rest
  }: BoxProps & { style?: ViewStyle },
  ref: React.Ref<BoxRef>
): JSX.Element => {
  const viewRef = React.useRef<View>(null);

  const measurements = React.useRef<BoxMeasurements>({
    width: 0,
    height: 0,
  });

  React.useImperativeHandle<BoxRef, BoxRef>(ref, () => ({
    measure: () => {
      return new Promise<BoxMeasurements>((res) => {
        if (willMeasure && viewRef.current) {
          viewRef.current.measure((_, __, width, height) => {
            res({
              width: measurements.current?.width || width,
              height: measurements.current?.height || height,
            });
          });
        } else {
          res({ width: 0, height: 0 });
        }
      });
    },
    addEventListener: () => void 0,
    removeEventListener: () => void 0,
    dispatchEvent: () => false,
  }));

  const handleOnLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      if (willMeasure) {
        measurements.current = {
          width: event.nativeEvent.layout.width,
          height: event.nativeEvent.layout.height,
        };
      }
    },
    [willMeasure]
  );

  const $style = React.useMemo(
    () => ({ ...cssToNativeStyle(styles), ...style }),
    [styles, style]
  );

  return (
    <Pressable
      ref={viewRef}
      {...native}
      // GestureDetector injects the collapsable props. rest === { "collapsable": false }
      {...rest}
      style={$style}
      onLayout={handleOnLayout}
      onTouchStart={onPressStart}
      onPress={onPress}
    >
      {children}
    </Pressable>
  );
};

export const Box = React.forwardRef(BoxBase);
