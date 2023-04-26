import React from 'react';
import { type ContextHandlers } from './models';
import { dataContext } from './provider';

export function useDataContext(): ContextHandlers {
  const { state, actions, dispatch } = React.useContext<ContextHandlers>(
    dataContext as React.Context<ContextHandlers>
  );
  return { state, actions, dispatch };
}
