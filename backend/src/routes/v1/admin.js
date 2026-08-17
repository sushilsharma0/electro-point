import { Router } from 'express';
import * as admin from '../../controllers/adminController.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireSuperadmin } from '../../middleware/admin.js';
import { validate } from '../../middleware/validate.js';
import { singleImage, singleModel } from '../../middleware/upload.js';
import { adminProductCreateSchema, adminProductUpdateSchema, adminBulkSchema } from '../../validators/product.js';
import { adminCategorySchema, adminCategoryUpdateSchema, reorderCategoriesSchema } from '../../validators/category.js';
import { updateOrderStatusSchema, idParamSchema, orderListQuerySchema } from '../../validators/order.js';
import { adminReviewSchema } from '../../validators/review.js';
import {
  adminCouponSchema,
  adminCouponUpdateSchema,
  inventoryAdjustSchema,
  customerUpdateSchema,
  settingsUpdateSchema,
} from '../../validators/admin.js';
const router = Router();
router.use(requireAuth, requireSuperadmin);

router.get('/products', admin.listProducts);
router.post('/products', validate(adminProductCreateSchema), admin.createProduct);
router.post('/products/bulk', validate(adminBulkSchema), admin.bulkProducts);
router.get('/products/:id', validate(idParamSchema), admin.getProduct);
router.patch('/products/:id', validate(adminProductUpdateSchema), admin.updateProduct);
router.delete('/products/:id', validate(idParamSchema), admin.deleteProduct);

router.get('/categories', admin.listCategories);
router.post('/categories', validate(adminCategorySchema), admin.createCategory);
router.post('/categories/reorder', validate(reorderCategoriesSchema), admin.reorderCategories);
router.patch('/categories/:id', validate(adminCategoryUpdateSchema), admin.updateCategory);
router.delete('/categories/:id', validate(idParamSchema), admin.deleteCategory);

router.get('/orders', validate(orderListQuerySchema), admin.listOrders);
router.get('/orders/:id', validate(idParamSchema), admin.getOrder);
router.patch('/orders/:id/status', validate(updateOrderStatusSchema), admin.updateOrderStatus);
router.post('/orders/:id/cancel', validate(idParamSchema), admin.cancelOrder);
router.post('/orders/:id/refund', validate(idParamSchema), admin.refundOrder);

router.get('/customers', admin.listCustomers);
router.get('/customers/:id', validate(idParamSchema), admin.getCustomer);
router.patch('/customers/:id', validate(customerUpdateSchema), admin.updateCustomer);

router.get('/inventory', admin.inventoryOverview);
router.get('/inventory/transactions', admin.inventoryTransactions);
router.post('/inventory/adjust', validate(inventoryAdjustSchema), admin.inventoryAdjust);

router.get('/coupons', admin.listCoupons);
router.post('/coupons', validate(adminCouponSchema), admin.createCoupon);
router.patch('/coupons/:id', validate(adminCouponUpdateSchema), admin.updateCoupon);
router.delete('/coupons/:id', validate(idParamSchema), admin.deleteCoupon);

router.get('/reviews', admin.listReviews);
router.patch('/reviews/:id', validate(adminReviewSchema), admin.updateReview);
router.delete('/reviews/:id', validate(idParamSchema), admin.deleteReview);

router.get('/payments', admin.listPayments);
router.get('/analytics', admin.analytics);
router.get('/dashboard', admin.analytics);

router.get('/settings', admin.getSettings);
router.put('/settings', validate(settingsUpdateSchema), admin.updateSettings);

router.post('/uploads/image', singleImage, admin.uploadImage);
router.post('/uploads/model3d', singleModel, admin.uploadModel);

export default router;
