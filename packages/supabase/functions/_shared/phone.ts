import { z } from "zod";

const PHONE_INVALID_MESSAGE = "Please enter a valid phone number";

/**
 * Simple phone number validation - basic check for valid format.
 * Frontend already validates with awesome-phonenumber, this is a lightweight backend fallback.
 */
const validatePhoneNumber = (
  phone: string | undefined,
  _countryCode?: string,
): boolean => {
  if (!phone) {
    return true;
  }

  const trimmed = phone.trim();
  if (!trimmed) {
    return true;
  }

  // Remove common formatting characters
  const digits = trimmed.replace(/\D/g, "");
  
  // Basic validation: 10-15 digits (international format)
  if (digits.length < 7 || digits.length > 15) {
    return false;
  }

  // If starts with +, must have country code
  if (trimmed.startsWith("+") && digits.length < 10) {
    return false;
  }

  return true;
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
 * Format phone number for display.
 * US numbers (10 digits) are formatted as +1 (234) 567-8900.
 * Other formats are returned as-is or in international format if recognized.
 */
export const formatPhoneNumber = (
  phone: string,
  countryCode?: string,
): string => {
  if (!phone) {
    return "";
  }

  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");

  // Format US numbers as +1 (234) 567-8900
  if (digits.length === 10 || (digits.length === 11 && digits.startsWith("1"))) {
    const phoneDigits = digits.length === 11 ? digits.slice(1) : digits;
    if (phoneDigits.length === 10) {
      const area = phoneDigits.slice(0, 3);
      const exchange = phoneDigits.slice(3, 6);
      const line = phoneDigits.slice(6);
      return `+1 (${area}) ${exchange}-${line}`;
    }
  }

  // If already formatted correctly, return as-is
  if (trimmed.startsWith("+1 (") && trimmed.includes(")")) {
    return trimmed;
  }

  // If starts with +1 and has 10 digits after, format it
  if (trimmed.startsWith("+1") && digits.length === 11) {
    const phoneDigits = digits.slice(1); // Remove the leading 1
    if (phoneDigits.length === 10) {
      const area = phoneDigits.slice(0, 3);
      const exchange = phoneDigits.slice(3, 6);
      const line = phoneDigits.slice(6);
      return `+1 (${area}) ${exchange}-${line}`;
    }
  }

  // If countryCode is US and we have 10 digits, format as US number
  if (countryCode === "US" && digits.length === 10) {
    const area = digits.slice(0, 3);
    const exchange = digits.slice(3, 6);
    const line = digits.slice(6);
    return `+1 (${area}) ${exchange}-${line}`;
  }

  // Return trimmed value for other formats
  return trimmed;
};

/**
 * Extract the detected region code (ISO 3166 alpha-2) from a phone number.
 * Simple detection based on phone number format.
 */
export const getPhoneRegionCode = (phone: string): string | undefined => {
  if (!phone) {
    return undefined;
  }

  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");

  // If starts with +1 or has 10/11 digits, likely US
  if (trimmed.startsWith("+1") || digits.length === 10 || (digits.length === 11 && digits.startsWith("1"))) {
    return "US";
  }

  // Could add more region detection here if needed
  return undefined;
};

/**
 * Determine whether a phone number is valid.
 * Frontend does thorough validation, this is a lightweight backend check.
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
