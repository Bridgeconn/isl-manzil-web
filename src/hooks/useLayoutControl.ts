import { useState, useEffect } from 'react';
import { useDeviceDetection } from './useDeviceDetection';

export type TextPosition = 'below' | 'right' | 'hidden';

interface LayoutControlState {
  textPosition: TextPosition;
  showText: boolean;
  isHorizontalLayout: boolean;
  canTogglePosition: boolean;
}

export const useLayoutControl = () => {
  const { shouldUseHorizontalLayout, isTabletLandscape } = useDeviceDetection();
  
  const [layoutState, setLayoutState] = useState<LayoutControlState>(() => ({
    textPosition: shouldUseHorizontalLayout || isTabletLandscape ? 'right' : 'below',
    showText: true,
    isHorizontalLayout: shouldUseHorizontalLayout,
    canTogglePosition: shouldUseHorizontalLayout,
  }));

  useEffect(() => {
    setLayoutState(prev => {
      let newTextPosition = prev.textPosition;
      
      if (shouldUseHorizontalLayout) {
        if (prev.textPosition === 'below' && prev.showText) {
          newTextPosition = 'right';
        }
      } else {
        if (prev.textPosition === 'right') {
          newTextPosition = 'below';
        }
      }
      
      return {
        ...prev,
        isHorizontalLayout: shouldUseHorizontalLayout,
        canTogglePosition: shouldUseHorizontalLayout,
        textPosition: newTextPosition,
      };
    });
  }, [shouldUseHorizontalLayout]);

  const toggleTextVisibility = () => {
    setLayoutState(prev => ({
      ...prev,
      showText: !prev.showText,
    }));
  };

  const setTextPosition = (position: TextPosition) => {
    setLayoutState(prev => ({
      ...prev,
      textPosition: position,
      showText: position !== 'hidden'
    }));
  };

  const toggleTextPosition = () => {
    setLayoutState(prev => {
      if (!prev.canTogglePosition || !prev.showText) return prev;
      
      const newPosition = prev.textPosition === 'right' ? 'below' : 'right';
      return {
        ...prev,
        textPosition: newPosition
      };
    });
  };

  return {
    ...layoutState,
    toggleTextVisibility,
    setTextPosition,
    toggleTextPosition,
  };
};