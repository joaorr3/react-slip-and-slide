import { type ReactSlipAndSlideProps } from '@react-slip-and-slide/models';
import {
  Context,
  isInRange,
  LazyLoad,
  useDynamicDimension,
} from '@react-slip-and-slide/utils';
import React from 'react';
import { ItemBase } from './Item';
import { LayoutManager } from './LayoutManager';

export type EngineProps<T extends object> = {
  onItemPress: (index: number) => void;
} & Pick<ReactSlipAndSlideProps<T>, 'renderItem'>;

export const Engine = <T extends object>({
  onItemPress,
  renderItem,
}: EngineProps<T>): JSX.Element => {
  const {
    state: {
      data,
      dataLength,
      itemDimensions,
      loadingType,
      visibleItems,
      OffsetX,
    },
  } = Context.useDataContext<T>();

  const { itemRefs } = useDynamicDimension();

  const shouldRender = React.useCallback(
    (i: number) => {
      if (loadingType === 'eager') {
        return true;
      }
      return isInRange(i, {
        dataLength,
        viewSize: itemDimensions.width,
        visibleItems: visibleItems || Math.round(dataLength / 2),
        offsetX: OffsetX.get(),
      });
    },
    [OffsetX, dataLength, itemDimensions.width, loadingType, visibleItems]
  );

  return (
    <LayoutManager>
      {data.map((item, index) => (
        <LazyLoad key={index} render={shouldRender(index)}>
          <ItemBase
            ref={itemRefs[index]}
            index={index}
            item={item}
            renderItem={renderItem}
            onPress={() => onItemPress(index)}
          />
        </LazyLoad>
      ))}
    </LayoutManager>
  );
};
