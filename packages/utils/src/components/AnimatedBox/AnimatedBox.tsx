import { animated } from '../../spring';
import React from 'react';
import { BoxBase } from '../Box';

const BaseAnimatedBox = React.forwardRef(BoxBase);
const AnimatedProxy = animated(BaseAnimatedBox);
export const AnimatedBox = AnimatedProxy;
