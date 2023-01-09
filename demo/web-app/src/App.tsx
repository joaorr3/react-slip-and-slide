import { ReactSlipAndSlide } from "@react-slip-and-slide/web/src";

import React from "react";

export type ShowCaseProps = React.PropsWithChildren;

export const ShowCase = ({ children }: ShowCaseProps): JSX.Element => {
  return (
    <div
      style={{
        minHeight: "100vh",
        alignItems: "center",
        display: "flex",
        justifyContent: "center",
        flexDirection: "column",
        backgroundColor: "#24212a",
      }}
    >
      {children}
    </div>
  );
};

export type ShowcaseItemProps = React.PropsWithChildren<{ title: string; active: boolean }>;

export const ShowcaseItem = ({ title, active, children }: ShowcaseItemProps) => {
  if (!active) {
    return null;
  }
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        marginBottom: 100,
        alignItems: "center",
      }}
    >
      <h2 style={{ color: "#fff", marginLeft: 24 }}>{title}</h2>

      {children}
    </div>
  );
};

const data = [
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
];

function App() {
  return (
    <ShowCase>
      <ShowcaseItem active={true} title="EngineMode: Multi / ItemDimensionMode: Fixed">
        <div
          className="Inner"
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <ReactSlipAndSlide
            data={data}
            snap
            centered
            infinite
            itemWidth={400}
            itemHeight={200}
            // fullWidthItem
            containerWidth={800}
            overflowHidden={false}
            // visibleItems={10}
            // pressToSlide
            // interpolators={{
            //   opacity: 0.2,
            //   scale: 0.9,
            // }}
            // onChange={(index) => {
            //   console.log("onChange:index: ", index);
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
      </ShowcaseItem>

      <ShowcaseItem active={true} title="EngineMode: Single / ItemDimensionMode: Dynamic">
        <ReactSlipAndSlide
          data={data}
          // centered
          // infinite
          // snap
          // itemWidth={200}
          // itemHeight={200}
          // fullWidthItem
          containerWidth={800}
          animateStartup={false}
          // visibleItems={10}
          // pressToSlide
          // interpolators={{
          //   opacity: 0.2,
          //   scale: 0.9,
          // }}
          // onChange={(index) => {
          //   console.log("onChange:index: ", index);
          // }}
          renderItem={({ index, item: { width } }) => {
            return (
              <div
                style={{
                  // width: "100%",
                  width: 200,
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
      </ShowcaseItem>
    </ShowCase>
  );
}

export default App;
