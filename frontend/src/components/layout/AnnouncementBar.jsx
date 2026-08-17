import { useSettings } from '@/hooks/useCatalog';

export function AnnouncementBar() {
  const { settings } = useSettings();
  const bar = settings.announcementBar;
  if (!bar || bar.enabled === false || !bar.text) return null;
  return (
    <div className="bg-primary text-primary-fg">
      <p className="mx-auto max-w-store px-4 py-2 text-center text-xs tracking-wide sm:text-[13px]">{bar.text}</p>
    </div>
  );
}
