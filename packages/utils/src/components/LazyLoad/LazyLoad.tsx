import React from "react";

type Props = React.PropsWithChildren<{
  render?: boolean | null;
}>;

export const LazyLoad = ({ render, children }: Props) => {
  if (render) {
    return <React.Fragment>{children}</React.Fragment>;
  }
  return <React.Fragment />;
};
