import { animated } from "@react-spring/native";
import styled from "styled-components/native";

export const Wrapper = styled(animated.View)`
  display: flex;
  position: relative;
  flex-direction: row;
  touch-action: none;
`;

export const Item = styled(animated.View)`
  position: absolute;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
`;
