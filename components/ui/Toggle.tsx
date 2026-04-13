import { Theme } from '@/constants/Theme';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity } from 'react-native';

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function Toggle({ value, onValueChange }: ToggleProps) {
  const translateX = useRef(new Animated.Value(value ? 22 : 0)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: value ? 22 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [value, translateX]);

  const backgroundColor = translateX.interpolate({
    inputRange: [0, 22],
    outputRange: [Theme.colors.border, Theme.colors.primary],
  });

  return (
    <TouchableOpacity onPress={() => onValueChange(!value)} activeOpacity={0.8}>
      <Animated.View style={[styles.container, { backgroundColor }]}>
        <Animated.View style={[styles.knob, { transform: [{ translateX }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  knob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Theme.colors.surface,
    ...Theme.shadows.soft,
  },
});
