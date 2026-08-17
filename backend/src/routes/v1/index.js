import { Router } from 'express';
import auth from './auth.js';
import { products, categories, search, brands, compare } from './catalog.js';
import cart from './cart.js';
import wishlist from './wishlist.js';
import { checkout, orderRoutes, payments } from './orders.js';
import { reviews, accountRoutes, settings, csrf } from './account.js';
import admin from './admin.js';

const router = Router();

router.use('/auth', auth);
router.use('/products', products);
router.use('/categories', categories);
router.use('/search', search);
router.use('/brands', brands);
router.use('/compare', compare);
router.use('/cart', cart);
router.use('/wishlist', wishlist);
router.use('/checkout', checkout);
router.use('/orders', orderRoutes);
router.use('/payments', payments);
router.use('/reviews', reviews);
router.use('/account', accountRoutes);
router.use('/settings', settings);
router.use('/csrf', csrf);
router.use('/admin', admin);

export default router;
