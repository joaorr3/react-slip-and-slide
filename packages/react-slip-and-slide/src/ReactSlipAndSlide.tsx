import {
  type ReactSlipAndSlideProps,
  type ReactSlipAndSlideRef,
} from '@react-slip-and-slide/models';
import {
  Context,
  GestureContainer,
  elementDimensionStyles,
  typedMemo,
  useEngine,
} from '@react-slip-and-slide/utils';
import React from 'react';
import { Engine } from './Engine';

function ReactSlipAndSlideComponent<T extends object>(
  {
    snap,
    containerWidth,
    pressToSlide,
    animateStartup = true,
    rubberbandElasticity = 0.1,
    overflowHidden = true,
    intentionalDragThreshold = 20,
    useWheel,
    initialIndex,
    loadingTime,
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
    initialIndex,
    loadingTime,
    onChange,
    onEdges,
    onReady,
    onItemPress,
  });

  const gestureContainerStyles: React.CSSProperties = {
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
      snap={snap}
      intentionalDragThreshold={intentionalDragThreshold}
      onDrag={handlers.onDrag}
      onRelease={handlers.onRelease}
      navigate={handlers.navigate}
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
    <Context.DataProvider
      props={props as unknown as ReactSlipAndSlideProps<object>}
    >
      {props.childrenPosition === 'above' && props.children}

      <ForwardReactSlipAndSlideRef ref={ref} {...props} />

      {(!props.childrenPosition || props.childrenPosition === 'below') &&
        props.children}
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
