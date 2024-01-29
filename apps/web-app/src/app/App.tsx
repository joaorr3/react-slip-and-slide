import { type RenderItem } from '@react-slip-and-slide/models';
import { random, range } from 'lodash';
import React from 'react';
import {
  Context,
  ReactSlipAndSlide,
  type ReactSlipAndSlideProps,
  type ReactSlipAndSlideRef,
} from 'react-slip-and-slide';

const data = range(10).map((_, i) => ({ value: i }));

const props0: ReactSlipAndSlideProps<{ value: number }> = {
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
  renderItem: ({ index, item: { value } }) => {
    return (
      <div
        style={{
          width: value,
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

const props1: ReactSlipAndSlideProps<{ value: number }> = {
  ...props0,
  infinite: false,
};

const props2: ReactSlipAndSlideProps<{ value: number; height: number }> = {
  ...props1,
  _testId: 'dynamic_same_width',
  data: [
    { value: 400, height: 100 },
    { value: 400, height: 200 },
    { value: 400, height: 100 },
    { value: 400, height: 300 },
    { value: 400, height: 100 },
    { value: 400, height: 200 },
  ],
  useWheel: true,
  centered: true,
  itemWidth: undefined,
  itemHeight: undefined,
  renderItem: ({ index, item: { value, height } }) => {
    return (
      <div
        style={{
          width: value,
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

const props3: ReactSlipAndSlideProps<{ value: number }> = {
  ...props1,
  _testId: 'dynamic_MULTI_width',
  data: [
    { value: 800 },
    { value: 200 },
    { value: 300 },
    { value: 400 },
    { value: 500 },
    { value: 800 },
  ],
  centered: true,
  itemWidth: undefined,
  itemHeight: undefined,
};

const props4: ReactSlipAndSlideProps<{ value: number }> = {
  ...props1,
  centered: false,
  interpolators: undefined,
};

const Item: RenderItem<{
  value: any;
}> = ({ item }) => {
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
      <p className="item-text">{item.value}</p>
    </div>
  );
};

const Child = () => {
  const {
    state: { currentIndex },
  } = Context.useDataContext();
  return <p>{currentIndex}</p>;
};

export function App() {
  const ref = React.useRef<ReactSlipAndSlideRef>(null);
  const [width, setWidth] = React.useState<number>(200);
  const [currIndex, setCurrIndex] = React.useState<number>(5);

  const [data1, setData1] = React.useState<typeof data>(data);

  // return <Example2 />;

  // return (
  //   <StyledApp style={{ backgroundColor: '#0f0f0f' }}>
  //     <div style={{ height: 0 }} />
  //     <Example />
  //   </StyledApp>
  // );

  return (
    <React.Fragment>
      <ReactSlipAndSlide
        ref={ref}
        data={data1}
        snap
        centered
        initialIndex={5}
        // fullWidthItem
        itemWidth={width}
        // containerHeight={200}
        itemHeight={200}
        infinite
        // animateStartup={false}
        // momentumMultiplier={2}
        // useWheel
        pressToSlide
        // interpolators={interpolators}
        interpolators={{
          scale: 0.92,
          opacity: 0.5,
        }}
        // onChange={handleOnChange}
        onChange={(i) => {
          setCurrIndex(i);
        }}
        renderItem={Item}
      >
        <Child />
      </ReactSlipAndSlide>
      <button onClick={() => ref.current?.previous()}>Prev</button>
      <button onClick={() => ref.current?.next()}>Next</button>
      <button onClick={() => setWidth(random(100, 400))}>set width</button>
      <button
        onClick={() => {
          const nextData = range(random(3, 20)).map((_, i) => ({ value: i }));
          setData1(nextData);
        }}
      >
        set data
      </button>

      <div>
        {data1.map((_, index) => {
          return (
            <button
              onClick={() => {
                ref.current?.goTo({ index });
                setCurrIndex(index);
              }}
            >
              Go To {index}
            </button>
          );
        })}
      </div>
      <h1>{currIndex}</h1>
    </React.Fragment>
  );

  // eslint-disable-next-line no-unreachable
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
