import { useQuery } from '@tanstack/react-query';
import { catalogApi } from '@/lib/api';
import { DEFAULT_SETTINGS } from '@/lib/product';

export function useSettings() {
  const query = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      try {
        return await catalogApi.settings();
      } catch {
        return DEFAULT_SETTINGS;
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
  });

  const raw = query.data?.settings || query.data || DEFAULT_SETTINGS;
  return {
    settings: { ...DEFAULT_SETTINGS, ...raw, contact: { ...DEFAULT_SETTINGS.contact, ...raw.contact } },
    query,
  };
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: catalogApi.categories,
    staleTime: 5 * 60_000,
  });
}

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: catalogApi.brands,
    staleTime: 5 * 60_000,
  });
}
