import React from 'react';
import { View } from 'react-native';
import Typography from '../ui/Typography';

export function FormSection({ title, subtitle = null, children, className = '' }) {
  return (
    <View className={`mb-6 ${className}`}>
      {title ? (
        <Typography variant="h3" className="mb-1">
          {title}
        </Typography>
      ) : null}
      {subtitle ? (
        <Typography variant="bodySmall" color="secondary" className="mb-3">
          {subtitle}
        </Typography>
      ) : null}
      <View className="mt-1">{children}</View>
    </View>
  );
}

export default FormSection;

