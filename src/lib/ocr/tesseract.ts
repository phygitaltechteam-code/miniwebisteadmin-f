// Tesseract.js wrapper that turns card photos into OcrLines shaped like the Android app's ML Kit output.
// tesseract.js is imported dynamically so it (and its WASM + language data, fetched on first use) stays out of the main bundle.
import type {Worker} from 'tesseract.js';
import type {OcrLine} from './types';

/** Long side, in pixels, every photo is redrawn at before OCR. */
const TARGET_SIDE = 2000;

export interface OcrProgress {
  /** Short text for the UI, e.g. "Reading front side". */
  label: string;
  /** Overall progress 0..1 (engine loading, then each side). */
  progress: number;
}

export interface CardOcr {
  /** OCR lines of the front, then the back (when given), in reading order. */
  read(front: Blob, back?: Blob | null): Promise<OcrLine[]>;
  /** Frees the worker; call when the scanner closes. */
  terminate(): Promise<void>;
}

const LOAD_SHARE = 0.25; // share of the progress bar for loading the engine

/**
 * Redraws the photo on a canvas: browsers apply the EXIF rotation when drawing an <img>, which Tesseract would
 * otherwise ignore (a phone photo would be read sideways), and the fixed size keeps text big enough but memory sane.
 */
async function toCanvas(file: Blob): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () =>
        reject(new Error("Couldn't open the image. Use a JPEG or PNG photo."));
      el.src = url;
    });
    const scale =
      TARGET_SIDE / Math.max(img.naturalWidth, img.naturalHeight, 1);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is not available in this browser.');
    ctx.fillStyle = '#fff'; // transparent PNGs: OCR reads dark text on white
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function createCardOcr(onProgress?: (p: OcrProgress) => void): CardOcr {
  let worker: Promise<Worker> | null = null;
  let terminated = false;
  // The logger is fixed at worker creation, so it reports into whichever step is running.
  let step = {label: 'Loading text reader', from: 0, span: LOAD_SHARE};
  let stepDone = 0;

  const setStep = (label: string, from: number, span: number) => {
    step = {label, from, span};
    stepDone = 0;
    report(0);
  };
  // Tesseract restarts its progress at 0 for each internal stage; keep the bar moving forward only.
  const report = (fraction: number) => {
    stepDone = Math.max(stepDone, Math.min(1, Math.max(0, fraction)));
    onProgress?.({
      label: step.label,
      progress: step.from + step.span * stepDone,
    });
  };

  const getWorker = () => {
    if (!worker) {
      worker = import('tesseract.js').then(async (mod) => {
        const T = (mod as unknown as {default?: typeof mod}).default ?? mod;
        const w = await T.createWorker('eng', T.OEM.LSTM_ONLY, {
          logger: (m) => {
            if (step.from === 0 || m.status === 'recognizing text')
              report(m.progress);
          },
        });
        if (terminated) {
          await w.terminate();
          throw new Error('Text reader closed');
        }
        return w;
      });
      worker.catch(() => (worker = null)); // allow a retry after a network failure
    }
    return worker;
  };

  return {
    async read(front, back) {
      setStep('Loading text reader', 0, LOAD_SHARE);
      const w = await getWorker();
      const pages = back ? [front, back] : [front];
      const lines: OcrLine[] = [];
      for (let i = 0; i < pages.length; i++) {
        const span = (1 - LOAD_SHARE) / pages.length;
        setStep(
          i === 0 ? 'Reading front side' : 'Reading back side',
          LOAD_SHARE + span * i,
          span,
        );
        const canvas = await toCanvas(pages[i]);
        const {data} = await w.recognize(canvas, {}, {blocks: true});
        // Same shape as the app's OcrEngine: block index restarts per side, boxes in that side's pixels.
        (data.blocks ?? []).forEach((block, blockIndex) => {
          block.paragraphs.forEach((paragraph) =>
            paragraph.lines.forEach((line) => {
              const text = line.text.trim();
              if (!text) return;
              const {x0, y0, x1, y1} = line.bbox;
              lines.push({
                text,
                height: y1 - y0,
                box: {left: x0, top: y0, right: x1, bottom: y1},
                confidence: line.confidence > 0 ? line.confidence / 100 : null,
                block: blockIndex,
              });
            }),
          );
        });
      }
      return lines;
    },
    async terminate() {
      terminated = true;
      const w = worker;
      worker = null;
      if (w) await w.then((x) => x.terminate()).catch(() => undefined);
    },
  };
}
