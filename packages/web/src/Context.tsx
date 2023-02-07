import {
  BoxMeasurements,
  ContainerDimensions,
  DynamicRangeSum,
  Interpolators,
  ItemDimensionMode,
  ReactSlipAndSlideProps,
} from "@react-slip-and-slide/models";
import { processClampOffsets } from "@react-slip-and-slide/utils";
import produce from "immer";
import React, { Reducer } from "react";
import { EngineMode, LoadingType } from "./Engine";

export type ContextModel<T extends unknown = unknown> = Required<
  Pick<ReactSlipAndSlideProps<T>, "data" | "centered" | "visibleItems" | "infinite" | "fullWidthItem">
> & {
  itemDimensionMode: ItemDimensionMode;
  engineMode: EngineMode;
  loadingType: LoadingType;
  itemDimensions: Required<BoxMeasurements>;
  container: ContainerDimensions;
  dataLength: number;
  wrapperWidth: number;
  clampOffset: {
    MIN: number;
    MAX: number;
  };
  itemDimensionMap: BoxMeasurements[];
  ranges: DynamicRangeSum[];
  interpolators?: Interpolators<number>;
};

export enum ActionTypes {
  INIT = "INIT",
  SET_CONTAINER_DIMENSIONS = "SET_CONTAINER_DIMENSIONS",
  SET_WRAPPER_WIDTH = "SET_WRAPPER_WIDTH",
  SET_ITEM_DIMENSION_MAP = "SET_ITEM_DIMENSION_MAP",
  SET_RANGES = "SET_RANGES",
}

type InitActionType = {
  type: ActionTypes.INIT;
  payload: Partial<ContextModel>;
};

type SetContainerDimensionsActionType = {
  type: ActionTypes.SET_CONTAINER_DIMENSIONS;
  payload: Partial<ContainerDimensions>;
};

type SetWrapperWidthActionType = {
  type: ActionTypes.SET_WRAPPER_WIDTH;
  payload: number;
};

type SetItemDimensionMapActionType = {
  type: ActionTypes.SET_ITEM_DIMENSION_MAP;
  payload: BoxMeasurements[];
};

type SetRangesActionType = {
  type: ActionTypes.SET_RANGES;
  payload: DynamicRangeSum[];
};

type Actions =
  | InitActionType
  | SetContainerDimensionsActionType
  | SetWrapperWidthActionType
  | SetItemDimensionMapActionType
  | SetRangesActionType;

export interface ContextHandlers<T extends unknown = unknown> {
  state: ContextModel<T>;
  dispatch: React.Dispatch<Actions>;
  actions: {
    init: (payload: Partial<ContextModel>) => void;
    setContainerDimensions: (payload: Partial<ContainerDimensions>) => void;
    setWrapperWidth: (payload: number) => void;
    setItemDimensionMap: (payload: BoxMeasurements[]) => void;
    setRanges: (payload: DynamicRangeSum[]) => void;
  };
}

const LateralMenuProducer = produce<Reducer<ContextModel, Actions>>((draft, action) => {
  switch (action.type) {
    case ActionTypes.INIT:
      draft.centered = true;
      break;
    case ActionTypes.SET_CONTAINER_DIMENSIONS:
      const { width, height } = action.payload;
      if (height) {
        draft.container.height = height;
      }
      if (width) {
        draft.container.width = width;
      }
      break;
    case ActionTypes.SET_WRAPPER_WIDTH:
      const {
        engineMode,
        dataLength,
        itemDimensions: { width: itemWidth = 0 },
      } = draft;

      const payloadWrapperWidth = action.payload;
      const nextWrapperWidth = engineMode === "multi" ? dataLength * itemWidth : payloadWrapperWidth;

      draft.wrapperWidth = nextWrapperWidth;
      break;
    case ActionTypes.SET_ITEM_DIMENSION_MAP:
      draft.itemDimensionMap = action.payload;
      break;
    case ActionTypes.SET_RANGES:
      draft.ranges = action.payload;
      break;
  }
});

