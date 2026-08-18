import { matchPath, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { catalogApi, checkoutApi } from '@/lib/api';

const home = { name: 'Home', href: '/' };

function unwrap(data, key) {
  if (!data) return data;
  return data[key] || data;
}

const STATIC = {
  '/shop': [home, { name: 'Shop' }],
  '/compare': [home, { name: 'Compare' }],
  '/cart': [home, { name: 'Cart' }],
  '/checkout': [home, { name: 'Cart', href: '/cart' }, { name: 'Checkout' }],
  '/login': [home, { name: 'Sign in' }],
  '/register': [home, { name: 'Create account' }],
  '/forgot-password': [home, { name: 'Sign in', href: '/login' }, { name: 'Forgot password' }],
  '/reset-password': [home, { name: 'Sign in', href: '/login' }, { name: 'Reset password' }],
  '/about': [home, { name: 'About' }],
  '/contact': [home, { name: 'Contact' }],
  '/faq': [home, { name: 'FAQ' }],
  '/terms': [home, { name: 'Terms' }],
  '/privacy': [home, { name: 'Privacy' }],
  '/500': [home, { name: 'Error' }],
};

const ACCOUNT_LEAF = {
  '/account/orders': 'Orders',
  '/account/profile': 'Profile',
  '/account/addresses': 'Addresses',
  '/account/wishlist': 'Wishlist',
  '/account/reviews': 'Reviews',
};

export function useStorefrontCrumbs() {
  const { pathname } = useLocation();
  const [sp] = useSearchParams();

  const productMatch = matchPath('/product/:slug', pathname);
  const categoryMatch = matchPath('/category/:slug', pathname);
  const orderMatch = matchPath('/account/orders/:id', pathname);

  const productSlug = productMatch?.params.slug;
  const categorySlug = categoryMatch?.params.slug;
  const orderId = orderMatch?.params.id;

  const productQuery = useQuery({
    queryKey: ['product', productSlug],
    queryFn: () => catalogApi.product(productSlug),
    enabled: Boolean(productSlug),
  });
  const categoryQuery = useQuery({
    queryKey: ['category', categorySlug],
    queryFn: () => catalogApi.category(categorySlug),
    enabled: Boolean(categorySlug),
  });
  const orderQuery = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => checkoutApi.order(orderId),
    enabled: Boolean(orderId),
  });

  if (pathname === '/') return null;

  if (productSlug) {
    const product = unwrap(productQuery.data, 'product');
    const crumbs = [home, { name: 'Shop', href: '/shop' }];
    if (product?.category?.slug) {
      crumbs.push({ name: product.category.name, href: `/category/${product.category.slug}` });
    }
    crumbs.push({ name: product?.name || 'Product' });
    return crumbs;
  }

  if (categorySlug) {
    const category = unwrap(categoryQuery.data, 'category');
    return [home, { name: 'Shop', href: '/shop' }, { name: category?.name || categorySlug }];
  }

  if (orderId) {
    const order = unwrap(orderQuery.data, 'order');
    return [
      home,
      { name: 'Account', href: '/account' },
      { name: 'Orders', href: '/account/orders' },
      { name: order?.orderNumber || 'Order' },
    ];
  }

  if (pathname === '/search') {
    const q = sp.get('q');
    return [home, { name: 'Shop', href: '/shop' }, { name: q ? `“${q}”` : 'Search' }];
  }

  if (pathname === '/track') {
    const orderNumber = sp.get('order');
    if (orderNumber) {
      return [home, { name: 'Track order', href: '/track' }, { name: orderNumber }];
    }
    return [home, { name: 'Track order' }];
  }

  if (pathname.startsWith('/payments/')) {
    return [home, { name: 'Account', href: '/account/orders' }, { name: 'Payment' }];
  }

  if (pathname === '/account' || pathname === '/account/') {
    return [home, { name: 'Account' }];
  }

  const accountLeaf = ACCOUNT_LEAF[pathname];
  if (accountLeaf) {
    return [home, { name: 'Account', href: '/account' }, { name: accountLeaf }];
  }

  if (STATIC[pathname]) return STATIC[pathname];

  return [home, { name: 'Not found' }];
}
