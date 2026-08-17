import { Link } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { useCategories, useSettings } from '@/hooks/useCatalog';
import { listFrom } from '@/lib/api';
import { StaffLoginLink } from '@/components/layout/StaffLoginLink';
import { FooterLinksSkeleton } from '@/components/ui/skeleton';

export function Footer() {
  const { settings } = useSettings();
  const cats = useCategories();
  const categories = listFrom(cats.data).slice(0, 8);
  const contact = settings.contact || {};

  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <Container className="grid gap-10 py-16 md:grid-cols-4">
        <div>
          <p className="font-display text-lg font-semibold">ElectroPoint</p>
          <p className="mt-3 max-w-xs text-sm text-muted">
            Professional electronics. Specified clearly, priced in NPR, paid with eSewa, Khalti, or cash on delivery.
          </p>
        </div>
        <div>
          <p className="caption mb-3">Categories</p>
          <ul className="space-y-2 text-sm">
            {cats.isLoading ? (
              <FooterLinksSkeleton />
            ) : (
              <>
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link to={`/category/${c.slug}`} className="hover:text-accent">
                      {c.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link to="/shop" className="hover:text-accent">All products</Link>
                </li>
              </>
            )}
          </ul>
        </div>
        <div>
          <p className="caption mb-3">Support</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/contact" className="hover:text-accent">Contact</Link></li>
            <li><Link to="/faq" className="hover:text-accent">FAQ</Link></li>
            <li><Link to="/account/orders" className="hover:text-accent">Order status</Link></li>
            <li><Link to="/about" className="hover:text-accent">About</Link></li>
          </ul>
        </div>
        <div>
          <p className="caption mb-3">Legal & contact</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/terms" className="hover:text-accent">Terms</Link></li>
            <li><Link to="/privacy" className="hover:text-accent">Privacy</Link></li>
            <li><a href={`mailto:${contact.email}`} className="hover:text-accent">{contact.email}</a></li>
            <li><a href={`tel:${contact.phone}`} className="hover:text-accent">{contact.phone}</a></li>
            <li className="text-muted">{contact.address}</li>
          </ul>
        </div>
      </Container>
      <div className="border-t border-border">
        <Container className="flex flex-col gap-2 py-4 text-xs text-muted sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} ElectroPoint. All rights reserved.</p>
          <p>
            Payments: eSewa · Khalti · Amounts in NPR
            <span className="mx-2 text-border">|</span>
            <StaffLoginLink className="hover:text-foreground" />
          </p>
        </Container>
      </div>
    </footer>
  );
}
