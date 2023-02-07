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

      <ShowcaseItem active={false} title="EngineMode: Multi / ItemDimensionMode: Dynamic">
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
            // itemWidth={400}
            // itemHeight={200}
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
                    width: 400,
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
          // containerWidth={800}
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

// const useInterval = (startT: number = 0) => {
//   const [t, setT] = React.useState(startT);

//   const timer = React.useRef<NodeJS.Timer>();

//   // const updateCount = () => {
//   // };
//   const handleSetT = React.useCallback(() => {
//     timer.current = setInterval(() => {
//       setT((prevT) => prevT + 1);
//     }, 1000);
//   }, []);

//   React.useEffect(() => {
//     handleSetT();

//     return () => clearInterval(timer.current);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   return t;
// };

// export type Comp1Props = {
//   children(props: { nr: number; tFromParent: number }): React.ReactElement;
// };

// export const Parent = ({ children }: Comp1Props): JSX.Element => {
//   const [_nr, _setNr] = React.useState<number>(0);
//   const tFromParent = useInterval();

//   return (
//     <div style={{ border: "10px solid red" }}>
//       <p>Parent</p>

//       <button onClick={() => _setNr(_nr + 1)}>Set From Parent</button>

//       {children({ nr: _nr, tFromParent })}
//     </div>
//   );
// };

// export type Comp2Props = {
//   nr: number;
//   nr2: number;
//   tFromParent: number;
//   tFromGrandParent: number;
//   children(props: { _tFromGrandParent: number }): React.ReactElement;
// };

// export const Children = ({ nr, nr2, tFromGrandParent, tFromParent, children }: Comp2Props): JSX.Element => {
//   const t = useInterval();

//   return (
//     <div style={{ border: "10px solid blue", display: "flex", justifyContent: "space-between" }}>
//       <div>
//         <p>Children (render prop)</p>
//         <p>{nr + nr2}</p>
//         <p>GrandParent T: {tFromGrandParent}</p>
//         <p>Parent T: {tFromParent}</p>
//         <p>Children T: {t}</p>
//       </div>
//       <div style={{ display: "flex", flexDirection: "column", flex: 1, marginLeft: 20 }}>
//         {children({ _tFromGrandParent: tFromGrandParent })}
//         {/* <GrandChildren tFromGrandParent={tFromGrandParent} /> */}
//       </div>
//     </div>
//   );
// };

// export type GrandChildrenProps = {
//   tFromGrandParent: number;
// };

// export const GrandChildren = ({ tFromGrandParent }: GrandChildrenProps): JSX.Element => {
//   return (
//     <div style={{ display: "flex", flexDirection: "column", flex: 1, border: "10px solid tomato" }}>
//       <p>Grand Children</p>
//       {tFromGrandParent % 2 === 0 && (
//         <div
//           style={{
//             border: "5px dashed tomato",
//             display: "flex",
//             flex: 1,
//             justifyContent: "center",
//             alignItems: "center",
//             flexDirection: "column",
//           }}
//         >
//           <p>show if GrandParent T is even</p>
//           <p>{tFromGrandParent}</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export const GrandParent = (): JSX.Element => {
//   const [_nr, _setNr] = React.useState<number>(0);
//   const tFromGrandParent = useInterval();

//   return (
//     <div style={{ border: "10px solid green" }}>
//       <p>Grand Parent</p>

//       <button onClick={() => _setNr(_nr + 1)}>Set From Grand Parent</button>
//       <Parent>
//         {({ nr, tFromParent }) => {
//           return (
//             <Children nr={nr} nr2={_nr} tFromGrandParent={tFromGrandParent} tFromParent={tFromParent}>
//               {({ _tFromGrandParent }) => {
//                 return <GrandChildren tFromGrandParent={_tFromGrandParent} />;
//               }}
//             </Children>
//           );
//         }}
//       </Parent>
//     </div>
//   );
// };

export default App;
