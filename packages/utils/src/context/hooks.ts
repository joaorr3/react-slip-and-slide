import React from 'react';
import { type ContextHandlers } from './models';
import { dataContext } from './provider';

export function useDataContext<T extends object>(): ContextHandlers<T> {
  const { state, actions, dispatch } = React.useContext<ContextHandlers<T>>(
    dataContext as unknown as React.Context<ContextHandlers<T>>
  );
  return { state, actions, dispatch };
}
