import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Cable,
  Camera,
  Cpu,
  Gamepad2,
  HardDrive,
  Headphones,
  House,
  Laptop,
  LayoutGrid,
  Monitor,
  PcCase,
  Printer,
  Smartphone,
  Speaker,
  Tablet,
  Wifi,
  Watch,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { listFrom } from '@/lib/api';
import { PLACEHOLDER_IMAGES } from '@/lib/product';
import { MegaMenuSkeleton } from '@/components/ui/skeleton';
import { useReducedMotion } from '@/hooks/useMedia';

const ICON_RULES = [
  [/phone|mobile/, Smartphone],
  [/laptop|notebook/, Laptop],
  [/desktop|pc/, PcCase],
  [/monitor|display/, Monitor],
  [/tablet/, Tablet],
  [/wear|watch/, Watch],
  [/audio|headphone|earbud/, Headphones],
  [/speaker/, Speaker],
  [/camera/, Camera],
  [/gam/, Gamepad2],
  [/accessor/, Cable],
  [/network|wifi|router/, Wifi],
  [/storage|ssd|drive/, HardDrive],
  [/print/, Printer],
  [/smart.?home|iot/, House],
  [/cpu|component/, Cpu],
];

function catKey(cat) {
  return `${cat?.slug || ''} ${cat?.name || ''}`.toLowerCase();
}

function CategoryIcon({ cat, className }) {
  const Icon = ICON_RULES.find(([re]) => re.test(catKey(cat)))?.[1] || LayoutGrid;
  return <Icon className={className} aria-hidden />;
}

function categoryImage(cat) {
  if (cat?.image) return cat.image;
  if (cat?.banner) return cat.banner;
  const key = catKey(cat);
  if (/phone|mobile/.test(key)) return PLACEHOLDER_IMAGES.phone;
  if (/laptop/.test(key)) return PLACEHOLDER_IMAGES.laptop;
  if (/audio|headphone|ear/.test(key)) return PLACEHOLDER_IMAGES.headphones;
  if (/watch|wear/.test(key)) return PLACEHOLDER_IMAGES.watch;
  if (/camera/.test(key)) return PLACEHOLDER_IMAGES.camera;
  if (/monitor|display/.test(key)) return PLACEHOLDER_IMAGES.monitor;
  if (/tablet/.test(key)) return PLACEHOLDER_IMAGES.tablet;
  return PLACEHOLDER_IMAGES.generic;
}

function catId(cat) {
  return String(cat?._id || cat?.id || cat?.slug || '');
}

