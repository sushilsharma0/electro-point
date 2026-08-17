import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { cartApi, checkoutApi } from '@/lib/api';
import { useCartUi } from '@/store/cart';
import { toast } from 'sonner';

export function useCart() {
  const qc = useQueryClient();
  const { pathname } = useLocation();
  const { openDrawer, pulse } = useCartUi();

  const query = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.get,
    staleTime: 15_000,
  });

  const cart = query.data?.cart || query.data || { items: [] };
  const items = cart.items || [];
  const count = items.reduce((n, i) => n + Number(i.qty || 0), 0);

  const add = useMutation({
    mutationFn: cartApi.add,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart'] });
      pulse();
      if (!pathname.startsWith('/cart') && !pathname.startsWith('/checkout')) {
        openDrawer();
      }
      toast.success('Added to cart');
    },
    onError: (err) => toast.error(err.message || 'Could not add to cart'),
  });

  const updateItem = useMutation({
    mutationFn: ({ itemId, qty }) => cartApi.updateItem(itemId, { qty }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
    onError: (err) => toast.error(err.message || 'Could not update quantity'),
  });

  const removeItem = useMutation({
    mutationFn: cartApi.removeItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
    onError: (err) => toast.error(err.message || 'Could not remove item'),
  });

  const applyCoupon = useMutation({
    mutationFn: cartApi.applyCoupon,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Coupon applied');
    },
    onError: (err) => toast.error(err.message || 'Invalid coupon'),
  });

  const removeCoupon = useMutation({
    mutationFn: cartApi.removeCoupon,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });

  return { cart, items, count, query, add, updateItem, removeItem, applyCoupon, removeCoupon };
}

export function useQuote(body) {
  return useQuery({
    queryKey: ['quote', body],
    queryFn: () => checkoutApi.quote(body),
    enabled: body != null,
  });
}
