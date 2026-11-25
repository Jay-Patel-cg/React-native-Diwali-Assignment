import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import Typography from '../ui/Typography';

/**
 * Reusable accessible Form Input with focus ring, icon slot,
 * password visibility toggle, helper text, and error display.
 */
export function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  error = null,
  helperText = null,
  leftIcon = null,
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  className = '',
  inputClassName = '',
  ...rest
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHidden, setIsHidden] = useState(secureTextEntry);

  const borderClass = error
    ? 'border-red-500 bg-red-50/40'
    : isFocused
      ? 'border-ocean-700 bg-white'
      : 'border-ink-200 bg-white';

  return (
    <View className={`mb-4 ${className}`}>
      {label ? (
        <Typography variant="label" color="secondary" className="mb-1.5 ml-0.5">
          {label}
        </Typography>
      ) : null}

      <View
        className={`flex-row items-center rounded-2xl border px-3.5 ${borderClass} ${
          multiline ? 'py-3 items-start' : 'min-h-[50px]'
        } ${!editable ? 'opacity-60 bg-ink-100' : ''}`}
      >
        {leftIcon ? <View className="mr-2.5">{leftIcon}</View> : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          secureTextEntry={secureTextEntry ? isHidden : false}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`flex-1 text-[15px] text-ink-900 ${inputClassName}`}
          style={multiline ? { minHeight: numberOfLines * 22, textAlignVertical: 'top' } : null}
          {...rest}
        />

        {secureTextEntry ? (
          <Pressable
            onPress={() => setIsHidden((prev) => !prev)}
            hitSlop={8}
            accessibilityLabel={isHidden ? 'Show password' : 'Hide password'}
            className="ml-2"
          >
            <Ionicons
              name={isHidden ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={COLORS.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Typography variant="caption" color="danger" className="mt-1 ml-1">
          {error}
        </Typography>
      ) : helperText ? (
        <Typography variant="caption" color="muted" className="mt-1 ml-1">
          {helperText}
        </Typography>
      ) : null}
    </View>
  );
}

export default FormInput;

