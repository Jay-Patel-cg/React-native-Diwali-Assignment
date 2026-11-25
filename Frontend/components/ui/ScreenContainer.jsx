import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { useResponsive } from '../../hooks/useResponsive';

/**
 * Responsive, safe-area aware root layout wrapper used across all screens.
 */
export function ScreenContainer({
  children,
  scrollable = true,
  keyboardAware = false,
  edges = ['top', 'left', 'right'],
  backgroundColor = COLORS.background,
  padded = true,
  refreshing = false,
  onRefresh = null,
  contentContainerStyle,
  className = '',
}) {
  const { horizontalPadding, contentMaxWidth, isTablet } = useResponsive();

  const innerStyle = {
    width: '100%',
    maxWidth: contentMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: padded ? horizontalPadding : 0,
  };

  const content = scrollable ? (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        { flexGrow: 1, paddingBottom: isTablet ? 40 : 28 },
        innerStyle,
        contentContainerStyle,
      ]}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, innerStyle, contentContainerStyle]}>{children}</View>
  );

  return (
    <SafeAreaView
      edges={edges}
      className={`flex-1 ${className}`}
      style={{ backgroundColor }}
    >
      {keyboardAware ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

export default ScreenContainer;

