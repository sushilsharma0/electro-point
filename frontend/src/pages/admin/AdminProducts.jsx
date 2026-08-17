import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { adminApi, listFrom } from '@/lib/api';
import { formatNpr } from '@/lib/money';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Seo } from '@/components/Seo';
import { toast } from 'sonner';

export function AdminProductsPage() {
  const [q, setQ] = useState('');
  const query = useQuery({ queryKey: ['admin-products', q], queryFn: () => adminApi.products({ q, limit: 50 }) });
  const products = listFrom(query.data);
  const del = useMutation({
    mutationFn: adminApi.deleteProduct,
    onSuccess: () => {
      query.refetch();
      toast.success('Deleted');
    },
  });

  return (
    <div>
      <Seo title="Products" noindex />
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold">Products</h1>
        <Button asChild>
          <Link to="/admin/products/new">New product</Link>
        </Button>
      </div>
      <Input className="my-4 max-w-sm" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => (
            <TableRow key={p._id}>
              <TableCell>
                <Link to={`/admin/products/${p._id}`} className="hover:text-accent">
                  {p.name}
                </Link>
              </TableCell>
              <TableCell className="tabular">{p.sku}</TableCell>
              <TableCell className="tabular">{formatNpr(p.salePricePaisa || p.pricePaisa)}</TableCell>
              <TableCell className="tabular">{p.stock}</TableCell>
              <TableCell>{p.status}</TableCell>
              <TableCell>
                <Button type="button" size="sm" variant="ghost" onClick={() => del.mutate(p._id)}>
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

const emptyProduct = {
  name: '',
  slug: '',
  brand: '',
  sku: '',
  description: '',
  shortDescription: '',
  pricePaisa: 0,
  salePricePaisa: 0,
  costPricePaisa: 0,
  stock: 0,
  lowStockThreshold: 5,
  visualMode: 'images',
  warranty: '',
  status: 'draft',
  flags: { isFeatured: false, isBestSeller: false, isNewArrival: false, isOnSale: false },
  features: [''],
  specGroups: [{ name: 'General', fields: [{ key: 'model', label: 'Model', value: '', filterable: true }] }],
  variants: [],
  images: [],
  seoTitle: '',
  seoDescription: '',
  tags: '',
};

export function AdminProductFormPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const nav = useNavigate();
  const existing = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => adminApi.product(id),
    enabled: !isNew,
  });
  const cats = useQuery({ queryKey: ['admin-cats'], queryFn: () => adminApi.categories() });
  const [form, setForm] = useState(emptyProduct);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = existing.data?.product || existing.data;
    if (!isNew && loaded && !hydrated) {
      setForm({
        ...emptyProduct,
        ...loaded,
        tags: Array.isArray(loaded.tags) ? loaded.tags.join(', ') : loaded.tags || '',
        flags: { ...emptyProduct.flags, ...loaded.flags },
      });
      setHydrated(true);
    }
  }, [existing.data, isNew, hydrated]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    const body = {
      ...form,
      pricePaisa: Number(form.pricePaisa),
      salePricePaisa: Number(form.salePricePaisa) || 0,
      costPricePaisa: Number(form.costPricePaisa) || 0,
      stock: Number(form.stock),
      tags: String(form.tags || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };
    try {
      if (isNew) {
        const created = await adminApi.createProduct(body);
        toast.success('Created');
        nav(`/admin/products/${created._id || created.product?._id || ''}`);
      } else {
        await adminApi.updateProduct(id, body);
        toast.success('Saved');
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const uploadImage = async (file) => {
    try {
      const res = await adminApi.uploadImage(file);
      const url = res.url || res.path || res.file?.url;
      set({ images: [...(form.images || []), { url, alt: form.name, isPrimary: !form.images?.length }] });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const uploadModel = async (file) => {
    try {
      const res = await adminApi.uploadModel(file);
      const url = res.url || res.path;
      set({ model3d: { url, format: file.name.endsWith('.gltf') ? 'gltf' : 'glb' }, visualMode: 'model3d' });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const categories = listFrom(cats.data);

  return (
    <div className="space-y-6">
      <Seo title={isNew ? 'New product' : 'Edit product'} noindex />
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold">{isNew ? 'New product' : form.name || 'Edit'}</h1>
        <Button type="button" onClick={save}>
          Save
        </Button>
      </div>
      <Tabs defaultValue="basic">
        <TabsList>
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="variants">Variants</TabsTrigger>
          <TabsTrigger value="specs">Specs</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>
        <TabsContent value="basic" className="grid max-w-2xl gap-4">
          <Field label="Name" id="name" value={form.name} onChange={(v) => set({ name: v })} />
          <Field label="Slug" id="slug" value={form.slug} onChange={(v) => set({ slug: v })} />
          <Field label="Brand" id="brand" value={form.brand} onChange={(v) => set({ brand: v })} />
          <Field label="SKU" id="sku" value={form.sku} onChange={(v) => set({ sku: v })} />
          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
              value={form.category || ''}
              onChange={(e) => set({ category: e.target.value })}
            >
              <option value="">Select</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="short">Short description</Label>
            <Textarea id="short" className="mt-1" value={form.shortDescription} onChange={(e) => set({ shortDescription: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" className="mt-1 min-h-[160px]" value={form.description} onChange={(e) => set({ description: e.target.value })} />
          </div>
          <Field label="Warranty" id="warranty" value={form.warranty} onChange={(v) => set({ warranty: v })} />
          <div>
            <Label htmlFor="status">Status</Label>
            <select id="status" className="mt-1 h-10 w-full rounded-md border border-border bg-surface px-3" value={form.status} onChange={(e) => set({ status: e.target.value })}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(form.flags || {}).map(([k, v]) => (
              <label key={k} className="flex cursor-pointer items-center justify-between border border-border px-3 py-2 text-sm">
                {k}
                <Switch checked={Boolean(v)} onCheckedChange={(c) => set({ flags: { ...form.flags, [k]: c } })} />
              </label>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="pricing" className="grid max-w-md gap-4">
          <Field label="Price (paisa)" id="price" type="number" value={form.pricePaisa} onChange={(v) => set({ pricePaisa: v })} />
          <Field label="Sale price (paisa)" id="sale" type="number" value={form.salePricePaisa} onChange={(v) => set({ salePricePaisa: v })} />
          <Field label="Cost (paisa)" id="cost" type="number" value={form.costPricePaisa} onChange={(v) => set({ costPricePaisa: v })} />
          <Field label="Stock" id="stock" type="number" value={form.stock} onChange={(v) => set({ stock: v })} />
          <Field label="Low stock threshold" id="low" type="number" value={form.lowStockThreshold} onChange={(v) => set({ lowStockThreshold: v })} />
        </TabsContent>
        <TabsContent value="variants">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              set({
                variants: [
                  ...(form.variants || []),
                  { sku: '', name: '', options: { color: '', storage: '' }, pricePaisa: form.pricePaisa, stock: 0 },
                ],
              })
            }
          >
            Add variant
          </Button>
          <div className="mt-4 space-y-4">
            {(form.variants || []).map((v, i) => (
              <div key={i} className="grid gap-2 border border-border p-3 md:grid-cols-4">
                <Input placeholder="SKU" value={v.sku} onChange={(e) => patchVariant(set, form, i, { sku: e.target.value })} />
                <Input placeholder="Name" value={v.name} onChange={(e) => patchVariant(set, form, i, { name: e.target.value })} />
                <Input placeholder="Color" value={v.options?.color || ''} onChange={(e) => patchVariant(set, form, i, { options: { ...v.options, color: e.target.value } })} />
                <Input placeholder="Storage" value={v.options?.storage || ''} onChange={(e) => patchVariant(set, form, i, { options: { ...v.options, storage: e.target.value } })} />
                <Input type="number" placeholder="Price paisa" value={v.pricePaisa} onChange={(e) => patchVariant(set, form, i, { pricePaisa: Number(e.target.value) })} />
                <Input type="number" placeholder="Stock" value={v.stock} onChange={(e) => patchVariant(set, form, i, { stock: Number(e.target.value) })} />
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="specs">
          <Button
            type="button"
            variant="outline"
            onClick={() => set({ specGroups: [...(form.specGroups || []), { name: 'New group', fields: [{ key: '', label: '', value: '', filterable: false }] }] })}
          >
            Add group
          </Button>
          {(form.specGroups || []).map((g, gi) => (
            <div key={gi} className="mt-4 border border-border p-3">
              <Input value={g.name} onChange={(e) => patchGroup(set, form, gi, { name: e.target.value })} />
              {(g.fields || []).map((f, fi) => (
                <div key={fi} className="mt-2 grid gap-2 md:grid-cols-4">
                  <Input placeholder="key" value={f.key} onChange={(e) => patchField(set, form, gi, fi, { key: e.target.value })} />
                  <Input placeholder="label" value={f.label} onChange={(e) => patchField(set, form, gi, fi, { label: e.target.value })} />
                  <Input placeholder="value" value={f.value} onChange={(e) => patchField(set, form, gi, fi, { value: e.target.value })} />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="cursor-pointer"
                      checked={Boolean(f.filterable)}
                      onChange={(e) => patchField(set, form, gi, fi, { filterable: e.target.checked })}
                    />
                    Filterable
                  </label>
                </div>
              ))}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="mt-2"
                onClick={() => patchGroup(set, form, gi, { fields: [...(g.fields || []), { key: '', label: '', value: '', filterable: false }] })}
              >
                Add field
              </Button>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="media" className="space-y-4">
          <div>
            <Label htmlFor="visualMode">Visual mode</Label>
            <select id="visualMode" className="mt-1 h-10 rounded-md border border-border bg-surface px-3" value={form.visualMode} onChange={(e) => set({ visualMode: e.target.value })}>
              <option value="images">Images</option>
              <option value="spin360">360</option>
              <option value="model3d">3D model</option>
            </select>
          </div>
          <div>
            <Label htmlFor="img">Images</Label>
            <Input id="img" type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="mt-1" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
            <ul className="mt-3 flex gap-2">
              {(form.images || []).map((im, i) => (
                <li key={i} className="h-16 w-16 overflow-hidden border border-border">
                  <img src={im.url || im} alt="" className="h-full w-full object-cover" />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <Label htmlFor="glb">3D model (GLB/GLTF)</Label>
            <Input id="glb" type="file" accept=".glb,.gltf,model/gltf-binary,model/gltf+json" className="mt-1" onChange={(e) => e.target.files?.[0] && uploadModel(e.target.files[0])} />
            {form.model3d?.url ? <p className="mt-2 text-xs text-muted">{form.model3d.url}</p> : null}
          </div>
        </TabsContent>
        <TabsContent value="seo" className="grid max-w-xl gap-4">
          <Field label="SEO title" id="seoTitle" value={form.seoTitle} onChange={(v) => set({ seoTitle: v })} />
          <div>
            <Label htmlFor="seoDescription">SEO description</Label>
            <Textarea id="seoDescription" className="mt-1" value={form.seoDescription} onChange={(e) => set({ seoDescription: e.target.value })} />
          </div>
          <Field label="Tags (comma)" id="tags" value={form.tags} onChange={(v) => set({ tags: v })} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, id, value, onChange, type = 'text' }) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} className="mt-1" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function patchVariant(set, form, i, patch) {
  const variants = [...(form.variants || [])];
  variants[i] = { ...variants[i], ...patch };
  set({ variants });
}

function patchGroup(set, form, i, patch) {
  const specGroups = [...(form.specGroups || [])];
  specGroups[i] = { ...specGroups[i], ...patch };
  set({ specGroups });
}

function patchField(set, form, gi, fi, patch) {
  const specGroups = [...(form.specGroups || [])];
  const fields = [...(specGroups[gi].fields || [])];
  fields[fi] = { ...fields[fi], ...patch };
  specGroups[gi] = { ...specGroups[gi], fields };
  set({ specGroups });
}
