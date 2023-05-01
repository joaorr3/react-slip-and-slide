import { type BoxRef } from '@react-slip-and-slide/models';
import { type AnimatableStyles } from '../../spring/models';
import { type BoxProps } from '../Box';

export type AnimatedBoxProps = React.PropsWithChildren<
  BoxProps & {
    style?: AnimatableStyles;
  }
>;

export type AnimatedBoxComponentType = React.ForwardRefExoticComponent<
  AnimatedBoxProps & React.RefAttributes<BoxRef>
>;