const context = React.createContext<ContextHandlers>({} as ContextHandlers);

export type DataProviderProps = React.PropsWithChildren<{ initialData: ContextModel }>;

export function DataProvider({ initialData: _initialData, children }: DataProviderProps) {
  const [state, dispatch] = React.useReducer(LateralMenuProducer, _initialData);

  // console.log("CONTEXT_STATE: ", processContextData(state));

  const actions = React.useMemo(
    (): ContextHandlers["actions"] => ({
      init: (payload) => dispatch({ type: ActionTypes.INIT, payload }),
      setContainerDimensions: (payload) => dispatch({ type: ActionTypes.SET_CONTAINER_DIMENSIONS, payload }),
      setWrapperWidth: (payload) => dispatch({ type: ActionTypes.SET_WRAPPER_WIDTH, payload }),
      setItemDimensionMap: (payload) => dispatch({ type: ActionTypes.SET_ITEM_DIMENSION_MAP, payload }),
      setRanges: (payload) => dispatch({ type: ActionTypes.SET_RANGES, payload }),
    }),
    []
  );

  const contextHandlers: ContextHandlers = React.useMemo(
    () => ({ state: processContextData(state), actions, dispatch }),
    [actions, state]
  );

  return <context.Provider value={contextHandlers}>{children}</context.Provider>;
}

export function useDataContext<T>(): ContextHandlers<T> {
  const { state, actions, dispatch } = React.useContext<ContextHandlers<T>>(
    context as React.Context<ContextHandlers<T>>
  );
  return { state, actions, dispatch };
}

function processContextData<T>(data: ContextModel<T>): ContextModel<T> {
  const {
    engineMode,
    dataLength,
    itemDimensions: { width: _itemWidth = 0 },
    wrapperWidth: _wrapperWidth,
    container,
    centered,
    fullWidthItem,
  } = data;

  const itemWidth = fullWidthItem ? container.width : _itemWidth;

  const wrapperWidth = engineMode === "multi" ? dataLength * itemWidth : _wrapperWidth;

  const sideMargins = (container.width - itemWidth) / 2;

  const { MIN, MAX } = processClampOffsets({
    wrapperWidth,
    sideMargins,
    containerWidth: container.width,
    centered,
  });

  return {
    ...data,
    wrapperWidth,
    clampOffset: {
      MIN,
      MAX,
    },
    itemDimensions: {
      ...data.itemDimensions,
      width: itemWidth,
    },
  };
}

/**
 * Initialize setup flags
 *
 */
export function initializeContextData<T>(props: ReactSlipAndSlideProps<T>) {
  const {
    data,
    itemHeight,
    itemWidth = 0,
    fullWidthItem,
    infinite: _infinite,
    visibleItems,
    containerWidth,
    interpolators,
  } = props;

  const itemDimensionMode: ItemDimensionMode = (itemWidth && itemHeight) || fullWidthItem ? "fixed" : "dynamic";
  const infinite = itemDimensionMode === "fixed" && !!_infinite;
  // LazyLoad only if necessary
  const loadingType: LoadingType = visibleItems === 0 ? "eager" : "lazy";
  const engineMode: EngineMode = infinite ? "multi" : "single";

  const initialContextData: ContextModel<T> = {
    infinite,
    itemDimensionMode,
    loadingType,
    engineMode,
    data: props.data,
    itemDimensions: {
      width: props.itemWidth || 0,
      height: props.itemHeight || 0,
    },
    container: {
      width: containerWidth || 0,
      height: itemHeight || 0,
    },
    centered: !!props.centered,
    visibleItems: props.visibleItems || 0,
    dataLength: data.length,
    wrapperWidth: 0,
    clampOffset: {
      MIN: 0,
      MAX: 0,
    },
    fullWidthItem: false,
    itemDimensionMap: [],
    ranges: [],
    interpolators,
  };

  return initialContextData;
}
