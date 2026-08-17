import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';

function resolveUser(data) {
  const user = data?.user || data || null;
  return user && (user._id || user.id || user.email) ? user : null;
}

export function useAuth() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const data = await authApi.me();
      return data;
    },
    staleTime: 60_000,
    retry: false,
  });

  const resolved = resolveUser(query.data);

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
    login,
    register,
    logout,
    refetch: query.refetch,
  };
}

export function useAdminAuth() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['auth', 'admin'],
    queryFn: async () => {
      const data = await authApi.adminMe();
      return data;
    },
    staleTime: 60_000,
    retry: false,
  });

  const resolved = resolveUser(query.data);
  const isAdmin = resolved?.role === 'superadmin';

  const login = useMutation({
    mutationFn: authApi.adminLogin,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['auth', 'admin'] });
    },
  });

  const logout = useMutation({
    mutationFn: authApi.adminLogout,
    onSuccess: () => {
      qc.setQueryData(['auth', 'admin'], null);
      toast.success('Signed out of admin');
    },
  });

  return {
    user: isAdmin ? resolved : null,
    isLoading: query.isLoading,
    isAdmin,
    login,
    logout,
    refetch: query.refetch,
  };
}
