import React from 'react';
import {
  ReactSlipAndSlide,
  type ReactSlipAndSlideProps,
  type ReactSlipAndSlideRef,
} from 'react-slip-and-slide';
// import { Example } from './Example';
import { random, range } from 'lodash';

const data = [
  { width: 400 },
  { width: 400 },
  { width: 400 },
  { width: 400 },
  { width: 400 },
  { width: 400 },
  { width: 400 },
  { width: 400 },
  { width: 400 },
  { width: 400 },
  { width: 400 },
  { width: 400 },
  { width: 400 },
  { width: 400 },
  { width: 400 },
  { width: 400 },
];

const props0: ReactSlipAndSlideProps<{ width: number }> = {
  _testId: 'fixed',
  data,
  snap: true,
  centered: true,
  infinite: true,
  pressToSlide: true,
  itemWidth: 400,
  itemHeight: 100,
  interpolators: {
    opacity: 0.4,
    scale: 0.82,
  },
  renderItem: ({ index, item: { width } }) => {
    return (
      <div
        style={{
          width,
          height: 100,
          backgroundColor: '#767676',
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
  },
};

const props1: ReactSlipAndSlideProps<{ width: number }> = {
  ...props0,
  infinite: false,
};

const props2: ReactSlipAndSlideProps<{ width: number; height: number }> = {
  ...props1,
  _testId: 'dynamic_same_width',
  data: [
    { width: 400, height: 100 },
    { width: 400, height: 200 },
    { width: 400, height: 100 },
    { width: 400, height: 300 },
    { width: 400, height: 100 },
    { width: 400, height: 200 },
  ],
  useWheel: true,
  centered: true,
  itemWidth: undefined,
  itemHeight: undefined,
  renderItem: ({ index, item: { width, height } }) => {
    return (
      <div
        style={{
          width,
          height,
          backgroundColor: '#858585',
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
  },
};

const props3: ReactSlipAndSlideProps<{ width: number }> = {
  ...props1,
  _testId: 'dynamic_MULTI_width',
  data: [
    { width: 800 },
    { width: 200 },
    { width: 300 },
    { width: 400 },
    { width: 500 },
    { width: 800 },
  ],
  centered: true,
  itemWidth: undefined,
  itemHeight: undefined,
};

const props4: ReactSlipAndSlideProps<{ width: number }> = {
  ...props1,
  centered: false,
  interpolators: undefined,
};

export function App() {
  const ref = React.useRef<ReactSlipAndSlideRef>(null);
  const [width, setWidth] = React.useState<number>(400);
  const [currIndex, setCurrIndex] = React.useState<number>(0);

  const [data1, setData1] = React.useState<typeof data>(data);

  // return <Example2 />;

  // return (
  //   <StyledApp style={{ backgroundColor: '#0f0f0f' }}>
  //     <div style={{ height: 0 }} />
  //     <Example />
  //   </StyledApp>
  // );

  const index = React.useRef<number>(0);

  return (
    <React.Fragment>
      <ReactSlipAndSlide
        ref={ref}
        data={data1}
        snap
        centered
        initialIndex={3}
        itemWidth={200}
        // containerHeight={200}
        itemHeight={200}
        infinite
        animateStartup={false}
        // momentumMultiplier={2}
        // useWheel
        // pressToSlide
        // This ↓ is essentially the same as passing pressToSlide={true}
        onItemPress={({ currentIndex, pressedItemIndex }) => {
          if (pressedItemIndex > index.current || pressedItemIndex === 0) {
            ref.current?.next();
          } else if (pressedItemIndex < index.current) {
            ref.current?.previous();
          }
          index.current = pressedItemIndex;
        }}
        // onChange={(i) => {
        //   setCurrIndex(i);
        // }}
        renderItem={({ index }) => {
          return (
            <div
              style={{
                width: '100%',
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
      />
      <button onClick={() => ref.current?.previous()}>Prev</button>
      <button onClick={() => ref.current?.next()}>Next</button>
      <button onClick={() => setWidth(random(100, 400))}>set width</button>
      <button
        onClick={() => {
          const nextData = range(random(3, 20)).map(() => ({ width: 400 }));
          setData1(nextData);
        }}
      >
        set data
      </button>

      <div>
        {data1.map((_, index) => {
          return (
            <button onClick={() => ref.current?.goTo({ index })}>
              Go To {index}
            </button>
          );
        })}
      </div>
      <h1>{currIndex}</h1>
    </React.Fragment>
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        height: '200vh',
        /* background-color: "#0f0f0f", */
        alignItems: 'center',
      }}
    >
      <p>infinite</p>
      <ReactSlipAndSlide {...props0} />

      <p>fixed</p>
      <ReactSlipAndSlide {...props1} visibleItems={10} />

      <p>dynamic (same width)</p>
      <ReactSlipAndSlide {...props2} />

      <p>dynamic (multi width)</p>
      <ReactSlipAndSlide {...props3} />

      <p>align-start</p>
      <ReactSlipAndSlide {...props4} />
    </div>
  );
}

export default App;
