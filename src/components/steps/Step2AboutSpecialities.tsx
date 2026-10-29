import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  CheckCircle2, Plus, X, Bold, Italic,
  Underline, List, ListOrdered, Link2,
  Image as ImageIcon, FileText, Download,
  Trash2, Upload, ArrowRight, ArrowLeft, Sparkles, Loader2, Check, Type, GripVertical
} from 'lucide-react';
import { ProfileData, CompanyDocument, AboutBlockKey, DEFAULT_ABOUT_BLOCK_ORDER } from '../../types/profile';
import { saveSettingsOrder } from '@/lib/api/customerSettingsApi';
import { reorderList, reorderErrorText } from '@/lib/api/reorderApi';
import { useDragReorder, moveItem } from '@/hooks/useDragReorder';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { RichTextEditor } from '@/components/Forms/RichTextEditor';

import { step2AboutSpecialitiesSchema } from '@/schemas/cardProfileSchema';
import { generateAiKeywords, generateAiNarrative, generateAiServices } from '@/utils/aiGenerator';
import { getCustomerCategories, CustomerCategory, rememberCategoryName } from '@/lib/api/customerCategoriesApi';
import {
  getCustomerInfo,
  updateCustomerInfo,
  formatAdminInfoPayload,
  isUuidOrId,
} from '@/lib/api/customerInfoApi';
import {
  getCustomerAbout,
  saveOrUpdateCustomerAbout,
  formatAdminAboutPayload,
  formatAboutFormData,
} from '@/lib/api/customerAboutApi';

