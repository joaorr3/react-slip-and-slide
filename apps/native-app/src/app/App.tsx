import { type ReactSlipAndSlideRef } from '@react-slip-and-slide/models';
import React from 'react';
import { Button, SafeAreaView, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ReactSlipAndSlide } from 'react-slip-and-slide';

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

export type ItemProps = {
  active: boolean;
  index: number;
  item: { label: string };
};

export const Item = ({ active, index, item }: ItemProps): JSX.Element => {
  return (
    <View
      style={{
        height: 32,
        margin: 12,
        marginLeft: index === 0 ? 12 : 0,
        paddingHorizontal: 12,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        backgroundColor: !active ? '#f1f1f1' : '#2e2e2e',
      }}
    >
      <Text
        style={{ fontSize: 14, color: !active ? '#0f0f0f' : '#f1f1f1' }}
        numberOfLines={1}
      >
        {item.label}
      </Text>
    </View>
  );
};

const App = () => {
  const [onEdgeStart, setOnEdgeStart] = React.useState<boolean>(true);
  const [onEdgeEnd, setOnEdgeEnd] = React.useState<boolean>(true);

  const [activeItem, setActiveItem] = React.useState<number>(0);

  const [index, setIndex] = React.useState<number>(0);

  const ref = React.useRef<ReactSlipAndSlideRef>(null);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView>
        <View style={{ height: 40 }} />

        <View style={{ display: 'flex', flexDirection: 'row' }}>
          <ReactSlipAndSlide
            ref={ref}
            data={data}
            // snap
            // centered
            // infinite
            // itemWidth={320}
            // itemHeight={200}
            // interpolators={{
            //   opacity: 0.6,
            //   scale: 0.9,
            // }}
            momentumMultiplier={0.8}
            // onChange={setIndex}
            onItemPress={({ pressedItemIndex }) => {
              setActiveItem(pressedItemIndex);
              ref.current?.goTo({ index: pressedItemIndex, centered: true });
            }}
            // onEdges={({ start, end }) => {
            //   setOnEdgeStart(start);
            //   setOnEdgeEnd(end);
            // }}
            renderItem={(props) => {
              return <Item active={props.index === activeItem} {...props} />;
            }}

            // renderItem={({ index: _index, item: { width } }) => {
            //   return (
            //     <View
            //       style={{
            //         width: 320,
            //         height: 200,
            //         backgroundColor: '#58a8d9',
            //         borderRadius: 20,
            //         justifyContent: 'center',
            //         alignItems: 'center',
            //       }}
            //     >
            //       <Text style={{ fontSize: 20 }}>{_index}</Text>
            //     </View>
            //   );
            // }}
          />
        </View>

        {/* <Text style={{ fontSize: 32 }}>{index}</Text>
        <Text style={{ fontSize: 22 }}>
          {JSON.stringify({ start: onEdgeStart, end: onEdgeEnd })}
        </Text>

        <Button title="Next" onPress={() => ref.current?.next()} />
        <Button title="Prev" onPress={() => ref.current?.previous()} />
        <Button title="Move:Next" onPress={() => ref.current?.move(-200)} />
        <Button title="Move:Prev" onPress={() => ref.current?.move(200)} />
        <Button
          title="GoTo"
          onPress={() => ref.current?.goTo({ index: 3, animated: false })}
        /> */}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default App;
