import { styled, css } from "../../utilities";
import { AnimatedBox } from "../AnimatedBox";

const itemBaseStyle = css`
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const FloatingItem = styled(AnimatedBox)`
  ${itemBaseStyle}
  position: absolute;
`;

export const Item = styled(AnimatedBox)`
  ${itemBaseStyle}
`;
