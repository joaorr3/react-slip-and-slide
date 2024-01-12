import { animated } from '../../../spring/index.native';
import { Box } from '../../Box';
import { type AnimatedBoxComponentType } from '../models';

export const AnimatedBox = animated(Box) as AnimatedBoxComponentType;
