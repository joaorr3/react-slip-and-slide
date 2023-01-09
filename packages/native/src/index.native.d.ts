import "@react-slip-and-slide/utils";

import { StyledComponent } from "styled-components";
import { AnimatedComponent } from "@react-spring/native";

type RNView = React.ComponentClass<
  ViewProps & {
    children?: React.ReactNode;
  },
  any
>;

type NativeComponent = StyledComponent<AnimatedComponent<RNView>, any, {}, never>;

declare module "@react-slip-and-slide/utils/dist/index.native" {
  const Styled: {
    Item: NativeComponent;
    FloatingItem: NativeComponent;
    Wrapper: NativeComponent;
  };
}
