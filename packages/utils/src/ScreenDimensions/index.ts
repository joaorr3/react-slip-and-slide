import { type ScreenDimensionsModel } from '@react-slip-and-slide/models';

export const ScreenDimensions = (): ScreenDimensionsModel => {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};
