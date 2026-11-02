import { CustomerCategory, rememberCategoryName } from '@/lib/api/customerCategoriesApi';

export type ChipList = 'servicesOffered' | 'specialities';

export const cleanServiceString = (s: any): string => {
  if (!s) return '';
  return String(s)
    .replace(/[\[\]]/g, '')
    .replace(/^['"`\s]+|['"`\s]+$/g, '')
    .trim();
};

/** Speciality entry (string or { specialities | name | title }) as text */
export const toSpecialityText = (item: any) =>
  typeof item === 'object' ? String(item.specialities || item.name || item.title || '') : String(item);

export const isUuid = (val: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

/** Adds categories that are not in the list yet (same id or same name, case-insensitive) */
export const mergeCategories = (prev: CustomerCategory[], incoming: CustomerCategory[]) => {
  const merged = [...prev];
  incoming.forEach((cat) => {
    if (!merged.some((m) => m.id === cat.id || m.name.toLowerCase() === cat.name.toLowerCase())) {
      merged.push(cat);
    }
  });
  return merged;
};

/**
 * Collects ids, readable names and { id, name } pairs from category items
 * (objects from the API or plain id / name strings). Pairs are remembered for later lookups.
 */
export const createCategoryCollector = () => {
  const ids: string[] = [];
  const names: string[] = [];
  const pairs: CustomerCategory[] = [];
  const add = (item: any) => {
    if (!item) return;
    if (typeof item === 'object') {
      const id = String(item.id || item._id || item.categoryId || item.adminCategoryId || '').trim();
      const name = String(item.name || item.CategoryName || item.categoryName || item.adminCategory?.name || item.title || '').trim();
      if (id && !ids.includes(id)) ids.push(id);
      if (name && !names.includes(name)) names.push(name);
      else if (id && !names.includes(id)) names.push(id);
      if (id && name) {
        pairs.push({ id, name });
        rememberCategoryName(id, name);
      }
    } else if (typeof item === 'string') {
      const str = item.trim();
      if (str) {
        if (!ids.includes(str)) ids.push(str);
        if (!names.includes(str)) names.push(str);
      }
    }
  };
  return { ids, names, pairs, add };
};
