// Port of PhoneUtils.kt. The /max metadata is needed for getType() (mobile vs landline).
import {
  findPhoneNumbersInText,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js/max';
import type {FoundPhone, PhoneKind} from './types';

const OFFICE_TYPES = new Set([
  'FIXED_LINE',
  'TOLL_FREE',
  'SHARED_COST',
  'UAN',
  'VOIP',
]);

/**
 * Finds valid phone numbers in `text`, reading numbers without a + prefix as `region` numbers.
 * Same as findNumbers(text, { defaultCountry, v2: true }) with the default VALID leniency, like the Java library.
 */
export function findPhones(text: string, region: string): FoundPhone[] {
  return findPhoneNumbersInText(text, {
    defaultCountry: region as CountryCode,
  }).map(({number, startsAt, endsAt}) => {
    const type = number.getType();
    const kind: PhoneKind | null =
      type === 'MOBILE'
        ? 'MOBILE'
        : type && OFFICE_TYPES.has(type)
          ? 'OFFICE'
          : null;
    return {
      start: startsAt,
      end: endsAt,
      // Without the extension, so the number stays dialable.
      formatted: number.formatInternational({
        formatExtension: (formatted) => formatted,
      }),
      numberKind: kind,
      extension: number.ext && number.ext.trim() ? number.ext : null,
    };
  });
}

function parseValid(raw: string, region: string) {
  try {
    const n = parsePhoneNumberFromString(raw, region as CountryCode);
    return n && n.isValid() ? n : null;
  } catch {
    return null;
  }
}

/** E.164 form ("+919820012345") for comparing numbers, or null if `raw` isn't a valid phone number. */
export const normalizePhone = (raw: string, region: string): string | null =>
  parseValid(raw, region)?.number ?? null;

/** National digits ("9820012345"): found inside a stored number however it was written (+91…, 0…, spaces). */
export const nationalDigits = (raw: string, region: string): string | null =>
  parseValid(raw, region)?.nationalNumber ?? null;
