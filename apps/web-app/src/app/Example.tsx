import React from 'react';
import {
  ReactSlipAndSlide,
  type ReactSlipAndSlideRef,
} from 'react-slip-and-slide';
import { type CSSProperties } from 'styled-components';

const loremIpsumText =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed eu purus lacinia, pretium ipsum in, vestibulum dolor. Fusce lobortis eu erat id aliquet. Donec sit amet ex dolor. Ut et tempus velit. Vestibulum lobortis enim mi. Donec vel velit condimentum, rhoncus mauris ut, faucibus nisi. Aenean vestibulum leo et lacus efficitur vehicula. Cras sagittis enim lectus, eget laoreet mauris faucibus eget. Nullam sit amet feugiat mi. Nunc vel rutrum erat. In et ullamcorper nibh. Mauris quam erat, congue ac risus et, vehicula fermentum magna. Maecenas pellentesque orci vitae neque tincidunt aliquet. Vestibulum justo nibh, condimentum non mollis eu, maximus quis lacus. Proin urna ipsum, luctus sit amet tincidunt nec, tincidunt nec orci.';

export const randomWord = (phrase?: boolean, length = 4) => {
  const words = loremIpsumText.replace(',', '').replace('.', '').split(' ');

  const randIndex = () => Math.floor(Math.random() * words.length);

  if (phrase) {
    return words
      .map((_, index) => (index <= length ? words[randIndex()] : undefined))
      .filter((w) => w !== undefined)
      .join(' ');
  }
  return words[randIndex()];
};

const data = [
  { label: randomWord(true, 2) },
  { label: randomWord(true, 1) },
  { label: randomWord(true, 3) },
  { label: randomWord(true, 2) },
  { label: randomWord(true, 1) },
  { label: randomWord(true, 1) },
  { label: randomWord(true, 3) },
  { label: randomWord(true, 2) },
  { label: randomWord(true, 1) },
  { label: randomWord(true, 1) },
  { label: randomWord(true, 1) },
  { label: randomWord(true, 1) },
  { label: randomWord(true, 3) },
  { label: randomWord(true, 2) },
  { label: randomWord(true, 1) },
  { label: randomWord(true, 1) },
];

export type NavButtonProps = {
  direction: 'prev' | 'next';
  styles?: CSSProperties;
  onPress?: () => void;
  hide?: boolean;
};

export const NavButton = ({
  direction = 'next',
  styles,
  hide,
  onPress,
}: NavButtonProps): JSX.Element => {
  if (hide) {
    return <React.Fragment />;
  }
  return (
    <span
      onClick={onPress}
      style={{
        position: 'absolute',
        transform: `rotate(${direction === 'prev' ? 180 : 0}deg)`,
        cursor: 'pointer',
        ...styles,
      }}
    >
      <span style={{ display: 'flex', flexDirection: 'row-reverse' }}>
        <span style={{ width: 32, height: 32, backgroundColor: '#0f0f0f' }}>
          <svg fill="#f1f1f1" viewBox="0 -960 960 960">
            <path d="m375-240-43-43 198-198-198-198 43-43 241 241-241 241Z" />
          </svg>
        </span>

        <span
          style={{
            width: 100,
            height: 32,
            background:
              'linear-gradient(to left,#0f0f0f 20%,rgba(33,33,33,0) 80%)',
          }}
        />
      </span>
    </span>
  );
};

export type ItemProps = {
  active: boolean;
  index: number;
  item: { label: string };
};

export const Item = ({ active, index, item }: ItemProps): JSX.Element => {
  return (
    <div
      // onClick={() => ref.current?.goTo({ index, animated: true })}
      style={{
        cursor: 'pointer',
        height: 32,
        margin: 12,
        marginLeft: index === 0 ? 12 : 0,
        padding: '0px 12px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        userSelect: 'none',
        backgroundColor: active ? '#f1f1f1' : '#2e2e2e',
        color: active ? '#0f0f0f' : '#f1f1f1',
      }}
    >
      <p style={{ fontSize: 14, whiteSpace: 'nowrap' }}>{item.label}</p>
    </div>
  );
};

export function Example() {
  const ref = React.useRef<ReactSlipAndSlideRef>(null);
  const [activeItem, setActiveItem] = React.useState<number>(0);

  const [hideStartNav, setHideStartNav] = React.useState<boolean>(true);
  const [hideEndNav, setHideEndNav] = React.useState<boolean>(true);

  React.useEffect(() => {
    console.log('render');
  });

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: 800,
      }}
    >
      <ReactSlipAndSlide
        ref={ref}
        data={data}
        useWheel
        onEdges={({ start, end }) => {
          console.log('{ start, end }: ', { start, end });

          setHideStartNav(start);
          setHideEndNav(end);
        }}
        onItemPress={({ pressedItemIndex }) => {
          setActiveItem(pressedItemIndex);
        }}
        renderItem={(props) => {
          return <Item active={props.index === activeItem} {...props} />;
        }}
      />

      <NavButton
        hide={hideStartNav}
        direction="prev"
        styles={{ left: 0 }}
        onPress={() => ref.current?.move(180)}
      />

      <NavButton
        hide={hideEndNav}
        direction="next"
        styles={{ right: 0 }}
        onPress={() => ref.current?.move(-180)}
      />
    </div>
  );
}
