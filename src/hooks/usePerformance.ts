/**
 * Hooks pour l'optimisation des performances
 * Phase 3.4 - Expérience utilisateur
 * 
 * Date: 10 mars 2025
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// Hook pour le lazy loading d'images
export const useLazyImage = (src: string, placeholder?: string) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = new Image();
            img.onload = () => {
              setImageSrc(src);
              setIsLoading(false);
            };
            img.onerror = () => {
              setError('Failed to load image');
              setIsLoading(false);
            };
            img.src = src;
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return { imageSrc, isLoading, error, imgRef };
};

// Hook pour le debounce
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

// Hook pour le throttle
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastCallRef = useRef<number>(0);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCallRef.current >= delay) {
        callback(...args);
        lastCallRef.current = now;
      }
    },
    [callback, delay]
  ) as T;

  return throttledCallback;
};

// Hook pour le virtual scrolling
export const useVirtualScroll = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return {
      startIndex,
      endIndex,
      visibleItems: items.slice(startIndex, endIndex),
      offsetY: startIndex * itemHeight
    };
  }, [items, scrollTop, itemHeight, containerHeight]);

  const scrollElementRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems: visibleItems.visibleItems,
    offsetY: visibleItems.offsetY,
    startIndex: visibleItems.startIndex,
    endIndex: visibleItems.endIndex,
    totalHeight: items.length * itemHeight,
    scrollElementRef,
    handleScroll
  };
};

// Hook pour le monitoring des performances
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    connectionType: 'unknown'
  });

  useEffect(() => {
    // Mesurer le temps de chargement
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const loadTime = navigation.loadEventEnd - navigation.fetchStart;

    // Mesurer l'utilisation mémoire si disponible
    const memoryInfo = (performance as any).memory;
    const memoryUsage = memoryInfo ? memoryInfo.usedJSHeapSize : 0;

    // Obtenir le type de connexion
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    const connectionType = connection ? connection.effectiveType : 'unknown';

    setMetrics({
      loadTime,
      renderTime: 0,
      memoryUsage,
      connectionType
    });
  }, []);

  const measureRenderTime = useCallback((name: string, fn: () => void) => {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(`${name} render time: ${end - start}ms`);
    return end - start;
  }, []);

  return { metrics, measureRenderTime };
};

// Hook pour le prefetching de ressources
export const usePrefetch = () => {
  const prefetchResource = useCallback((url: string, type: 'script' | 'style' | 'image' = 'script') => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    
    if (type === 'script') {
      link.as = 'script';
    } else if (type === 'style') {
      link.as = 'style';
    } else if (type === 'image') {
      link.as = 'image';
    }
    
    document.head.appendChild(link);
  }, []);

  const prefetchPage = useCallback((url: string) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  }, []);

  return { prefetchResource, prefetchPage };
};

// Hook pour le code splitting dynamique
export const useDynamicImport = <T>(importFn: () => Promise<T>) => {
  const [component, setComponent] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComponent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const module = await importFn();
      setComponent(module);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load component');
    } finally {
      setLoading(false);
    }
  }, [importFn]);

  return { component, loading, error, loadComponent };
};

// Hook pour l'optimisation des animations
export const useOptimizedAnimation = () => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const shouldAnimate = !reducedMotion;

  return { shouldAnimate, reducedMotion };
};

// Hook pour le cache des données
export const useCache = <T>(key: string, ttl: number = 5 * 60 * 1000) => {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem(key);
    if (cached) {
      const { value, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < ttl) {
        setData(value);
      } else {
        localStorage.removeItem(key);
      }
    }
  }, [key, ttl]);

  const setCachedData = useCallback((value: T) => {
    const cacheData = {
      value,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
    setData(value);
  }, [key]);

  const clearCache = useCallback(() => {
    localStorage.removeItem(key);
    setData(null);
  }, [key]);

  return { data, setCachedData, clearCache };
};

// Hook pour le monitoring de la taille du bundle
export const useBundleSize = () => {
  const [bundleSize, setBundleSize] = useState(0);

  useEffect(() => {
    // Estimer la taille du bundle basée sur les ressources chargées
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const totalSize = resources.reduce((acc, resource) => {
      return acc + (resource.transferSize || 0);
    }, 0);

    setBundleSize(totalSize);
  }, []);

  const formatSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return { bundleSize, formatSize };
};

// Hook pour l'optimisation des scroll events
export const useScrollOptimization = (callback: () => void, delay: number = 16) => {
  const tickingRef = useRef(false);

  const optimizedScroll = useCallback(() => {
    if (!tickingRef.current) {
      requestAnimationFrame(() => {
        callback();
        tickingRef.current = false;
      });
      tickingRef.current = true;
    }
  }, [callback]);

  return optimizedScroll;
};

// Hook pour le monitoring du First Contentful Paint
export const useFCPMonitor = () => {
  const [fcp, setFcp] = useState<number | null>(null);

  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        setFcp(fcpEntry.startTime);
      }
    });

    try {
      observer.observe({ entryTypes: ['paint'] });
    } catch (e) {
      console.warn('Performance Observer not supported');
    }

    return () => observer.disconnect();
  }, []);

  return fcp;
};
