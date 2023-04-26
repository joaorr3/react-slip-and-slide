import { type ScreenDimensionsModel } from '@react-slip-and-slide/models';
import { Dimensions } from 'react-native';

export const ScreenDimensions = (): ScreenDimensionsModel => {
  const { width, height } = Dimensions.get('screen');
  return {
    width,
    height,
  };
};
