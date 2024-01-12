import transform from 'css-to-react-native';
import { toString } from 'lodash';
import type { CSSProperties } from 'react';

const propertiesWithoutUnits = new Set([
  'aspectRatio',
  'elevation',
  'flexGrow',
  'flexShrink',
  'opacity',
  'shadowOpacity',
  'zIndex',
]);

const blackList: (keyof CSSProperties | (string & {}))[] = [
  'transition',
  'shadowRadius',
  'shadowColor',
  'shadowOpacity',
  'shadowOffset',
];

const allowedProperties = (entry: [string, any]) => {
  const [key] = entry;
  return !blackList.includes(key as (typeof blackList)[number]);
};

export const cssToNativeStyle = (styles: CSSProperties = {}) => {
  const flattenedStyles = Object.entries(styles)
    .filter(allowedProperties)
    .reduce<Record<string, string>>((acc, [k, v]) => {
      if (v === undefined || v === null) {
        return acc;
      }

      const cast = toString(v);
      acc[k] =
        typeof v === 'number' && !propertiesWithoutUnits.has(k)
          ? `${cast}px`
          : cast;
      return acc;
    }, {});

  return transform(Object.entries(flattenedStyles), [
    'borderRadius',
    'borderWidth',
    'borderColor',
    'borderStyle',
  ]);
};
