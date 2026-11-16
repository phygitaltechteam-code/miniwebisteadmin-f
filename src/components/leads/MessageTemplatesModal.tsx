import React, {useEffect, useState} from 'react';
import {Loader2, X} from 'lucide-react';
import {
  useCardLinks,
  useLeadTemplates,
  useSaveLeadTemplates,
} from '@/lib/react-query/leads';
import {fillTemplate} from '@/lib/leads/templates';
import type {LeadTemplates} from '@/types/lead';

const SAMPLE = {
  name: 'Dr. Asha Patel',
  company: 'Nimbus Pvt Ltd',
  event: 'Pune Expo',
};

/** Shown in the preview until the card has a saved link. */
const SAMPLE_LINKS = {
  cardLink: 'https://digiwebcard.in/your-card',
  reviewLink: 'https://digiwebcard.in/your-card?review=1',
};

/** Edits the WhatsApp/email follow-up templates shared by the web panel and the app. */
export const MessageTemplatesModal: React.FC<{
  adminId?: string;
  myName: string;
  onClose: () => void;
}> = ({adminId, myName, onClose}) => {
  const {data, isLoading} = useLeadTemplates(adminId);
  const {data: cardLinks} = useCardLinks(adminId);
  const previewLinks = cardLinks?.cardLink ? cardLinks : SAMPLE_LINKS;
  const save = useSaveLeadTemplates(adminId);
  const [form, setForm] = useState<LeadTemplates>({
    whatsapp: '',
    emailSubject: '',
    emailBody: '',
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !save.isPending) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save.isPending, onClose]);

  const set =
    (key: keyof LeadTemplates) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({...f, [key]: e.target.value}));

  const submit = (values: LeadTemplates) =>
    save.mutate(values, {onSuccess: onClose});

  const box =
    'w-full rounded border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#212121] focus:outline-none focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3]';
  const label = 'block text-[12px] font-semibold text-[#424242] mb-1';

  return (
    <div
      className="fixed inset-0 z-[900] flex items-center justify-center bg-black/50 p-4 font-['Roboto',Helvetica,Arial,sans-serif]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !save.isPending) onClose();
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(form);
        }}
        className="flex max-h-[92vh] w-full max-w-[560px] flex-col gap-4 overflow-y-auto rounded-lg bg-white p-5 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[19px] font-bold text-[#212121]">
            Message templates
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#9CA3AF] hover:text-[#374151]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="-mt-2 text-[12.5px] text-[#4B5563]">
          Used by the WhatsApp and Email buttons here and in the mobile app.
          Placeholders:{' '}
          <code className="text-[11.5px]">
            {
              '{first_name} {name} {company} {event} {at_event} {my_name} {card_link} {review_link}'
            }
          </code>
        </p>
        <p className="-mt-2 text-[12px] text-[#6B7280]">
          <code className="text-[11.5px]">{'{card_link}'}</code> is your digital
          card
          {cardLinks?.cardLink ? (
            <>
              {' '}
              (
              <a
                href={cardLinks.cardLink}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-[#1565C0] hover:underline"
              >
                {cardLinks.cardLink}
              </a>
              )
            </>
          ) : null}
          , and <code className="text-[11.5px]">{'{review_link}'}</code> opens
          it at the reviews so customers can rate you.
        </p>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-[#6B7280]">
            <Loader2 className="mr-1.5 inline h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <>
            <div>
              <label htmlFor="tpl-wa" className={label}>
                WhatsApp message
              </label>
              <textarea
                id="tpl-wa"
                rows={3}
                maxLength={2000}
                value={form.whatsapp}
                onChange={set('whatsapp')}
                className={box}
              />
              {form.whatsapp.trim() && (
                <p className="mt-1 whitespace-pre-line text-[11.5px] text-[#6B7280]">
                  Preview:{' '}
                  {fillTemplate(
                    form.whatsapp,
                    SAMPLE,
                    myName || 'You',
                    previewLinks,
                  )}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="tpl-subject" className={label}>
                Email subject
              </label>
              <input
                id="tpl-subject"
                maxLength={2000}
                value={form.emailSubject}
                onChange={set('emailSubject')}
                className={box}
              />
            </div>
            <div>
              <label htmlFor="tpl-body" className={label}>
                Email body
              </label>
              <textarea
                id="tpl-body"
                rows={6}
                maxLength={2000}
                value={form.emailBody}
                onChange={set('emailBody')}
                className={box}
              />
            </div>
          </>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <button
            type="button"
            disabled={save.isPending || isLoading}
            onClick={() =>
              submit({whatsapp: '', emailSubject: '', emailBody: ''})
            }
            className="text-[13px] text-[#4B5563] hover:text-[#2196F3] disabled:opacity-50"
          >
            Reset all to default
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={save.isPending}
              className="rounded-lg border border-[#E0E0E0] px-5 py-2.5 text-[14px] font-medium text-[#424242] hover:bg-[#F5F5F5] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={save.isPending || isLoading}
              className="flex items-center gap-1.5 rounded-lg bg-[#2196F3] px-6 py-2.5 text-[14px] font-medium text-white hover:bg-[#1E88E5] disabled:opacity-70"
            >
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MessageTemplatesModal;
