import { useState, useEffect, useCallback } from 'react';
import { storageUtils } from '@/lib/utils';

// Custom hook for localStorage with TypeScript support
export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] => {
  // Get value from localStorage or use initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    return storageUtils.getItem(key, initialValue);
  });

  // Set value to localStorage and state
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      storageUtils.setItem(key, valueToStore);
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      storageUtils.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
};

// Custom hook for session storage
export const useSessionStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting sessionStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      window.sessionStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing sessionStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
};

// Custom hook for managing favorites
export const useFavorites = () => {
  const [favorites, setFavorites, removeFavorites] = useLocalStorage<string[]>('pet_favorites', []);

  const addFavorite = useCallback((petId: string) => {
    setFavorites(prev => {
      if (prev.includes(petId)) {
        return prev;
      }
      return [...prev, petId];
    });
  }, [setFavorites]);

  const removeFavorite = useCallback((petId: string) => {
    setFavorites(prev => prev.filter(id => id !== petId));
  }, [setFavorites]);

  const toggleFavorite = useCallback((petId: string) => {
    setFavorites(prev => {
      if (prev.includes(petId)) {
        return prev.filter(id => id !== petId);
      }
      return [...prev, petId];
    });
  }, [setFavorites]);

  const isFavorite = useCallback((petId: string): boolean => {
    return favorites.includes(petId);
  }, [favorites]);

  const clearFavorites = useCallback(() => {
    removeFavorites();
  }, [removeFavorites]);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    clearFavorites,
  };
};

// Custom hook for managing search history
export const useSearchHistory = () => {
  const [searchHistory, setSearchHistory, removeSearchHistory] = useLocalStorage<string[]>('search_history', []);

  const addSearch = useCallback((query: string) => {
    if (!query.trim()) return;

    setSearchHistory(prev => {
      const filtered = prev.filter(item => item !== query);
      return [query, ...filtered].slice(0, 10); // Keep only last 10 searches
    });
  }, [setSearchHistory]);

  const removeSearch = useCallback((query: string) => {
    setSearchHistory(prev => prev.filter(item => item !== query));
  }, [setSearchHistory]);

  const clearHistory = useCallback(() => {
    removeSearchHistory();
  }, [removeSearchHistory]);

  return {
    searchHistory,
    addSearch,
    removeSearch,
    clearHistory,
  };
};

// Custom hook for managing user preferences
interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'ja' | 'en';
  notifications: boolean;
  autoPlay: boolean;
}

export const useUserPreferences = () => {
  const defaultPreferences: UserPreferences = {
    theme: 'system',
    language: 'ja',
    notifications: true,
    autoPlay: false,
  };

  const [preferences, setPreferences] = useLocalStorage<UserPreferences>(
    'user_preferences',
    defaultPreferences
  );

  const updatePreference = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  }, [setPreferences]);

  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences);
  }, [setPreferences, defaultPreferences]);

  return {
    preferences,
    updatePreference,
    resetPreferences,
  };
};

// Custom hook for managing form draft data
export const useFormDraft = <T>(key: string, initialData: T) => {
  const [draft, setDraft] = useLocalStorage<T>(`form_draft_${key}`, initialData);

  const updateDraft = useCallback((data: Partial<T>) => {
    setDraft(prev => ({
      ...prev,
      ...data,
    }));
  }, [setDraft]);

  const clearDraft = useCallback(() => {
    setDraft(initialData);
  }, [setDraft, initialData]);

  const hasDraft = useCallback((): boolean => {
    return JSON.stringify(draft) !== JSON.stringify(initialData);
  }, [draft, initialData]);

  return {
    draft,
    updateDraft,
    clearDraft,
    hasDraft,
  };
};
