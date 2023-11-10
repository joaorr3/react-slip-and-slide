import { type ReactSlipAndSlideProps } from '@react-slip-and-slide/models';
import { nothing, produce } from 'immer';
import React, { type Reducer } from 'react';
import { SpringValue } from 'react-spring';
import { useIsFirstRender } from '../utilities';
import { baseSpringConfig } from '../utilities/config';
import {
  ActionTypes,
  type Actions,
  type ContextHandlers,
  type ContextModel,
} from './models';
import { initializeContextData, processContextData } from './utils';

export const OffsetX = new SpringValue(0, {
  config: baseSpringConfig,
});

const useProducer = (initialData: ContextModel) => {
  return React.useReducer<Reducer<ContextModel, Actions>>(
    produce((draft, action) => {
      switch (action.type) {
        case ActionTypes.INIT: {
          return action.payload;
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
        default: {
          return nothing;
        }
      }
    }),
    initialData
  );
};

export const dataContext = React.createContext<ContextHandlers<object>>(
  {} as ContextHandlers<object>
);

export type DataProviderProps = React.PropsWithChildren<{
  props: ReactSlipAndSlideProps<object>;
}>;

export function DataProvider({ props, children }: DataProviderProps) {
  const isFirstRender = useIsFirstRender();
  const [state, dispatch] = useProducer(initializeContextData(props));

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
    [dispatch]
  );

  React.useEffect(() => {
    if (!isFirstRender) {
      actions.init(initializeContextData(props));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    props.data,
    props.itemHeight,
    props.itemWidth,
    props.fullWidthItem,
    props.infinite,
    props.visibleItems,
    props.containerWidth,
    props.interpolators,
    props.centered,
    props.momentumMultiplier,
  ]);

  const contextHandlers: ContextHandlers<object> = React.useMemo(
    () => ({ state: processContextData(state), actions, dispatch }),
    [actions, dispatch, state]
  );

  return (
    <dataContext.Provider value={contextHandlers}>
      {children}
    </dataContext.Provider>
  );
}
