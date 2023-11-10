import {
  AnimatedBox,
  Box,
  Context,
  elementDimensionStyles,
  type CSSProperties,
} from '@react-slip-and-slide/utils';
import React from 'react';

export const LayoutManager = <T extends object>({
  children,
}: React.PropsWithChildren): JSX.Element => {
  const {
    state: { itemDimensions, itemDimensionMode, engineMode, centered, OffsetX },
  } = Context.useDataContext<T>();

  /**
   * Infinite = false
   * EngineMode = 'single'
   * itemDimensionMode = 'fixed' | 'dynamic'
   */
  if (engineMode === 'single') {
    const dynamicCenteredCorrectionStyles: CSSProperties = {
      transform:
        itemDimensionMode === 'dynamic' && centered
          ? `translateX(${itemDimensions.width / 2}px)`
          : undefined,
    };

    return (
      <Box styles={dynamicCenteredCorrectionStyles}>
        <AnimatedBox
          style={{
            transform: [{ translateX: OffsetX }],
          }}
          styles={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            ...elementDimensionStyles(itemDimensions),
          }}
        >
          {children}
        </AnimatedBox>
      </Box>
    );
  }

  /**
   * Infinite = true
   * EngineMode = 'multi'
   * itemDimensionMode = 'fixed'
   */
  return <React.Fragment>{children}</React.Fragment>;
};