export function MegaMenu({ categories, open, onClose, isLoading = false }) {
  const tree = listFrom(categories);
  const reduced = useReducedMotion();
  const [active, setActive] = useState(catId(tree[0]));

  useEffect(() => {
    if (!tree.length) return;
    setActive((cur) => {
      const ids = new Set(tree.map(catId));
      if (cur && ids.has(String(cur))) return cur;
      return catId(tree[0]);
    });
  }, [tree]);

  const current = tree.find((c) => catId(c) === String(active)) || tree[0];
  const children = current?.children || [];
  const duration = reduced ? 0 : 0.2;

  function focusCategoryAt(index) {
    const buttons = document.querySelectorAll('#shop-megamenu [data-mega-cat]');
    const next = buttons[index];
    if (next) {
      next.focus();
      const id = next.getAttribute('data-mega-cat');
      if (id) setActive(id);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          id="shop-megamenu"
          role="region"
          aria-label="Shop categories"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -10 }}
          transition={{ duration, ease: [0.2, 0, 0, 1] }}
          className="absolute left-0 right-0 top-full z-40 px-4 pb-5 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-store overflow-hidden border border-border bg-surface-elevated shadow-md">
            {isLoading ? (
              <MegaMenuSkeleton nested />
            ) : !tree.length ? (
              <p className="px-5 py-8 text-sm text-muted">No categories yet.</p>
            ) : (
              <div className="grid grid-cols-12">
                <ul
                  className="col-span-4 max-h-[min(70vh,28rem)] overflow-y-auto border-r border-border py-3 lg:col-span-3"
                  role="list"
                >
                  {tree.map((cat, index) => {
                    const id = catId(cat);
                    const isActive = id === catId(current);
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          data-mega-cat={id}
                          className={cn(
                            'flex w-full cursor-pointer items-center gap-3 border-l-2 px-4 py-2.5 text-left text-sm transition-colors duration-200',
                            isActive
                              ? 'border-l-accent bg-muted-bg text-foreground'
                              : 'border-l-transparent text-foreground hover:bg-muted-bg',
                          )}
                          aria-current={isActive ? 'true' : undefined}
                          onMouseEnter={() => setActive(id)}
                          onFocus={() => setActive(id)}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              focusCategoryAt((index + 1) % tree.length);
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              focusCategoryAt((index - 1 + tree.length) % tree.length);
                            } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
                              e.preventDefault();
                              document.querySelector('#shop-megamenu [data-mega-panel] a')?.focus();
                            } else if (e.key === 'Home') {
                              e.preventDefault();
                              focusCategoryAt(0);
                            } else if (e.key === 'End') {
                              e.preventDefault();
                              focusCategoryAt(tree.length - 1);
                            }
                          }}
                        >
                          <CategoryIcon cat={cat} className="h-4 w-4 shrink-0 text-muted" />
                          <span className="min-w-0 flex-1 truncate">{cat.name}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <div className="col-span-8 lg:col-span-9" data-mega-panel>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={catId(current)}
                      initial={reduced ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={reduced ? undefined : { opacity: 0 }}
                      transition={{ duration: reduced ? 0 : 0.16, ease: [0.2, 0, 0, 1] }}
                      className="grid gap-0 lg:grid-cols-5"
                    >
                      <div className="p-6 lg:col-span-3">
                        <p className="caption">{current.name}</p>
                        <Link
                          to={`/category/${current.slug}`}
                          className="mt-1 inline-flex items-center gap-2 font-display text-lg font-semibold hover:text-accent"
                          onClick={onClose}
                        >
                          Shop {current.name}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                        <p className="mt-1 max-w-md text-sm text-muted">
                          {current.description || `${current.name} at ElectroPoint — authentic products, official warranty.`}
                        </p>
                        <ul className="mt-5 grid grid-cols-2 gap-2">
                          {(children.length ? children.slice(0, 8) : fallbackLinks(current)).map((child) => (
                            <li key={child._id || child.id || child.href}>
                              <Link
                                to={child.href || `/category/${child.slug}`}
                                className="flex h-full cursor-pointer flex-col border border-border px-3 py-3 transition-colors duration-200 hover:border-foreground/30 hover:bg-muted-bg"
                                onClick={onClose}
                              >
                                <span className="text-sm font-medium">{child.name || child.title}</span>
                                {child.blurb ? <span className="mt-0.5 text-xs text-muted">{child.blurb}</span> : null}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Link
                        to={`/category/${current.slug}`}
                        onClick={onClose}
                        className="group relative hidden min-h-[16rem] border-l border-border lg:col-span-2 lg:block"
                      >
                        <div className="absolute inset-0 product-stage">
                          <img
                            src={categoryImage(current)}
                            alt=""
                            className="h-full w-full object-cover transition-opacity duration-200 group-hover:opacity-90"
                          />
                        </div>
                        <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-foreground/75 px-5 py-4 text-sm font-medium text-background">
                          Shop all {current.name}
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </Link>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border px-5 py-3 text-sm">
              <Link to="/shop" className="font-medium hover:text-accent" onClick={onClose}>
                All products
              </Link>
              <Link to="/shop?sort=bestseller" className="text-muted hover:text-foreground" onClick={onClose}>
                Best selling
              </Link>
              <Link to="/compare" className="text-muted hover:text-foreground" onClick={onClose}>
                Compare
              </Link>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function fallbackLinks(current) {
  return [
    { title: `All ${current.name}`, href: `/category/${current.slug}`, blurb: 'Full catalog' },
    { title: 'Best selling', href: `/category/${current.slug}?sort=bestseller`, blurb: 'From real orders' },
    { title: 'Newest', href: `/category/${current.slug}?sort=newest`, blurb: 'Latest arrivals' },
    { title: 'In stock', href: `/category/${current.slug}?inStock=1`, blurb: 'Ready to ship' },
  ];
}
