import { z } from 'zod';

export const CoordinatesSchema = z.object({
  latitude: z.number().gte(-90).lte(90),
  longitude: z.number().gte(-180).lte(180),
});

export type Coordinates = z.infer<typeof CoordinatesSchema>;

export const LocationSchema = z.object({
  raw: z.string().trim().min(1).optional(),
  formatted: z.string().trim().min(1).optional(),
  streetAddress: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
  region: z.string().trim().min(1).optional(),
  postalCode: z.string().trim().min(1).optional(),
  country: z.string().trim().min(2).optional(),
  countryCode: z.string().trim().length(2).optional(),
  timeZone: z.string().trim().min(1).optional(),
  remote: z.boolean().optional(),
  coordinates: CoordinatesSchema.optional(),
});

export type Location = z.infer<typeof LocationSchema>;

export const CompensationFrequencySchema = z.enum([
  'hour',
  'day',
  'week',
  'month',
  'year',
  'total',
]);

export type CompensationFrequency = z.infer<typeof CompensationFrequencySchema>;

export const CompensationSchema = z
  .object({
    currency: z
      .string()
      .trim()
      .length(3, 'Use ISO-4217 currency codes')
      .transform((value) => value.toUpperCase()),
    minAmount: z.number().nonnegative().optional(),
    maxAmount: z.number().nonnegative().optional(),
    periodicity: CompensationFrequencySchema,
    isEstimated: z.boolean().optional(),
    visible: z.boolean().optional(),
    notes: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.minAmount === undefined && value.maxAmount === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide at least one compensation amount',
        path: ['minAmount'],
      });
    }
    if (
      value.minAmount !== undefined &&
      value.maxAmount !== undefined &&
      value.minAmount > value.maxAmount
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'minAmount must be less than or equal to maxAmount',
        path: ['minAmount'],
      });
    }
  });

export type Compensation = z.infer<typeof CompensationSchema>;

export const DateTimeSchema = z.preprocess((value) => {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return value;
}, z.date());

export type DateTime = z.infer<typeof DateTimeSchema>;
