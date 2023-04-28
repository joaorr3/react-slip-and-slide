import { Platform as RNPlatform } from 'react-native';
import { type PlatformModel, type SupportedPlatform } from './Platform.models';
export * from './Platform.models';

export const Platform: PlatformModel = {
  is: (platform) => {
    if (!platform) {
      return RNPlatform.OS as SupportedPlatform;
    }
    const platforms: Record<SupportedPlatform, boolean> = {
      web: false,
      native: true,
      ios: RNPlatform.OS === 'ios',
      android: RNPlatform.OS === 'android',
    };
    return platforms[platform];
  },
};
