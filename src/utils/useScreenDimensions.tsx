import { debounce } from "lodash";
import React from "react";

type ScreenDimensions = {
  width?: number;
  height?: number;
};

export const useScreenDimensions = () => {
  const [screenDimensions, setScreenDimensions] =
    React.useState<ScreenDimensions>({
      width: undefined,
      height: undefined,
    });

  const set = debounce(() => {
    setScreenDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, 200);

  React.useEffect(() => {
    window.addEventListener("resize", set);
    set();
    return () => window.removeEventListener("resize", set);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return screenDimensions;
};
