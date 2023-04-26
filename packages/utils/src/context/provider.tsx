import { produce } from 'immer';
import React, { type Reducer } from 'react';
import {
  ActionTypes,
  type Actions,
  type ContextHandlers,
  type ContextModel,
} from './models';
import { processContextData } from './utils';

const LateralMenuProducer = produce<Reducer<ContextModel, Actions>>(
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
          engineMode,
          dataLength,
          itemDimensions: { width: itemWidth = 0 },
        } = draft;

        const payloadWrapperWidth = action.payload;
        const nextWrapperWidth =
          engineMode === 'multi' ? dataLength * itemWidth : payloadWrapperWidth;

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

export const dataContext = React.createContext<ContextHandlers>(
  {} as ContextHandlers
);

export type DataProviderProps = React.PropsWithChildren<{
  initialData: ContextModel;
}>;

export function DataProvider({
  initialData: _initialData,
  children,
}: DataProviderProps) {
  const [state, dispatch] = React.useReducer(LateralMenuProducer, _initialData);

  // console.log('CONTEXT_STATE: ', processContextData(state));

  const actions = React.useMemo(
    (): ContextHandlers['actions'] => ({
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

  const contextHandlers: ContextHandlers = React.useMemo(
    () => ({ state: processContextData(state), actions, dispatch }),
    [actions, state]
  );

  return (
    <dataContext.Provider value={contextHandlers}>
      {children}
    </dataContext.Provider>
  );
}
