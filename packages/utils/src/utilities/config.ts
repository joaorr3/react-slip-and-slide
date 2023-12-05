import { type ActionType } from '@react-slip-and-slide/models';
import { type SpringConfig } from 'react-spring';

export const baseSpringConfig = {
  tension: 220,
  friction: 32,
  mass: 1,
};

export const snappySpringConfig = {
  ...baseSpringConfig,
  tension: 320,
};

export const springConfigByActionType: Record<
  ActionType,
  Pick<SpringConfig, 'tension' | 'friction' | 'mass'>
> = {
  drag: baseSpringConfig,
  wheel: baseSpringConfig,
  release: baseSpringConfig,
  correction: baseSpringConfig,
  wheelSnap: snappySpringConfig,
  navigate: snappySpringConfig,
  ref: snappySpringConfig,
};
