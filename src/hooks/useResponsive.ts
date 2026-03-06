/**
 * Hook personnalisé pour la gestion responsive
 * Phase 3.4 - Expérience utilisateur
 * 
 * Date: 10 mars 2025
 */

import { useState, useEffect } from 'react';

interface BreakpointValues {
  xs: boolean;
  sm: boolean;
  md: boolean;
  lg: boolean;
  xl: boolean;
  '2xl': boolean;
}

interface ResponsiveValues {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  isUltraWide: boolean;
  breakpoint: BreakpointValues;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  isTouch: boolean;
  isDarkMode: boolean;
  isReducedMotion: boolean;
}

const defaultBreakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

export const useResponsive = (): ResponsiveValues => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [isTouch, setIsTouch] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    // Vérifier si on est côté client
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    const checkTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    const checkDarkMode = () => {
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    };

    const checkReducedMotion = () => {
      setIsReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    };

    // Initialisation
    handleResize();
    checkTouch();
    checkDarkMode();
    checkReducedMotion();

    // Écouteurs d'événements
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', checkDarkMode);
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', checkReducedMotion);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', checkDarkMode);
      window.matchMedia('(prefers-reduced-motion: reduce)').removeEventListener('change', checkReducedMotion);
    };
  }, []);

  const breakpoint: BreakpointValues = {
    xs: windowSize.width >= defaultBreakpoints.xs,
    sm: windowSize.width >= defaultBreakpoints.sm,
    md: windowSize.width >= defaultBreakpoints.md,
    lg: windowSize.width >= defaultBreakpoints.lg,
    xl: windowSize.width >= defaultBreakpoints.xl,
    '2xl': windowSize.width >= defaultBreakpoints['2xl']
  };

  const isMobile = breakpoint.sm && !breakpoint.md;
  const isTablet = breakpoint.md && !breakpoint.lg;
  const isDesktop = breakpoint.lg && !breakpoint.xl;
  const isWide = breakpoint.xl && !breakpoint['2xl'];
  const isUltraWide = breakpoint['2xl'];

  return {
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    isUltraWide,
    breakpoint,
    width: windowSize.width,
    height: windowSize.height,
    orientation,
    isTouch,
    isDarkMode,
    isReducedMotion
  };
};

// Hook pour les media queries personnalisées
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
};

// Hook pour la taille de l'écran
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

// Hook pour l'orientation
export const useOrientation = () => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    handleOrientationChange();
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return orientation;
};

// Hook pour détecter les appareils tactiles
export const useTouch = () => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    checkTouch();
  }, []);

  return isTouch;
};

// Hook pour le mode sombre
export const useDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkDarkMode = () => {
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    };

    checkDarkMode();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);

    return () => mediaQuery.removeEventListener('change', checkDarkMode);
  }, []);

  return isDarkMode;
};

// Hook pour la réduction de mouvement
export const useReducedMotion = () => {
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkReducedMotion = () => {
      setIsReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    };

    checkReducedMotion();

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', checkReducedMotion);

    return () => mediaQuery.removeEventListener('change', checkReducedMotion);
  }, []);

  return isReducedMotion;
};

// Hook pour les breakpoints personnalisés
export const useBreakpoint = (breakpoint: keyof typeof defaultBreakpoints) => {
  const [isAbove, setIsAbove] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkBreakpoint = () => {
      setIsAbove(window.innerWidth >= defaultBreakpoints[breakpoint]);
    };

    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);

    return () => window.removeEventListener('resize', checkBreakpoint);
  }, [breakpoint]);

  return isAbove;
};
