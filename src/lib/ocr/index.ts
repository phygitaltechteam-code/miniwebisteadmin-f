// In-browser business card reader: Tesseract OCR + a TypeScript port of the Android app's offline rules.
export * from './types';
export {RuleBasedExtractor, extractCard, LOW_CONFIDENCE} from './ruleExtractor';
export {findDuplicate, merge, similarity, type LeadLike} from './duplicates';
export {findPhones, normalizePhone, nationalDigits} from './phone';
export {isValidGstin, isValidPan, isValidCin, allValid} from './taxIds';
export {createCardOcr, type CardOcr, type OcrProgress} from './tesseract';
