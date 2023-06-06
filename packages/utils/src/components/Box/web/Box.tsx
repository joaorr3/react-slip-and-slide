import {
  type BoxMeasurements,
  type BoxRef,
} from '@react-slip-and-slide/models';
import { merge } from 'lodash';
import React from 'react';
import { styled } from '../../../styled-components';
import { type BoxProps, type StyledBoxProps } from '../models';

const StyledBox = styled.div<StyledBoxProps>`
  ${({ styles }) => ({
    ...styles,
  })}
`;

export const BoxBase = (
  { children, styles, willMeasure, onPress, web, native: _, ...rest }: BoxProps,
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
    addEventListener: (...props) => {
      divRef.current?.addEventListener(...props);
    },
    removeEventListener: (...props) => {
      divRef.current?.removeEventListener(...props);
    },
    dispatchEvent: (e) => !!divRef.current?.dispatchEvent(e),
  }));

  return (
    <StyledBox
      ref={divRef}
      onClick={onPress}
      styles={styles}
      {...merge(web, rest)}
    >
      {children}
    </StyledBox>
  );
};

export const Box = React.forwardRef(BoxBase);
