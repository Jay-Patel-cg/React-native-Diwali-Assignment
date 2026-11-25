import React from 'react';
import { Pressable, View } from 'react-native';
import Typography from '../ui/Typography';
import { formatTitleCase } from '../../utils/formatters';

/**
 * Chip-based single or multi-select form control for travel styles, categories, currencies, etc.
 */
export function FormSelect({
  label,
  options = [],
  value,
  onChange,
  multi = false,
  error = null,
  className = '',
}) {
  const isSelected = (optValue) => {
    if (multi) {
      return Array.isArray(value) && value.includes(optValue);
    }
    return value === optValue;
  };

  const handleToggle = (optValue) => {
    if (!onChange) return;
    if (multi) {
      const current = Array.isArray(value) ? value : [];
      if (current.includes(optValue)) {
        onChange(current.filter((v) => v !== optValue));
      } else {
        onChange([...current, optValue]);
      }
    } else {
      onChange(optValue);
    }
  };

  return (
    <View className={`mb-4 ${className}`}>
      {label ? (
        <Typography variant="label" color="secondary" className="mb-2 ml-0.5">
          {label}
        </Typography>
      ) : null}

      <View className="flex-row flex-wrap gap-2">
        {options.map((opt) => {
          const optValue = typeof opt === 'string' ? opt : opt.value;
          const optLabel =
            typeof opt === 'string' ? formatTitleCase(opt) : opt.label;
          const active = isSelected(optValue);

          return (
            <Pressable
              key={optValue}
              onPress={() => handleToggle(optValue)}
              className={`px-3.5 py-2 rounded-full border ${
                active
                  ? 'bg-ocean-800 border-ocean-800'
                  : 'bg-white border-ink-200'
              }`}
            >
              <Typography
                variant="caption"
                color={active ? 'inverse' : 'secondary'}
                style={{ fontWeight: '600' }}
              >
                {optLabel}
              </Typography>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <Typography variant="caption" color="danger" className="mt-1 ml-1">
          {error}
        </Typography>
      ) : null}
    </View>
  );
}

export default FormSelect;

