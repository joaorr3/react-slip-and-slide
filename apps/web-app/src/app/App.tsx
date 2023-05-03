import styled from 'styled-components';
import {
  ReactSlipAndSlide,
  type ReactSlipAndSlideProps,
} from 'react-slip-and-slide';

const StyledApp = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: 200vh;
`;

const props0: ReactSlipAndSlideProps<{ width: number }> = {
  _testId: 'fixed',
  data: [
    { width: 400 },
    { width: 400 },
    { width: 400 },
    { width: 400 },
    { width: 400 },
    { width: 400 },
    { width: 400 },
  ],
  snap: true,
  centered: true,
  infinite: true,
  pressToSlide: true,
  itemWidth: 400,
  itemHeight: 100,
  interpolators: {
    opacity: 0.6,
    scale: 0.9,
  },
  renderItem: ({ index, item: { width } }) => {
    return (
      <div
        style={{
          width,
          height: 100,
          backgroundColor: '#858585',
          color: '#d6d6d6',
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
    { width: 600, height: 300 },
    { width: 400, height: 100 },
    { width: 400, height: 200 },
  ],
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
          color: '#d6d6d6',
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
  // centered: false,
  itemWidth: undefined,
  itemHeight: undefined,
};

const props4: ReactSlipAndSlideProps<{ width: number }> = {
  ...props1,
  centered: false,
  interpolators: undefined,
};

export function App() {
  return (
    <StyledApp>
      <p>infinite</p>
      <ReactSlipAndSlide {...props0} />

      <p>fixed</p>
      <ReactSlipAndSlide {...props1} />

      <p>dynamic (same width)</p>
      <ReactSlipAndSlide {...props2} />

      <p>dynamic (multi width)</p>
      <ReactSlipAndSlide {...props3} />

      <p>align-start</p>
      <ReactSlipAndSlide {...props4} />
    </StyledApp>
  );
}

export default App;
