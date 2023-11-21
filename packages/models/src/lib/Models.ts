import { type FluidValue } from '@react-spring/shared';
import { type AnimationResult, type SpringValue } from 'react-spring';

export type ReactSlipAndSlideRef = {
  /**
   * This could be useful if you don't provide item dimensions and need to restart de component if the item internal dimensions had change.
   */
  reinitialize: () => void;
  next: () => void;
  previous: () => void;
  goTo: (params: {
    index: number;
    animated?: boolean;
    centered?: boolean;
  }) => void;
  /**
   * Offset in pixels to translate.
   */
  move: (offset: number) => void;
};

export type ValidDirection = 'left' | 'right';
export type Direction = ValidDirection | 'center';
export type ActionType =
  | 'drag'
  | 'wheel'
  | 'navigate'
  | 'release'
  | 'correction';

export type SpringIt = {
  offset: number;
  immediate?: boolean;
  onRest?: (x: AnimationResult<SpringValue<number>>) => void;
};

export type Navigate = {
  index?: number;
  direction?: 'next' | 'prev';
  immediate?: boolean;
};

export type RenderItemProps<T extends object> = {
  item: T;
  index: number;
};

export type RenderItem<T extends object> = (
  props: RenderItemProps<T>
) => JSX.Element;

type InterpolatableProperties = 'scale' | 'opacity';

export type Interpolators<T> = {
  [key in InterpolatableProperties]?: T;
};

export type ReactSlipAndSlideProps<T extends object> = React.PropsWithChildren<{
  _testId?: string;
  /**
   * By default there's no pre optimization being done, so if you're experiencing unwanted re-renders make sure you preserve reference integrity by memoizing data.
   * This could be a static structure declare outside of the parent or a React.useMemo call.
   */
  data: T[];
  snap?: boolean;
  centered?: boolean;
  infinite?: boolean;
  /**
   * Useful in some edge cases.
   * For ex, if you have a big container, small items and a small data.length.
   * @default undefined
   */
  pressToSlide?: boolean;
  initialIndex?: number;
  containerWidth?: number;
  /**
   * Allows the items to be visible when overflowing the parent container.
   *
   * @example Example of a cool use case:
   * ```jsx
   * <div className="outer" style={{ width: "100%", overflow: "hidden", display: "flex", justifyContent: "center" }}>
   *   <ReactSlipAndSlide overflowHidden={false} containerWidth={600} ... />
   * </div>
   * ```
   * @default true
   */
  overflowHidden?: boolean;

  /**
   * If true the items will assume the width of it's container.
   * Useful if you leave `containerWidth` undefined to force it to fallback to 100%.
   * The containerWidth will be measured for you and them `containerWidth` and `itemWidth` will be the same.
   *
   * *Overrides `itemWidth`.
   *
   * @default false
   */
  fullWidthItem?: boolean;

  /**
   * If itemWidth is not provided it's assumed that infinite feature is turned off.
   * Also, be aware that if itemWidth is undefined some extra work is required and that could be expensive.
   */
  itemWidth?: number;
  itemHeight?: number;
  interpolators?: Interpolators<number>;
  /**
   * Animates opacity on start up
   * @default true
   */
  animateStartup?: boolean;
  /**
   * In ms
   *
   * Only affects the initial mount
   */
  loadingTime?: number;
  /**
   * The amount of elasticity when dragging beyond the container edges.
   * 0: zero elasticity / disabled
   * @default 1.4
   */
  rubberbandElasticity?: number;
  /**
   * The amount of rendered items at the same time.
   * Ex: If your dataset have a length of 1000 and you pass 10 to the prop, the browser will only paint 10 elements.
   *
   * Default is zero, which means LazyLoading is disabled by default.
   *
   * Be aware that lower values can produce weird behaviors. Play safe with this prop.
   * @default 1
   */
  visibleItems?: number;
  /**
   * Allows you to control the slide gesture with the trackpad or mouse wheel
   */
  useWheel?: boolean;
  /**
   * Controls how much momentum the release will have when snap if false.
   * To prevent bad UX the expected range is between 0 and 1.
   * @example 0.6
   * @default 0
   */
  momentumMultiplier?: number;
  /**
   * If you pass children, to access the context provider for ex,
   * this prop allows you to choose the rendering order.
   * @default 'below'
   */
  childrenPosition?: 'above' | 'below';
  /**
   * Advance usage prop.
   * Make the component react to external dependencies.
   *
   * This covers a particular use case where you might need to trigger a full re-initialization in both dynamic or static modes.
   */
  listener?: React.DependencyList;
  renderItem: RenderItem<T>;
  onChange?: (index: number) => void;
  onEdges?: (props: Edges) => void;
  onReady?: (ready: boolean) => void;
  onItemPress?: (item: {
    currentIndex: number;
    pressedItemIndex: number;
  }) => void;
}>;

