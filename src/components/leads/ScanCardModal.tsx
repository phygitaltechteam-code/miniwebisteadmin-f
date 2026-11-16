import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Camera, Loader2, ScanText, Users, X} from 'lucide-react';
import toast from 'react-hot-toast';
import {getCountries, getCountryCallingCode} from 'libphonenumber-js/max';
import LeadFormModal from './LeadFormModal';
import {
  createLead,
  listLeads,
  updateLead,
  uploadLeadImages,
} from '@/lib/api/leadsApi';
import {apiErrorMessage, useLeadEvents} from '@/lib/react-query/leads';
import {LEAD_FIELDS, type Lead, type LeadInput} from '@/types/lead';
import {compressImageFile} from '@/utils/imageCompressor';
import {
  createCardOcr,
  extractCard,
  findDuplicate,
  merge,
  nationalDigits,
  type CardOcr,
  type Extraction,
} from '@/lib/ocr';

export interface ScanCardModalProps {
  adminId?: string;
  onClose: () => void;
  onSaved: (lead: Lead) => void;
}

type Step = 'pick' | 'reading' | 'review' | 'existing';

const REGION_KEY = 'leads.scanRegion';
const MAX_UPLOAD = 3 * 1024 * 1024; // backend limit per image

const loadRegion = () => {
  try {
    return localStorage.getItem(REGION_KEY) || 'IN';
  } catch {
    return 'IN';
  }
};

