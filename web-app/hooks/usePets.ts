import { useState, useEffect, useCallback } from 'react';
import { Pet, PetSearchParams, PetResponse, ApiException } from '@/types';
import { petApi } from '@/lib/api';

// Custom hook for managing pets data
export const usePets = (searchParams: PetSearchParams = {}) => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchPets = useCallback(async (params: PetSearchParams = {}, reset = true) => {
    setLoading(true);
    setError(null);

    try {
      const response: PetResponse = await petApi.getPets(params);
      
      if (reset) {
        setPets(response.pets);
      } else {
        setPets(prev => [...prev, ...response.pets]);
      }
      
      setTotal(response.total);
      setHasMore(response.pets.length === (params.limit || 20));
    } catch (err) {
      const errorMessage = err instanceof ApiException 
        ? err.message 
        : 'ペットの取得に失敗しました';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more pets (pagination)
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    const offset = pets.length;
    await fetchPets({ ...searchParams, offset }, false);
  }, [fetchPets, searchParams, pets.length, loading, hasMore]);

  // Refresh pets list
  const refresh = useCallback(() => {
    fetchPets(searchParams, true);
  }, [fetchPets, searchParams]);

  useEffect(() => {
    fetchPets(searchParams, true);
  }, [searchParams, fetchPets]);

  return {
    pets,
    loading,
    error,
    total,
    hasMore,
    refresh,
    loadMore,
  };
};

// Custom hook for managing a single pet
export const usePet = (petId: string | null) => {
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPet = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const petData = await petApi.getPet(id);
      setPet(petData);
    } catch (err) {
      const errorMessage = err instanceof ApiException 
        ? err.message 
        : 'ペットの詳細取得に失敗しました';
      setError(errorMessage);
      setPet(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    if (petId) {
      fetchPet(petId);
    }
  }, [petId, fetchPet]);

  useEffect(() => {
    if (petId) {
      fetchPet(petId);
    } else {
      setPet(null);
      setError(null);
    }
  }, [petId, fetchPet]);

  return {
    pet,
    loading,
    error,
    refresh,
  };
};

// Custom hook for managing user's pets
export const useMyPets = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMyPets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await petApi.getMyPets();
      setPets(response.pets);
    } catch (err) {
      const errorMessage = err instanceof ApiException 
        ? err.message 
        : 'あなたのペット一覧の取得に失敗しました';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchMyPets();
  }, [fetchMyPets]);

  useEffect(() => {
    fetchMyPets();
  }, [fetchMyPets]);

  return {
    pets,
    loading,
    error,
    refresh,
  };
};
