export type SupportedPlatform = 'web' | 'native' | 'ios' | 'android';

export type PlatformModel = {
  /**
   * @example
   * ```ts
   * const isNative = Platform.is('native');
   * ```
   * @example
   * ```ts
   * const platform = Platform.is();
   * ```
   */
  is: (platform?: SupportedPlatform) => SupportedPlatform | boolean;
};
