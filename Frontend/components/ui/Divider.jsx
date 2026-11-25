import React from 'react';
import { View } from 'react-native';

export function Divider({ className = '' }) {
  return <View className={`h-[1px] w-full bg-ink-200 my-3 ${className}`} />;
}

export default Divider;

