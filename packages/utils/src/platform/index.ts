import { type PlatformModel, type SupportedPlatform } from './Platform.models';

export * from './Platform.models';

export const Platform: PlatformModel = {
  is: (platform) => {
    if (!platform) {
      return 'web';
    }
    const platforms: Record<SupportedPlatform, boolean> = {
      web: true,
      native: false,
      ios: false,
      android: false,
    };
    return platforms[platform];
  },
};
