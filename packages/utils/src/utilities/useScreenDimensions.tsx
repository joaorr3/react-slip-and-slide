import { type ScreenDimensionsModel } from '@react-slip-and-slide/models';
import React from 'react';
import {
  asyncScheduler,
  distinctUntilChanged,
  fromEvent,
  throttleTime,
} from 'rxjs';
import { ScreenDimensions } from '../ScreenDimensions';

export const useScreenDimensions = () => {
  const throttle = 100;
  const [screenDimensions, setScreenDimensions] =
    React.useState<ScreenDimensionsModel>(ScreenDimensions());

  const set = () => {
    setScreenDimensions(ScreenDimensions());
  };

  React.useEffect(() => {
    const sub$ = fromEvent(window, 'resize')
      .pipe(
        throttleTime(throttle, asyncScheduler, {
          leading: true,
          trailing: true,
        }),
        distinctUntilChanged()
      )
      .subscribe(set);

    // set();

    return () => sub$.unsubscribe();
  }, []);

  return screenDimensions;
};
