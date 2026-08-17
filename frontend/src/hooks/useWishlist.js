import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { wishlistApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { idOf } from '@/lib/product';

export function useWishlist() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['wishlist'],
    queryFn: wishlistApi.get,
    enabled: Boolean(user),
  });

  const data = query.data?.wishlist || query.data || {};
  const products = data.products || data.items || [];
  const ids = new Set(products.map((p) => String(idOf(p.product || p))));

  const add = useMutation({
    mutationFn: wishlistApi.add,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Saved to wishlist');
    },
    onError: (err) => toast.error(err.message || 'Sign in to save items'),
  });

  const remove = useMutation({
    mutationFn: async (productId) => {
      try {
        return await wishlistApi.remove(productId);
      } catch {
        return wishlistApi.removeAlt(productId);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wishlist'] }),
  });

  const toggle = (productId) => {
    if (!user) {
      toast.error('Sign in to use wishlist');
      return;
    }
    if (ids.has(String(productId))) remove.mutate(productId);
    else add.mutate(productId);
  };

  return { products, ids, query, add, remove, toggle, isAuthed: Boolean(user) };
}
