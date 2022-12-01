import { ReactSlipAndSlide } from "@react-slip-and-slide/web/src";
import "./App.css";

function App() {
  return (
    <div className="App">
      <div
        className="Inner"
        style={{
          width: 800,
          overflow: "hidden",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <ReactSlipAndSlide
          data={[
            { width: 300 },
            { width: 200 },
            { width: 100 },
            { width: 200 },
            { width: 400 },
            { width: 400 },
            { width: 500 },
            { width: 200 },
            { width: 200 },
            { width: 200 },
            { width: 300 },
            { width: 200 },
            { width: 100 },
            { width: 200 },
            { width: 400 },
            { width: 400 },
            { width: 500 },
            { width: 200 },
            { width: 200 },
            { width: 200 },
            //
          ]}
          snap
          centered
          infinite
          // itemWidth={400}
          itemHeight={200}
          fullWidthItem
          // containerWidth={800}
          // overflowHidden={false}
          visibleItems={10}
          // pressToSlide
          // interpolators={{
          //   opacity: 0.2,
          //   scale: 0.9,
          // }}
          renderItem={({ index, item: { width } }) => {
            return (
              <div
                style={{
                  width: "100%",
                  // width: 400,
                  height: 200,
                  backgroundColor: "#858585",
                  color: "#d6d6d6",
                  border: "1px solid #000",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: "32px",
                  userSelect: "none",
                }}
              >
                <p className="item-text">{index}</p>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}

export default App;
