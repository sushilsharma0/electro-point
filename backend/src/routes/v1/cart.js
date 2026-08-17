import { Router } from 'express';
import * as cart from '../../controllers/cartController.js';
import { optionalAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  addCartItemSchema,
  updateCartItemSchema,
  cartItemParamsSchema,
  replaceCartSchema,
  applyCouponSchema,
} from '../../validators/cart.js';

const router = Router();
router.use(optionalAuth);

router.get('/', cart.getCart);
router.put('/', validate(replaceCartSchema), cart.replaceCart);
router.delete('/', cart.clearCart);
router.post('/items', validate(addCartItemSchema), cart.addItem);
router.patch('/items/:itemId', validate(updateCartItemSchema), cart.updateItem);
router.delete('/items/:itemId', validate(cartItemParamsSchema), cart.removeItem);
router.post('/coupon', validate(applyCouponSchema), cart.applyCoupon);
router.delete('/coupon', cart.removeCoupon);

export default router;
