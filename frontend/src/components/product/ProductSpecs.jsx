import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export function ProductSpecs({ groups = [] }) {
  if (!groups.length) return null;
  return (
    <section>
      <h2 className="font-display text-h3">Specifications</h2>
      <Accordion type="multiple" defaultValue={groups.slice(0, 2).map((g, i) => g.name || String(i))} className="mt-4">
        {groups.map((group, i) => (
          <AccordionItem key={group.name || i} value={group.name || String(i)}>
            <AccordionTrigger>{group.name}</AccordionTrigger>
            <AccordionContent>
              <dl className="spec-text divide-y divide-border">
                {(group.fields || []).map((f) => (
                  <div key={f.key || f.label} className="grid grid-cols-2 gap-4 py-2">
                    <dt className="text-muted">{f.label || f.key}</dt>
                    <dd className="text-foreground">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