const cleanServiceString = (s: any): string => {
  if (!s) return '';
  return String(s)
    .replace(/[\[\]]/g, '')
    .replace(/^['"`\s]+|['"`\s]+$/g, '')
    .trim();
};

interface Step2Props {
  profile: ProfileData;
  onChange: <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => void;
  onNext: () => void;
  onPrev: () => void;
  onToast: (msg: string) => void;
  adminId?: string;
}

export const Step2AboutSpecialities: React.FC<Step2Props> = ({
  profile,
  onChange,
  onNext,
  onPrev,
  onToast,
  adminId,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSpeciality, setNewSpeciality] = useState('');
  const [newService, setNewService] = useState('');
  const [availableCategories, setAvailableCategories] = useState<CustomerCategory[]>([]);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocDescription, setNewDocDescription] = useState('');
  const [selectedDocFile, setSelectedDocFile] = useState<{ file: File; base64: string } | null>(null);
  const [hasExistingAbout, setHasExistingAbout] = useState(false);
  const [backendServices, setBackendServices] = useState<string[]>([]);
  // Chip currently being dragged for reordering
  const [dragItem, setDragItem] = useState<{ list: 'servicesOffered' | 'specialities'; index: number } | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Auto-fetch existing about info on mount (GET customers/about or superAdmin/admin/:adminId/about)
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
            const ids: string[] = [];
            const names: string[] = [];
            const newAvail: CustomerCategory[] = [];

            aboutCatsSource.forEach((item: any) => {
              if (!item) return;
              if (typeof item === 'object') {
                const id = String(item.id || item._id || item.categoryId || item.adminCategoryId || '').trim();
                const name = String(item.name || item.CategoryName || item.categoryName || item.adminCategory?.name || item.title || '').trim();
                if (id && !ids.includes(id)) ids.push(id);
                if (name && !names.includes(name)) names.push(name);
                else if (id && !names.includes(id)) names.push(id);
                if (id && name) {
                  newAvail.push({ id, name });
                  rememberCategoryName(id, name);
                }
              } else if (typeof item === 'string') {
                const str = item.trim();
                if (str) {
                  if (!ids.includes(str)) ids.push(str);
                  if (!names.includes(str)) names.push(str);
                }
              }
            });

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

            if (newAvail.length > 0) {
              setAvailableCategories((prev) => {
                const merged = [...prev];
                newAvail.forEach((cat) => {
                  if (!merged.some((m) => m.id === cat.id || m.name.toLowerCase() === cat.name.toLowerCase())) {
                    merged.push(cat);
                  }
                });
                return merged;
              });
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
          setAvailableCategories((prev) => {
            const merged = [...prev];
            cats.forEach((cat) => {
              if (!merged.some((m) => m.id === cat.id || m.name.toLowerCase() === cat.name.toLowerCase())) {
                merged.push(cat);
              }
            });
            return merged;
          });
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

        const ids: string[] = [];
        const names: string[] = [];
        const newCatsList: CustomerCategory[] = [];

        const addCategoryItem = (item: any) => {
          if (!item) return;
          if (typeof item === 'object') {
            const id = String(item.id || item._id || item.categoryId || item.adminCategoryId || '').trim();
            const name = String(item.name || item.CategoryName || item.categoryName || item.adminCategory?.name || item.title || '').trim();
            if (id && !ids.includes(id)) ids.push(id);
            if (name && !names.includes(name)) names.push(name);
            else if (id && !names.includes(id)) names.push(id);
            if (id && name) {
              newCatsList.push({ id, name });
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

        (Array.isArray(data.categories) ? data.categories : []).forEach(addCategoryItem);
        (Array.isArray(data.categoryIds) ? data.categoryIds : []).forEach(addCategoryItem);
        (Array.isArray(data.adminCategories) ? data.adminCategories : []).forEach(addCategoryItem);
        (Array.isArray(data.adminCategoryIds) ? data.adminCategoryIds : []).forEach(addCategoryItem);

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
        if (newCatsList.length > 0) {
          setAvailableCategories((prev) => {
            const merged = [...prev];
            newCatsList.forEach((c) => {
              if (!merged.some((m) => m.id === c.id || m.name.toLowerCase() === c.name.toLowerCase())) {
                merged.push(c);
              }
            });
            return merged;
          });
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

  // Category chips: show readable names from categories [{ id, name }], categoryIds, or categoryNames
  const isUuid = (val: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

  const rawCandidateLabels = [
    ...(profile.categories || []),
    ...(profile.categoryNames || []),
    ...(profile.categoryIds || []),
  ];

  const hasReadableNames = rawCandidateLabels.some(
    (item: any) =>
      typeof item === 'object' || (typeof item === 'string' && !isUuid(item.trim()))
  );

  const selectedCategoryLabels = Array.from(
    new Set(
      rawCandidateLabels
        .map((item: any) => {
          if (!item) return '';
          if (typeof item === 'object') {
            return String(item.name || item.CategoryName || item.categoryName || item.title || '').trim();
          }
          const str = String(item).trim();
          if (!str) return '';
          const matched = availableCategories.find(
            (a) => a.id === str || a.name.toLowerCase() === str.toLowerCase()
          );
          if (matched?.name) return matched.name;
          if (hasReadableNames && isUuid(str)) return '';
          return str;
        })
        .filter(Boolean)
    )
  );

  const setServices = (list: string[]) => {
    onChange('servicesOffered', list);
    onChange('natureOfBusiness', list);
    onChange('businessNatures', list);
  };

  const toSpecialityText = (item: any) =>
    typeof item === 'object' ? String(item.specialities || item.name || item.title || '') : String(item);

  // Selecting a category auto-adds its services and matching keywords (manual entries are kept)
  const handleAddCategory = (catToAdd?: string, catIdToAdd?: string) => {
    const name = (catToAdd || '').trim();
    if (!name) return;

    const matched = availableCategories.find(
      (c) => c.name.toLowerCase() === name.toLowerCase() || c.id === name || (catIdToAdd && c.id === catIdToAdd)
    );
    const resolvedId = catIdToAdd || matched?.id || name;
    const resolvedName = matched?.name || name;

    const currentCats = profile.categories || [];
    if (!currentCats.some((c) => c.toLowerCase() === resolvedName.toLowerCase())) {
      onChange('categories', [...currentCats, resolvedName]);
    }

    const currentCatIds = profile.categoryIds || [];
    if (!currentCatIds.includes(resolvedId)) {
      const updatedIds = [...currentCatIds, resolvedId];
      onChange('categoryIds', updatedIds);
      onChange('adminCategoryIds', updatedIds);
      onChange('categoryId', updatedIds[0]);
    }

    const currentNames = profile.categoryNames || [];
    if (!currentNames.includes(resolvedName)) {
      onChange('categoryNames', [...currentNames, resolvedName]);
    }
    const allSelectedCats = Array.from(new Set([...currentNames, resolvedName]));
    const currentServices = (profile.servicesOffered || []).map(cleanServiceString).filter(Boolean);
    const newServices = generateAiServices(allSelectedCats, profile.businessName, [])
      .map(cleanServiceString)
      .filter((srv) => srv && !currentServices.some((c) => c.toLowerCase() === srv.toLowerCase()));

    const combinedServices = [...currentServices, ...newServices];
    if (newServices.length > 0) {
      setServices(combinedServices);
    }

    // Automatically generate & append keywords matching all selected categories and services
    const currentSpecs = (profile.specialities || []).map(toSpecialityText).filter(Boolean);
    const generatedKeywords = generateAiKeywords(
      profile.businessName,
      combinedServices.length > 0 ? combinedServices : allSelectedCats,
      currentSpecs
    );
    if (generatedKeywords.length > 0) {
      const mergedKeywords = Array.from(new Set([...currentSpecs, ...generatedKeywords])).slice(0, 15);
      onChange('specialities', mergedKeywords);
    }

    if (newServices.length > 0) {
      onToast(`Added category: ${resolvedName} (+${newServices.length} services & keywords auto-generated)`);
    } else {
      onToast(`Added category: ${resolvedName} (keywords updated)`);
    }
  };

  const handleRemoveCategory = (cat: string) => {
    const matched = availableCategories.find((c) => c.name.toLowerCase() === cat.toLowerCase() || c.id === cat);
    const namesToRemove = [cat, matched?.name, matched?.id].filter(Boolean) as string[];

    onChange('categories', (profile.categories || []).filter((c) => !namesToRemove.includes(c)));

    const updatedIds = (profile.categoryIds || []).filter((id) => !namesToRemove.includes(id));
    onChange('categoryIds', updatedIds);
    onChange('adminCategoryIds', updatedIds);
    onChange('categoryId', updatedIds[0] || '');

    const updatedNames = (profile.categoryNames || []).filter((n) => !namesToRemove.includes(n));
    onChange('categoryNames', updatedNames);
    if (profile.categoryName && namesToRemove.includes(profile.categoryName)) {
      onChange('categoryName', updatedNames[0] || '');
    }
  };

  const activeCategories = selectedCategoryLabels.length > 0
    ? selectedCategoryLabels
    : profile.category
      ? [profile.category]
      : [];

  const suggestedServices = generateAiServices(
    activeCategories,
    profile.businessName,
    profile.natureOfBusiness || []
  ).filter((srv) => !(profile.servicesOffered || []).includes(srv));

  const handleAutoGenerateServices = () => {
    const generated = generateAiServices(activeCategories, profile.businessName, [])
      .map(cleanServiceString)
      .filter(Boolean);

    if (generated.length === 0) {
      onToast('Please select a business category or enter your business name first.');
      return;
    }
    setServices(generated);

    // Also automatically generate keywords matching the selected categories & services
    const currentSpecs = (profile.specialities || []).map(toSpecialityText).filter(Boolean);
    const generatedKeywords = generateAiKeywords(profile.businessName, generated, currentSpecs);
    onChange('specialities', generatedKeywords);

    onToast(`Auto-generated ${generated.length} key services & ${generatedKeywords.length} keywords for ${activeCategories.join(', ')}!`);
  };

  const handleAddSuggestedService = (srvName: string) => {
    const cleaned = cleanServiceString(srvName);
    if (!cleaned) return;
    const current = (profile.servicesOffered || []).map(cleanServiceString);
    if (current.some((c) => c.toLowerCase() === cleaned.toLowerCase())) return;
    setServices([...current, cleaned]);
    onToast(`Added service: ${cleaned}`);
  };

  const handleAddAllSuggestedServices = () => {
    if (suggestedServices.length === 0) return;
    const current = (profile.servicesOffered || []).map(cleanServiceString);
    const cleanedSuggested = suggestedServices.map(cleanServiceString).filter(Boolean);
    setServices(Array.from(new Set([...current, ...cleanedSuggested])));
    onToast(`Added all ${suggestedServices.length} suggested services!`);
  };

  const handleAddService = () => {
    const name = cleanServiceString(newService);
    if (!name) return;
    const current = (profile.servicesOffered || []).map(cleanServiceString);
    if (current.some((c) => c.toLowerCase() === name.toLowerCase())) {
      onToast(`"${name}" service is already listed.`);
      return;
    }
    setServices([...current, name]);
    setNewService('');
    onToast(`Added service: ${name}`);
  };

  const handleRemoveService = (service: string) => {
    const cleaned = cleanServiceString(service);
    const updated = (profile.servicesOffered || [])
      .map(cleanServiceString)
      .filter((c) => c && c.toLowerCase() !== cleaned.toLowerCase());
    setServices(updated);

    // Also remove any specialities that reference the removed service
    if (Array.isArray(profile.specialities) && profile.specialities.length > 0) {
      onChange(
        'specialities',
        profile.specialities.filter((spec: any) => !toSpecialityText(spec).toLowerCase().includes(cleaned.toLowerCase()))
      );
    }
    onToast(`Removed service: ${cleaned}`);
  };

  // Auto-sync services from Step 1 so removed services are never kept in Step 2
  useEffect(() => {
    if (Array.isArray(profile.servicesOffered) && profile.servicesOffered.length > 0) {
      const cleanActive = profile.servicesOffered
        .map((s: any) => typeof s === 'object' ? String((s as any).businessNature || (s as any).name || '') : String(s))
        .map(s => s.trim())
        .filter(Boolean);
      const currentNatures = (profile.natureOfBusiness || []).map(String);
      const isMismatch = currentNatures.some(n => !cleanActive.some(a => a.toLowerCase() === n.toLowerCase()));
      if (isMismatch || currentNatures.length === 0) {
        onChange('natureOfBusiness', cleanActive);
      }
    }
  }, [profile.servicesOffered]);

  // Active services list strictly respecting Step 1 user selections
  const activeServicesList = (profile.servicesOffered && profile.servicesOffered.length > 0)
    ? profile.servicesOffered.map(String).map(s => s.trim()).filter(Boolean)
    : (profile.natureOfBusiness && profile.natureOfBusiness.length > 0)
    ? profile.natureOfBusiness.map(String).map(s => s.trim()).filter(Boolean)
    : backendServices;

  // Auto-generate initial specialities and narrative if empty once services / businessName are ready
  useEffect(() => {
    if (activeServicesList.length > 0 && profile.businessName) {
      if (!profile.specialities || profile.specialities.length === 0) {
        const generatedKeywords = generateAiKeywords(profile.businessName, activeServicesList);
        onChange('specialities', generatedKeywords);
      }
      if (!profile.aboutNarrative) {
        const generatedNarrative = generateAiNarrative(profile.businessName, activeServicesList, profile.contactName);
        onChange('aboutNarrative', generatedNarrative);
      }
    }
  }, [profile.servicesOffered, profile.natureOfBusiness, profile.businessName]);

  const handleAiGenerateKeywords = () => {
    const currentSpecialities = (profile.specialities || []).map((item) =>
      typeof item === 'object' ? String((item as any).specialities || (item as any).name || (item as any).title || '') : String(item)
    );
    const generated = generateAiKeywords(
      profile.businessName,
      activeServicesList,
      currentSpecialities
    );
    onChange('specialities', generated);
    onToast(`AI generated ${generated.length} SEO keywords & speciality tags! Click again to regenerate.`);
  };

  const handleAiGenerateNarrative = () => {
    const text = generateAiNarrative(
      profile.businessName,
      activeServicesList,
      profile.contactName,
      profile.aboutNarrative || ''
    );
    onChange('aboutNarrative', text);
    onToast('AI generated professional business narrative! Click Regenerate to cycle.');
  };

  const handleAddSpeciality = () => {
    const trimmed = newSpeciality.trim().slice(0, 100);
    if (!trimmed) return;
    if (newSpeciality.trim().length > 100) {
      onToast('Speciality entry must be at most 100 characters.');
    }
    if (profile.specialities.includes(trimmed)) {
      onToast('Speciality already added!');
      return;
    }
    onChange('specialities', [...profile.specialities, trimmed]);
    setNewSpeciality('');
    onToast(`Added speciality: "${trimmed}"`);
  };

  const handleRemoveSpeciality = (item: string) => {
    onChange('specialities', profile.specialities.filter(s => s !== item));
    onToast(`Removed speciality: "${item}"`);
  };

  // Drag & drop reorder for services / specialities; the new order is saved to the API immediately
  const handleChipDrop = async (list: 'servicesOffered' | 'specialities', toIndex: number) => {
    const from = dragItem;
    setDragItem(null);
    setDragOverIndex(null);
    if (!from || from.list !== list || from.index === toIndex) return;

    const items = [...((profile[list] as any[]) || [])];
    const [moved] = items.splice(from.index, 1);
    items.splice(toIndex, 0, moved);
    onChange(list, items as any);

    const nextProfile = { ...profile, [list]: items } as ProfileData;
    const toastId = toast.loading('Saving new order...');
    try {
      // Services are also part of the info API; only sync it when Step 1 data exists (same rule as Save & Next)
      if (list === 'servicesOffered' && nextProfile.businessName && nextProfile.contactName) {
        await updateCustomerInfo(formatAdminInfoPayload(nextProfile), adminId);
      }
      await saveOrUpdateCustomerAbout(
        formatAboutFormData(nextProfile),
        hasExistingAbout,
        formatAdminAboutPayload(nextProfile),
        adminId
      );
      setHasExistingAbout(true);
      toast.success('Order saved', { id: toastId });
    } catch (error: any) {
      const backendMessage = error?.response?.data?.message || error?.message || 'Failed to save order';
      toast.error(`API Error: ${backendMessage}`, { id: toastId });
    }
  };

  // ─── Reorderable About blocks (services / specialities / about text / documents) ───
  const aboutBlockOrder: AboutBlockKey[] = [
    ...(profile.aboutBlockOrder || []).filter((k) => DEFAULT_ABOUT_BLOCK_ORDER.includes(k)),
    ...DEFAULT_ABOUT_BLOCK_ORDER.filter((k) => !(profile.aboutBlockOrder || []).includes(k)),
  ];

  const { dragProps: blockDragProps, dragClass: blockDragClass } = useDragReorder(async (from, to) => {
    const order = moveItem(aboutBlockOrder, from, to);
    onChange('aboutBlockOrder', order);
    try {
      await saveSettingsOrder({ aboutBlockOrder: order }, adminId);
      toast.success('Section order saved');
    } catch (error: any) {
      toast.error(`API Error: ${error?.response?.data?.message || error?.message || 'Failed to save order'}`);
    }
  });

  // Drag & drop document order, saved with PATCH about/documents/reorder (every saved document id, new order).
  // Documents not uploaded yet (still holding a local file) are left out of the request.
  const { dragProps: docDragProps, dragClass: docDragClass } = useDragReorder(async (from, to) => {
    const previous = profile.documents || [];
    const reordered = moveItem(previous, from, to);
    const ids = reordered
      .filter((d) => !d.file && !String(d.id).startsWith('doc_'))
      .map((d) => String(d.id));
    onChange('documents', reordered);
    if (ids.length < 2) return;
    try {
      await reorderList('about/documents', ids, adminId);
      toast.success('Document order saved');
    } catch (error: any) {
      onChange('documents', previous);
      toast.error(`API Error: ${reorderErrorText(error, 'Failed to save document order')}`);
    }
  });

  // Block container: positioned with CSS order and accepts drops
  const aboutBlockDropProps = (key: AboutBlockKey) => {
    const idx = aboutBlockOrder.indexOf(key);
    const { onDragOver, onDrop } = blockDragProps(idx);
    return { style: { order: idx }, onDragOver, onDrop };
  };

  const aboutBlockClass = (key: AboutBlockKey) => blockDragClass(aboutBlockOrder.indexOf(key));

  // Only the grip starts a drag, so typing/selecting inside the block still works
  const aboutBlockHandle = (key: AboutBlockKey) => {
    const { draggable, onDragStart, onDragEnd } = blockDragProps(aboutBlockOrder.indexOf(key));
    return (
      <span
        draggable={draggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-[#2563EB] -ml-1"
        title="Drag to move this block"
      >
        <GripVertical className="w-4 h-4" />
      </span>
    );
  };

  // Shared drag props for a chip at `index` in `list`
  const chipDragProps = (list: 'servicesOffered' | 'specialities', index: number) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = 'move';
      setDragItem({ list, index });
    },
    onDragOver: (e: React.DragEvent) => {
      if (dragItem?.list !== list) return;
      e.preventDefault();
      if (dragOverIndex !== index) setDragOverIndex(index);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      handleChipDrop(list, index);
    },
    onDragEnd: () => {
      setDragItem(null);
      setDragOverIndex(null);
    },
  });

  const chipDragClass = (list: 'servicesOffered' | 'specialities', index: number) =>
    dragItem?.list === list
      ? dragItem.index === index
        ? 'opacity-40'
        : dragOverIndex === index
          ? 'ring-2 ring-[#2563EB]'
          : ''
      : '';

  const handleSaveAndNext = async () => {
    const rawNatures = (profile.natureOfBusiness && profile.natureOfBusiness.length > 0)
      ? profile.natureOfBusiness
      : Array.isArray(profile.servicesOffered)
        ? profile.servicesOffered
        : typeof profile.servicesOffered === 'string' && profile.servicesOffered
          ? [profile.servicesOffered]
          : [];

    const rawSpecialities = (Array.isArray(profile.specialities)
      ? profile.specialities
      : typeof profile.specialities === 'string' && profile.specialities
        ? [profile.specialities]
        : [])
      .map(s => String(s || '').trim().slice(0, 100))
      .filter(Boolean);

    const result = step2AboutSpecialitiesSchema.safeParse({
      establishmentYear: profile.establishmentYear || undefined,
      gstNumber: profile.gstNumber || undefined,
      isCategoryDigitalCard: profile.showCategoryInCard ?? true,
      aboutUsText: profile.aboutNarrative || '',
      aboutNarrative: profile.aboutNarrative || '',
      categoryIds: profile.categoryIds || [],
      categories: profile.categories || [],
      businessNatures: rawNatures,
      businessNature: rawNatures,
      removeDocumentIds: (profile as any).removeDocumentIds || [],
      documents: (profile.documents || []).filter(d => Boolean(d.file || (d.url && d.url.trim()))),
    });

    if (!result.success) {
      console.warn('[Step2AboutSpecialities] Validation issues:', result.error.errors);
      const firstErr = result.error.errors[0];
      const fieldPath = firstErr?.path?.join('.') ? `${firstErr.path.join('.')}: ` : '';
      const msg = `${fieldPath}${firstErr?.message || 'Please check the entered values'}`;
      toast.error(`Validation: ${msg}`, { id: 'save-step2' });
      onToast(`⚠️ Validation: ${msg}`);
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Saving About & Specialities to customers/about API...');
    onToast('Submitting to customers/about...');

    // Categories & services are part of customers/info; only sync when Step 1 data is present
    // so an empty basic profile is never written over the saved one
    if (profile.businessName && profile.contactName) {
      try {
        await updateCustomerInfo(formatAdminInfoPayload(profile), adminId);
      } catch (infoErr) {
        console.warn('[Step2AboutSpecialities] Could not sync categories/services to customer info:', infoErr);
        onToast('⚠️ Categories & services could not be saved. Please save Basic Details first.');
      }
    }

    try {
      const jsonPayload = formatAdminAboutPayload(profile);
      const formData = formatAboutFormData(profile);
      console.log('[Step2AboutSpecialities] Submitting customers/about as FormData:', jsonPayload);

      // Submit via FormData with jsonPayload fallback
      const res = await saveOrUpdateCustomerAbout(formData, hasExistingAbout, jsonPayload, adminId);
      setHasExistingAbout(true);

      const serverMsg = res?.message || 'Step 2: About & Specialities saved successfully!';
      const displayMsg = `${serverMsg} (customers/about)`;

      toast.success(displayMsg, { id: toastId, duration: 4000 });
      onToast(`✅ ${displayMsg}`);
      onNext();
    } catch (error: any) {
      console.error('[Step2AboutSpecialities] API Error on customers/about:', error);
      const backendErrors = error?.response?.data?.errors;
      let fieldError = '';
      if (Array.isArray(backendErrors) && backendErrors.length > 0) {
        fieldError = backendErrors
          .map((e: any) => `${e.field ? e.field + ': ' : ''}${e.message}`)
          .join(', ');
      }
      const backendMessage =
        fieldError ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to sync About & Specialities to server.';
      const statusCode = error?.response?.status ? ` [HTTP ${error.response.status}]` : '';

      const errText = `API Error${statusCode}: ${backendMessage}`;
      toast.error(errText, { id: toastId, duration: 5000 });
      onToast(`❌ ${errText}`);
      if (error?.response?.status !== 400) {
        onNext();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-white border border-[#E0E0E0] rounded-lg p-2.5 sm:p-3.5 shadow-xs scroll-mt-28 font-['Roboto',Helvetica,Arial,sans-serif]" id="sec-2">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#E0E0E0] mb-3">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2196F3] flex items-center justify-center font-bold text-xs shrink-0">
            2
          </div>
          <h2 className="text-sm sm:text-base font-bold text-[#091426] leading-tight">
            About & Specialities
          </h2>
        </div>
      </div>

      {/* Statutory & Business Profile Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-3">
        <div>
          <GenericInputField
            label="Establishment Year"
            type="text"
            value={profile.establishmentYear !== undefined && profile.establishmentYear !== null ? String(profile.establishmentYear) : ''}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 4);
              onChange('establishmentYear', val);
            }}
            placeholder="e.g. 2020"
          />
        </div>

        <div>
          <GenericInputField
            label="GST Number"
            value={profile.gstNumber}
            onChange={(e) => onChange('gstNumber', e.target.value.toUpperCase())}
            placeholder="27AAAAA0000A1Z5"
          />
        </div>
      </div>

      {/* ─── Business Categories (Multi-Select Dropdown) ───────────── */}
      <div className="mb-3 pt-2.5 border-t border-[#E0E0E0]">
        <label className="text-[14px] font-normal text-[#000000DE] block mb-1">
          Business Categories <span className="text-red-500 font-bold">*</span>
        </label>

        {/* Multi-select Dropdown */}
        <div className="relative">
          {/* Trigger */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setCatDropdownOpen((prev) => !prev)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setCatDropdownOpen((prev) => !prev))}
            className={`w-full cursor-pointer flex items-center justify-between gap-2 px-3 py-2 rounded border text-[14px] font-medium transition-all bg-white ${
              catDropdownOpen
                ? 'border-[#2196F3] ring-1 ring-[#2196F3]'
                : 'border-[#C4C4C4] hover:border-[#2196F3]'
            }`}
          >
            <div className="flex flex-wrap gap-1.5 flex-1 min-h-[22px] items-center">
              {selectedCategoryLabels.length === 0 ? (
                <span className="text-[#9E9E9E] text-[14px]">Select or add categories...</span>
              ) : (
                selectedCategoryLabels.map((label) => {
                  return (
                    <span
                      key={label}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2196F3] border border-[#BFDBFE] text-[12px] font-medium"
                    >
                      {label}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemoveCategory(label); }}
                        className="hover:text-red-600 ml-0.5"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  );
                })
              )}
            </div>
            <span className="text-gray-400 shrink-0 text-[11px]">{catDropdownOpen ? '▲' : '▼'}</span>
          </div>

          {/* Dropdown Panel */}
          {catDropdownOpen && (
            <div className="absolute z-30 mt-1 w-full bg-white border border-[#c5c6cd] rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-top-2 duration-150">
              {/* Search */}
              <div className="px-3 pt-3 pb-2 border-b border-stroke">
                <input
                  type="text"
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  placeholder="Search or type a new category..."
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stroke focus:outline-none focus:border-[#2563EB] bg-[#f8f9fc]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && catSearch.trim()) {
                      e.preventDefault();
                      const match = availableCategories.find((c) => c.name.toLowerCase() === catSearch.trim().toLowerCase());
                      handleAddCategory(match?.name || catSearch.trim(), match?.id);
                      setCatSearch('');
                    }
                  }}
                  autoFocus
                />
              </div>

              {/* Options */}
              <div className="max-h-52 overflow-y-auto">
                {availableCategories
                  .filter((c) =>
                    c.name.toLowerCase().includes(catSearch.toLowerCase())
                  )
                  .map((cat) => {
                    const isSelected =
                      (profile.categoryIds || []).includes(cat.id) ||
                      (profile.categories || []).some((c: any) =>
                        typeof c === 'object'
                          ? c.id === cat.id || String(c.name || '').toLowerCase() === cat.name.toLowerCase()
                          : String(c).toLowerCase() === cat.name.toLowerCase() || c === cat.id
                      ) ||
                      (profile.categoryNames || []).some((n: string) => String(n).toLowerCase() === cat.name.toLowerCase());
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            handleRemoveCategory(cat.name);
                          } else {
                            handleAddCategory(cat.name, cat.id);
                          }
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs text-left transition-colors ${
                          isSelected
                            ? 'bg-[#EFF6FF] text-[#2563EB]'
                            : 'text-[#091426] hover:bg-[#f8f9fc]'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-[#2563EB] border-[#2563EB]'
                              : 'border-[#c5c6cd] bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                        </span>
                        <span className="font-medium">{cat.name}</span>
                      </button>
                    );
                  })}

                {/* Manually add a custom category when it's not in the list */}
                {catSearch.trim() &&
                  !availableCategories.some((c) => c.name.toLowerCase() === catSearch.trim().toLowerCase()) && (
                    <button
                      type="button"
                      onClick={() => { handleAddCategory(catSearch.trim()); setCatSearch(''); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-left text-[#2563EB] font-semibold hover:bg-[#EFF6FF] border-t border-stroke"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add "{catSearch.trim()}"</span>
                    </button>
                  )}

                {availableCategories.length === 0 && !catSearch.trim() && (
                  <div className="px-4 py-4 text-xs text-gray-400 text-center">
                    Type to add a category
                  </div>
                )}
              </div>

              {/* Done button */}
              <div className="px-3 py-2 border-t border-stroke">
                <button
                  type="button"
                  onClick={() => { setCatDropdownOpen(false); setCatSearch(''); }}
                  className="w-full py-1.5 rounded-lg bg-[#2563EB] text-white text-[11px] font-bold hover:bg-[#1D4ED8] transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reorderable blocks: drag a block's grip to change its position (saved as aboutBlockOrder) */}
      <div className="flex flex-col">
      {/* ─── Key Services Offered (Multiple Entry) ───────────────── */}
      <div {...aboutBlockDropProps('services')} className={`mb-3 pt-3 border-t border-[#c5c6cd]/40 ${aboutBlockClass('services')}`}>
        <div className="flex items-center justify-between gap-1.5 mb-1.5">
          <label className="text-xs font-bold text-[#091426] flex items-center gap-1">
            {aboutBlockHandle('services')}
            Key Services Offered
          </label>

          <button
            type="button"
            onClick={handleAutoGenerateServices}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] text-[11px] font-bold border border-[#BFDBFE] transition-colors shadow-2xs active:scale-95 shrink-0"
            title="Automatically generate services matching your business category"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Auto Generate</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 p-2 sm:p-2.5 rounded-xl border border-stroke bg-[#f8f9fc] items-center min-h-[42px]">
          {(profile.servicesOffered || []).map((srv, idx) => {
            const cleanSrv = cleanServiceString(srv);
            if (!cleanSrv) return null;
            return (
              <span
                key={idx}
                {...chipDragProps('servicesOffered', idx)}
                className={`px-2.5 py-1 rounded-lg bg-white text-[#091426] text-xs font-semibold flex items-center gap-1.5 border border-stroke shadow-2xs cursor-grab active:cursor-grabbing ${chipDragClass('servicesOffered', idx)}`}
                title="Drag to reorder"
              >
                <GripVertical className="w-3 h-3 text-gray-400 -ml-1" />
                <span>{cleanSrv}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveService(cleanSrv)}
                  className="hover:text-red-600 text-[11px] p-0.5"
                  title={`Remove ${cleanSrv}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}

          <div className="flex items-center gap-1 flex-1 min-w-[150px]">
            <input
              type="text"
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddService())}
              placeholder="+ Type service & Enter (e.g. Corporate Consulting)..."
              className="w-full text-xs bg-transparent border-none text-[#091426] focus:outline-none p-1 placeholder:text-gray-400"
            />
            {newService && (
              <button
                type="button"
                onClick={handleAddService}
                className="px-2.5 py-1 rounded-lg bg-[#2563EB] text-white text-[11px] font-bold shrink-0 shadow-2xs"
              >
                Add
              </button>
            )}
          </div>
        </div>

        {/* Smart Suggestions based on Business Category / Services */}
        {suggestedServices.length > 0 && (
          <div className="mt-2 p-2 sm:p-2.5 rounded-xl bg-[#EFF6FF]/70 border border-[#BFDBFE] text-xs animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-blue-200/50">
              <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wide flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#2563EB]" />
                Suggested Services:
              </span>
              <button
                type="button"
                onClick={handleAddAllSuggestedServices}
                className="text-[10px] font-bold text-[#2563EB] hover:underline px-1 py-0.5"
              >
                + Add All
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {suggestedServices.slice(0, 6).map((srv, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddSuggestedService(srv)}
                  className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-white hover:bg-[#EFF6FF] text-[#091426] hover:text-[#2563EB] border border-stroke hover:border-[#2563EB] transition-all flex items-center gap-1 shadow-2xs"
                  title={`Add ${srv}`}
                >
                  <Plus className="w-2.5 h-2.5 text-[#2563EB]" />
                  <span className="truncate max-w-[200px]">{srv}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Core Specialities (Configured tags) */}
      <div {...aboutBlockDropProps('specialities')} className={`mb-3 pt-3 border-t border-[#c5c6cd]/40 ${aboutBlockClass('specialities')}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <label className="text-xs font-bold text-[#091426] flex items-center gap-1">
              {aboutBlockHandle('specialities')}
              Core Specialities
            </label>
            <button
              type="button"
              onClick={handleAiGenerateKeywords}
              className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#2563EB] border border-blue-200 text-xs font-bold hover:bg-blue-100 flex items-center gap-1.5 transition-colors shadow-2xs shrink-0"
              title={profile.specialities?.length ? "Regenerate new keyword specialities using AI" : "Automatically craft keywords from registered services"}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{profile.specialities?.length ? 'Regenerate' : 'AI Generate'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              maxLength={100}
              value={newSpeciality}
              onChange={(e) => setNewSpeciality(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSpeciality())}
              placeholder="New speciality..."
              className="h-8 px-2.5 text-xs rounded-xl border border-stroke bg-white focus:outline-none focus:border-[#2563EB] flex-1 min-w-0 sm:w-56"
            />
            <button
              type="button"
              onClick={handleAddSpeciality}
              className="h-8 px-3 rounded-xl bg-[#2563EB] text-white text-xs font-bold flex items-center gap-1 shrink-0 shadow-2xs hover:bg-[#1D4ED8]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-stroke bg-[#f8f9ff] min-h-[42px]">
          {(profile.specialities || []).map((item, index) => {
            const itemText = typeof item === 'object' ? String((item as any).specialities || (item as any).name || (item as any).title || '') : String(item);
            return (
              <span
                key={index}
                {...chipDragProps('specialities', index)}
                className={`px-2.5 py-1 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs group hover:bg-blue-100 transition-colors cursor-grab active:cursor-grabbing ${chipDragClass('specialities', index)}`}
                title="Drag to reorder"
              >
                <GripVertical className="w-3 h-3 text-blue-300 -ml-1" />
                <span>{itemText}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSpeciality(itemText)}
                  className="hover:text-rose-600 text-xs text-[#75777d] group-hover:text-[#2563EB]"
                  title={`Remove ${itemText}`}
                >
                  ✕
                </button>
              </span>
            );
          })}
        </div>
      </div>

      {/* About Us Narrative Rich Text Editor */}
      <div {...aboutBlockDropProps('about')} className={`mb-3 pt-3 border-t border-[#c5c6cd]/40 ${aboutBlockClass('about')}`}>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs sm:text-[13px] font-bold text-[#091426] flex items-center gap-1">
            {aboutBlockHandle('about')}
            About us text
          </label>
          <button
            type="button"
            onClick={handleAiGenerateNarrative}
            className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#2563EB] border border-blue-200 text-xs font-bold hover:bg-blue-100 flex items-center gap-1.5 transition-colors shadow-2xs"
            title={profile.aboutNarrative ? "Regenerate narrative with a different template" : "Generate narrative using AI"}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{profile.aboutNarrative ? 'Regenerate' : 'AI Write'}</span>
          </button>
        </div>

        <RichTextEditor
          label=""
          value={profile.aboutNarrative || (profile as any).aboutUsText || ''}
          onChange={(val) => {
            onChange('aboutNarrative', val);
            onChange('aboutUsText' as any, val);
          }}
          placeholder="Write company story, vision, or background here..."
          minHeight="140px"
          typography={profile.typography}
          onTypographyChange={(newTypo) => {
            onChange('typography', newTypo);
          }}
        />
      </div>

      {/* Upload Company Documents / Brochures */}
      <div {...aboutBlockDropProps('documents')} className={`mb-3 pt-3 border-t border-[#c5c6cd]/40 ${aboutBlockClass('documents')}`}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <label className="text-xs font-bold text-[#091426] flex items-center gap-1">
            {aboutBlockHandle('documents')}
            Documents & Brochures
          </label>

          <button
            type="button"
            onClick={() => setIsAddingDoc(true)}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-[#EFF6FF] border border-[#2563EB]/40 text-[#2563EB] text-xs font-bold flex items-center gap-1.5 hover:bg-[#2563EB] hover:text-white transition-all shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Document</span>
          </button>
        </div>

        {/* Add Document Upload Section Div */}
        {isAddingDoc && (
          <div className="mb-3 p-3 rounded-xl border border-[#2563EB]/30 bg-[#f8faff] animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-blue-100 mb-2.5">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#2563EB]" />
                <h4 className="text-xs font-bold text-[#091426]">Attach Document</h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddingDoc(false);
                  setNewDocTitle('');
                  setNewDocDescription('');
                  setSelectedDocFile(null);
                }}
                className="p-1 rounded-lg hover:bg-blue-100 text-slate-500 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <GenericInputField
                  label="Document Title"
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="e.g. MEA Annual Corporate Profile 2026, Product Catalogue, GST Certificate"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea
                  rows={2}
                  maxLength={300}
                  value={newDocDescription}
                  onChange={(e) => setNewDocDescription(e.target.value)}
                  placeholder="Short note about this document (optional)"
                  className="w-full px-3 py-2 rounded-xl border border-stroke bg-white text-xs text-[#091426] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/25 resize-y"
                />
              </div>

              {/* File Dropzone */}
              <div>
                <label className="w-full min-h-[72px] rounded-xl border-2 border-dashed border-[#c5c6cd] hover:border-[#2563EB] bg-white hover:bg-[#EFF6FF]/40 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all p-3 text-center group">
                  <Upload className="w-5 h-5 text-[#2563EB] group-hover:scale-110 transition-transform" />
                  {selectedDocFile ? (
                    <div className="text-center">
                      <span className="text-xs font-bold text-[#091426] block">
                        📄 {selectedDocFile.file.name}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {(selectedDocFile.file.size / (1024 * 1024)).toFixed(2)} MB • Ready to attach
                      </span>
                    </div>
                  ) : (
                    <>
                      <span className="text-xs font-semibold text-slate-700 group-hover:text-[#2563EB]">
                        Browse document (PDF, DOC, Image - max 5 MB)
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const sizeMb = file.size / (1024 * 1024);
                        if (sizeMb > 5.0) {
                          onToast(`File size is ${sizeMb.toFixed(1)} MB. Exceeds allowed limit of 5 MB.`);
                          return;
                        }
                        if (!newDocTitle) {
                          setNewDocTitle(file.name.replace(/\.[^/.]+$/, ''));
                        }
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setSelectedDocFile({
                            file,
                            base64: (event.target?.result as string) || '',
                          });
                        };
                        reader.readAsDataURL(file);
                        onToast(`Selected: ${file.name} (${sizeMb.toFixed(1)} MB)`);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingDoc(false);
                    setNewDocTitle('');
                    setNewDocDescription('');
                    setSelectedDocFile(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedDocFile?.file) {
                      onToast('Please select a document file to attach (PDF, DOC, or Image).');
                      return;
                    }
                    const title = newDocTitle.trim() || selectedDocFile.file.name || 'Official Document';
                    const file = selectedDocFile?.file;
                    const sizeText = file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '1.5 MB';
                    const ext = file?.name?.split('.').pop()?.toUpperCase() || 'PDF';

                    const newDoc: CompanyDocument = {
                      id: `doc_${Date.now()}`,
                      name: title,
                      fileName: title,
                      description: newDocDescription.trim(),
                      url: selectedDocFile?.base64 || '',
                      size: sizeText,
                      uploadedAt: 'Uploaded Just Now',
                      type: ext,
                      file: file,
                    };

                    const updated = [...(profile.documents || []), newDoc];
                    onChange('documents', updated);
                    setIsAddingDoc(false);
                    setNewDocTitle('');
                    setNewDocDescription('');
                    setSelectedDocFile(null);
                    onToast(`✅ Added document: "${title}"`);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-[#1D4ED8] flex items-center gap-1.5 shadow-sm shadow-[#2563EB]/25 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Attach Document</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* List of Attached Documents */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
          {/* Legacy single brochure if present */}
          {profile.brochureName && (
            <div
              className="px-2 py-1.5 rounded-lg border border-stroke bg-[#f8f9ff] flex items-center justify-between hover:border-slate-300 transition-all"
              title={`${profile.brochureSize || '2.4 MB'} • ${profile.brochureDate || 'Uploaded'}`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-7 h-7 rounded-md bg-red-100 text-red-700 flex items-center justify-center font-bold shrink-0 text-[9px]">
                  PDF
                </div>
                <p className="text-xs font-bold text-[#091426] truncate">
                  {profile.brochureName}
                </p>
              </div>

              <div className="flex items-center shrink-0 ml-1">
                <button
                  type="button"
                  onClick={() => onToast(`Downloading ${profile.brochureName}`)}
                  className="p-1.5 text-[#45474c] hover:text-[#2563EB] rounded-lg hover:bg-white transition-colors"
                  title="Download Document"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChange('brochureName', '');
                    onToast('Brochure removed.');
                  }}
                  className="p-1.5 text-[#45474c] hover:text-rose-600 rounded-lg hover:bg-white transition-colors"
                  title="Remove Document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Multiple uploaded documents */}
          {profile.documents && profile.documents.length > 0 && (
            profile.documents.map((doc, docIdx) => {
              const fileName = doc.fileName || doc.name || 'Document';
              const fileUrl = doc.url || '';
              const isImage = doc.type === 'IMAGE' || fileUrl.match(/\.(jpeg|jpg|png|webp)/i);
              const isPdf = doc.type === 'PDF' || fileUrl.toLowerCase().endsWith('.pdf') || fileName.toLowerCase().endsWith('.pdf');
              const badgeLabel = isPdf ? 'PDF' : isImage ? 'IMG' : 'DOC';

              return (
                <div
                  key={doc.id}
                  {...docDragProps(docIdx)}
                  className={`px-2 py-1.5 rounded-lg border border-slate-200/80 bg-white hover:border-[#2563EB]/40 flex items-center justify-between transition-all group cursor-grab active:cursor-grabbing ${docDragClass(docIdx)}`}
                  title={`Drag to reorder • ${doc.size || (isImage ? 'Image Document' : 'Official Document')} • ${doc.uploadedAt || 'Attached'}`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-[9px] shrink-0 ${
                      isPdf 
                        ? 'bg-red-50 text-red-600 border border-red-200/60' 
                        : isImage 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' 
                        : 'bg-blue-50 text-blue-600 border border-blue-200/60'
                    }`}>
                      {badgeLabel}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#091426] truncate group-hover:text-[#2563EB] transition-colors">
                        {fileName}
                      </p>
                      {doc.description && (
                        <p className="text-[10px] text-gray-500 truncate">{doc.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center shrink-0 ml-1">
                    {fileUrl && (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-slate-500 hover:text-[#2563EB] rounded-lg hover:bg-blue-50 transition-colors"
                        title="View / Download Document"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (profile.documents || []).filter(d => d.id !== doc.id);
                        onChange('documents', updated);
                        if (doc.id && !doc.id.startsWith('doc_')) {
                          const currentRemoved = (profile as any).removeDocumentIds || [];
                          onChange('removeDocumentIds' as any, [...currentRemoved, doc.id]);
                        }
                        onToast(`Removed document: "${fileName}"`);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Remove Document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {/* Empty state when no documents uploaded */}
          {(!profile.documents || profile.documents.length === 0) && !profile.brochureName && !isAddingDoc && (
            <div className="col-span-full p-3 rounded-xl border border-dashed border-slate-200 text-center bg-slate-50/50">
              <FileText className="w-6 h-6 text-slate-300 mx-auto mb-1" />
              <p className="text-xs text-slate-600 font-semibold">No documents uploaded yet</p>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Step Navigation Buttons */}
      <div className="mt-4 pt-3 border-t border-[#E0E0E0] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onPrev}
          className="px-4 py-2 rounded border border-[#C4C4C4] bg-white text-[#000000DE] text-[14px] font-medium hover:bg-gray-50 flex items-center gap-1.5 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous: Basic Details</span>
          <span className="sm:hidden">Previous</span>
        </button>

        <GenericButton
          type="button"
          onClick={handleSaveAndNext}
          disabled={isSubmitting}
          className="!bg-[#2196F3] hover:!bg-[#1E88E5] !px-6 !py-2 !text-[14px] font-medium text-white shadow-none flex items-center gap-2 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <span>Save & Next</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </GenericButton>
      </div>
    </section>
  );
};

