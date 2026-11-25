import React from 'react';
import { Text as RNText } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';

const COLOR_MAP = {
  primary: COLORS.textPrimary,
  secondary: COLORS.textSecondary,
  muted: COLORS.textMuted,
  inverse: COLORS.textInverse,
  ocean: COLORS.primary,
  seafoam: COLORS.secondary,
  coral: COLORS.coral,
  danger: COLORS.danger,
  success: COLORS.success,
};

/**
 * Consistent Typography component supporting variants:
 * display | h1 | h2 | h3 | body | bodyMedium | bodySmall | caption | label
 */
export function Typography({
  variant = 'body',
  color = 'primary',
  className = '',
  style,
  children,
  ...rest
}) {
  const variantStyle = TYPOGRAPHY[variant] || TYPOGRAPHY.body;
  const resolvedColor = COLOR_MAP[color] || color;

  return (
    <RNText
      className={className}
      style={[variantStyle, { color: resolvedColor }, style]}
      {...rest}
    >
      {children}
    </RNText>
  );
}

export default Typography;

