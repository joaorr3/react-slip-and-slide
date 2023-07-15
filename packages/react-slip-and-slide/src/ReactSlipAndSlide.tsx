import {
  type ReactSlipAndSlideProps,
  type ReactSlipAndSlideRef,
} from '@react-slip-and-slide/models';
import {
  Context,
  elementDimensionStyles,
  GestureContainer,
  typedMemo,
  useEngine,
  type CSSProperties,
} from '@react-slip-and-slide/utils';
import React from 'react';
import { Engine } from './Engine';

function ReactSlipAndSlideComponent<T extends object>(
  {
    snap,
    containerWidth,
    pressToSlide,
    animateStartup = true,
    rubberbandElasticity = 1.4,
    overflowHidden = true,
    useWheel,
    onChange,
    onEdges,
    onReady,
    onItemPress,
    renderItem,
  }: ReactSlipAndSlideProps<T>,
  ref: React.Ref<ReactSlipAndSlideRef>
) {
  const { handlers, state, signals, containerRef, Opacity } = useEngine<T>({
    snap,
    containerWidth,
    pressToSlide,
    animateStartup,
    rubberbandElasticity,
    instanceRef: ref,
    onChange,
    onEdges,
    onReady,
    onItemPress,
  });

  const gestureContainerStyles: CSSProperties = {
    justifyContent: state.centered ? 'center' : 'flex-start',
    ...elementDimensionStyles(state.container),
    width: containerWidth || '100%',
    minWidth: containerWidth || '100%',
    overflow: overflowHidden ? 'hidden' : undefined,
  };

  return (
    <GestureContainer
      ref={containerRef}
      direction={signals.direction}
      isDragging={signals.isDragging}
      isIntentionalDrag={signals.isIntentionalDrag}
      lastOffset={signals.lastOffset}
      lastValidDirection={signals.lastValidDirection}
      useWheel={useWheel}
      style={{ opacity: Opacity }}
      styles={gestureContainerStyles}
      onDrag={handlers.onDrag}
      onRelease={handlers.onRelease}
    >
      <Engine onItemPress={handlers.onItemPress} renderItem={renderItem} />
    </GestureContainer>
  );
}

export const ForwardReactSlipAndSlideRef = React.forwardRef(
  ReactSlipAndSlideComponent
) as <T extends object>(
  props: ReactSlipAndSlideProps<T> & {
    ref?: React.Ref<ReactSlipAndSlideRef>;
  }
) => ReturnType<typeof ReactSlipAndSlideComponent>;

function ReactSlipAndSlideWithContext<T extends object>(
  props: ReactSlipAndSlideProps<T>,
  ref: React.Ref<ReactSlipAndSlideRef>
) {
  return (
    <Context.DataProvider initialData={Context.initializeContextData<T>(props)}>
      <ForwardReactSlipAndSlideRef ref={ref} {...props} />
    </Context.DataProvider>
  );
}

const ForwardReactSlipAndSlideWithContextRef = React.forwardRef(
  ReactSlipAndSlideWithContext
) as <T extends object>(
  props: ReactSlipAndSlideProps<T> & {
    ref?: React.Ref<ReactSlipAndSlideRef>;
  }
) => ReturnType<typeof ReactSlipAndSlideWithContext>;

export const ReactSlipAndSlide = typedMemo(
  ForwardReactSlipAndSlideWithContextRef
);
