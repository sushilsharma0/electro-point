import { Router } from 'express';
import * as orders from '../../controllers/orderController.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { paymentLimiter, trackLimiter } from '../../middleware/rateLimits.js';
import {
  checkoutQuoteSchema,
  createOrderSchema,
  initiatePaymentSchema,
  orderListQuerySchema,
  idParamSchema,
  trackOrderSchema,
} from '../../validators/order.js';

const checkout = Router();
checkout.post('/quote', requireAuth, validate(checkoutQuoteSchema), orders.quote);

const orderRoutes = Router();
orderRoutes.post('/', requireAuth, validate(createOrderSchema), orders.createOrder);
orderRoutes.post('/track', trackLimiter, validate(trackOrderSchema), orders.trackOrder);
orderRoutes.get('/', requireAuth, validate(orderListQuerySchema), orders.listOrders);
orderRoutes.get('/:id', requireAuth, validate(idParamSchema), orders.getOrder);

const payments = Router();
payments.post('/esewa/initiate', requireAuth, paymentLimiter, validate(initiatePaymentSchema), orders.initiateEsewa);
payments.get('/esewa/return', orders.esewaReturn);
payments.post('/khalti/initiate', requireAuth, paymentLimiter, validate(initiatePaymentSchema), orders.initiateKhalti);
payments.get('/khalti/return', orders.khaltiReturn);

export { checkout, orderRoutes, payments };
