import { type ScreenDimensions } from '@react-slip-and-slide/models';
import { useWindowDimensions } from 'react-native';

export const useScreenDimensions = (): ScreenDimensions => {
  const { width, height } = useWindowDimensions();
  return {
    width,
    height,
  };
};
