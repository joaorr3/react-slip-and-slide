# react-slip-and-slide

```bash
npm i react-slip-and-slide
```

![example](https://media.giphy.com/media/xX1jzTGlknCM5xSsI2/giphy.gif)

## Props

| Prop           | Type                                                         | Description                                                                                                                                                                                                                           |
| -------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ref            | `ReactSlipAndSlideRef`                                       | Instance reference that allow some external controls                                                                                                                                                                                  |
| data           | `T[]`                                                        | The shape data will be inferred from usage                                                                                                                                                                                            |
| snap           | `boolean`                                                    | Turns on offset snapping                                                                                                                                                                                                              |
| centered       | `boolean`                                                    | Centers the items on the container                                                                                                                                                                                                    |
| infinite       | `boolean`                                                    | Turns on infinite looping                                                                                                                                                                                                             |
| pressToSlide   | `boolean`                                                    | Allows navigation when the next/prev item is pressed                                                                                                                                                                                  |
| animateStartup | `boolean`                                                    | If true the slider will have an opacity transition when mounted. (can be useful to hide initial setup when itemWidth and/or itemHeight are not provided)                                                                              |
| containerWidth | `number?`                                                    | The width of the items parent node (defaults to the width of the grand parent if undefined node)                                                                                                                                      |
| itemWidth      | `number?`                                                    | The width of the items                                                                                                                                                                                                                |
| itemHeight     | `number?`                                                    | The height of the items                                                                                                                                                                                                               |
| interpolators  | `[key in keyof CSSProperties]: number`                       | Allows you to define custom interpolation effects. For example, if opacity: 0.3, all items but the current will have opacity of 0.3, while the current will have 1. Be reasonable with this one as i'm not validating the properties. |
| renderItem     | `(props: RenderItemProps<T>) => JSX.Element`                 | A function that have access to index and item props and returns a JSX.Element                                                                                                                                                         |
| onChange       | `onChange?: (index: number) => void`                         | A callback that's fired when the index changes.                                                                                                                                                                                       |
| onEdges        | `onEdges?: (props: {start: boolean; end: boolean;}) => void` | A callback that's fired when the offset reaches both the start or end edges.                                                                                                                                                          |
| onReady        | `onReady?: (ready: boolean) => void`                         | `onReady` fires immediately if `animateStartup` is set to `true` otherwise it fires after the setup phase.                                                                                                                            |

## Instance Ref

| Handler | Description                                                                |
| ------- | -------------------------------------------------------------------------- |
| next    | Go to next slide                                                           |
| next    | Go to previous slide                                                       |
| goTo    | Go to some index with an animation or not                                  |
| move    | Move the offset by the pixels provided (-x goes forward, x goes backwards) |

```jsx
const data = [
  {
    label: "Lorem",
  },
  {
    label: "Ipsum",
  },
  ...
];

function App() {

  const ref = React.useRef<ReactSlipAndSlideRef>(null);

  const prev = () => ref.current?.previous();
  const next = () => ref.current?.next();

  return (
    <div className="App">
      <ReactSlipAndSlide
        ref={ref}
        data={data}
        snap
        centered
        infinite
        pressToSlide
        itemWidth={420}
        itemHeight={400}
        interpolators={{
          opacity: 0.3,
          scale: 0.9,
        }}
        renderItem={({ index, item }) => {
          return (
            <img
              style={{ borderRadius: 80 }}
              src={`https://picsum.photos/seed/${index * 2}/400`}
              alt={item.label}
            />
          );
        }}
      />
    </div>
  );
}
```

### A longer version of this readme may come soon. Check the **d.ts** files for more detailed info.

## License

Licensed under the terms of the [MIT License](https://opensource.org/licenses/MIT).
