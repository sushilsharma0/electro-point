import { Router } from 'express';
import * as account from '../../controllers/accountController.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { wishlistSchema } from '../../validators/cart.js';
import { params, objectId } from '../../validators/common.js';

const router = Router();
router.use(requireAuth);

router.get('/', account.getWishlist);
router.post('/', validate(wishlistSchema), account.addWishlist);
router.delete('/', validate(wishlistSchema), account.removeWishlist);
router.delete('/:productId', validate(params({ productId: objectId })), account.removeWishlist);

export default router;
