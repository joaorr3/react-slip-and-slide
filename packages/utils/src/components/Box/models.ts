import type React from 'react';
import type { ViewProps } from 'react-native';
import { type CSSProperties } from '../../styled-components';

export type BoxProps = React.PropsWithChildren<{
  styles?: CSSProperties;
  willMeasure?: boolean;
  onPress?: (e?: any) => void;
  onPressStart?: (e?: any) => void;
  web?: React.HTMLAttributes<HTMLDivElement>;
  native?: ViewProps;
}>;

export type StyledBoxProps = Pick<BoxProps, 'styles'>;
