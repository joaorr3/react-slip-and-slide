import { animated } from '../../../spring';
import React from 'react';
import { BoxBase } from '../../Box';
import {
  type AnimatedBoxComponentType,
  type AnimatedBoxProps,
} from '../models';
import { type BoxRef } from '@react-slip-and-slide/models';
import { springTransformsStyles } from '../helpers';

const BaseAnimatedBox = React.forwardRef(BoxBase);
const AnimatedProxy = animated(BaseAnimatedBox);

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