export type Edges = { start: boolean; end: boolean };

export type ItemProps<T extends object> = {
  item: T;
  index: number;
  renderItem: RenderItem<T>;
  onPress?: () => void;
};

export type BaseDimensions = {
  width: number;
  height: number;
};

export type ContainerDimensions = BaseDimensions;

/**
 * This flag indicates how we should deal with the item dimensions.
 * "static" means that we the get the values from the props, so we don't need to measure them. (You provide the dimensions)
 * "dynamic" means we need to measure every item.
 */
export type ItemDimensionMode = 'dynamic' | 'static';

/**
 * This flag indicates how we utilize the the gesture values.
 * "multi" means that we're applying a translate transform on every item. This is required when "infinite" is true.
 * "single" means we're using the translation value on the container instead of the items.
 *
 * The default will be "single" since it requires less computation.
 */
export type EngineMode = 'multi' | 'single';

/**
 * LazyLoad only if necessary
 */
export type LoadingType = 'lazy' | 'eager';

// -- Utils

export interface DisplacementModel {
  OffsetX: FluidValue<number>;
  index: number;
  itemWidth: number;
  dataLength: number;
  infinite: boolean;
}

export type ScreenDimensionsModel = BaseDimensions;

export type ItemDimension = BaseDimensions;

export type OnMeasureCallback = (args: {
  itemDimensionMap?: BoxMeasurements[];
  itemWidthSum?: number;
  ranges: DynamicRangeSum[];
}) => void;

export type DynamicRangeSum = Pick<ItemDimension, 'width'> & {
  index: number;
  range: Record<RangeOffsetPosition, number>;
};

export type RangeOffsetPosition = 'start' | 'center' | 'end';

export type UseDynamicDimension = {
  itemDimensionMode: ItemDimensionMode;
  dataLength: number;
  onMeasure?: OnMeasureCallback;
};

export type UseItemsRange = {
  itemDimensionMode: ItemDimensionMode;
  itemDimensionMap: BoxMeasurements[];
};

export type NextDynamicOffset = {
  offsetX: number;
  ranges: DynamicRangeSum[];
  lastValidDirection: ValidDirection | null;
  direction: Direction;
  rangeOffsetPosition: RangeOffsetPosition;
  clampOffset: ClampOffset;
};

export type IsInRange = {
  dataLength: number;
  viewSize: number;
  offsetX: number;
  visibleItems: number;
};

export type ClampOffset = {
  MIN: number;
  MAX: number;
};

// -- Utils.Components

export type BoxMeasurements = ItemDimension;

type Listener = (
  type: string,
  listener: (e: any) => void,
  options?: boolean | AddEventListenerOptions
) => void;

export type BoxRef = {
  measure: () => Promise<BoxMeasurements>;
  addEventListener: Listener;
  removeEventListener: Listener;
  dispatchEvent: (event: Event) => boolean;
};

// -- Helper

type ExtractProps<C> = C extends React.ComponentType<infer P> ? P : never;

export type TypedMemo = <C>(
  Component: C,
  propsAreEqual?: (
    prevProps: ExtractProps<C>,
    nextProps: ExtractProps<C>
  ) => boolean
) => C;
