import { useEffect, useState } from 'react';
import { ProfileData, CompanyDocument } from '@/types/profile';
import { getCustomerCategories, CustomerCategory } from '@/lib/api/customerCategoriesApi';
import { getCustomerInfo } from '@/lib/api/customerInfoApi';
import { getCustomerAbout } from '@/lib/api/customerAboutApi';
import { cleanServiceString, mergeCategories, createCategoryCollector } from './helpers';

type OnChange = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => void;

/**
 * Loads Step 2 data when it opens: saved About (GET customers/about or superAdmin/admin/:adminId/about),
 * the category list, and categories / services stored with customer info.
 */
export const useAboutLoaders = (profile: ProfileData, onChange: OnChange, adminId?: string) => {
  const [availableCategories, setAvailableCategories] = useState<CustomerCategory[]>([]);
  const [hasExistingAbout, setHasExistingAbout] = useState(false);
  const [backendServices, setBackendServices] = useState<string[]>([]);

  // Auto-fetch existing about info on mount
  useEffect(() => {
    let isMounted = true;
    const loadAbout = async () => {
      try {
        const res = await getCustomerAbout(adminId);
        const raw = (res as any)?.data || (res as any)?.about || res;
        if (!isMounted || !raw || typeof raw !== 'object') return;

        const toCleanString = (item: any, fallbackKey: string): string => {
          if (!item) return '';
          let val = '';
          if (typeof item === 'string') val = item;
          else if (typeof item === 'object') {
            val = String(item[fallbackKey] || item.name || item.title || item.value || '');
          } else {
            val = String(item);
          }
          return val.replace(/[\[\]]/g, '').trim();
        };

        // Backend response format: { aboutUs: {...} | null, basicDetailsServices: ["..."] }
        const about = raw.aboutUs || raw.about || (raw && !raw.basicDetailsServices ? raw : null);
        const serverBasicServices: string[] = (
          Array.isArray(raw.basicDetailsServices)
            ? raw.basicDetailsServices
            : Array.isArray(raw.servicesOffered)
            ? raw.servicesOffered
            : []
        )
          .map((s: any) => toCleanString(s, 'businessNature'))
          .filter(Boolean);

        if (serverBasicServices.length > 0) {
          setBackendServices(serverBasicServices);
          onChange('basicDetailsServices', serverBasicServices);
          if (!profile.servicesOffered || profile.servicesOffered.length === 0) {
            onChange('servicesOffered', serverBasicServices);
          }
          if (!profile.natureOfBusiness || profile.natureOfBusiness.length === 0) {
            onChange('natureOfBusiness', serverBasicServices);
          }
        }

        if (about && typeof about === 'object') {
          if (about._id || about.id || about.establishmentYear || about.aboutNarrative || about.aboutUsText || (about.specialities && about.specialities.length > 0) || (about.officialDocuments && about.officialDocuments.length > 0)) {
            setHasExistingAbout(true);
          }
          if (about.establishmentYear) {
            onChange('establishmentYear', String(about.establishmentYear));
          }
          if (about.gstNumber) {
            onChange('gstNumber', String(about.gstNumber));
          }
          if (about.isCategoryDigitalCard !== undefined) {
            onChange('showCategoryInCard', Boolean(about.isCategoryDigitalCard));
          }
          if (Array.isArray(about.specialities) && about.specialities.length > 0) {
            const cleanSpecialities = about.specialities
              .map((s: any) => toCleanString(s, 'specialities'))
              .filter(Boolean);
            onChange('specialities', cleanSpecialities);
          }
          const serverNatures = about.businessNatures || about.natureOfBusiness || about.businessNature;
          if (Array.isArray(serverNatures) && serverNatures.length > 0) {
            const cleanNatures = serverNatures
              .map((n: any) => toCleanString(n, 'businessNature'))
              .filter(Boolean);
            onChange('natureOfBusiness', cleanNatures);
          }
          const narrative = about.aboutUsText || about.aboutNarrative;
          if (narrative) {
            onChange('aboutNarrative', narrative);
          }

          // ─── HYDRATE OFFICIAL DOCUMENTS FROM BACKEND ──────────────────
          const rawDocs = about.officialDocuments || about.documents;
          if (Array.isArray(rawDocs) && rawDocs.length > 0) {
            const normalizedDocs: CompanyDocument[] = rawDocs.map((d: any, idx: number) => {
              const fileUrl = d.fileUrl || d.url || '';
              const docName = d.fileName || d.name || `Document_${idx + 1}`;
              const isImage = fileUrl.match(/\.(jpeg|jpg|png|webp)/i);
              const isPdf = fileUrl.toLowerCase().endsWith('.pdf');
              return {
                id: d.id || d._id || `doc_${idx}`,
                name: docName,
                fileName: docName,
                description: d.description || '',
                url: fileUrl,
                size: d.size || '',
                uploadedAt: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : d.uploadedAt || '',
                type: d.type || (isImage ? 'IMAGE' : isPdf ? 'PDF' : 'DOC'),
              };
            });
            onChange('documents', normalizedDocs);
          }

          // ─── HYDRATE CATEGORIES FROM ABOUT US GET RESPONSE ─────────────
          const aboutCatsSource =
            (Array.isArray(about.categoryIds) && about.categoryIds.length > 0 ? about.categoryIds : null) ||
            (Array.isArray(raw.categoryIds) && raw.categoryIds.length > 0 ? raw.categoryIds : null) ||
            (Array.isArray(about.categories) && about.categories.length > 0 ? about.categories : null) ||
            (Array.isArray(raw.categories) && raw.categories.length > 0 ? raw.categories : null) ||
            (Array.isArray(about.adminCategories) && about.adminCategories.length > 0 ? about.adminCategories : null) ||
            (Array.isArray(raw.adminCategories) && raw.adminCategories.length > 0 ? raw.adminCategories : null);

          if (aboutCatsSource && aboutCatsSource.length > 0) {
            const { ids, names, pairs, add } = createCategoryCollector();
            aboutCatsSource.forEach(add);

            if (ids.length > 0) {
              onChange('categoryIds', ids);
              onChange('adminCategoryIds', ids);
              onChange('categoryId', ids[0]);
            }
            const finalNames = names.length > 0 ? names : ids;
            if (finalNames.length > 0) {
              onChange('categories', finalNames);
              onChange('categoryNames', finalNames);
              onChange('categoryName', finalNames[0]);
            }

            if (pairs.length > 0) {
              setAvailableCategories((prev) => mergeCategories(prev, pairs));
            }
          }
        }
      } catch (err) {
        // Normal if profile hasn't saved about yet
      }
    };
    loadAbout();
    return () => { isMounted = false; };
  }, [adminId]);

  // Fetch available categories (customers/categories or superAdmin/admin/:adminId/categories)
  useEffect(() => {
    let isMounted = true;
    getCustomerCategories(adminId)
      .then((cats) => {
        if (isMounted && Array.isArray(cats) && cats.length > 0) {
          setAvailableCategories((prev) => mergeCategories(prev, cats));
        }
      })
      .catch(() => {
        // silent – list stays empty, custom categories can still be added
      });
    return () => { isMounted = false; };
  }, [adminId]);

  // Categories & services are stored with customer info; hydrate them if Step 1 hasn't loaded them yet
  useEffect(() => {
    let isMounted = true;
    getCustomerInfo(adminId)
      .then((res: any) => {
        const data = res?.data || res?.customer || res?.info || res;
        if (!isMounted || !data || typeof data !== 'object') return;

        const { ids, names, pairs, add } = createCategoryCollector();
        (Array.isArray(data.categories) ? data.categories : []).forEach(add);
        (Array.isArray(data.categoryIds) ? data.categoryIds : []).forEach(add);
        (Array.isArray(data.adminCategories) ? data.adminCategories : []).forEach(add);
        (Array.isArray(data.adminCategoryIds) ? data.adminCategoryIds : []).forEach(add);

        if (ids.length > 0) {
          onChange('categoryIds', ids);
          onChange('adminCategoryIds', ids);
          onChange('categoryId', ids[0]);
        }
        const labels = names.length > 0 ? names : ids;
        if (labels.length > 0) {
          onChange('categories', labels);
          onChange('categoryNames', labels);
          onChange('categoryName', labels[0]);
        }
        if (pairs.length > 0) {
          setAvailableCategories((prev) => mergeCategories(prev, pairs));
        }
        if ((!profile.servicesOffered || profile.servicesOffered.length === 0) && data.servicesOffered) {
          const list = Array.isArray(data.servicesOffered)
            ? data.servicesOffered
            : String(data.servicesOffered).split(',');
          const cleaned = list.map(cleanServiceString).filter(Boolean);
          if (cleaned.length > 0) onChange('servicesOffered', cleaned);
        }
      })
      .catch(() => {
        // no customer info yet
      });
    return () => { isMounted = false; };
  }, [adminId]);

  return { availableCategories, hasExistingAbout, setHasExistingAbout, backendServices };
};
