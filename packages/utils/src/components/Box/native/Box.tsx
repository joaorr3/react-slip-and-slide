import {
  type BoxMeasurements,
  type BoxRef,
} from '@react-slip-and-slide/models';
import { merge } from 'lodash';
import React from 'react';
import {
  TouchableWithoutFeedback,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { styled } from '../../../styled-components';
import { type BoxProps, type StyledBoxProps } from '../models';

const StyledBox = styled(View)<StyledBoxProps>`
  ${({ styles }) => ({
    ...styles,
  })}
`;

export const BoxBase = (
  { children, styles, willMeasure, onPress, native, web: _, ...rest }: BoxProps,
  ref: React.Ref<BoxRef>
): JSX.Element => {
  const viewRef = React.useRef<View>(null);

  const [measurements, setMeasurements] = React.useState<BoxMeasurements>({
    width: 0,
    height: 0,
  });

  React.useImperativeHandle<BoxRef, BoxRef>(ref, () => ({
    measure: () => {
      return new Promise<BoxMeasurements>((res) => {
        if (willMeasure && viewRef.current) {
          viewRef.current.measure((_, __, width, height) => {
            res({
              width: measurements?.width || width,
              height: measurements?.height || height,
            });
          });
        }
        res({ width: 0, height: 0 });
      });
    },
  }));

  const handleOnLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      if (willMeasure) {
        const {
          nativeEvent: {
            layout: { height, width },
          },
        } = event;

        setMeasurements({
          width,
          height,
        });
      }
    },
    [willMeasure]
  );

  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <StyledBox
        ref={viewRef}
        styles={styles}
        onLayout={handleOnLayout}
        {...merge(native, rest)}
      >
        {children}
      </StyledBox>
    </TouchableWithoutFeedback>
  );
};

export const Box = React.forwardRef(BoxBase);
