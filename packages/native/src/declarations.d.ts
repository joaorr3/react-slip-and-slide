import { type AnimatedComponent } from '@react-spring/native';
import { type ViewProps } from 'react-native/types';
import { type StyledComponent } from 'styled-components';

type RNView = React.ComponentClass<
  ViewProps & {
    children?: React.ReactNode;
  },
  any
>;

type NativeComponent = StyledComponent<
  AnimatedComponent<RNView>,
  any,
  object,
  never
>;

declare module '@react-slip-and-slide/utils/src/index.native' {
  const Styled: {
    Item: NativeComponent;
    Wrapper: NativeComponent;
  };
}
