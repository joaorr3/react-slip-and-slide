import { ItemDimension, UseDynamicDimension } from "@react-slip-and-slide/models";
import { sumBy, times } from "lodash";
import React from "react";
import { View } from "react-native";

const viewMeasure = (ref: React.RefObject<View>) => {
  return new Promise<ItemDimension>((res) => {
    ref.current?.measure((_, __, width, height) => {
      res({
        width,
        height,
      });
    });
  });
};

export const useDynamicDimension = ({ mode, dataLength, onMeasure }: UseDynamicDimension) => {
  const itemRefs = React.useMemo<Array<React.RefObject<View>>>(() => {
    return times(dataLength, () => React.createRef());
  }, [dataLength]);

  const [itemDimensionMap, setItemDimensionMap] = React.useState<ItemDimension[]>([]);
  const [itemWidthSum, setItemWidthSum] = React.useState<number>(0);

  const measure = React.useCallback(() => {
    return new Promise<ItemDimension[]>((res) => {
      setTimeout(() => {
        const promises = itemRefs.map((ref) => viewMeasure(ref));
        Promise.all(promises).then((measurements) => {
          res(measurements);
        });
      }, 200);
    });
  }, [itemRefs]);

  React.useEffect(() => {
    if (mode === "dynamic") {
      measure().then((_itemDimensionMap) => {
        setItemDimensionMap(_itemDimensionMap);
        onMeasure?.({ itemDimensionMap: _itemDimensionMap });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLength]);

  React.useEffect(() => {
    if (mode === "dynamic") {
      const sum = sumBy(itemDimensionMap, ({ width }) => width);
      setItemWidthSum(sum);
      onMeasure?.({ itemWidthSum: sum });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemDimensionMap]);

  if (mode === "fixed") {
    return { itemRefs: [], itemDimensionMap: [], itemWidthSum: 0 };
  }

  return { itemRefs, itemDimensionMap, itemWidthSum };
};
