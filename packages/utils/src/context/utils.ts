import {
  type ItemDimensionMode,
  type LoadingType,
  type ReactSlipAndSlideProps,
} from '@react-slip-and-slide/models';
import { processClampOffsets } from '../utilities/helpers';
import { type ContextModel } from './models';

export function processContextData(data: ContextModel): ContextModel {
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

  const wrapperWidth =
    engineMode === 'multi' ? dataLength * itemWidth : _wrapperWidth;

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
export function initializeContextData<T extends object>(
  props: ReactSlipAndSlideProps<T>
) {
  const {
    data,
    itemHeight,
    itemWidth = 0,
    fullWidthItem,
    infinite: _infinite,
    visibleItems = 0,
    containerWidth,
    interpolators,
  } = props;

  /**
   * This flag indicates how we should deal with the item dimensions.
   * "fixed" means that we the get the values from the props, so we don't need to measure them.
   * "dynamic" means we need to perform a measurement on every item.
   */
  const itemDimensionMode: ItemDimensionMode =
    (itemWidth && itemHeight) || fullWidthItem ? 'fixed' : 'dynamic';

  const infinite = itemDimensionMode === 'fixed' && !!_infinite;
  // LazyLoad only if necessary
  const loadingType: LoadingType = visibleItems === 0 ? 'eager' : 'lazy';

  /**
   * This flag indicates how we utilize the the gesture values.
   * "multi" means that we're applying a translate transform on every item. This is required when "infinite" is true.
   * "single" means we're using the translation value on the container instead of the items.
   *
   * The default will be "single" since it requires less computation.
   */
  // const engineMode: EngineMode = infinite ? 'multi' : 'single';

  const initialContextData: ContextModel<T> = {
    infinite,
    itemDimensionMode,
    loadingType,
    engineMode: 'multi',
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
