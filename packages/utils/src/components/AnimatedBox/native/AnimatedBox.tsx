import React from "react";
import { animated } from "react-spring";
import { BoxBase } from "../../Box";

const BaseAnimatedBox = React.forwardRef(BoxBase);
const AnimatedProxy = animated(BaseAnimatedBox);
export const AnimatedBox = AnimatedProxy;

// type AnimatedBoxProps = React.ComponentProps<typeof AnimatedProxy> & BoxProps;

// export const AnimatedBox = ({ style, children }: AnimatedBoxProps): JSX.Element => {
//   return <AnimatedProxy style={style}>{children}</AnimatedProxy>;
// };
