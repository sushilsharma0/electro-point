import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, listFrom } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AdminHeader } from '@/components/admin/AdminChrome';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HeroProductPicker } from '@/components/admin/HeroProductPicker';

const MAX_POPUPS = 8;
const MAX_IMAGES = 8;

export function AdminPopupsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['admin-settings'], queryFn: adminApi.settings });
  const couponsQ = useQuery({ queryKey: ['admin-coupons'], queryFn: () => adminApi.coupons({ limit: 50 }) });
  const [form, setForm] = useState(null);
  const [imageUrl, setImageUrl] = useState({});
  const [openId, setOpenId] = useState('');

  useEffect(() => {
    if (!q.data) return;
    const settings = q.data.settings || q.data;
    setForm(Array.isArray(settings.homepagePopups) ? settings.homepagePopups : []);
  }, [q.data]);

  const mut = useMutation({
    mutationFn: (homepagePopups) => adminApi.updateSettings({ homepagePopups }),
    onSuccess: (data) => {
      toast.success('Popups saved');
      const settings = data?.settings || data;
      if (settings) setForm(Array.isArray(settings.homepagePopups) ? settings.homepagePopups : []);
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (e) => toast.error(e.message),
  });

  if (!form) return null;
  const coupons = listFrom(couponsQ.data);
  const full = atMax(form, MAX_POPUPS);

  const patch = (index, next) => {
    setForm((rows) => rows.map((row, i) => (i === index ? { ...row, ...next } : row)));
  };

  const uploadImage = async (index, file) => {
    try {
      const res = await adminApi.uploadImage(file);
      const url = res.url || res.path || res.file?.url;
      if (!url) throw new Error('Upload did not return a URL');
      let blocked = false;
      setForm((rows) => {
        const images = [...(rows[index].images || [])];
        if (atMax(images, MAX_IMAGES)) {
          blocked = true;
          return rows;
        }
        return rows.map((row, i) => (i === index ? { ...row, images: [...images, url] } : row));
      });
      if (blocked) toast.error('Maximum 8 images');
      else toast.success('Image uploaded');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        mut.mutate(form.map((row, i) => ({ ...row, sort: i * 10 })));
      }}
    >
      <AdminHeader
        title="Homepage popups"
        description="Shown when a visitor opens the homepage. Each enabled popup appears in order. Images, copy, sale products, and coupon codes are optional."
        actions={
          <Button type="submit" disabled={mut.isPending}>
            {mut.isPending ? 'Saving…' : 'Save popups'}
          </Button>
        }
      />

      {form.length ? (
        <Accordion type="single" collapsible value={openId} onValueChange={setOpenId} className="border-t border-border">
          {form.map((row, i) => (
            <AccordionItem key={row.id} value={row.id}>
              <AccordionTrigger>
                <span className="min-w-0 flex-1 truncate pr-4 text-left">{row.title || `Popup ${i + 1}`}</span>
                <span className="mr-3 shrink-0 text-xs font-normal text-muted">{row.enabled !== false ? 'On' : 'Off'}</span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    Enabled
                    <Switch checked={row.enabled !== false} onCheckedChange={(v) => patch(i, { enabled: v })} />
                  </label>
                  <Button type="button" variant="ghost" size="icon" aria-label="Move up" disabled={i === 0} onClick={() => setForm(move(form, i, -1))}>
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" aria-label="Move down" disabled={isLast(form, i)} onClick={() => setForm(move(form, i, 1))}>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove popup"
                    onClick={() => {
                      setForm(form.filter((_, idx) => idx !== i));
                      if (openId === row.id) setOpenId('');
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor={`kicker-${i}`}>Kicker</Label>
                  <Input id={`kicker-${i}`} className="mt-1" value={row.kicker || ''} onChange={(e) => patch(i, { kicker: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor={`title-${i}`}>Title</Label>
                  <Input id={`title-${i}`} className="mt-1" value={row.title || ''} onChange={(e) => patch(i, { title: e.target.value })} />
                </div>
              </div>
              <div>
                <Label htmlFor={`body-${i}`}>Text</Label>
                <Textarea id={`body-${i}`} className="mt-1" value={row.body || ''} onChange={(e) => patch(i, { body: e.target.value })} />
              </div>

              <div>
                <Label>Images</Label>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {(row.images || []).map((src) => (
                    <li key={src} className="relative h-20 w-20 overflow-hidden border border-border bg-muted-bg">
                      <img src={src} alt="" className="h-full w-full object-contain" />
                      <button
                        type="button"
                        className="absolute right-0.5 top-0.5 cursor-pointer border border-border bg-surface p-0.5"
                        aria-label="Remove image"
                        onClick={() => patch(i, { images: (row.images || []).filter((u) => u !== src) })}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadImage(i, file);
                      e.target.value = '';
                    }}
                  />
                  <Input
                    placeholder="https:// or /uploads/…"
                    value={imageUrl[row.id] || ''}
                    onChange={(e) => setImageUrl({ ...imageUrl, [row.id]: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const url = (imageUrl[row.id] || '').trim();
                      if (!url) return;
                      const images = [...(row.images || [])];
                      if (atMax(images, MAX_IMAGES)) {
                        toast.error('Maximum 8 images');
                        return;
                      }
                      images.push(url);
                      patch(i, { images });
                      setImageUrl({ ...imageUrl, [row.id]: '' });
                    }}
                  >
                    Add link
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor={`cta-${i}`}>Button label</Label>
                  <Input id={`cta-${i}`} className="mt-1" value={row.ctaLabel || ''} onChange={(e) => patch(i, { ctaLabel: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor={`href-${i}`}>Button link</Label>
                  <Input id={`href-${i}`} className="mt-1" placeholder="/shop?onSale=1" value={row.ctaHref || ''} onChange={(e) => patch(i, { ctaHref: e.target.value })} />
                </div>
              </div>

              <HeroProductPicker
                cacheKey={`popup-${row.id}`}
                ids={row.productIds || []}
                products={row.products || []}
                showPreview={false}
                title="Products in this popup"
                description="Only these products appear in the popup. Leave empty to show none."
                emptyHint="No products selected. The popup will not list devices until you add some."
                onChange={(productIds, products) => patch(i, { productIds, products })}
              />

              {coupons.length ? (
                <fieldset>
                  <legend className="text-[13px] font-medium">Coupons</legend>
                  <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                    {coupons.map((c) => (
                      <li key={c._id || c.code} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          id={`c-${row.id}-${c.code}`}
                          checked={(row.couponCodes || []).includes(c.code)}
                          onCheckedChange={() => patch(i, { couponCodes: toggleCode(row.couponCodes || [], c.code) })}
                        />
                        <label htmlFor={`c-${row.id}-${c.code}`} className="cursor-pointer">
                          {c.code}
                        </label>
                      </li>
                    ))}
                  </ul>
                </fieldset>
              ) : (
                <p className="text-sm text-muted">Create coupons first to attach them here.</p>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>How often</Label>
                  <Select value={row.frequency || 'once'} onValueChange={(frequency) => patch(i, { frequency })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">Once per visitor</SelectItem>
                      <SelectItem value="daily">Once a day</SelectItem>
                      <SelectItem value="always">Every visit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor={`delay-${i}`}>Delay (ms)</Label>
                  <Input
                    id={`delay-${i}`}
                    className="mt-1"
                    type="number"
                    min={0}
                    max={15000}
                    value={row.delayMs ?? 600}
                    onChange={(e) => patch(i, { delayMs: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <p className="text-sm text-muted">No popups yet. Add one to announce a sale, coupon, or campaign.</p>
      )}

      <Button
        type="button"
        variant="outline"
        disabled={full}
        onClick={() => {
          const next = emptyPopup(form.length);
          setForm([...form, next]);
          setOpenId(next.id);
        }}
      >
        <Plus className="h-4 w-4" />
        Add popup
      </Button>
    </form>
  );
}

function emptyPopup(index) {
  return {
    id: `p_${Date.now().toString(36)}_${index}`,
    enabled: true,
    kicker: '',
    title: '',
    body: '',
    images: [],
    ctaLabel: 'Shop sale',
    ctaHref: '/shop?onSale=1',
    productIds: [],
    products: [],
    couponCodes: [],
    delayMs: 600,
    frequency: 'once',
    sort: index * 10,
  };
}

function toggleCode(codes, code) {
  if (codes.includes(code)) return codes.filter((c) => c !== code);
  if (atMax(codes, 8)) return codes;
  return [...codes, code];
}

function atMax(list, max) {
  return (list || []).length >= max;
}

function isLast(list, index) {
  return index === (list || []).length - 1;
}

function move(list, index, delta) {
  const next = [...list];
  const dest = index + delta;
  if (dest < 0 || dest >= next.length) return list;
  const [row] = next.splice(index, 1);
  next.splice(dest, 0, row);
  return next.map((item, i) => ({ ...item, sort: i * 10 }));
}
