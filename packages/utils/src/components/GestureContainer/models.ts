import {
  type ActionType,
  type Direction,
  type Navigate,
  type ValidDirection,
} from '@react-slip-and-slide/models';
import type React from 'react';
import { type AnimatableStyles } from '../../spring/models';

export type GestureContainerProps = React.PropsWithChildren<{
  style: AnimatableStyles;
  styles: React.CSSProperties;
  direction: React.MutableRefObject<Direction>;
  lastValidDirection: React.MutableRefObject<ValidDirection | null>;
  lastOffset: React.MutableRefObject<number>;
  isIntentionalDrag: React.MutableRefObject<boolean>;
  isDragging: React.MutableRefObject<boolean>;
  useWheel?: boolean;
  snap?: boolean;
  intentionalDragThreshold: number;
  onDrag: (offset: number, actionType: ActionType) => void;
  onRelease: (props: { offset: number; velocity: number }) => void;
  navigate: (props: Navigate) => void;
}>;
