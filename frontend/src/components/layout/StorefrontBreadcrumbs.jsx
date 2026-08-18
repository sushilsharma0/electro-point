import { Container } from '@/components/layout/Container';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { useStorefrontCrumbs } from '@/hooks/useStorefrontCrumbs';
import { cn } from '@/lib/cn';

export function StorefrontBreadcrumbs({ className }) {
  const items = useStorefrontCrumbs();
  if (!items?.length) return null;
  return (
    <Container className={cn('pt-6', className)}>
      <Breadcrumbs items={items} />
    </Container>
  );
}
