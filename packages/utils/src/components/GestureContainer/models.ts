import {
  type Direction,
  type ValidDirection,
} from '@react-slip-and-slide/models';
import type React from 'react';
import { type CSSProperties } from 'styled-components';
import { type AnimatableStyles } from '../../spring/models';

export type GestureContainerProps = React.PropsWithChildren<{
  style: AnimatableStyles;
  styles: CSSProperties;
  direction: React.MutableRefObject<Direction>;
  lastValidDirection: React.MutableRefObject<ValidDirection | null>;
  lastOffset: React.MutableRefObject<number>;
  isIntentionalDrag: React.MutableRefObject<boolean>;
  isDragging: React.MutableRefObject<boolean>;
  useWheel?: boolean;
  onDrag: (offset: number) => void;
  onRelease: (props: { offset: number; velocity: number }) => void;
}>;
