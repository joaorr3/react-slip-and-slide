import { type DisplacementModel } from '@react-slip-and-slide/models';
import { type Interpolation, to } from 'react-spring';

export const displacement = ({
  offsetX,
  index = 0,
  itemWidth = 200,
  infinite,
  dataLength,
}: DisplacementModel): Interpolation<number, number> => {
  if (infinite) {
    const halfData = Math.round((dataLength - 1) / 2) + 1;
    const halfItem = itemWidth / 2;
    const wrapperWidth = dataLength * itemWidth;

    const startPosition =
      index > halfData ? (index - dataLength) * itemWidth : index * itemWidth;

    const max = halfData * itemWidth;
    const min = -((dataLength - halfData - 1) * itemWidth);

    const input = [
      -wrapperWidth,
      min - halfItem - startPosition,
      min - halfItem - startPosition,
      0,
      max + halfItem - startPosition,
      max + halfItem - startPosition,
      wrapperWidth,
    ];

    const output = [
      startPosition,
      max + halfItem,
      min - halfItem,
      startPosition,
      max + halfItem,
      min - halfItem,
      startPosition,
    ];

    return to(offsetX, input, output, 'clamp');
  }

  return to(offsetX, (x) => x + itemWidth * index);
};
