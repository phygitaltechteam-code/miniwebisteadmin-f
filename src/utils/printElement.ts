/**
 * Prints one element (not the whole app) through a hidden iframe that carries the page's styles.
 * The browser's print preview opens straight away; choose "Save as PDF" there for a PDF.
 * Elements with the `print:hidden` class (buttons, links back) are left out of the printout.
 */
export const printElement = (element: HTMLElement | null, title: string) => {
  if (!element) return;

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    iframe.remove();
    return;
  }

  // Same styles as the app (Vite dev <style> tags, build <link> tags)
  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((node) => node.outerHTML)
    .join('\n');
  const escapedTitle = title.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c] as string);

  doc.open();
  doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapedTitle}</title>${styles}
<style>
  @page { size: A4; margin: 12mm; }
  html, body { background: #fff !important; overflow: visible !important; max-width: none !important; }
  body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  table { page-break-inside: auto; } tr { page-break-inside: avoid; }
  .overflow-x-auto { overflow: visible !important; }
</style></head><body>${element.outerHTML}</body></html>`);
  doc.close();

  let printed = false;
  const run = () => {
    if (printed) return;
    printed = true;
    win.focus();
    win.print();
    // Remove after the print dialog closes
    setTimeout(() => iframe.remove(), 1000);
  };
  // Wait for stylesheets / fonts, with a fallback in case load never fires
  iframe.onload = run;
  setTimeout(run, 800);
};
