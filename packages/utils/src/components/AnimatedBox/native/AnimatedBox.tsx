import React from 'react';
import { animated } from '../../../spring';
import { BoxBase } from '../../Box';
import { type AnimatedBoxComponentType } from '../models';

const BaseAnimatedBox = React.forwardRef(BoxBase);
const AnimatedProxy = animated(BaseAnimatedBox) as AnimatedBoxComponentType;
export const AnimatedBox = AnimatedProxy;
