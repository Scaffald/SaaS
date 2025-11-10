import { z } from "zod";

const PHONE_INVALID_MESSAGE = "Please enter a valid phone number";

const normalizePhone = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }
  return value.replace(/[\s().-]/g, "");
};

const looksLikePhoneNumber = (
  value: string | undefined,
  _countryCode?: string,
): boolean => {
  if (!value) {
    return true;
  }
  const normalized = normalizePhone(value);
  if (!normalized) {
    return true;
  }
  const hasPlusPrefix = normalized.startsWith("+");
  const digits = normalized.replace(/\D/g, "");
  const length = digits.length;

  if (length < 7 || length > 15) {
    return false;
  }

  if (hasPlusPrefix && !normalized.startsWith("+")) {
    return false;
  }

  return true;
};

export const phoneNumberSchema = z
  .string()
  .optional()
  .transform((value) => value?.trim())
  .refine((value) => looksLikePhoneNumber(value), {
    message: PHONE_INVALID_MESSAGE,
  });

export const requiredPhoneNumberSchema = z
  .string()
  .min(1, "Phone number is required")
  .transform((value) => value.trim())
  .refine((value) => looksLikePhoneNumber(value), {
    message: PHONE_INVALID_MESSAGE,
  });

export const formatPhoneNumber = (
  phone: string,
  _countryCode?: string,
): string => phone.trim();

export const getPhoneRegionCode = (_phone: string): string | undefined =>
  undefined;

export const isValidPhoneNumber = (
  phone: string,
  countryCode?: string,
): boolean => looksLikePhoneNumber(phone, countryCode);
