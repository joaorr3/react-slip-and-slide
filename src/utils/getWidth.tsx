export const getWidth = (ref: React.RefObject<HTMLDivElement>) => {
  return new Promise<number>((res) => {
    setTimeout(() => {
      if (ref.current) {
        res(ref.current.offsetWidth);
      }
    }, 200);
  });
};
export const getDimensions = (refs: Array<React.RefObject<HTMLDivElement>>) => {
  return new Promise<Array<{ index: number; width: number }>>((res) => {
    setTimeout(() => {
      res(
        refs.map((ref, index) => {
          return {
            index,
            width: ref.current?.offsetWidth ?? 0,
          };
        })
      );
    }, 200);
  });
};
