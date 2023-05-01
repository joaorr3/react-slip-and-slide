import { to } from '../../spring';
import { type FluidTransforms, type FluidTypes } from '../../spring/models';

export const parseTranslate = (x?: number, y?: number): string => {
  if (x !== undefined && y !== undefined) {
    return `translate(${x}px, ${y}px)`;
  } else if (x !== undefined) {
    return `translateX(${x}px)`;
  } else if (y !== undefined) {
    return `translateY(${y}px)`;
  }
  return '';
};

/**
 * Converts React Native transforms array to @react-spring/web transform styles
 */
export const parseTransforms = (transform?: FluidTransforms[]) => {
  return transform?.reduce((acc, transform) => {
    const [trs] = Object.entries(transform) as Array<
      [keyof FluidTransforms, FluidTypes]
    >;
    const [key, val] = trs;
    acc[key] = val;
    return acc;
  }, {} as FluidTransforms);
};

export const selectTransforms = (transforms?: FluidTransforms) => {
  return {
    rotateX: transforms?.rotateX,
    rotateY: transforms?.rotateY,
    rotateZ: transforms?.rotateZ,
    rotate: transforms?.rotate,
    scale: transforms?.scale,
    scaleX: transforms?.scaleX,
    scaleY: transforms?.scaleY,
    transform: to(
      [transforms?.translateX, transforms?.translateY],
      parseTranslate
    ),
  };
};

export const springTransformsStyles = (transform?: FluidTransforms[]) => {
  const transformsObject = parseTransforms(transform);
  return selectTransforms(transformsObject);
};
