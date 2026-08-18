import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export const ORDER_STATUSES = [
  'pending',
  'payment_pending',
  'paid',
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'payment_failed',
  'refunded',
];

function toDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export function AdminShipmentForm({ order }) {
  const qc = useQueryClient();
  const [status, setStatus] = useState(order.status);
  const [note, setNote] = useState('');
  const [carrier, setCarrier] = useState(order.tracking?.carrier || '');
  const [trackingNumber, setTrackingNumber] = useState(order.tracking?.trackingNumber || '');
  const [trackingUrl, setTrackingUrl] = useState(order.tracking?.trackingUrl || '');
  const [estimatedDelivery, setEstimatedDelivery] = useState(toDateInput(order.tracking?.estimatedDelivery));
  const [lastLocation, setLastLocation] = useState(order.tracking?.lastLocation || '');

  useEffect(() => {
    setStatus(order.status);
    setCarrier(order.tracking?.carrier || '');
    setTrackingNumber(order.tracking?.trackingNumber || '');
    setTrackingUrl(order.tracking?.trackingUrl || '');
    setEstimatedDelivery(toDateInput(order.tracking?.estimatedDelivery));
    setLastLocation(order.tracking?.lastLocation || '');
  }, [order]);

  const mut = useMutation({
    mutationFn: (body) => adminApi.updateOrder(order._id || order.id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-order', String(order._id || order.id)] });
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      setNote('');
      toast.success('Shipment updated');
    },
    onError: (err) => toast.error(err.message || 'Could not update shipment'),
  });

  const submit = (e) => {
    e.preventDefault();
    const tracking = {
      carrier,
      trackingNumber,
      trackingUrl,
      lastLocation,
      estimatedDelivery: estimatedDelivery || null,
    };
    mut.mutate({ status, note, tracking });
  };

  return (
    <form className="space-y-4 border border-border bg-surface p-5" onSubmit={submit}>
      <div>
        <p className="caption">Update shipment</p>
        <h3 className="mt-1 font-display text-lg font-semibold">Status and tracking</h3>
        <p className="mt-1 text-sm text-muted">
          Customers see this on their order and on the public tracking page.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="admin-order-status">Status</Label>
          <select
            id="admin-order-status"
            className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="admin-carrier">Courier</Label>
          <Input
            id="admin-carrier"
            className="mt-1"
            placeholder="Pathao, Sundarban, Nepal Post…"
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="admin-tracking-number">Tracking number</Label>
          <Input
            id="admin-tracking-number"
            className="mt-1 font-spec"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="admin-eta">Estimated delivery</Label>
          <Input
            id="admin-eta"
            type="date"
            className="mt-1"
            value={estimatedDelivery}
            onChange={(e) => setEstimatedDelivery(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="admin-tracking-url">Courier tracking URL</Label>
          <Input
            id="admin-tracking-url"
            className="mt-1"
            inputMode="url"
            placeholder="https://"
            value={trackingUrl}
            onChange={(e) => setTrackingUrl(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="admin-last-location">Last location</Label>
          <Input
            id="admin-last-location"
            className="mt-1"
            placeholder="Kathmandu hub"
            value={lastLocation}
            onChange={(e) => setLastLocation(e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="admin-note">Note to customer</Label>
          <Textarea
            id="admin-note"
            className="mt-1 min-h-[88px]"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional. Appears on the order timeline."
          />
        </div>
      </div>
      <Button type="submit" disabled={mut.isPending}>
        {mut.isPending ? 'Saving' : 'Save shipment'}
      </Button>
    </form>
  );
}
