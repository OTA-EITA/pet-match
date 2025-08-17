import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiException } from '@/types';

// Generic async state type
interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Custom hook for managing async operations
export const useAsync = <T, Args extends unknown[]>(
  asyncFunction: (...args: Args) => Promise<T>,
  immediate = true,
  deps: React.DependencyList = []
) => {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const mountedRef = useRef(true);

  const execute = useCallback(
    async (...args: Args) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const result = await asyncFunction(...args);
        
        if (mountedRef.current) {
          setState({ data: result, loading: false, error: null });
        }
        
        return result;
      } catch (error) {
        const errorMessage = error instanceof ApiException 
          ? error.message 
          : error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred';

        if (mountedRef.current) {
          setState({ data: null, loading: false, error: errorMessage });
        }
        
        throw error;
      }
    },
    [asyncFunction]
  );

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, deps);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    ...state,
    execute,
  };
};

// Custom hook for debounced async operations
export const useDebouncedAsync = <T, Args extends unknown[]>(
  asyncFunction: (...args: Args) => Promise<T>,
  delay = 300
) => {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const timeoutRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);

  const execute = useCallback(
    (...args: Args) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(async () => {
        try {
          const result = await asyncFunction(...args);
          
          if (mountedRef.current) {
            setState({ data: result, loading: false, error: null });
          }
        } catch (error) {
          const errorMessage = error instanceof ApiException 
            ? error.message 
            : error instanceof Error 
            ? error.message 
            : 'An unexpected error occurred';

          if (mountedRef.current) {
            setState({ data: null, loading: false, error: errorMessage });
          }
        }
      }, delay);
    },
    [asyncFunction, delay]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    execute,
    cancel,
  };
};

// Custom hook for managing API calls with cache
export const useCachedAsync = <T, Args extends unknown[]>(
  asyncFunction: (...args: Args) => Promise<T>,
  cacheKey: string,
  cacheTime = 5 * 60 * 1000 // 5 minutes
) => {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map());
  const mountedRef = useRef(true);

  const execute = useCallback(
    async (...args: Args) => {
      const key = `${cacheKey}_${JSON.stringify(args)}`;
      const cached = cacheRef.current.get(key);
      const now = Date.now();

      // Return cached data if it's still valid
      if (cached && now - cached.timestamp < cacheTime) {
        setState({ data: cached.data, loading: false, error: null });
        return cached.data;
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const result = await asyncFunction(...args);
        
        if (mountedRef.current) {
          // Cache the result
          cacheRef.current.set(key, { data: result, timestamp: now });
          setState({ data: result, loading: false, error: null });
        }
        
        return result;
      } catch (error) {
        const errorMessage = error instanceof ApiException 
          ? error.message 
          : error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred';

        if (mountedRef.current) {
          setState({ data: null, loading: false, error: errorMessage });
        }
        
        throw error;
      }
    },
    [asyncFunction, cacheKey, cacheTime]
  );

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  const invalidateCache = useCallback((specificKey?: string) => {
    if (specificKey) {
      cacheRef.current.delete(specificKey);
    } else {
      // Clear all keys that start with the base cache key
      for (const key of cacheRef.current.keys()) {
        if (key.startsWith(cacheKey)) {
          cacheRef.current.delete(key);
        }
      }
    }
  }, [cacheKey]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    ...state,
    execute,
    clearCache,
    invalidateCache,
  };
};

// Custom hook for infinite scrolling/pagination
export const useInfiniteAsync = <T>(
  asyncFunction: (page: number) => Promise<{ data: T[]; hasMore: boolean }>,
  initialPage = 1
) => {
  const [state, setState] = useState({
    data: [] as T[],
    loading: false,
    error: null as string | null,
    hasMore: true,
    page: initialPage,
  });

  const mountedRef = useRef(true);

  const loadMore = useCallback(async () => {
    if (state.loading || !state.hasMore) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await asyncFunction(state.page);
      
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          data: [...prev.data, ...result.data],
          loading: false,
          hasMore: result.hasMore,
          page: prev.page + 1,
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof ApiException 
        ? error.message 
        : error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred';

      if (mountedRef.current) {
        setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      }
    }
  }, [asyncFunction, state.loading, state.hasMore, state.page]);

  const reset = useCallback(() => {
    setState({
      data: [],
      loading: false,
      error: null,
      hasMore: true,
      page: initialPage,
    });
  }, [initialPage]);

  const refresh = useCallback(async () => {
    setState({
      data: [],
      loading: true,
      error: null,
      hasMore: true,
      page: initialPage,
    });

    try {
      const result = await asyncFunction(initialPage);
      
      if (mountedRef.current) {
        setState({
          data: result.data,
          loading: false,
          error: null,
          hasMore: result.hasMore,
          page: initialPage + 1,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof ApiException 
        ? error.message 
        : error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred';

      if (mountedRef.current) {
        setState({
          data: [],
          loading: false,
          error: errorMessage,
          hasMore: true,
          page: initialPage,
        });
      }
    }
  }, [asyncFunction, initialPage]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    hasMore: state.hasMore,
    loadMore,
    reset,
    refresh,
  };
};

// Custom hook for polling data
export const usePolling = <T>(
  asyncFunction: () => Promise<T>,
  interval: number,
  immediate = true
) => {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const [isPolling, setIsPolling] = useState(immediate);
  const intervalRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);

  const execute = useCallback(async () => {
    try {
      const result = await asyncFunction();
      
      if (mountedRef.current) {
        setState({ data: result, loading: false, error: null });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof ApiException 
        ? error.message 
        : error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred';

      if (mountedRef.current) {
        setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      }
      
      throw error;
    }
  }, [asyncFunction]);

  const startPolling = useCallback(() => {
    setIsPolling(true);
  }, []);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  useEffect(() => {
    if (isPolling) {
      execute(); // Execute immediately
      
      intervalRef.current = setInterval(() => {
        execute();
      }, interval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPolling, interval, execute]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    isPolling,
    startPolling,
    stopPolling,
    execute,
  };
};
