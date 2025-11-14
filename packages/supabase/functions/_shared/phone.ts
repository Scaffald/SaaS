import { z } from "zod";
// @deno-types="npm:@types/awesome-phonenumber@7.5.0"
import { parsePhoneNumber } from "npm:awesome-phonenumber@7.5.0";

const PHONE_INVALID_MESSAGE = "Please enter a valid phone number";

const validatePhoneNumber = (
  phone: string | undefined,
  countryCode?: string,
): boolean => {
  if (!phone) {
    return true;
  }

  try {
    const parsed = parsePhoneNumber(
      phone,
      countryCode ? { regionCode: countryCode } : undefined,
    );
    return parsed.valid;
  } catch {
    return false;
  }
};

export const phoneNumberSchema = z
  .string()
  .optional()
  .transform((value) => value?.trim())
  .refine((value) => validatePhoneNumber(value), {
    message: PHONE_INVALID_MESSAGE,
  });

export const requiredPhoneNumberSchema = z
  .string()
  .min(1, "Phone number is required")
  .transform((value) => value.trim())
  .refine((value) => validatePhoneNumber(value), {
    message: PHONE_INVALID_MESSAGE,
  });

/**
 * Format phone number for display using the international format.
 * US numbers are formatted as +1 (234) 567-8900
 */
export const formatPhoneNumber = (
  phone: string,
  countryCode?: string,
): string => {
  try {
    const parsed = parsePhoneNumber(
      phone,
      countryCode ? { regionCode: countryCode } : undefined,
    );
    if (parsed.regionCode === "US" && parsed.number?.national) {
      // Format US numbers as +1 (234) 567-8900
      const national = parsed.number.national;
      if (national.length === 10) {
        const area = national.slice(0, 3);
        const exchange = national.slice(3, 6);
        const line = national.slice(6);
        return `+1 (${area}) ${exchange}-${line}`;
      }
      // Fallback for non-standard US numbers
      return `+1 ${national}`;
    }
    return parsed.number?.international ?? phone;
  } catch {
    return phone.trim();
  }
};

/**
 * Extract the detected region code (ISO 3166 alpha-2) from a phone number.
 */
export const getPhoneRegionCode = (phone: string): string | undefined => {
  try {
    const parsed = parsePhoneNumber(phone);
    return parsed.regionCode ?? undefined;
  } catch {
    return undefined;
  }
};

/**
 * Determine whether a phone number is valid for a specific region.
 */
export const isValidPhoneNumber = (
  phone: string,
  countryCode?: string,
): boolean => {
  if (!phone) {
    return false;
  }

  return validatePhoneNumber(phone, countryCode);
};
