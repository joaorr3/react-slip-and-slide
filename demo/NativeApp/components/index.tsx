import React from 'react';
import {View, Text} from 'react-native';

export const ItemInternal = ({index}: {index: number}) => {
  console.info('render:Item:', index);
  return (
    <View
      style={{
        width: 320,
        height: 200,
        backgroundColor: '#858585',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Text style={{fontSize: 40}}>{index}</Text>
    </View>
  );
};
