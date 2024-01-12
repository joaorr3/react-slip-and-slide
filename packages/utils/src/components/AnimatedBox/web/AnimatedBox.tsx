import { type BoxRef } from '@react-slip-and-slide/models';
import React from 'react';
import { animated } from '../../../spring';
import { Box } from '../../Box';
import { springTransformsStyles } from '../helpers';
import {
  type AnimatedBoxComponentType,
  type AnimatedBoxProps,
} from '../models';

const AnimatedProxy = animated(Box);

export const AnimatedBox = React.forwardRef(
  (
    { children, style, ...rest }: AnimatedBoxProps,
    ref?: React.Ref<BoxRef>
  ): JSX.Element => {
    const transforms = React.useMemo(
      () => springTransformsStyles(style?.transform),
      [style?.transform]
    );

    return (
      <AnimatedProxy
        ref={ref}
        style={{
          ...style,
          ...transforms,
        }}
        {...rest}
      >
        {children}
      </AnimatedProxy>
    );
  }
) as AnimatedBoxComponentType;
