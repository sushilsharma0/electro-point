import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Seo } from '@/components/Seo';
import { toast } from 'sonner';
import { WithTooltip } from '@/components/ui/tooltip';
import { CONTENT_FORMAT_HINT, mergeContentPages } from '@/lib/contentPages';

export function AdminPagesPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['admin-settings'], queryFn: adminApi.settings });
  const [form, setForm] = useState(null);
  useEffect(() => {
    if (q.data) {
      const settings = q.data.settings || q.data;
      setForm(mergeContentPages(settings.contentPages));
    }
  }, [q.data]);
  const mut = useMutation({
    mutationFn: (contentPages) => adminApi.updateSettings({ contentPages }),
    onSuccess: (data) => {
      toast.success('Pages saved');
      const settings = data?.settings || data;
      if (settings) setForm(mergeContentPages(settings.contentPages));
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (e) => toast.error(e.message),
  });
  if (!form) return null;

  const setPage = (key, patch) => setForm((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        mut.mutate(form);
      }}
    >
      <Seo title="Pages" noindex />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Pages</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">{CONTENT_FORMAT_HINT}</p>
        </div>
        <Button type="submit" disabled={mut.isPending}>
          {mut.isPending ? 'Saving…' : 'Save pages'}
        </Button>
      </div>

      <Tabs defaultValue="about">
        <TabsList>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="terms">Terms</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="max-w-3xl space-y-4">
          <ViewLink to="/about" />
          <Field label="Kicker" value={form.about.kicker} onChange={(v) => setPage('about', { kicker: v })} />
          <Field label="Headline" value={form.about.headline} onChange={(v) => setPage('about', { headline: v })} />
          <Area label="Intro" value={form.about.intro} onChange={(v) => setPage('about', { intro: v })} />
          <Field label="Body title" value={form.about.bodyTitle} onChange={(v) => setPage('about', { bodyTitle: v })} />
          <Area label="Body" value={form.about.body} tall onChange={(v) => setPage('about', { body: v })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Shop button" value={form.about.shopLabel} onChange={(v) => setPage('about', { shopLabel: v })} />
            <Field label="Shop link" value={form.about.shopHref} onChange={(v) => setPage('about', { shopHref: v })} />
            <Field label="Contact button" value={form.about.contactLabel} onChange={(v) => setPage('about', { contactLabel: v })} />
            <Field label="Contact link" value={form.about.contactHref} onChange={(v) => setPage('about', { contactHref: v })} />
          </div>
          <Field label="Store card title" value={form.about.storeCardTitle} onChange={(v) => setPage('about', { storeCardTitle: v })} />
          <Field label="Payments line" value={form.about.paymentsText} onChange={(v) => setPage('about', { paymentsText: v })} />
          <Field label="Facts title" value={form.about.factsTitle} onChange={(v) => setPage('about', { factsTitle: v })} />
          <BlockList
            label="Facts"
            items={form.about.facts || []}
            empty={{ title: '', body: '' }}
            max={8}
            onChange={(facts) => setPage('about', { facts })}
            renderItem={(item, patch) => (
              <>
                <Field label="Title" value={item.title} onChange={(v) => patch({ title: v })} />
                <Area label="Body" value={item.body} onChange={(v) => patch({ body: v })} />
              </>
            )}
          />
          <Field label="Policies title" value={form.about.policiesTitle} onChange={(v) => setPage('about', { policiesTitle: v })} />
          <Area label="Policies intro" value={form.about.policiesIntro} onChange={(v) => setPage('about', { policiesIntro: v })} />
          <BlockList
            label="Policy links"
            items={form.about.policiesLinks || []}
            empty={{ label: '', href: '' }}
            max={12}
            onChange={(policiesLinks) => setPage('about', { policiesLinks })}
            renderItem={(item, patch) => (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Label" value={item.label} onChange={(v) => patch({ label: v })} />
                <Field label="Link" value={item.href} onChange={(v) => patch({ href: v })} />
              </div>
            )}
          />
          <Field label="SEO title" value={form.about.seoTitle} onChange={(v) => setPage('about', { seoTitle: v })} />
          <Area label="SEO description" value={form.about.seoDescription} onChange={(v) => setPage('about', { seoDescription: v })} />
        </TabsContent>

        <TabsContent value="terms">
          <LegalEditor page={form.terms} onChange={(patch) => setPage('terms', patch)} view="/terms" />
        </TabsContent>
        <TabsContent value="privacy">
          <LegalEditor page={form.privacy} onChange={(patch) => setPage('privacy', patch)} view="/privacy" />
        </TabsContent>

        <TabsContent value="faq" className="max-w-3xl space-y-4">
          <ViewLink to="/faq" />
          <Field label="Title" value={form.faq.title} onChange={(v) => setPage('faq', { title: v })} />
          <BlockList
            label="Questions"
            items={form.faq.items || []}
            empty={{ q: '', a: '' }}
            max={40}
            onChange={(items) => setPage('faq', { items })}
            renderItem={(item, patch) => (
              <>
                <Field label="Question" value={item.q} onChange={(v) => patch({ q: v })} />
                <Area label="Answer" value={item.a} onChange={(v) => patch({ a: v })} />
              </>
            )}
          />
          <Field label="SEO title" value={form.faq.seoTitle} onChange={(v) => setPage('faq', { seoTitle: v })} />
          <Area label="SEO description" value={form.faq.seoDescription} onChange={(v) => setPage('faq', { seoDescription: v })} />
        </TabsContent>

        <TabsContent value="contact" className="max-w-3xl space-y-4">
          <ViewLink to="/contact" />
          <p className="text-sm text-muted">Address, email, and phone always come from Settings. Edit the heading and intro here.</p>
          <Field label="Kicker" value={form.contact.kicker} onChange={(v) => setPage('contact', { kicker: v })} />
          <Field label="Headline" value={form.contact.headline} onChange={(v) => setPage('contact', { headline: v })} />
          <Area label="Intro" value={form.contact.intro} onChange={(v) => setPage('contact', { intro: v })} />
          <Field label="SEO title" value={form.contact.seoTitle} onChange={(v) => setPage('contact', { seoTitle: v })} />
          <Area label="SEO description" value={form.contact.seoDescription} onChange={(v) => setPage('contact', { seoDescription: v })} />
        </TabsContent>
      </Tabs>

      <Button type="submit" disabled={mut.isPending}>
        {mut.isPending ? 'Saving…' : 'Save pages'}
      </Button>
    </form>
  );
}

