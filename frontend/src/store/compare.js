import { create } from 'zustand';
import { getCompareIds, setCompareIds } from '@/lib/storage';

export const useCompareStore = create((set, get) => ({
  ids: typeof window === 'undefined' ? [] : getCompareIds(),
  add: (id) => {
    const next = setCompareIds([...get().ids, String(id)]);
    set({ ids: next });
  },
  remove: (id) => {
    const next = setCompareIds(get().ids.filter((x) => x !== String(id)));
    set({ ids: next });
  },
  toggle: (id) => {
    const sid = String(id);
    if (get().ids.includes(sid)) get().remove(sid);
    else get().add(sid);
  },
  clear: () => {
    setCompareIds([]);
    set({ ids: [] });
  },
}));
