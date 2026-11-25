import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import Typography from '../ui/Typography';

export function AiTypingIndicator({ message = 'Gemini AI is thinking...' }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (anim, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.delay(400 - delay),
        ])
      );
    };

    const anim1 = createAnimation(dot1, 0);
    const anim2 = createAnimation(dot2, 150);
    const anim3 = createAnimation(dot3, 300);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1, dot2, dot3]);

  const translateY1 = dot1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });
  const translateY2 = dot2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });
  const translateY3 = dot3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  return (
    <View className="flex-row items-center bg-white border border-ocean-100 rounded-2xl px-4 py-3 self-start my-2 shadow-xs">
      <View className="w-6 h-6 rounded-full bg-ocean-50 border border-ocean-100 items-center justify-center mr-2.5">
        <Ionicons name="sparkles" size={13} color={COLORS.secondary} />
      </View>
      <View className="flex-row items-center mr-3 h-4">
        <Animated.View
          style={[
            styles.dot,
            { transform: [{ translateY: translateY1 }] },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            { transform: [{ translateY: translateY2 }] },
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            { transform: [{ translateY: translateY3 }] },
          ]}
        />
      </View>
      <Typography variant="caption" color="secondary" style={{ fontStyle: 'italic' }}>
        {message}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.secondary,
    marginHorizontal: 2,
  },
});

export default AiTypingIndicator;
