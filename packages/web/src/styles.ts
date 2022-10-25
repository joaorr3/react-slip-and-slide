import { animated } from "react-spring";
import styled from "styled-components";

export const Wrapper = styled(animated.div)`
  display: flex;
  position: relative;
  flex-direction: row;
  touch-action: none;
`;

export const Item = styled(animated.div)`
  position: absolute;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
`;
