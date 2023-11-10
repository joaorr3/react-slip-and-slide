import { random, range } from 'lodash';
import React from 'react';
import {
  ReactSlipAndSlide,
  type ReactSlipAndSlideRef,
} from 'react-slip-and-slide';
import { Context } from '@react-slip-and-slide/utils';
import { animated } from 'react-spring';

export const Child = (): JSX.Element => {
  const { state } = Context.useDataContext();

  return (
    <div style={{}}>
      <animated.div
        style={{
          display: 'flex',
          translateX: state.OffsetX.to((v) => v / 2),
        }}
      >
        {range(10).map((index) => (
          <div
            style={{
              minWidth: 233,
              height: 100,
              backgroundColor: '#85858573',
              color: '#000000',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: '32px',
              userSelect: 'none',
            }}
          >
            <p className="item-text">{index}</p>
          </div>
        ))}
      </animated.div>

      <animated.div
        style={{
          display: 'flex',
          translateX: state.OffsetX.to((v) => v / 3),
        }}
      >
        {range(10).map((index) => (
          <div
            style={{
              minWidth: 233,
              height: 50,
              backgroundColor: '#85858573',
              color: '#000000',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: '32px',
              userSelect: 'none',
            }}
          >
            <p className="item-text">{index}</p>
          </div>
        ))}
      </animated.div>
    </div>
  );
};

export function Example2() {
  const ref = React.useRef<ReactSlipAndSlideRef>(null);
  const [_width, setWidth] = React.useState<number>(400);
  const [currIndex, setCurrIndex] = React.useState<number>(0);
  const [isReady, setIsReady] = React.useState<boolean>(false);

  const [data1, setData1] = React.useState<Array<{ width: number }>>(
    range(10).map(() => ({ width: 400 }))
  );

  return (
    <React.Fragment>
      <ReactSlipAndSlide
        ref={ref}
        data={data1}
        // snap
        // centered
        // loadingTime={500}
        // animateStartup={false}
        // initialIndex={3}
        // itemWidth={width}
        itemHeight={200}
        onReady={(v) => setIsReady(v)}
        useWheel
        onChange={(i) => {
          setCurrIndex(i);
        }}
        renderItem={({ index }) => {
          return (
            <div
              style={{
                width: 233,
                height: 200,
                backgroundColor: '#85858573',
                color: '#000000',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: '32px',
                userSelect: 'none',
              }}
            >
              <p className="item-text">{index}</p>
            </div>
          );
        }}
      >
        <Child />
      </ReactSlipAndSlide>

      <button onClick={() => ref.current?.previous()}>Prev</button>
      <button onClick={() => ref.current?.next()}>Next</button>
      <button onClick={() => ref.current?.goTo({ index: 3, animated: true })}>
        Go To 3
      </button>
      <button onClick={() => setWidth(random(100, 400))}>set width</button>
      <button
        onClick={() => {
          const nextData = range(random(3, 20)).map(() => ({ width: 400 }));
          setData1(nextData);
        }}
      >
        set data
      </button>
      <h1>{currIndex}</h1>
      <h1>Is Ready? {isReady ? 'yes' : 'no'}</h1>
    </React.Fragment>
  );
}
