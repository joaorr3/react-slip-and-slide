import {
  type BoxMeasurements,
  type ClampOffset,
  type ContainerDimensions,
  type DynamicRangeSum,
  type EngineMode,
  type Interpolators,
  type ItemDimensionMode,
  type LoadingType,
  type RangeOffsetPosition,
  type ReactSlipAndSlideProps,
} from '@react-slip-and-slide/models';
import { type SpringValue } from '../spring';

export type ContextModel<T extends object = object> = Required<
  Pick<
    ReactSlipAndSlideProps<T>,
    | '_testId'
    | 'data'
    | 'centered'
    | 'visibleItems'
    | 'infinite'
    | 'fullWidthItem'
    | 'momentumMultiplier'
  >
> & {
  itemDimensionMode: ItemDimensionMode;
  engineMode: EngineMode;
  loadingType: LoadingType;
  itemDimensions: Required<BoxMeasurements>;
  container: ContainerDimensions;
  dataLength: number;
  wrapperWidth: number;
  clampOffset: ClampOffset;
  itemDimensionMap: BoxMeasurements[];
  ranges: DynamicRangeSum[];
  interpolators?: Interpolators<number>;
  rangeOffsetPosition: RangeOffsetPosition;
  OffsetX: SpringValue<number>;
};

export enum ActionTypes {
  INIT = 'INIT',
  SET_CONTAINER_DIMENSIONS = 'SET_CONTAINER_DIMENSIONS',
  SET_WRAPPER_WIDTH = 'SET_WRAPPER_WIDTH',
  SET_ITEM_DIMENSION_MAP = 'SET_ITEM_DIMENSION_MAP',
  SET_RANGES = 'SET_RANGES',
}

export type InitActionType = {
  type: ActionTypes.INIT;
  payload: Partial<ContextModel>;
};

export type SetContainerDimensionsActionType = {
  type: ActionTypes.SET_CONTAINER_DIMENSIONS;
  payload: Partial<ContainerDimensions>;
};

export type SetWrapperWidthActionType = {
  type: ActionTypes.SET_WRAPPER_WIDTH;
  payload: number;
};

export type SetItemDimensionMapActionType = {
  type: ActionTypes.SET_ITEM_DIMENSION_MAP;
  payload: BoxMeasurements[];
};

export type SetRangesActionType = {
  type: ActionTypes.SET_RANGES;
  payload: DynamicRangeSum[];
};

export type Actions =
  | InitActionType
  | SetContainerDimensionsActionType
  | SetWrapperWidthActionType
  | SetItemDimensionMapActionType
  | SetRangesActionType;

export type ContextHandlers<T extends object> = {
  state: ContextModel<T>;
  dispatch: React.Dispatch<Actions>;
  actions: {
    init: (payload: Partial<ContextModel<T>>) => void;
    setContainerDimensions: (payload: Partial<ContainerDimensions>) => void;
    setWrapperWidth: (payload: number) => void;
    setItemDimensionMap: (payload: BoxMeasurements[]) => void;
    setRanges: (payload: DynamicRangeSum[]) => void;
  };
};
