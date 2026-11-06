import React from 'react';
import { Share2, Copy, Check, Download } from 'lucide-react';
import { SectionProps } from '../useTemplateModel';
import { SectionTitle } from '../SectionTitle';
import { copyCardLink } from '../helpers';

const qrSrc = (cardUrl: string, size: number) => `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(cardUrl)}`;
const whatsappShareHref = (businessName: string, cardUrl: string) => `https://wa.me/?text=${encodeURIComponent(`${businessName} ${cardUrl}`.trim())}`;

/** Save the profile QR as a PNG; opens it in a new tab if the image can't be fetched */
const downloadQr = async (cardUrl: string, businessName: string) => {
  const src = qrSrc(cardUrl, 600);
  try {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const objectUrl = URL.createObjectURL(await res.blob());
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = `${businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'profile'}-qr.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(src, '_blank', 'noopener,noreferrer');
  }
};

/** Desktop: Share card in the same row as the Review / Enquiry forms */
export const ShareInRow: React.FC<SectionProps> = ({ t }) => {
  const { isMobile, cardUrl, businessName, copied, setCopied } = t;
  return (
    <section data-section="share" className="order-3 flex flex-col">
      <SectionTitle isMobile={isMobile} first="Share Our" second="Profile" />
      <div className="flex-1 rounded-2xl border border-slate-200 border-t-4 border-t-[var(--c)] bg-white p-5 shadow-sm flex flex-col items-center text-center gap-3">
        <img src={qrSrc(cardUrl, 200)} alt="Profile QR code" className="w-32 h-32 rounded-md border border-slate-100 p-1" />
        <div className="min-w-0 w-full">
          <p className="text-[12px] text-slate-500">Scan the QR or share the link</p>
          <p className="mt-1 text-[13px] font-semibold text-[#0B1B33] break-all">{cardUrl}</p>
        </div>
        <div className="!mt-auto grid w-full grid-cols-3 gap-2">
          <a
            href={whatsappShareHref(businessName, cardUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#25D366] py-3 text-[13px] font-semibold text-white"
          >
            <Share2 className="w-3.5 h-3.5" /> WhatsApp
          </a>
          <button
            type="button"
            onClick={() => copyCardLink(cardUrl, setCopied)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--c)] hover:bg-[var(--cd)] py-3 text-[13px] font-semibold text-white"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copied' : 'Copy Link'}
          </button>
          <button
            type="button"
            onClick={() => downloadQr(cardUrl, businessName)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--c)] hover:bg-[var(--cd)] py-3 text-[13px] font-semibold text-white"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </button>
        </div>
      </div>
    </section>
  );
};

/** Share section on its own row (mobile, tablet, or when there are no forms) */
export const ShareSection: React.FC<SectionProps> = ({ t }) => {
  const { isMobile, cardUrl, businessName, copied, setCopied } = t;
  const iconClass = isMobile ? 'w-4 h-4' : 'w-3.5 h-3.5';
  return (
    <section data-section="share" style={{ order: 101 }}>
      <SectionTitle isMobile={isMobile} first="Share Our" second="Profile" />
      <div className="rounded-xl bg-white border border-slate-200 p-4 flex items-center gap-4">
        <img src={qrSrc(cardUrl, 160)} alt="Profile QR code" className="w-24 h-24 shrink-0 rounded-md border border-slate-100 p-1" />
        <div className={`min-w-0 flex-1 ${isMobile ? 'space-y-2' : 'flex items-center gap-6'}`}>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-slate-500">Scan the QR or share the link</p>
            <p className={`mt-1 font-semibold text-[#0B1B33] ${isMobile ? 'text-[12px] break-all' : 'text-[14px] truncate'}`}>{cardUrl}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={whatsappShareHref(businessName, cardUrl)}
              target="_blank"
              rel="noopener noreferrer"
              title="Share on WhatsApp"
              aria-label="Share on WhatsApp"
              className={`inline-flex items-center justify-center gap-1.5 rounded-md bg-[#25D366] text-white font-semibold ${isMobile ? 'w-9 h-9' : 'px-4 py-2 text-[13px]'}`}
            >
              <Share2 className={iconClass} /> {!isMobile && 'WhatsApp'}
            </a>
            <button
              type="button"
              onClick={() => copyCardLink(cardUrl, setCopied)}
              title={copied ? 'Copied' : 'Copy link'}
              aria-label={copied ? 'Copied' : 'Copy link'}
              className={`inline-flex items-center justify-center gap-1.5 rounded-md bg-[var(--c)] hover:bg-[var(--cd)] text-white font-semibold ${isMobile ? 'w-9 h-9' : 'px-4 py-2 text-[13px]'}`}
            >
              {copied ? <Check className={iconClass} /> : <Copy className={iconClass} />}
              {!isMobile && (copied ? 'Copied' : 'Copy Link')}
            </button>
            <button
              type="button"
              onClick={() => downloadQr(cardUrl, businessName)}
              title="Download QR code"
              aria-label="Download QR code"
              className={`inline-flex items-center justify-center gap-1.5 rounded-md bg-[var(--c)] hover:bg-[var(--cd)] text-white font-semibold ${isMobile ? 'w-9 h-9' : 'px-4 py-2 text-[13px]'}`}
            >
              <Download className={iconClass} /> {!isMobile && 'Download QR'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
