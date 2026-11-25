import React from 'react';
import { View } from 'react-native';
import Typography from './Typography';

const TONE_MAP = {
  ocean: { bg: 'bg-ocean-50 border-ocean-200', text: 'ocean' },
  seafoam: { bg: 'bg-seafoam-50 border-seafoam-200', text: 'seafoam' },
  coral: { bg: 'bg-coral-50 border-coral-100', text: 'coral' },
  success: { bg: 'bg-emerald-50 border-emerald-200', text: 'success' },
  danger: { bg: 'bg-red-50 border-red-200', text: 'danger' },
  neutral: { bg: 'bg-ink-100 border-ink-200', text: 'secondary' },
};

export function Badge({ label, tone = 'ocean', className = '' }) {
  const palette = TONE_MAP[tone] || TONE_MAP.ocean;

  return (
    <View
      className={`self-start px-3 py-1 rounded-full border ${palette.bg} ${className}`}
    >
      <Typography variant="caption" color={palette.text} style={{ fontWeight: '600' }}>
        {label}
      </Typography>
    </View>
  );
}

export default Badge;

