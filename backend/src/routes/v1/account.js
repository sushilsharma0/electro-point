import { Router } from 'express';
import * as account from '../../controllers/accountController.js';
import { requireAuth, optionalAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createReviewSchema } from '../../validators/review.js';
import { updateProfileSchema, addressSchema, addressUpdateSchema } from '../../validators/account.js';
import { productIdParamsSchema } from '../../validators/product.js';
import { params, objectId } from '../../validators/common.js';

const reviews = Router();
reviews.get('/product/:productId', validate(productIdParamsSchema), account.listProductReviews);
reviews.post('/', requireAuth, validate(createReviewSchema), account.createReview);

const accountRoutes = Router();
accountRoutes.use(requireAuth);
accountRoutes.get('/profile', account.getProfile);
accountRoutes.put('/profile', validate(updateProfileSchema), account.updateProfile);
accountRoutes.get('/addresses', account.listAddresses);
accountRoutes.post('/addresses', validate(addressSchema), account.createAddress);
accountRoutes.put('/addresses/:id', validate(addressUpdateSchema), account.updateAddress);
accountRoutes.delete('/addresses/:id', validate(params({ id: objectId })), account.deleteAddress);
accountRoutes.get('/notifications', account.listNotifications);
accountRoutes.patch('/notifications/:id/read', validate(params({ id: objectId })), account.readNotification);

const settings = Router();
settings.get('/', optionalAuth, account.getSettings);

const csrf = Router();
csrf.get('/', account.csrfToken);

export { reviews, accountRoutes, settings, csrf };
