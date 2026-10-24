import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  CheckCircle2, Plus, X, Bold, Italic,
  Underline, List, ListOrdered, Link2,
  Image as ImageIcon, FileText, Download,
  Trash2, Upload, ArrowRight, ArrowLeft, Sparkles, RefreshCw, Loader2
} from 'lucide-react';
import { ProfileData, CompanyDocument } from '../../types/profile';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { step2AboutSpecialitiesSchema } from '@/schemas/cardProfileSchema';
import { generateAiKeywords, generateAiNarrative } from '@/utils/aiGenerator';
import {
  getCustomerAbout,
  saveOrUpdateCustomerAbout,
  formatAdminAboutPayload,
  formatAboutFormData,
} from '@/lib/api/customerAboutApi';

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
  const [newNature, setNewNature] = useState('');
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [selectedDocFile, setSelectedDocFile] = useState<{ file: File; base64: string } | null>(null);
  const [hasExistingAbout, setHasExistingAbout] = useState(false);
  const [backendServices, setBackendServices] = useState<string[]>([]);

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
                url: fileUrl,
                size: d.size || '',
                uploadedAt: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : d.uploadedAt || '',
                type: d.type || (isImage ? 'IMAGE' : isPdf ? 'PDF' : 'DOC'),
              };
            });
            onChange('documents', normalizedDocs);
          }
        }
      } catch (err) {
        // Normal if profile hasn't saved about yet
      }
    };
    loadAbout();
    return () => { isMounted = false; };
  }, [adminId]);

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

  const handleSyncFromServices = () => {
    const services = profile.servicesOffered || [];
    if (services.length === 0) {
      onToast('No services found in Basic Details (Step 1) to sync.');
      return;
    }
    const merged = Array.from(new Set([...(profile.natureOfBusiness || []), ...services]));
    onChange('natureOfBusiness', merged);
    onToast(`✅ Synced ${services.length} service(s) from Basic Details into Nature of Business!`);
  };

  const handleAddNature = () => {
    if (!newNature.trim()) return;
    if (profile.natureOfBusiness.includes(newNature.trim())) {
      onToast('Nature of business already added!');
      return;
    }
    onChange('natureOfBusiness', [...profile.natureOfBusiness, newNature.trim()]);
    setNewNature('');
    onToast(`Added nature of business: "${newNature.trim()}"`);
  };

  const handleRemoveNature = (item: string) => {
    onChange('natureOfBusiness', profile.natureOfBusiness.filter(n => n !== item));
  };

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
      businessNatures: rawNatures,
      businessNature: rawNatures,
      specialities: rawSpecialities,
      removeDocumentIds: [],
      documents: profile.documents || [],
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
    <section className="bg-white border border-[#c5c6cd]/60 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs scroll-mt-28" id="sec-2">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#c5c6cd]/40 mb-3">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-xs shrink-0">
            2
          </div>
          <h2 className="text-sm sm:text-base font-bold text-[#091426] leading-tight">
            About & Specialities
          </h2>
        </div>
      </div>

      {/* Statutory & Business Profile Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-3">
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

        <div className="col-span-2 sm:col-span-1 flex flex-col justify-end">
          <label className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border border-stroke bg-[#f8f9ff] cursor-pointer hover:border-[#2563EB] transition-colors">
            <input
              type="checkbox"
              checked={profile.showCategoryInCard}
              onChange={(e) => onChange('showCategoryInCard', e.target.checked)}
              className="w-4 h-4 text-[#2563EB] rounded border-[#c5c6cd] focus:ring-[#2563EB]"
            />
            <span className="text-xs font-semibold text-[#091426]">
              Show category in digital card
            </span>
          </label>
        </div>
      </div>

      {/* Nature of Business */}
      <div className="mb-3 pt-3 border-t border-[#c5c6cd]/40">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <label className="block text-xs font-bold text-[#091426]">
            Nature of Business
          </label>

          <button
            type="button"
            onClick={handleSyncFromServices}
            className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#2563EB] border border-blue-200 text-xs font-bold hover:bg-blue-100 flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs"
            title="Sync all services from Step 1 into Nature of Business"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Services</span>
          </button>
        </div>

        {/* Available services chips from Step 1 & backend that can be quickly added if not already */}
        {(() => {
          const available = Array.from(new Set([
            ...(profile.servicesOffered || []),
            ...(profile.basicDetailsServices || []),
            ...backendServices,
          ])).filter(Boolean);

          if (available.length === 0) return null;

          return (
            <div className="mb-2 p-2 rounded-xl bg-[#f8faff] border border-blue-100 flex flex-wrap items-center gap-1.5 text-xs">
              {available.map((srv, idx) => {
                const srvText = typeof srv === 'object' ? String((srv as any).businessNature || (srv as any).name || '') : String(srv);
                const isAdded = (profile.natureOfBusiness || []).some(n => {
                  const nText = typeof n === 'object' ? String((n as any).businessNature || (n as any).name || '') : String(n);
                  return nText.toLowerCase() === srvText.toLowerCase();
                });
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (isAdded) {
                        handleRemoveNature(srvText);
                      } else {
                        onChange('natureOfBusiness', [...(profile.natureOfBusiness || []), srvText]);
                        onToast(`Added "${srvText}" to Nature of Business!`);
                      }
                    }}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
                      isAdded
                        ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]'
                        : 'bg-white text-gray-600 border border-stroke hover:border-[#2563EB]'
                    }`}
                  >
                    <span>{isAdded ? '✓' : '+'}</span>
                    <span>{srvText}</span>
                  </button>
                );
              })}
            </div>
          );
        })()}

        <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border border-stroke bg-white min-h-[42px]">
          {(profile.natureOfBusiness || []).map((nature, idx) => {
            const natureText = typeof nature === 'object' ? String((nature as any).businessNature || (nature as any).name || '') : String(nature);
            return (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-[#EFF6FF] text-[#2563EB] text-xs font-semibold flex items-center gap-1.5 border border-[#BFDBFE]"
              >
                <span>{natureText}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveNature(natureText)}
                  className="text-[#45474c] hover:text-rose-600 text-xs"
                >
                  ✕
                </button>
              </span>
            );
          })}

          <div className="flex items-center gap-1 flex-1 min-w-[150px]">
            <input
              type="text"
              value={newNature}
              onChange={(e) => setNewNature(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNature())}
              placeholder="+ Add custom nature..."
              className="border-none text-xs text-[#091426] focus:ring-0 p-1 w-full focus:outline-none"
            />
            {newNature && (
              <button
                type="button"
                onClick={handleAddNature}
                className="text-[11px] font-bold text-[#2563EB] px-2 py-0.5 rounded bg-[#EFF6FF]"
              >
                Add
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Core Specialities (Configured tags) */}
      <div className="mb-3 pt-3 border-t border-[#c5c6cd]/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <label className="text-xs font-bold text-[#091426]">
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
                className="px-2.5 py-1 rounded-full bg-blue-50 text-[#2563EB] border border-blue-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs group hover:bg-blue-100 transition-colors"
              >
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
      <div className="mb-3 pt-3 border-t border-[#c5c6cd]/40">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-[#091426]">
            About Us
          </label>
          <div className="flex items-center gap-2">
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
        </div>

        <div className="border border-stroke rounded-xl overflow-hidden bg-white focus-within:border-[#2563EB] focus-within:ring-1 focus-within:ring-[#2563EB]/25">
          {/* Editor Toolbar */}
          <div className="px-2 py-1 border-b border-stroke bg-[#f8f9ff] flex flex-wrap items-center gap-1 text-[#45474c]">
            <button
              type="button"
              onClick={() => onToast('Applied Bold')}
              className="p-1.5 rounded hover:bg-[#EFF6FF] hover:text-[#2563EB]"
              title="Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onToast('Applied Italic')}
              className="p-1.5 rounded hover:bg-[#EFF6FF] hover:text-[#2563EB]"
              title="Italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onToast('Applied Underline')}
              className="p-1.5 rounded hover:bg-[#EFF6FF] hover:text-[#2563EB]"
              title="Underline"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <div className="h-4 w-px bg-stroke mx-1" />
            <button
              type="button"
              onClick={() => onToast('Inserted Bullet List')}
              className="p-1.5 rounded hover:bg-[#EFF6FF] hover:text-[#2563EB]"
              title="Bullet list"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onToast('Inserted Numbered List')}
              className="p-1.5 rounded hover:bg-[#EFF6FF] hover:text-[#2563EB]"
              title="Numbered list"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Text Area */}
          <textarea
            rows={5}
            value={profile.aboutNarrative}
            onChange={(e) => onChange('aboutNarrative', e.target.value)}
            className="w-full p-3 text-xs sm:text-sm text-[#091426] leading-relaxed focus:outline-none resize-y"
            placeholder="Write enterprise summary narrative..."
          />
        </div>
      </div>

      {/* Upload Company Documents / Brochures */}
      <div className="pt-3 border-t border-[#c5c6cd]/40">
        <div className="flex items-center justify-between gap-2 mb-2">
          <label className="text-xs font-bold text-[#091426]">
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
                    setSelectedDocFile(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedDocFile && !newDocTitle.trim()) {
                      onToast('Please enter document title and select a file.');
                      return;
                    }
                    const title = newDocTitle.trim() || selectedDocFile?.file.name || 'Official Document';
                    const file = selectedDocFile?.file;
                    const sizeText = file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '1.5 MB';
                    const ext = file?.name?.split('.').pop()?.toUpperCase() || 'PDF';

                    const newDoc: CompanyDocument = {
                      id: `doc_${Date.now()}`,
                      name: title,
                      fileName: title,
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
            profile.documents.map((doc) => {
              const fileName = doc.fileName || doc.name || 'Document';
              const fileUrl = doc.url || '';
              const isImage = doc.type === 'IMAGE' || fileUrl.match(/\.(jpeg|jpg|png|webp)/i);
              const isPdf = doc.type === 'PDF' || fileUrl.toLowerCase().endsWith('.pdf') || fileName.toLowerCase().endsWith('.pdf');
              const badgeLabel = isPdf ? 'PDF' : isImage ? 'IMG' : 'DOC';

              return (
                <div
                  key={doc.id}
                  className="px-2 py-1.5 rounded-lg border border-slate-200/80 bg-white hover:border-[#2563EB]/40 flex items-center justify-between transition-all group"
                  title={`${doc.size || (isImage ? 'Image Document' : 'Official Document')} • ${doc.uploadedAt || 'Attached'}`}
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
                    <p className="text-xs font-bold text-[#091426] truncate group-hover:text-[#2563EB] transition-colors">
                      {fileName}
                    </p>
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

      {/* Step Navigation Buttons */}
      <div className="mt-4 pt-3 border-t border-[#c5c6cd]/40 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onPrev}
          className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-stroke bg-white text-[#091426] text-xs font-semibold hover:bg-[#f8f9ff] flex items-center gap-1.5 sm:gap-2 transition-all shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Previous: Basic Details</span>
          <span className="sm:hidden">Previous</span>
        </button>

        <GenericButton
          type="button"
          onClick={handleSaveAndNext}
          disabled={isSubmitting}
          className="!px-6 !py-2.5 !text-xs !font-bold flex items-center gap-2 shadow-md shadow-[#2563EB]/25 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Syncing to server...</span>
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
