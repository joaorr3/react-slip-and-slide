import type { FluidProps, FluidValue } from '@react-spring/shared';

export type { AnimationResult, SpringConfig, SpringUpdate } from 'react-spring';
export type { FluidProps, FluidValue };

//taken from https://github.com/sindresorhus/type-fest/blob/main/source/union-to-intersection.d.ts
type UnionToIntersection<Union> = (
  Union extends unknown ? (distributedUnion: Union) => void : never
) extends (mergedIntersection: infer Intersection) => void
  ? Intersection
  : never;

interface PerspectiveTransform {
  perspective: number;
}

interface RotateTransform {
  rotate: string;
}

interface RotateXTransform {
  rotateX: string;
}

interface RotateYTransform {
  rotateY: string;
}

interface RotateZTransform {
  rotateZ: string;
}

interface ScaleTransform {
  scale: number;
}

interface ScaleXTransform {
  scaleX: number;
}

interface ScaleYTransform {
  scaleY: number;
}

interface TranslateXTransform {
  translateX: number;
}

interface TranslateYTransform {
  translateY: number;
}

interface SkewXTransform {
  skewX: string;
}

interface SkewYTransform {
  skewY: string;
}

interface MatrixTransform {
  matrix: number[];
}

type TransformsStyle = Array<
  | PerspectiveTransform
  | RotateTransform
  | RotateXTransform
  | RotateYTransform
  | RotateZTransform
  | ScaleTransform
  | ScaleXTransform
  | ScaleYTransform
  | TranslateXTransform
  | TranslateYTransform
  | SkewXTransform
  | SkewYTransform
  | MatrixTransform
>;

type TransformsModel = NonNullable<TransformsStyle>[number];
export type Transforms = Partial<UnionToIntersection<TransformsModel>>;

export type SelectedTransforms = Pick<
  Transforms,
  | 'rotate'
  | 'rotateX'
  | 'rotateY'
  | 'rotateZ'
  | 'scale'
  | 'scaleX'
  | 'scaleY'
  | 'translateX'
  | 'translateY'
>;

export type FluidTransforms = FluidProps<SelectedTransforms>;
export type FluidTypes = (string | FluidValue<string, any>) &
  (number | FluidValue<number, any>) &
  (number[] | FluidValue<number[], any>);

/**
 * Base on ViewStyle
 */
export type AnimatableStyles = {
  transform?: FluidTransforms[];
} & FluidProps<{
  opacity?: number;
  height?: number | string;
  width?: number | string;
  shadowColor?: string;
  elevation?: number;
  // ---
  backgroundColor?: string;
  borderBottomColor?: string;
  borderBottomLeftRadius?: number;
  borderBottomRightRadius?: number;
  borderBottomWidth?: number;
  borderColor?: string;
  borderLeftColor?: string;
  borderLeftWidth?: number;
  borderRadius?: number;
  borderRightColor?: string;
  borderRightWidth?: number;
  borderStyle?: 'solid' | 'dotted' | 'dashed';
  borderTopColor?: string;
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
  borderTopWidth?: number;
  borderWidth?: number;
  flex?: number;
}>;
