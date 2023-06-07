import { produce } from 'immer';
import React, { type Reducer } from 'react';
import {
  ActionTypes,
  type Actions,
  type ContextHandlers,
  type ContextModel,
} from './models';
import { processContextData } from './utils';

const DataProducer = produce<Reducer<ContextModel, Actions>>(
  (draft, action) => {
    switch (action.type) {
      case ActionTypes.INIT: {
        draft.centered = true;
        break;
      }
      case ActionTypes.SET_CONTAINER_DIMENSIONS: {
        const { width, height } = action.payload;
        if (height) {
          draft.container.height = height;
        }
        if (width) {
          draft.container.width = width;
        }
        break;
      }
      case ActionTypes.SET_WRAPPER_WIDTH: {
        const {
          dataLength,
          itemDimensions: { width: itemWidth = 0 },
          itemDimensionMode,
        } = draft;

        const payloadWrapperWidth = action.payload;
        const nextWrapperWidth =
          itemDimensionMode === 'fixed'
            ? dataLength * itemWidth
            : payloadWrapperWidth;

        draft.wrapperWidth = nextWrapperWidth;
        break;
      }
      case ActionTypes.SET_ITEM_DIMENSION_MAP: {
        draft.itemDimensionMap = action.payload;
        break;
      }
      case ActionTypes.SET_RANGES: {
        draft.ranges = action.payload;
        break;
      }
    }
  }
);

export const dataContext = React.createContext<ContextHandlers<object>>(
  {} as ContextHandlers<object>
);

export type DataProviderProps = React.PropsWithChildren<{
  initialData: ContextModel;
}>;

export function DataProvider({
  initialData: _initialData,
  children,
}: DataProviderProps) {
  const [state, dispatch] = React.useReducer(DataProducer, _initialData);

  const actions = React.useMemo(
    (): ContextHandlers<object>['actions'] => ({
      init: (payload) => dispatch({ type: ActionTypes.INIT, payload }),
      setContainerDimensions: (payload) =>
        dispatch({ type: ActionTypes.SET_CONTAINER_DIMENSIONS, payload }),
      setWrapperWidth: (payload) =>
        dispatch({ type: ActionTypes.SET_WRAPPER_WIDTH, payload }),
      setItemDimensionMap: (payload) =>
        dispatch({ type: ActionTypes.SET_ITEM_DIMENSION_MAP, payload }),
      setRanges: (payload) =>
        dispatch({ type: ActionTypes.SET_RANGES, payload }),
    }),
    []
  );

  const contextHandlers: ContextHandlers<object> = React.useMemo(
    () => ({ state: processContextData(state), actions, dispatch }),
    [actions, state]
  );

  return (
    <dataContext.Provider value={contextHandlers}>
      {children}
    </dataContext.Provider>
  );
}
