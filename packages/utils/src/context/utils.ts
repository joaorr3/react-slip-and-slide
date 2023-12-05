import {
  type BaseDimensions,
  type EngineMode,
  type ItemDimensionMode,
  type LoadingType,
  type ReactSlipAndSlideProps,
} from '@react-slip-and-slide/models';
import { clamp, sumBy, uniqueId } from 'lodash';
import { type SpringValue } from '../spring';
import { processClampOffsets } from '../utilities/helpers';
import { type ContextModel } from './models';

const getLargestDynamicItem = (itemDimensionMap: BaseDimensions[]) => {
  const widest = Math.max(...itemDimensionMap.map((d) => d.width || 0));
  const highest = Math.max(...itemDimensionMap.map((d) => d.height || 0));

  return {
    width: isFinite(widest) ? widest : 0,
    height: isFinite(highest) ? highest : 0,
  };
};

const getDynamicWrapperWidth = (itemDimensionMap: BaseDimensions[]) => {
  return sumBy(itemDimensionMap, ({ width }) => width);
};

export function processContextData(data: ContextModel): ContextModel {
  const {
    dataLength,
    itemDimensions: { width: itemWidth = 0, height: _itemHeight = 0 },
    wrapperWidth: _wrapperWidth,
    container,
    centered,
    fullWidthItem,
    itemDimensionMode,
    itemDimensionMap,
  } = data;

  const largestItem = getLargestDynamicItem(itemDimensionMap);
  const dynamicWrapperWidth = getDynamicWrapperWidth(itemDimensionMap);

  const itemDimensions: BaseDimensions = {
    width: fullWidthItem ? container.width : itemWidth || largestItem.width,
    height: itemDimensionMode === 'static' ? _itemHeight : largestItem.height,
  };

  const containerDimensions: BaseDimensions = {
    width: container.width,
    height: itemDimensions.height,
  };

  const wrapperWidth =
    itemDimensionMode === 'static'
      ? dataLength * itemDimensions.width
      : dynamicWrapperWidth;

  const sideMargins = (containerDimensions.width - itemDimensions.width) / 2;

  const { MIN, MAX } = processClampOffsets({
    wrapperWidth,
    sideMargins,
    containerWidth: containerDimensions.width,
    centered,
    itemDimensionMode,
    ranges: data.ranges,
  });

  return {
    ...data,
    wrapperWidth,
    clampOffset: {
      MIN,
      MAX,
    },
    itemDimensionMode,
    itemDimensions,
    container: containerDimensions,
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
    _testId = '',
    data,
    itemHeight = 0,
    itemWidth = 0,
    fullWidthItem,
    infinite: _infinite,
    visibleItems = 0,
    containerWidth,
    interpolators,
    centered,
    momentumMultiplier = 2,
    animateStartup = true,
    initialIndex,
  } = props;

  const itemDimensionMode: ItemDimensionMode =
    (itemWidth && itemHeight) || fullWidthItem ? 'static' : 'dynamic';

  const infinite = itemDimensionMode === 'static' && !!_infinite;
  const loadingType: LoadingType = visibleItems === 0 ? 'eager' : 'lazy';

  const engineMode: EngineMode =
    infinite || loadingType === 'lazy' ? 'multi' : 'single';

  const shouldAnimatedStartup =
    !!initialIndex ||
    itemDimensionMode === 'dynamic' ||
    (!!animateStartup && loadingType === 'eager');

  const initialContextData: ContextModel<T> = {
    _testId,
    initId: uniqueId('init-'),
    infinite,
    itemDimensionMode,
    loadingType,
    isReady: itemDimensionMode === 'static',
    shouldAnimatedStartup,
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
    centered: !!centered,
    visibleItems: props.visibleItems || 0,
    dataLength: data.length,
    wrapperWidth: 0,
    clampOffset: {
      MIN: 0,
      MAX: 0,
    },
    fullWidthItem: !!fullWidthItem,
    itemDimensionMap: [],
    ranges: [],
    interpolators,
    rangeOffsetPosition: centered ? 'center' : 'start',
    momentumMultiplier: clamp(momentumMultiplier, 0, 10),
    OffsetX: null as unknown as SpringValue<number>,
  };

  return initialContextData;
}
