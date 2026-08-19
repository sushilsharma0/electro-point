import { Seo } from '@/components/Seo';
import { useSettings } from '@/hooks/useCatalog';

export function MaintenanceModal() {
  const { settings } = useSettings();
  if (!settings.maintenanceMode) return null;

  const phone = settings.contact?.phone;
  const email = settings.contact?.email;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background p-4">
      <Seo title="Maintenance" noindex />
      <div className="w-full max-w-md border border-border bg-surface p-6 text-center">
        <p className="caption">Store closed</p>
        <h1 className="mt-2 font-display text-lg font-semibold">Maintenance is under way</h1>
        <p className="mt-2 text-sm text-muted">
          The store is temporarily closed while we update the catalog. Please check back shortly.
        </p>
        {phone || email ? (
          <p className="mt-4 text-sm text-muted">
            {phone ? (
              <a href={`tel:${phone}`} className="hover:text-accent">
                {phone}
              </a>
            ) : null}
            {phone && email ? ' · ' : null}
            {email ? (
              <a href={`mailto:${email}`} className="hover:text-accent">
                {email}
              </a>
            ) : null}
          </p>
        ) : null}
      </div>
    </div>
  );
}
