import { useWindowDimensions } from 'react-native';

/**
 * Responsive layout breakpoints for phones, compact screens, and tablets/web.
 */
export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  const isCompact = width < 375;
  const isTablet = width >= 768;
  const isDesktop = width >= 1024;
  const horizontalPadding = isTablet ? 32 : isCompact ? 14 : 20;
  const contentMaxWidth = isTablet ? 720 : width;

  return {
    width,
    height,
    isCompact,
    isTablet,
    isDesktop,
    horizontalPadding,
    contentMaxWidth,
  };
};

export default useResponsive;

