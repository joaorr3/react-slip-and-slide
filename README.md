# react-slip-and-slide

![example](https://media.giphy.com/media/xX1jzTGlknCM5xSsI2/giphy.gif)

```bash
npm i react-slip-and-slide
```

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
  return (
    <div className="App">
      <ReactCarousel
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

### A longer version of this readme will come soon. Check the **d.ts** files for more info.

## License

Licensed under the terms of the [MIT License](https://opensource.org/licenses/MIT).
