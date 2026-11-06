import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ProfileData, AboutBlockKey, DEFAULT_ABOUT_BLOCK_ORDER } from '@/types/profile';
import { saveSettingsOrder } from '@/lib/api/customerSettingsApi';
import { reorderList, reorderErrorText } from '@/lib/api/reorderApi';
import { useDragReorder, moveItem } from '@/hooks/useDragReorder';
import { step2AboutSpecialitiesSchema } from '@/schemas/cardProfileSchema';
import { generateAiKeywords, generateAiNarrative, generateAiNarrativeFromText, generateAiServices, narrativeTemplates } from '@/utils/aiGenerator';
import { htmlToText } from '@/utils/richText';
import { updateCustomerInfo, formatAdminInfoPayload } from '@/lib/api/customerInfoApi';
import { saveOrUpdateCustomerAbout, formatAdminAboutPayload, formatAboutFormData } from '@/lib/api/customerAboutApi';
import { useAboutLoaders } from './useAboutLoaders';
import { cleanServiceString, toSpecialityText, isUuid, ChipList } from './helpers';

export interface Step2Props {
  profile: ProfileData;
  onChange: <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => void;
  onNext: () => void;
  onPrev: () => void;
  onToast: (msg: string) => void;
  adminId?: string;
}

/** State, derived lists and every handler of Step 2 (About & Specialities) */
export const useStep2Model = ({ profile, onChange, onNext, onToast, adminId }: Step2Props) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSpeciality, setNewSpeciality] = useState('');
  const [newService, setNewService] = useState('');
  // Chip currently being dragged for reordering
  const [dragItem, setDragItem] = useState<{ list: ChipList; index: number } | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  // Text written by the user that About Regenerate works from, and the last About text we generated
  const narrativeSeedRef = useRef('');
  const lastGeneratedRef = useRef('');

  const { availableCategories, hasExistingAbout, setHasExistingAbout, backendServices } = useAboutLoaders(profile, onChange, adminId);

  // ─── Category chips: readable names from categories [{ id, name }], categoryIds, or categoryNames ───
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

  // ─── Services (Nature of business) ───
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
        lastGeneratedRef.current = generatedNarrative;
        onChange('aboutNarrative', generatedNarrative);
      }
    }
  }, [profile.servicesOffered, profile.natureOfBusiness, profile.businessName]);

  // ─── Specialities + About text (AI) ───
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
    const current = profile.aboutNarrative || '';
    const currentText = htmlToText(current);
    const isGenerated =
      currentText === htmlToText(lastGeneratedRef.current) ||
      narrativeTemplates(profile.businessName, activeServicesList).some((t) => htmlToText(t) === currentText);

    // The user typed or edited the text: it becomes the source for regenerating
    if (currentText && !isGenerated) narrativeSeedRef.current = current;
    // Text cleared: back to the stock templates
    if (!currentText) narrativeSeedRef.current = '';

    const seed = narrativeSeedRef.current;
    const text = seed
      ? generateAiNarrativeFromText(profile.businessName, activeServicesList, seed, current)
      : generateAiNarrative(profile.businessName, activeServicesList, profile.contactName, current);
    lastGeneratedRef.current = text;
    onChange('aboutNarrative', text);
    onToast(seed
      ? 'Regenerated about text from your content! Click Regenerate for another version.'
      : 'AI generated professional business narrative! Click Regenerate to cycle.');
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

  // ─── Drag & drop reorder for services / specialities; the new order is saved to the API immediately ───
  const handleChipDrop = async (list: ChipList, toIndex: number) => {
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

  // Shared drag props for a chip at `index` in `list`
  const chipDragProps = (list: ChipList, index: number) => ({
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

  const chipDragClass = (list: ChipList, index: number) =>
    dragItem?.list === list
      ? dragItem.index === index
        ? 'opacity-40'
        : dragOverIndex === index
          ? 'ring-2 ring-[#2563EB]'
          : ''
      : '';

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

  /** Props for the grip that starts a block drag (only the grip, so typing inside the block still works) */
  const aboutBlockHandleProps = (key: AboutBlockKey) => {
    const { draggable, onDragStart, onDragEnd } = blockDragProps(aboutBlockOrder.indexOf(key));
    return { draggable, onDragStart, onDragEnd };
  };

  // ─── Save & Next ───
  const handleSaveAndNext = async () => {
    const rawNatures = (profile.natureOfBusiness && profile.natureOfBusiness.length > 0)
      ? profile.natureOfBusiness
      : Array.isArray(profile.servicesOffered)
        ? profile.servicesOffered
        : typeof profile.servicesOffered === 'string' && profile.servicesOffered
          ? [profile.servicesOffered]
          : [];

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

  return {
    profile, onChange, onToast, isSubmitting,
    availableCategories, selectedCategoryLabels, handleAddCategory, handleRemoveCategory,
    newService, setNewService, suggestedServices, handleAutoGenerateServices, handleAddSuggestedService,
    handleAddAllSuggestedServices, handleAddService, handleRemoveService,
    newSpeciality, setNewSpeciality, handleAiGenerateKeywords, handleAiGenerateNarrative, handleAddSpeciality, handleRemoveSpeciality,
    chipDragProps, chipDragClass, aboutBlockDropProps, aboutBlockClass, aboutBlockHandleProps, docDragProps, docDragClass,
    handleSaveAndNext,
  };
};

export type Step2Model = ReturnType<typeof useStep2Model>;
