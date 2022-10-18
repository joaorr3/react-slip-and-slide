import { FluidValue } from "@react-spring/shared";
import { CSSProperties } from "react";
import { AnimationResult, SpringValue } from "react-spring";

export type ReactSlipAndSlideRef = {
  next: () => void;
  previous: () => void;
  goTo: (params: { index: number; animated?: boolean }) => void;
  /**
   * Offset in pixels to translate.
   */
  move: (offset: number) => void;
};

export type ValidDirection = "left" | "right";
export type Direction = ValidDirection | "center";
export type ActionType = "drag" | "release" | "correction";
export type SpringIt = {
  offset: number;
  immediate?: boolean;
  onRest?: (x: AnimationResult<SpringValue<number>>) => void;
  actionType: ActionType;
};
export type Navigate = {
  index?: number;
  direction?: "next" | "prev";
  immediate?: boolean;
};

export type RenderItemProps<T> = {
  item: T;
  index: number;
};

export type RenderItem<T> = (props: RenderItemProps<T>) => JSX.Element;

export type Interpolators<T> = {
  [key in keyof CSSProperties]: T;
};

export type ReactSlipAndSlideProps<T> = {
  data: T[];
  snap?: boolean;
  centered?: boolean;
  infinite?: boolean;
  /**
   * Useful in some edge cases.
   * For ex, if you have a big container, small items and a small data.length.
   * @default undefined
   */
  // clonesNumber?: number;
  pressToSlide?: boolean;
  containerWidth?: number;
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
  renderItem: RenderItem<T>;
  onChange?: (index: number) => void;
  onEdges?: (props: { start: boolean; end: boolean }) => void;
  onReady?: (ready: boolean) => void;
};

export type ItemProps<T> = {
  item: T;
  dataLength: number;
  index: number;
  offsetX: FluidValue<number>;
  infinite: boolean;
  itemWidth: number;
  itemHeight?: number;
  interpolators: Interpolators<number>;
  dynamicOffset: number;
  mode: Mode;
  renderItem: RenderItem<T>;
  onPress?: () => void;
};

export type ContainerDimensions = {
  width: number;
  height: number;
};

export type Mode = "dynamic" | "fixed";

// -- Utils

export interface DisplacementModel {
  offsetX: FluidValue<number>;
  index: number;
  itemWidth: number;
  dataLength: number;
  infinite: boolean;
}

export type ScreenDimensions = {
  width?: number;
  height?: number;
};

export type ItemDimensionMap = {
  index: number;
  width: number;
  height: number;
};

export type OnMeasureCallback = (args: { itemDimensionMap?: ItemDimensionMap[]; itemWidthSum?: number }) => void;

export type DynamicRangeSum =
  | {
      index: number;
      width: number;
      range: { start: number; center: number; end: number };
    }
  | undefined;

export type UseDynamicDimension = {
  mode: Mode;
  dataLength: number;
  onMeasure?: OnMeasureCallback;
};

export type UseItemsRange = {
  mode: Mode;
  itemDimensionMap: ItemDimensionMap[];
  offsetX: number;
};

export type NextDynamicOffset = {
  offsetX: number;
  ranges: DynamicRangeSum[];
  dir: ValidDirection | null;
  centered: boolean;
};
