import { type ActionType } from '@react-slip-and-slide/models';
import { type SpringConfig } from 'react-spring';

export const baseSpringConfig = {
  tension: 220,
  friction: 32,
  mass: 1,
};

export const springConfigByActionType: Record<
  ActionType,
  Pick<SpringConfig, 'tension' | 'friction' | 'mass'>
> = {
  drag: baseSpringConfig,
  wheel: baseSpringConfig,
  navigate: { tension: 320, friction: 32, mass: 1 },
  release: baseSpringConfig,
  correction: baseSpringConfig,
};
