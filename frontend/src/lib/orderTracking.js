export const TRACKING_STEPS = [
  { key: 'placed', label: 'Placed', short: 'Placed' },
  { key: 'processing', label: 'Processing', short: 'Prep' },
  { key: 'packed', label: 'Packed', short: 'Packed' },
  { key: 'shipped', label: 'Shipped', short: 'Shipped' },
  { key: 'out_for_delivery', label: 'Out for delivery', short: 'Out' },
  { key: 'delivered', label: 'Delivered', short: 'Done' },
];

const STEP_BY_STATUS = {
  pending: 0,
  payment_pending: 0,
  paid: 0,
  confirmed: 0,
  processing: 1,
  packed: 2,
  shipped: 3,
  out_for_delivery: 4,
  delivered: 5,
};

export const TERMINAL_STATUSES = new Set(['cancelled', 'payment_failed', 'refunded']);

export const STATUS_META = {
  pending: { title: 'Order received', body: 'We have the order and will confirm it shortly.', tone: 'muted' },
  payment_pending: { title: 'Awaiting payment', body: 'Complete eSewa or Khalti to confirm this order.', tone: 'warning' },
  paid: { title: 'Payment received', body: 'The charge is verified. Fulfillment is next.', tone: 'success' },
  confirmed: { title: 'Order confirmed', body: 'The warehouse has the order and will start packing.', tone: 'accent' },
  processing: { title: 'Processing', body: 'Items are being picked from stock.', tone: 'accent' },
  packed: { title: 'Packed', body: 'The parcel is sealed and waiting for handover.', tone: 'accent' },
  shipped: { title: 'Shipped', body: 'The courier has accepted the parcel.', tone: 'accent' },
  out_for_delivery: { title: 'Out for delivery', body: 'The rider is on the way to the delivery address.', tone: 'accent' },
  delivered: { title: 'Delivered', body: 'The order was handed over. Keep the invoice for warranty.', tone: 'success' },
  cancelled: { title: 'Cancelled', body: 'This order will not be shipped.', tone: 'danger' },
  payment_failed: { title: 'Payment failed', body: 'The gateway did not confirm the charge. Place a new order to try again.', tone: 'danger' },
  refunded: { title: 'Refunded', body: 'The payment has been marked refunded.', tone: 'warning' },
};

export function formatStatusLabel(status) {
  const raw = String(status || '').replaceAll('_', ' ');
  if (!raw) return '';
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function trackingStepIndex(status) {
  if (status in STEP_BY_STATUS) return STEP_BY_STATUS[status];
  return -1;
}

export function statusTone(status) {
  return STATUS_META[status]?.tone || 'muted';
}

export function formatOrderStamp(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatOrderDay(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function hasShipmentTracking(tracking) {
  if (!tracking) return false;
  return Boolean(tracking.carrier || tracking.trackingNumber || tracking.trackingUrl || tracking.estimatedDelivery || tracking.lastLocation);
}

export function paymentLabel(order) {
  const method = order?.payment?.method;
  const payStatus = order?.payment?.status;
  if (method === 'cod') return `Cash on delivery (${payStatus || 'pending'})`;
  if (method === 'esewa') return `eSewa (${payStatus || 'pending'})`;
  if (method === 'khalti') return `Khalti (${payStatus || 'pending'})`;
  return method || '';
}
