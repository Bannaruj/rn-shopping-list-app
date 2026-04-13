import { Theme } from '@/constants/Theme';
import { Check } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

interface CheckboxProps {
  checked: boolean;
  onValueChange: (checked: boolean) => void;
}

export function Checkbox({ checked, onValueChange }: CheckboxProps) {
  return (
    <TouchableOpacity
      style={[styles.container, checked && styles.checked]}
      onPress={() => onValueChange(!checked)}
      activeOpacity={0.8}
    >
      {checked && <Check size={16} color={Theme.colors.surface} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 24,
    height: 24,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 2,
    borderColor: Theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.surface,
  },
  checked: {
    backgroundColor: Theme.colors.success,
    borderColor: Theme.colors.success,
  },
});
