/**
 * Rich text saved from the editor (product descriptions, About Us) carries pasted inline styles
 * (fonts like "Uniform Medium", fixed colours and sizes). These helpers turn it into plain text for
 * short previews, or into clean HTML that keeps the structure (headings, bold, lists, line breaks, links)
 * and takes the card's own fonts and colours.
 */

const decode = (html: string) => {
  if (typeof document === 'undefined') {
    return html.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  }
  const el = document.createElement('textarea');
  el.innerHTML = html;
  return el.value;
};

/** Plain text, one line: tags removed, entities (&amp; &nbsp; …) decoded */
export const htmlToText = (html?: string | null): string =>
  decode(
    String(html || '')
      .replace(/<(br|\/p|\/h[1-6]|\/li|\/div)\s*\/?>/gi, ' ')
      .replace(/<[^>]*>/g, ' '),
  )
    .replace(/ /g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const DROP_TAGS = ['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'form', 'input', 'button', 'textarea', 'select'];

/** Safe HTML for display: no scripts / event handlers / inline styles, empty blocks removed, links open in a new tab */
export const cleanRichHtml = (html?: string | null): string => {
  const source = String(html || '');
  if (!source.trim() || typeof DOMParser === 'undefined') return '';
  const doc = new DOMParser().parseFromString(`<div>${source}</div>`, 'text/html');
  const root = doc.body.firstElementChild as HTMLElement | null;
  if (!root) return '';

  root.querySelectorAll(DROP_TAGS.join(',')).forEach((el) => el.remove());
  root.querySelectorAll('*').forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const keep = (el.tagName === 'A' && name === 'href') || (el.tagName === 'IMG' && (name === 'src' || name === 'alt'));
      if (!keep) el.removeAttribute(attr.name);
    });
    if (el.tagName === 'A') {
      const href = el.getAttribute('href') || '';
      if (/^\s*javascript:/i.test(href)) el.removeAttribute('href');
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
    }
  });

  // Empty blocks the editor leaves behind (<h3></h3>, <p><strong></strong></p>) take up space for nothing
  for (let pass = 0; pass < 3; pass++) {
    root.querySelectorAll('p,h1,h2,h3,h4,h5,h6,span,strong,b,em,div').forEach((el) => {
      if (!el.textContent?.replace(/ /g, ' ').trim() && !el.querySelector('img,br')) el.remove();
    });
  }
  return root.innerHTML;
};

/** Tailwind classes that style cleaned rich text (headings, lists, links) */
export const RICH_TEXT_CLASS =
  '[&_h1]:text-[17px] [&_h1]:font-bold [&_h1]:mb-2 [&_h1]:mt-1 [&_h2]:text-[15.5px] [&_h2]:font-bold [&_h2]:mb-1.5 [&_h2]:mt-2 ' +
  '[&_h3]:text-[14.5px] [&_h3]:font-semibold [&_h3]:mb-1.5 [&_h3]:mt-2 [&_h4]:text-[13.5px] [&_h4]:font-semibold [&_h4]:mb-1 [&_h4]:mt-2 ' +
  '[&_h1]:text-[#0B1B33] [&_h2]:text-[#0B1B33] [&_h3]:text-[#0B1B33] [&_h4]:text-[#0B1B33] [&_strong]:font-semibold [&_b]:font-semibold ' +
  '[&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 ' +
  '[&_a]:text-[var(--c)] [&_a]:underline [&_a]:break-all';
