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
  initId: string;
  isReady: boolean;
  needsMeasurements: boolean;
  shouldAnimatedStartup: boolean;
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
  RE_INIT = 'RE_INIT',
  SET_CONTAINER_DIMENSIONS = 'SET_CONTAINER_DIMENSIONS',
  SET_WRAPPER_WIDTH = 'SET_WRAPPER_WIDTH',
  SET_ITEM_DIMENSION_MAP = 'SET_ITEM_DIMENSION_MAP',
  SET_RANGES = 'SET_RANGES',
  SET_IS_READY = 'SET_IS_READY',
}

export type InitActionType = {
  type: ActionTypes.INIT;
  payload?: Partial<ContextModel>;
};

export type ReInitActionType = {
  type: ActionTypes.RE_INIT;
  payload: Pick<ContextModel, 'initId'>;
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

export type SetIsReadyActionType = {
  type: ActionTypes.SET_IS_READY;
  payload: boolean;
};

export type Actions =
  | InitActionType
  | ReInitActionType
  | SetContainerDimensionsActionType
  | SetWrapperWidthActionType
  | SetItemDimensionMapActionType
  | SetRangesActionType
  | SetIsReadyActionType;

export type ContextHandlers<T extends object> = {
  state: ContextModel<T>;
  dispatch: React.Dispatch<Actions>;
  actions: {
    init: (payload?: InitActionType['payload']) => void;
    reInit: () => void;
    setContainerDimensions: (
      payload: SetContainerDimensionsActionType['payload']
    ) => void;
    setWrapperWidth: (payload: SetWrapperWidthActionType['payload']) => void;
    setItemDimensionMap: (
      payload: SetItemDimensionMapActionType['payload']
    ) => void;
    setRanges: (payload: SetRangesActionType['payload']) => void;
    setIsReady: (payload: SetIsReadyActionType['payload']) => void;
  };
};