/** Every phone region, labelled "India (+91)". */
const regionOptions = () => {
  let names: Intl.DisplayNames | null = null;
  try {
    names = new Intl.DisplayNames(['en'], {type: 'region'});
  } catch {
    names = null;
  }
  return getCountries()
    .map((code) => ({
      code,
      label: `${names?.of(code) ?? code} (+${getCountryCallingCode(code)})`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

const summary = (l: Lead) =>
  [l.name, l.company, l.mobile || l.email].filter(Boolean).join(' · ') ||
  'Unnamed lead';

/** crypto.randomUUID needs https; the dev server is also opened over plain http on phones. */
const uuid = (): string =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
        (
          +c ^
          (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
        ).toString(16),
      );

/** Object URL for a preview, revoked when the file changes or the modal closes. */
function useObjectUrl(file: File | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) return setUrl(null);
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return url;
}

/** A photo small enough for the upload limit, or null when it can't be made to fit. */
async function forUpload(file: File): Promise<File | null> {
  const small = await compressImageFile(file, 1600, 0.82);
  return small.size <= MAX_UPLOAD ? small : null;
}

const ScanCardModal: React.FC<ScanCardModalProps> = ({
  adminId,
  onClose,
  onSaved,
}) => {
  const {data: events} = useLeadEvents(adminId);
  const regions = useMemo(regionOptions, []);

  const [step, setStep] = useState<Step>('pick');
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [region, setRegion] = useState(loadRegion);
  const [progress, setProgress] = useState({label: '', progress: 0});
  const [result, setResult] = useState<Extraction | null>(null);
  const [duplicate, setDuplicate] = useState<Lead | null>(null);
  /** Save was pressed while a possible duplicate is shown: the user has to pick Merge or Save as new. */
  const [askDuplicate, setAskDuplicate] = useState(false);
  const [keepPhoto, setKeepPhoto] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const ocrRef = useRef<CardOcr | null>(null);
  const aliveRef = useRef(true);
  // One id per scan, so retrying a failed save can't create the lead twice (POST /leads is idempotent by id).
  const leadIdRef = useRef('');
  if (!leadIdRef.current) leadIdRef.current = uuid();
  // Set by the banner's submit buttons: the form's submit (and so handleSubmit) runs synchronously after the click.
  // Cleared right after, so a click that fails the form's validation can't leak into a later plain Save.
  const choiceRef = useRef<'merge' | 'new' | null>(null);
  const choose = (choice: 'merge' | 'new') => {
    choiceRef.current = choice;
    setTimeout(() => (choiceRef.current = null), 0);
  };

  const frontUrl = useObjectUrl(front);
  const backUrl = useObjectUrl(back);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      void ocrRef.current?.terminate();
      ocrRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (step !== 'pick' && step !== 'reading') return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, onClose]);

  const changeRegion = (code: string) => {
    setRegion(code);
    try {
      localStorage.setItem(REGION_KEY, code);
    } catch {
      /* private mode: just not remembered */
    }
  };

  /** Up to 3 searches (email, mobile digits, name), then the same matching rules as the app. */
  const findExisting = async (values: LeadInput): Promise<Lead | null> => {
    const searches = [
      values.email || values.email2,
      values.mobile ? nationalDigits(values.mobile, region) : null,
      values.name && values.company ? values.name : null,
    ].filter((s): s is string => !!s && s.trim().length > 0);
    if (searches.length === 0) return null;
    try {
      const pages = await Promise.all(
        searches.map((search) => listLeads({search, limit: 50}, adminId)),
      );
      const byId = new Map(pages.flatMap((p) => p.leads).map((l) => [l.id, l]));
      return findDuplicate(
        {...values, id: leadIdRef.current},
        Array.from(byId.values()),
        region,
      );
    } catch {
      return null; // a failed check must not block saving
    }
  };

  const read = async () => {
    if (!front) return;
    setStep('reading');
    setProgress({label: 'Loading text reader', progress: 0});
    try {
      if (!ocrRef.current)
        ocrRef.current = createCardOcr(
          (p) => aliveRef.current && setProgress(p),
        );
      const lines = await ocrRef.current.read(front, back);
      if (!aliveRef.current) return;
      const extraction = extractCard(lines, region);
      if (lines.length === 0)
        toast('No text found. Fill in the details by hand.');
      else if (extraction.lead.needsReview) {
        const conf = lines
          .map((l) => l.confidence)
          .filter((c): c is number => c != null);
        if (
          conf.length &&
          conf.reduce((a, b) => a + b, 0) / conf.length < 0.6
        ) {
          toast(
            'The photo looks blurry or dark: check the fields, or retake it in better light.',
          );
        }
      }
      setResult(extraction);
      setProgress({label: 'Checking your leads', progress: 1});
      setDuplicate(await findExisting(extraction.lead));
      if (aliveRef.current) setStep('review');
    } catch (e) {
      if (!aliveRef.current) return;
      toast.error(
        e instanceof Error
          ? `Couldn't read the card: ${e.message}`
          : "Couldn't read the card.",
      );
      setStep('pick');
    }
  };

  const uploadPhotos = async (
    id: string,
    sides: {front?: File | null; back?: File | null},
  ) => {
    if (!keepPhoto || (!sides.front && !sides.back)) return;
    try {
      const [f, b] = await Promise.all([
        sides.front ? forUpload(sides.front) : null,
        sides.back ? forUpload(sides.back) : null,
      ]);
      if ((sides.front && !f) || (sides.back && !b))
        toast.error('A card photo is too large to keep (max 3 MB).');
      if (f || b)
        await uploadLeadImages(
          id,
          {front: f ?? undefined, back: b ?? undefined},
          adminId,
        );
    } catch (e) {
      toast.error(
        apiErrorMessage(
          e,
          "The lead was saved, but the card photo couldn't be uploaded.",
        ),
      );
    }
  };

  const finish = (lead: Lead, message: string) => {
    toast.success(message);
    onSaved(lead);
  };

  const saveNew = async (values: LeadInput) => {
    if (!result) return;
    const lead = await createLead(
      {
        ...values,
        id: leadIdRef.current,
        source: 'SCAN',
        extractionMethod: 'rules',
        rawText: result.lead.rawText,
        needsReview: false, // a person checked it in the form, same as the app's ReviewScreen
      },
      adminId,
    );
    await uploadPhotos(lead.id || leadIdRef.current, {front, back});
    finish(lead, 'Lead saved');
  };

  /** Like the app: fills the existing lead's gaps, keeps differing values in its notes, adds photos it lacks. */
  const mergeInto = async (existing: Lead, values: LeadInput) => {
    const merged = merge(existing, {
      ...values,
      rawText: result?.lead.rawText ?? '',
    });
    const patch: LeadInput = {rawText: merged.rawText, needsReview: false};
    for (const {key} of LEAD_FIELDS)
      if (merged[key] !== existing[key]) patch[key] = merged[key];
    const updated = await updateLead(existing.id, patch, adminId);
    await uploadPhotos(existing.id, {
      front: existing.imageFront ? null : front,
      back: existing.imageBack ? null : back,
    });
    finish(updated, 'Merged into the existing lead');
  };

  const handleSubmit = async (values: LeadInput) => {
    const choice = choiceRef.current;
    choiceRef.current = null;
    setSubmitting(true);
    try {
      if (choice === 'merge' && duplicate)
        return await mergeInto(duplicate, values);
      if (choice !== 'new') {
        // Nothing found after the scan? The values may have been corrected since, so look again.
        const match = duplicate ?? (await findExisting(values));
        if (match) {
          setDuplicate(match);
          setAskDuplicate(true);
          toast(
            'You may already have this lead: merge into it, or save as new.',
          );
          return;
        }
      }
      await saveNew(values);
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Could not save the lead'));
    } finally {
      if (aliveRef.current) setSubmitting(false);
    }
  };

  const saveExisting = async (existing: Lead, values: LeadInput) => {
    setSubmitting(true);
    try {
      finish(await updateLead(existing.id, values, adminId), 'Lead updated');
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Could not update the lead'));
    } finally {
      if (aliveRef.current) setSubmitting(false);
    }
  };

  const ocrLines = useMemo(
    () =>
      result ? result.lead.rawText.split('\n').filter((l) => l.trim()) : [],
    [result],
  );

  if (step === 'existing' && duplicate) {
    return (
      <LeadFormModal
        key={`existing-${duplicate.id}`}
        title="Existing lead"
        initial={duplicate}
        ocrLines={ocrLines}
        events={events}
        adminId={adminId}
        submitting={submitting}
        onSubmit={(values) => saveExisting(duplicate, values)}
        onClose={onClose}
        extra={
          <button
            type="button"
            onClick={() => setStep('review')}
            disabled={submitting}
            className="self-start text-[13px] font-medium text-[#1565C0] hover:underline disabled:opacity-50"
          >
            ← Back to the scanned card
          </button>
        }
      />
    );
  }

  if (step === 'review' && result) {
    const initial: Partial<LeadInput> = {};
    for (const {key} of LEAD_FIELDS) initial[key] = result.lead[key];
    const reasons = Object.fromEntries(
      Object.entries(result.reasons).filter(
        (e): e is [string, string] => !!e[1],
      ),
    );
    const bannerButton =
      'rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-50';
    return (
      <LeadFormModal
        key="scan"
        title="Scanned card"
        initial={initial}
        uncertain={result.uncertain}
        reasons={reasons}
        ocrLines={ocrLines}
        events={events}
        adminId={adminId}
        submitting={submitting}
        onSubmit={handleSubmit}
        onClose={onClose}
        extra={
          <>
            {duplicate && (
              <div
                className={`rounded-lg border p-3 text-[13px] ${
                  askDuplicate
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-amber-200 bg-amber-50/60'
                }`}
              >
                <div className="flex items-start gap-2 text-amber-900">
                  <Users className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    {askDuplicate
                      ? 'This looks like a lead you already have:'
                      : 'You may already have this lead:'}{' '}
                    <span className="font-semibold">{summary(duplicate)}</span>
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setStep('existing')}
                    className={`${bannerButton} border border-amber-300 bg-white text-amber-900 hover:bg-amber-100`}
                  >
                    Open existing
                  </button>
                  {/* Submit buttons: the form validates and hands its values to handleSubmit, which reads the choice. */}
                  <button
                    type="submit"
                    disabled={submitting}
                    onClick={() => choose('merge')}
                    className={`${bannerButton} bg-amber-500 text-white hover:bg-amber-600`}
                  >
                    Merge into it
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    onClick={() => choose('new')}
                    className={`${bannerButton} border border-amber-300 bg-white text-amber-900 hover:bg-amber-100`}
                  >
                    Save as new
                  </button>
                </div>
              </div>
            )}
            <label className="flex select-none items-center gap-2 text-[13px] text-[#424242]">
              <input
                type="checkbox"
                checked={keepPhoto}
                onChange={(e) => setKeepPhoto(e.target.checked)}
                className="h-4 w-4 accent-[#2196F3]"
              />
              Keep card photo{back ? 's' : ''} with the lead
            </label>
          </>
        }
      />
    );
  }

  const reading = step === 'reading';
  const picker = (
    label: string,
    file: File | null,
    url: string | null,
    set: (f: File | null) => void,
    required: boolean,
  ) => (
    <div className="flex flex-col gap-1.5">
      <span className="text-gray-600 text-[12px] font-medium">
        {label}{' '}
        {required ? (
          <span className="text-rose-500">*</span>
        ) : (
          <span className="text-gray-400">(optional)</span>
        )}
      </span>
      <label
        className={`relative flex aspect-[1.6] cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors ${
          file
            ? 'border-[#90CAF9] bg-white'
            : 'border-gray-300 bg-gray-50 hover:border-[#2196F3] hover:bg-[#F7FBFF]'
        } ${reading ? 'pointer-events-none opacity-60' : ''}`}
      >
        {url ? (
          <img
            src={url}
            alt={`${label} of the card`}
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="text-gray-500 flex flex-col items-center gap-1.5 text-[12px]">
            <Camera className="text-gray-400 h-6 w-6" />
            Take or choose a photo
          </span>
        )}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          disabled={reading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) set(f);
            e.target.value = ''; // picking the same file again still fires onChange
          }}
        />
      </label>
      {file && !reading && (
        <button
          type="button"
          onClick={() => set(null)}
          className="text-gray-500 hover:text-gray-800 self-start text-[12px]"
        >
          Remove
        </button>
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[900] flex items-center justify-center bg-black/50 p-3 font-['Roboto',Helvetica,Arial,sans-serif] sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !reading) onClose();
      }}
    >
      <div className="relative flex max-h-[94vh] w-full max-w-[560px] flex-col rounded-lg bg-white shadow-2xl">
        <div className="border-gray-100 flex items-center justify-between border-b px-5 pb-3 pt-5">
          <h2 className="text-[19px] font-bold text-[#212121]">
            Scan a business card
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 rounded-md p-1 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {picker('Front', front, frontUrl, setFront, true)}
            {picker('Back', back, backUrl, setBack, false)}
          </div>

          <div>
            <label
              htmlFor="scan-region"
              className="text-gray-600 mb-1 block text-[11px] font-medium"
            >
              Phone numbers without a country code are from
            </label>
            <select
              id="scan-region"
              value={region}
              disabled={reading}
              onChange={(e) => changeRegion(e.target.value)}
              className="border-gray-300 w-full rounded border bg-white px-3 py-2.5 text-sm font-medium text-[#212121] focus:border-[#2196F3] focus:outline-none focus:ring-1 focus:ring-[#2196F3]"
            >
              {regions.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {reading && (
            <div aria-live="polite">
              <div className="mb-1.5 flex justify-between text-[12px] text-[#546E7A]">
                <span>{progress.label}…</span>
                <span>{Math.round(progress.progress * 100)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#E3F2FD]">
                <div
                  className="h-full rounded-full bg-[#2196F3] transition-[width] duration-300"
                  style={{width: `${Math.round(progress.progress * 100)}%`}}
                />
              </div>
              <p className="text-gray-500 mt-1.5 text-[11px]">
                Read on this device. The first scan downloads the text reader
                (about 10 MB).
              </p>
            </div>
          )}
        </div>

        <div className="border-gray-100 flex justify-end gap-3 border-t px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#E0E0E0] px-5 py-2.5 text-[14px] font-medium text-[#424242] transition-colors hover:bg-[#F5F5F5]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={read}
            disabled={!front || reading}
            className="flex items-center gap-1.5 rounded-lg bg-[#2196F3] px-6 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#1E88E5] disabled:opacity-60"
          >
            {reading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ScanText className="h-4 w-4" />
            )}
            {reading ? 'Reading…' : 'Read card'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScanCardModal;
