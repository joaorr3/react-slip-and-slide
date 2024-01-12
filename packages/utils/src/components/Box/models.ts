import type React from 'react';
import type { ViewProps } from 'react-native';

export type BoxProps = React.PropsWithChildren<{
  styles?: React.CSSProperties;
  willMeasure?: boolean;
  onPress?: (e?: any) => void;
  onPressStart?: (e?: any) => void;
  web?: React.HTMLAttributes<HTMLDivElement>;
  native?: ViewProps;
}>;

export type StyledBoxProps = Pick<BoxProps, 'styles'>;