function LegalEditor({ page, onChange, view }) {
  return (
    <div className="max-w-3xl space-y-4">
      <ViewLink to={view} />
      <Field label="Kicker" value={page.kicker} onChange={(v) => onChange({ kicker: v })} />
      <Field label="Title" value={page.title} onChange={(v) => onChange({ title: v })} />
      <Area label="Intro" value={page.description} onChange={(v) => onChange({ description: v })} />
      <Field label="Last updated" value={page.updated} onChange={(v) => onChange({ updated: v })} />
      <BlockList
        label="Sections"
        items={page.sections || []}
        empty={{ id: '', title: '', body: '' }}
        max={40}
        onChange={(sections) => onChange({ sections })}
        renderItem={(item, patch) => (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Anchor id" value={item.id} onChange={(v) => patch({ id: v })} />
              <Field label="Heading" value={item.title} onChange={(v) => patch({ title: v })} />
            </div>
            <Area label="Body" value={item.body} tall onChange={(v) => patch({ body: v })} />
          </>
        )}
      />
      <Field label="SEO title" value={page.seoTitle} onChange={(v) => onChange({ seoTitle: v })} />
      <Area label="SEO description" value={page.seoDescription} onChange={(v) => onChange({ seoDescription: v })} />
    </div>
  );
}

function BlockList({ label, items, empty, max, onChange, renderItem }) {
  return (
    <div>
      <p className="caption mb-3">{label}</p>
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="space-y-3 border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted">{i + 1}</p>
              <WithTooltip label="Remove">
                <Button type="button" variant="ghost" size="icon" aria-label="Remove" onClick={() => onChange(items.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </WithTooltip>
            </div>
            {renderItem(item, (patch) => {
              const next = items.slice();
              next[i] = { ...item, ...patch };
              onChange(next);
            })}
          </div>
        ))}
      </div>
      {items.length < max ? (
        <Button type="button" variant="outline" className="mt-3" onClick={() => onChange([...items, { ...empty }])}>
          <Plus className="mr-2 h-4 w-4" />
          Add
        </Button>
      ) : null}
    </div>
  );
}

function Field({ label, value, onChange }) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} className="mt-1" value={value || ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Area({ label, value, onChange, tall }) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        className={tall ? 'mt-1 min-h-[200px]' : 'mt-1'}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ViewLink({ to }) {
  return (
    <p className="text-sm">
      <Link to={to} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
        View live page
      </Link>
    </p>
  );
}
