import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, ApiError } from '@/lib/api';
import { toast } from 'sonner';

export function useAuth() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        return await authApi.me();
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) return null;
        throw err;
      }
    },
    staleTime: 60_000,
    retry: false,
  });

  const user = query.data?.user || query.data || null;
  const resolved = user && (user._id || user.id || user.email) ? user : null;

  const login = useMutation({
    mutationFn: authApi.login,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['auth'] });
      await qc.invalidateQueries({ queryKey: ['cart'] });
      await qc.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  const register = useMutation({
    mutationFn: authApi.register,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['auth'] });
      await qc.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const logout = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      qc.setQueryData(['auth', 'me'], null);
      qc.invalidateQueries({ queryKey: ['cart'] });
      qc.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Signed out');
    },
  });

  return {
    user: resolved,
    isLoading: query.isLoading,
    isCustomer: resolved?.role === 'customer',
    isAdmin: resolved?.role === 'superadmin',
    login,
    register,
    logout,
    refetch: query.refetch,
  };
}
