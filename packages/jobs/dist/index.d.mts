import { z } from 'zod';
import { AxiosInstance } from 'axios';
import { SupabaseClient } from '@supabase/supabase-js';

declare const CoordinatesSchema: z.ZodObject<{
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    latitude: number;
    longitude: number;
}, {
    latitude: number;
    longitude: number;
}>;
type Coordinates = z.infer<typeof CoordinatesSchema>;
declare const LocationSchema: z.ZodObject<{
    raw: z.ZodOptional<z.ZodString>;
    formatted: z.ZodOptional<z.ZodString>;
    streetAddress: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    region: z.ZodOptional<z.ZodString>;
    postalCode: z.ZodOptional<z.ZodString>;
    country: z.ZodOptional<z.ZodString>;
    countryCode: z.ZodOptional<z.ZodString>;
    timeZone: z.ZodOptional<z.ZodString>;
    remote: z.ZodOptional<z.ZodBoolean>;
    coordinates: z.ZodOptional<z.ZodObject<{
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        latitude: number;
        longitude: number;
    }, {
        latitude: number;
        longitude: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    raw?: string | undefined;
    formatted?: string | undefined;
    streetAddress?: string | undefined;
    city?: string | undefined;
    region?: string | undefined;
    postalCode?: string | undefined;
    country?: string | undefined;
    countryCode?: string | undefined;
    timeZone?: string | undefined;
    remote?: boolean | undefined;
    coordinates?: {
        latitude: number;
        longitude: number;
    } | undefined;
}, {
    raw?: string | undefined;
    formatted?: string | undefined;
    streetAddress?: string | undefined;
    city?: string | undefined;
    region?: string | undefined;
    postalCode?: string | undefined;
    country?: string | undefined;
    countryCode?: string | undefined;
    timeZone?: string | undefined;
    remote?: boolean | undefined;
    coordinates?: {
        latitude: number;
        longitude: number;
    } | undefined;
}>;
type Location = z.infer<typeof LocationSchema>;
declare const CompensationFrequencySchema: z.ZodEnum<["hour", "day", "week", "month", "year", "total"]>;
type CompensationFrequency = z.infer<typeof CompensationFrequencySchema>;
declare const CompensationSchema: z.ZodEffects<z.ZodObject<{
    currency: z.ZodEffects<z.ZodString, string, string>;
    minAmount: z.ZodOptional<z.ZodNumber>;
    maxAmount: z.ZodOptional<z.ZodNumber>;
    periodicity: z.ZodEnum<["hour", "day", "week", "month", "year", "total"]>;
    isEstimated: z.ZodOptional<z.ZodBoolean>;
    visible: z.ZodOptional<z.ZodBoolean>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    currency: string;
    periodicity: "hour" | "day" | "week" | "month" | "year" | "total";
    minAmount?: number | undefined;
    maxAmount?: number | undefined;
    isEstimated?: boolean | undefined;
    visible?: boolean | undefined;
    notes?: string | undefined;
}, {
    currency: string;
    periodicity: "hour" | "day" | "week" | "month" | "year" | "total";
    minAmount?: number | undefined;
    maxAmount?: number | undefined;
    isEstimated?: boolean | undefined;
    visible?: boolean | undefined;
    notes?: string | undefined;
}>, {
    currency: string;
    periodicity: "hour" | "day" | "week" | "month" | "year" | "total";
    minAmount?: number | undefined;
    maxAmount?: number | undefined;
    isEstimated?: boolean | undefined;
    visible?: boolean | undefined;
    notes?: string | undefined;
}, {
    currency: string;
    periodicity: "hour" | "day" | "week" | "month" | "year" | "total";
    minAmount?: number | undefined;
    maxAmount?: number | undefined;
    isEstimated?: boolean | undefined;
    visible?: boolean | undefined;
    notes?: string | undefined;
}>;
type Compensation = z.infer<typeof CompensationSchema>;
declare const DateTimeSchema: z.ZodEffects<z.ZodDate, Date, unknown>;
type DateTime = z.infer<typeof DateTimeSchema>;

declare const EmploymentTypeSchema: z.ZodEnum<["full_time", "part_time", "contract", "temporary", "internship", "volunteer", "freelance", "other"]>;
type EmploymentType = z.infer<typeof EmploymentTypeSchema>;
declare const ExperienceLevelSchema: z.ZodEnum<["intern", "entry", "mid", "senior", "lead", "director", "executive"]>;
type ExperienceLevel = z.infer<typeof ExperienceLevelSchema>;
declare const WorkplaceTypeSchema: z.ZodEnum<["onsite", "remote", "hybrid", "flexible"]>;
type WorkplaceType = z.infer<typeof WorkplaceTypeSchema>;
declare const JobStatusSchema: z.ZodEnum<["open", "closed", "draft"]>;
type JobStatus = z.infer<typeof JobStatusSchema>;
declare const JobIdentifierSchema: z.ZodObject<{
    externalId: z.ZodString;
    source: z.ZodString;
    url: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    externalId: string;
    source: string;
    url?: string | undefined;
}, {
    externalId: string;
    source: string;
    url?: string | undefined;
}>;
type JobIdentifier = z.infer<typeof JobIdentifierSchema>;
declare const NormalizedJobSchema: z.ZodEffects<z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    identifier: z.ZodObject<{
        externalId: z.ZodString;
        source: z.ZodString;
        url: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        externalId: string;
        source: string;
        url?: string | undefined;
    }, {
        externalId: string;
        source: string;
        url?: string | undefined;
    }>;
    title: z.ZodString;
    url: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    summary: z.ZodOptional<z.ZodString>;
    language: z.ZodOptional<z.ZodString>;
    applicationUrl: z.ZodOptional<z.ZodString>;
    postedAt: z.ZodOptional<z.ZodEffects<z.ZodDate, Date, unknown>>;
    updatedAt: z.ZodOptional<z.ZodEffects<z.ZodDate, Date, unknown>>;
    closesAt: z.ZodOptional<z.ZodEffects<z.ZodDate, Date, unknown>>;
    employmentType: z.ZodOptional<z.ZodEnum<["full_time", "part_time", "contract", "temporary", "internship", "volunteer", "freelance", "other"]>>;
    experienceLevel: z.ZodOptional<z.ZodEnum<["intern", "entry", "mid", "senior", "lead", "director", "executive"]>>;
    workplaceType: z.ZodOptional<z.ZodEnum<["onsite", "remote", "hybrid", "flexible"]>>;
    compensation: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        currency: z.ZodEffects<z.ZodString, string, string>;
        minAmount: z.ZodOptional<z.ZodNumber>;
        maxAmount: z.ZodOptional<z.ZodNumber>;
        periodicity: z.ZodEnum<["hour", "day", "week", "month", "year", "total"]>;
        isEstimated: z.ZodOptional<z.ZodBoolean>;
        visible: z.ZodOptional<z.ZodBoolean>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        currency: string;
        periodicity: "hour" | "day" | "week" | "month" | "year" | "total";
        minAmount?: number | undefined;
        maxAmount?: number | undefined;
        isEstimated?: boolean | undefined;
        visible?: boolean | undefined;
        notes?: string | undefined;
    }, {
        currency: string;
        periodicity: "hour" | "day" | "week" | "month" | "year" | "total";
        minAmount?: number | undefined;
        maxAmount?: number | undefined;
        isEstimated?: boolean | undefined;
        visible?: boolean | undefined;
        notes?: string | undefined;
    }>, {
        currency: string;
        periodicity: "hour" | "day" | "week" | "month" | "year" | "total";
        minAmount?: number | undefined;
        maxAmount?: number | undefined;
        isEstimated?: boolean | undefined;
        visible?: boolean | undefined;
        notes?: string | undefined;
    }, {
        currency: string;
        periodicity: "hour" | "day" | "week" | "month" | "year" | "total";
        minAmount?: number | undefined;
        maxAmount?: number | undefined;
        isEstimated?: boolean | undefined;
        visible?: boolean | undefined;
        notes?: string | undefined;
    }>>;
    locations: z.ZodOptional<z.ZodArray<z.ZodObject<{
        raw: z.ZodOptional<z.ZodString>;
        formatted: z.ZodOptional<z.ZodString>;
        streetAddress: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodString>;
        region: z.ZodOptional<z.ZodString>;
        postalCode: z.ZodOptional<z.ZodString>;
        country: z.ZodOptional<z.ZodString>;
        countryCode: z.ZodOptional<z.ZodString>;
        timeZone: z.ZodOptional<z.ZodString>;
        remote: z.ZodOptional<z.ZodBoolean>;
        coordinates: z.ZodOptional<z.ZodObject<{
            latitude: z.ZodNumber;
            longitude: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            latitude: number;
            longitude: number;
        }, {
            latitude: number;
            longitude: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        raw?: string | undefined;
        formatted?: string | undefined;
        streetAddress?: string | undefined;
        city?: string | undefined;
        region?: string | undefined;
        postalCode?: string | undefined;
        country?: string | undefined;
        countryCode?: string | undefined;
        timeZone?: string | undefined;
        remote?: boolean | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
    }, {
        raw?: string | undefined;
        formatted?: string | undefined;
        streetAddress?: string | undefined;
        city?: string | undefined;
        region?: string | undefined;
        postalCode?: string | undefined;
        country?: string | undefined;
        countryCode?: string | undefined;
        timeZone?: string | undefined;
        remote?: boolean | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
    }>, "atleastone">>;
    primaryLocation: z.ZodOptional<z.ZodObject<{
        raw: z.ZodOptional<z.ZodString>;
        formatted: z.ZodOptional<z.ZodString>;
        streetAddress: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodString>;
        region: z.ZodOptional<z.ZodString>;
        postalCode: z.ZodOptional<z.ZodString>;
        country: z.ZodOptional<z.ZodString>;
        countryCode: z.ZodOptional<z.ZodString>;
        timeZone: z.ZodOptional<z.ZodString>;
        remote: z.ZodOptional<z.ZodBoolean>;
        coordinates: z.ZodOptional<z.ZodObject<{
            latitude: z.ZodNumber;
            longitude: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            latitude: number;
            longitude: number;
        }, {
            latitude: number;
            longitude: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        raw?: string | undefined;
        formatted?: string | undefined;
        streetAddress?: string | undefined;
        city?: string | undefined;
        region?: string | undefined;
        postalCode?: string | undefined;
        country?: string | undefined;
        countryCode?: string | undefined;
        timeZone?: string | undefined;
        remote?: boolean | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
    }, {
        raw?: string | undefined;
        formatted?: string | undefined;
        streetAddress?: string | undefined;
        city?: string | undefined;
        region?: string | undefined;
        postalCode?: string | undefined;
        country?: string | undefined;
        countryCode?: string | undefined;
        timeZone?: string | undefined;
        remote?: boolean | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
    }>>;
    remote: z.ZodOptional<z.ZodBoolean>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    skills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    benefits: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    keywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    organization: z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        identifier: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            externalId: z.ZodOptional<z.ZodString>;
            source: z.ZodOptional<z.ZodString>;
            slug: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            externalId?: string | undefined;
            source?: string | undefined;
            slug?: string | undefined;
        }, {
            externalId?: string | undefined;
            source?: string | undefined;
            slug?: string | undefined;
        }>, {
            externalId?: string | undefined;
            source?: string | undefined;
            slug?: string | undefined;
        }, {
            externalId?: string | undefined;
            source?: string | undefined;
            slug?: string | undefined;
        }>>;
        name: z.ZodString;
        legalName: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        websiteUrl: z.ZodOptional<z.ZodString>;
        careersUrl: z.ZodOptional<z.ZodString>;
        logoUrl: z.ZodOptional<z.ZodString>;
        industries: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        size: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            label: z.ZodOptional<z.ZodString>;
            min: z.ZodOptional<z.ZodNumber>;
            max: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            label?: string | undefined;
            min?: number | undefined;
            max?: number | undefined;
        }, {
            label?: string | undefined;
            min?: number | undefined;
            max?: number | undefined;
        }>, {
            label?: string | undefined;
            min?: number | undefined;
            max?: number | undefined;
        }, {
            label?: string | undefined;
            min?: number | undefined;
            max?: number | undefined;
        }>>;
        headquarters: z.ZodOptional<z.ZodObject<{
            raw: z.ZodOptional<z.ZodString>;
            formatted: z.ZodOptional<z.ZodString>;
            streetAddress: z.ZodOptional<z.ZodString>;
            city: z.ZodOptional<z.ZodString>;
            region: z.ZodOptional<z.ZodString>;
            postalCode: z.ZodOptional<z.ZodString>;
            country: z.ZodOptional<z.ZodString>;
            countryCode: z.ZodOptional<z.ZodString>;
            timeZone: z.ZodOptional<z.ZodString>;
            remote: z.ZodOptional<z.ZodBoolean>;
            coordinates: z.ZodOptional<z.ZodObject<{
                latitude: z.ZodNumber;
                longitude: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                latitude: number;
                longitude: number;
            }, {
                latitude: number;
                longitude: number;
            }>>;
        }, "strip", z.ZodTypeAny, {
            raw?: string | undefined;
            formatted?: string | undefined;
            streetAddress?: string | undefined;
            city?: string | undefined;
            region?: string | undefined;
            postalCode?: string | undefined;
            country?: string | undefined;
            countryCode?: string | undefined;
            timeZone?: string | undefined;
            remote?: boolean | undefined;
            coordinates?: {
                latitude: number;
                longitude: number;
            } | undefined;
        }, {
            raw?: string | undefined;
            formatted?: string | undefined;
            streetAddress?: string | undefined;
            city?: string | undefined;
            region?: string | undefined;
            postalCode?: string | undefined;
            country?: string | undefined;
            countryCode?: string | undefined;
            timeZone?: string | undefined;
            remote?: boolean | undefined;
            coordinates?: {
                latitude: number;
                longitude: number;
            } | undefined;
        }>>;
        locations: z.ZodOptional<z.ZodArray<z.ZodObject<{
            raw: z.ZodOptional<z.ZodString>;
            formatted: z.ZodOptional<z.ZodString>;
            streetAddress: z.ZodOptional<z.ZodString>;
            city: z.ZodOptional<z.ZodString>;
            region: z.ZodOptional<z.ZodString>;
            postalCode: z.ZodOptional<z.ZodString>;
            country: z.ZodOptional<z.ZodString>;
            countryCode: z.ZodOptional<z.ZodString>;
            timeZone: z.ZodOptional<z.ZodString>;
            remote: z.ZodOptional<z.ZodBoolean>;
            coordinates: z.ZodOptional<z.ZodObject<{
                latitude: z.ZodNumber;
                longitude: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                latitude: number;
                longitude: number;
            }, {
                latitude: number;
                longitude: number;
            }>>;
        }, "strip", z.ZodTypeAny, {
            raw?: string | undefined;
            formatted?: string | undefined;
            streetAddress?: string | undefined;
            city?: string | undefined;
            region?: string | undefined;
            postalCode?: string | undefined;
            country?: string | undefined;
            countryCode?: string | undefined;
            timeZone?: string | undefined;
            remote?: boolean | undefined;
            coordinates?: {
                latitude: number;
                longitude: number;
            } | undefined;
        }, {
            raw?: string | undefined;
            formatted?: string | undefined;
            streetAddress?: string | undefined;
            city?: string | undefined;
            region?: string | undefined;
            postalCode?: string | undefined;
            country?: string | undefined;
            countryCode?: string | undefined;
            timeZone?: string | undefined;
            remote?: boolean | undefined;
            coordinates?: {
                latitude: number;
                longitude: number;
            } | undefined;
        }>, "many">>;
        remoteFriendly: z.ZodOptional<z.ZodBoolean>;
        foundedAt: z.ZodOptional<z.ZodEffects<z.ZodDate, Date, unknown>>;
        emails: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        phoneNumbers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        socialProfiles: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodEnum<["website", "linkedin", "twitter", "facebook", "instagram", "github", "youtube", "glassdoor", "crunchbase", "angelList", "other"]>;
            url: z.ZodString;
            handle: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: "website" | "linkedin" | "twitter" | "facebook" | "instagram" | "github" | "youtube" | "glassdoor" | "crunchbase" | "angelList" | "other";
            url: string;
            handle?: string | undefined;
        }, {
            type: "website" | "linkedin" | "twitter" | "facebook" | "instagram" | "github" | "youtube" | "glassdoor" | "crunchbase" | "angelList" | "other";
            url: string;
            handle?: string | undefined;
        }>, "many">>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id?: string | undefined;
        identifier?: {
            externalId?: string | undefined;
            source?: string | undefined;
            slug?: string | undefined;
        } | undefined;
        legalName?: string | undefined;
        description?: string | undefined;
        websiteUrl?: string | undefined;
        careersUrl?: string | undefined;
        logoUrl?: string | undefined;
        industries?: string[] | undefined;
        size?: {
            label?: string | undefined;
            min?: number | undefined;
            max?: number | undefined;
        } | undefined;
        headquarters?: {
            raw?: string | undefined;
            formatted?: string | undefined;
            streetAddress?: string | undefined;
            city?: string | undefined;
            region?: string | undefined;
            postalCode?: string | undefined;
            country?: string | undefined;
            countryCode?: string | undefined;
            timeZone?: string | undefined;
            remote?: boolean | undefined;
            coordinates?: {
                latitude: number;
                longitude: number;
            } | undefined;
        } | undefined;
        locations?: {
            raw?: string | undefined;
            formatted?: string | undefined;
            streetAddress?: string | undefined;
            city?: string | undefined;
            region?: string | undefined;
            postalCode?: string | undefined;
            country?: string | undefined;
            countryCode?: string | undefined;
            timeZone?: string | undefined;
            remote?: boolean | undefined;
            coordinates?: {
                latitude: number;
                longitude: number;
            } | undefined;
        }[] | undefined;
        remoteFriendly?: boolean | undefined;
        foundedAt?: Date | undefined;
        emails?: string[] | undefined;
        phoneNumbers?: string[] | undefined;
        socialProfiles?: {
            type: "website" | "linkedin" | "twitter" | "facebook" | "instagram" | "github" | "youtube" | "glassdoor" | "crunchbase" | "angelList" | "other";
            url: string;
            handle?: string | undefined;
        }[] | undefined;
        metadata?: Record<string, unknown> | undefined;
    }, {
        name: string;
        id?: string | undefined;
        identifier?: {
            externalId?: string | undefined;
            source?: string | undefined;
            slug?: string | undefined;
        } | undefined;
        legalName?: string | undefined;
        description?: string | undefined;
        websiteUrl?: string | undefined;
        careersUrl?: string | undefined;
        logoUrl?: string | undefined;
        industries?: string[] | undefined;
        size?: {
            label?: string | undefined;
            min?: number | undefined;
            max?: number | undefined;
        } | undefined;
        headquarters?: {
            raw?: string | undefined;
            formatted?: string | undefined;
            streetAddress?: string | undefined;
            city?: string | undefined;
            region?: string | undefined;
            postalCode?: string | undefined;
            country?: string | undefined;
            countryCode?: string | undefined;
            timeZone?: string | undefined;
            remote?: boolean | undefined;
            coordinates?: {
                latitude: number;
                longitude: number;
            } | undefined;
        } | undefined;
        locations?: {
            raw?: string | undefined;
            formatted?: string | undefined;
            streetAddress?: string | undefined;
            city?: string | undefined;
            region?: string | undefined;
            postalCode?: string | undefined;
            country?: string | undefined;
            countryCode?: string | undefined;
            timeZone?: string | undefined;
            remote?: boolean | undefined;
            coordinates?: {
                latitude: number;
                longitude: number;
            } | undefined;
        }[] | undefined;
        remoteFriendly?: boolean | undefined;
        foundedAt?: unknown;
        emails?: string[] | undefined;
        phoneNumbers?: string[] | undefined;
        socialProfiles?: {
            type: "website" | "linkedin" | "twitter" | "facebook" | "instagram" | "github" | "youtube" | "glassdoor" | "crunchbase" | "angelList" | "other";
            url: string;
            handle?: string | undefined;
        }[] | undefined;
        metadata?: Record<string, unknown> | undefined;
    }>;
    status: z.ZodOptional<z.ZodEnum<["open", "closed", "draft"]>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    url: string;
    identifier: {
        externalId: string;
        source: string;
        url?: string | undefined;
    };
    title: string;
    organization: {
        name: string;
        id?: string | undefined;
        identifier?: {
            externalId?: string | undefined;
            source?: string | undefined;
            slug?: string | undefined;
        } | undefined;
        legalName?: string | undefined;
        description?: string | undefined;
        websiteUrl?: string | undefined;
        careersUrl?: string | undefined;
        logoUrl?: string | undefined;
        industries?: string[] | undefined;
        size?: {
            label?: string | undefined;
            min?: number | undefined;
            max?: number | undefined;
        } | undefined;
        headquarters?: {
            raw?: string | undefined;
            formatted?: string | undefined;
            streetAddress?: string | undefined;
            city?: string | undefined;
            region?: string | undefined;
            postalCode?: string | undefined;
            country?: string | undefined;
            countryCode?: string | undefined;
            timeZone?: string | undefined;
            remote?: boolean | undefined;
            coordinates?: {
                latitude: number;
                longitude: number;
            } | undefined;
        } | undefined;
        locations?: {
            raw?: string | undefined;
            formatted?: string | undefined;
            streetAddress?: string | undefined;
            city?: string | undefined;
            region?: string | undefined;
            postalCode?: string | undefined;
            country?: string | undefined;
            countryCode?: string | undefined;
            timeZone?: string | undefined;
            remote?: boolean | undefined;
            coordinates?: {
                latitude: number;
                longitude: number;
            } | undefined;
        }[] | undefined;
        remoteFriendly?: boolean | undefined;
        foundedAt?: Date | undefined;
        emails?: string[] | undefined;
        phoneNumbers?: string[] | undefined;
        socialProfiles?: {
            type: "website" | "linkedin" | "twitter" | "facebook" | "instagram" | "github" | "youtube" | "glassdoor" | "crunchbase" | "angelList" | "other";
            url: string;
            handle?: string | undefined;
        }[] | undefined;
        metadata?: Record<string, unknown> | undefined;
    };
    status?: "open" | "closed" | "draft" | undefined;
    remote?: boolean | undefined;
    id?: string | undefined;
    description?: string | undefined;
    locations?: [{
        raw?: string | undefined;
        formatted?: string | undefined;
        streetAddress?: string | undefined;
        city?: string | undefined;
        region?: string | undefined;
        postalCode?: string | undefined;
        country?: string | undefined;
        countryCode?: string | undefined;
        timeZone?: string | undefined;
        remote?: boolean | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
    }, ...{
        raw?: string | undefined;
        formatted?: string | undefined;
        streetAddress?: string | undefined;
        city?: string | undefined;
        region?: string | undefined;
        postalCode?: string | undefined;
        country?: string | undefined;
        countryCode?: string | undefined;
        timeZone?: string | undefined;
        remote?: boolean | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
    }[]] | undefined;
    metadata?: Record<string, unknown> | undefined;
    summary?: string | undefined;
    language?: string | undefined;
    applicationUrl?: string | undefined;
    postedAt?: Date | undefined;
    updatedAt?: Date | undefined;
    closesAt?: Date | undefined;
    employmentType?: "other" | "full_time" | "part_time" | "contract" | "temporary" | "internship" | "volunteer" | "freelance" | undefined;
    experienceLevel?: "intern" | "entry" | "mid" | "senior" | "lead" | "director" | "executive" | undefined;
    workplaceType?: "remote" | "onsite" | "hybrid" | "flexible" | undefined;
    compensation?: {
        currency: string;
        periodicity: "hour" | "day" | "week" | "month" | "year" | "total";
        minAmount?: number | undefined;
        maxAmount?: number | undefined;
        isEstimated?: boolean | undefined;
        visible?: boolean | undefined;
        notes?: string | undefined;
    } | undefined;
    primaryLocation?: {
        raw?: string | undefined;
        formatted?: string | undefined;
        streetAddress?: string | undefined;
        city?: string | undefined;
        region?: string | undefined;
        postalCode?: string | undefined;
        country?: string | undefined;
        countryCode?: string | undefined;
        timeZone?: string | undefined;
        remote?: boolean | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
    } | undefined;
    tags?: string[] | undefined;
    skills?: string[] | undefined;
    benefits?: string[] | undefined;
    keywords?: string[] | undefined;
}, {
    url: string;
    identifier: {
        externalId: string;
        source: string;
        url?: string | undefined;
    };
    title: string;
    organization: {
        name: string;
        id?: string | undefined;
        identifier?: {
            externalId?: string | undefined;
            source?: string | undefined;
            slug?: string | undefined;
        } | undefined;
        legalName?: string | undefined;
        description?: string | undefined;
        websiteUrl?: string | undefined;
        careersUrl?: string | undefined;
        logoUrl?: string | undefined;
        industries?: string[] | undefined;
        size?: {
            label?: string | undefined;
            min?: number | undefined;
            max?: number | undefined;
        } | undefined;
        headquarters?: {
            raw?: string | undefined;
            formatted?: string | undefined;
            streetAddress?: string | undefined;
            city?: string | undefined;
            region?: string | undefined;
            postalCode?: string | undefined;
            country?: string | undefined;
            countryCode?: string | undefined;
            timeZone?: string | undefined;
            remote?: boolean | undefined;
            coordinates?: {
                latitude: number;
                longitude: number;
            } | undefined;
        } | undefined;
        locations?: {
            raw?: string | undefined;
            formatted?: string | undefined;
            streetAddress?: string | undefined;
            city?: string | undefined;
            region?: string | undefined;
            postalCode?: string | undefined;
            country?: string | undefined;
            countryCode?: string | undefined;
            timeZone?: string | undefined;
            remote?: boolean | undefined;
            coordinates?: {
                latitude: number;
                longitude: number;
            } | undefined;
        }[] | undefined;
        remoteFriendly?: boolean | undefined;
        foundedAt?: unknown;
        emails?: string[] | undefined;
        phoneNumbers?: string[] | undefined;
        socialProfiles?: {
            type: "website" | "linkedin" | "twitter" | "facebook" | "instagram" | "github" | "youtube" | "glassdoor" | "crunchbase" | "angelList" | "other";
            url: string;
            handle?: string | undefined;
        }[] | undefined;
        metadata?: Record<string, unknown> | undefined;
    };
    status?: "open" | "closed" | "draft" | undefined;
    remote?: boolean | undefined;
    id?: string | undefined;
    description?: string | undefined;
    locations?: [{
        raw?: string | undefined;
        formatted?: string | undefined;
        streetAddress?: string | undefined;
        city?: string | undefined;
        region?: string | undefined;
        postalCode?: string | undefined;
        country?: string | undefined;
        countryCode?: string | undefined;
        timeZone?: string | undefined;
        remote?: boolean | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
    }, ...{
        raw?: string | undefined;
        formatted?: string | undefined;
        streetAddress?: string | undefined;
        city?: string | undefined;
        region?: string | undefined;
        postalCode?: string | undefined;
        country?: string | undefined;
        countryCode?: string | undefined;
        timeZone?: string | undefined;
        remote?: boolean | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
    }[]] | undefined;
    metadata?: Record<string, unknown> | undefined;
    summary?: string | undefined;
    language?: string | undefined;
    applicationUrl?: string | undefined;
    postedAt?: unknown;
    updatedAt?: unknown;
    closesAt?: unknown;
    employmentType?: "other" | "full_time" | "part_time" | "contract" | "temporary" | "internship" | "volunteer" | "freelance" | undefined;
    experienceLevel?: "intern" | "entry" | "mid" | "senior" | "lead" | "director" | "executive" | undefined;
    workplaceType?: "remote" | "onsite" | "hybrid" | "flexible" | undefined;
    compensation?: {
        currency: string;
        periodicity: "hour" | "day" | "week" | "month" | "year" | "total";
        minAmount?: number | undefined;
        maxAmount?: number | undefined;
        isEstimated?: boolean | undefined;
        visible?: boolean | undefined;
        notes?: string | undefined;
    } | undefined;
    primaryLocation?: {
        raw?: string | undefined;
        formatted?: string | undefined;
        streetAddress?: string | undefined;
        city?: string | undefined;
        region?: string | undefined;
        postalCode?: string | undefined;
        country?: string | undefined;
        countryCode?: string | undefined;
        timeZone?: string | undefined;
        remote?: boolean | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
    } | undefined;
    tags?: string[] | undefined;
    skills?: string[] | undefined;
    benefits?: string[] | undefined;
    keywords?: string[] | undefined;
}>, {
    url: string;
    identifier: {
        externalId: string;
        source: string;
        url?: string | undefined;
    };
    title: string;
    organization: {
        name: string;
        id?: string | undefined;
        identifier?: {
            externalId?: string | undefined;
            source?: string | undefined;
            slug?: string | undefined;
        } | undefined;
        legalName?: string | undefined;
        description?: string | undefined;
        websiteUrl?: string | undefined;
        careersUrl?: string | undefined;
        logoUrl?: string | undefined;
        industries?: string[] | undefined;
        size?: {
            label?: string | undefined;
            min?: number | undefined;
            max?: number | undefined;
        } | undefined;
        headquarters?: {
            raw?: string | undefined;
            formatted?: string | undefined;
            streetAddress?: string | undefined;
            city?: string | undefined;
            region?: string | undefined;
            postalCode?: string | undefined;
            country?: string | undefined;
            countryCode?: string | undefined;
            timeZone?: string | undefined;
            remote?: boolean | undefined;
            coordinates?: {
                latitude: number;
                longitude: number;
            } | undefined;
        } | undefined;
        locations?: {
            raw?: string | undefined;
            formatted?: string | undefined;
            streetAddress?: string | undefined;
            city?: string | undefined;
            region?: string | undefined;
            postalCode?: string | undefined;
            country?: string | undefined;
            countryCode?: string | undefined;
            timeZone?: string | undefined;
            remote?: boolean | undefined;
            coordinates?: {
                latitude: number;
                longitude: number;
            } | undefined;
        }[] | undefined;
        remoteFriendly?: boolean | undefined;
        foundedAt?: Date | undefined;
        emails?: string[] | undefined;
        phoneNumbers?: string[] | undefined;
        socialProfiles?: {
            type: "website" | "linkedin" | "twitter" | "facebook" | "instagram" | "github" | "youtube" | "glassdoor" | "crunchbase" | "angelList" | "other";
            url: string;
            handle?: string | undefined;
        }[] | undefined;
        metadata?: Record<string, unknown> | undefined;
    };
    status?: "open" | "closed" | "draft" | undefined;
    remote?: boolean | undefined;
    id?: string | undefined;
    description?: string | undefined;
    locations?: [{
        raw?: string | undefined;
        formatted?: string | undefined;
        streetAddress?: string | undefined;
        city?: string | undefined;
        region?: string | undefined;
        postalCode?: string | undefined;
        country?: string | undefined;
        countryCode?: string | undefined;
        timeZone?: string | undefined;
        remote?: boolean | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
    }, ...{
        raw?: string | undefined;
        formatted?: string | undefined;
        streetAddress?: string | undefined;
        city?: string | undefined;
        region?: string | undefined;
        postalCode?: string | undefined;
        country?: string | undefined;
        countryCode?: string | undefined;
        timeZone?: string | undefined;
        remote?: boolean | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
    }[]] | undefined;
    metadata?: Record<string, unknown> | undefined;
    summary?: string | undefined;
    language?: string | undefined;
    applicationUrl?: string | undefined;
    postedAt?: Date | undefined;
    updatedAt?: Date | undefined;
    closesAt?: Date | undefined;
    employmentType?: "other" | "full_time" | "part_time" | "contract" | "temporary" | "internship" | "volunteer" | "freelance" | undefined;
    experienceLevel?: "intern" | "entry" | "mid" | "senior" | "lead" | "director" | "executive" | undefined;
    workplaceType?: "remote" | "onsite" | "hybrid" | "flexible" | undefined;
    compensation?: {
        currency: string;
        periodicity: "hour" | "day" | "week" | "month" | "year" | "total";
        minAmount?: number | undefined;
        maxAmount?: number | undefined;
        isEstimated?: boolean | undefined;
        visible?: boolean | undefined;
        notes?: string | undefined;
    } | undefined;
    primaryLocation?: {
        raw?: string | undefined;
        formatted?: string | undefined;
        streetAddress?: string | undefined;
        city?: string | undefined;
        region?: string | undefined;
        postalCode?: string | undefined;
        country?: string | undefined;
        countryCode?: string | undefined;
        timeZone?: string | undefined;
        remote?: boolean | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
    } | undefined;
    tags?: string[] | undefined;
    skills?: string[] | undefined;
    benefits?: string[] | undefined;
    keywords?: string[] | undefined;
}, {
    url: string;
    identifier: {
        externalId: string;
        source: string;
        url?: string | undefined;
    };
    title: string;
    organization: {
        name: string;
        id?: string | undefined;
        identifier?: {
            externalId?: string | undefined;
            source?: string | undefined;
            slug?: string | undefined;
        } | undefined;
        legalName?: string | undefined;
        description?: string | undefined;
        websiteUrl?: string | undefined;
        careersUrl?: string | undefined;
        logoUrl?: string | undefined;
        industries?: string[] | undefined;
        size?: {
            label?: string | undefined;
            min?: number | undefined;
            max?: number | undefined;
        } | undefined;
        headquarters?: {
            raw?: string | undefined;
            formatted?: string | undefined;
            streetAddress?: string | undefined;
            city?: string | undefined;
            region?: string | undefined;
            postalCode?: string | undefined;
            country?: string | undefined;
            countryCode?: string | undefined;
            timeZone?: string | undefined;
            remote?: boolean | undefined;
            coordinates?: {
                latitude: number;
                longitude: number;
            } | undefined;
        } | undefined;
        locations?: {
            raw?: string | undefined;
            formatted?: string | undefined;
            streetAddress?: string | undefined;
            city?: string | undefined;
            region?: string | undefined;
            postalCode?: string | undefined;
            country?: string | undefined;
            countryCode?: string | undefined;
            timeZone?: string | undefined;
            remote?: boolean | undefined;
            coordinates?: {
                latitude: number;
                longitude: number;
            } | undefined;
        }[] | undefined;
        remoteFriendly?: boolean | undefined;
        foundedAt?: unknown;
        emails?: string[] | undefined;
        phoneNumbers?: string[] | undefined;
        socialProfiles?: {
            type: "website" | "linkedin" | "twitter" | "facebook" | "instagram" | "github" | "youtube" | "glassdoor" | "crunchbase" | "angelList" | "other";
            url: string;
            handle?: string | undefined;
        }[] | undefined;
        metadata?: Record<string, unknown> | undefined;
    };
    status?: "open" | "closed" | "draft" | undefined;
    remote?: boolean | undefined;
    id?: string | undefined;
    description?: string | undefined;
    locations?: [{
        raw?: string | undefined;
        formatted?: string | undefined;
        streetAddress?: string | undefined;
        city?: string | undefined;
        region?: string | undefined;
        postalCode?: string | undefined;
        country?: string | undefined;
        countryCode?: string | undefined;
        timeZone?: string | undefined;
        remote?: boolean | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
    }, ...{
        raw?: string | undefined;
        formatted?: string | undefined;
        streetAddress?: string | undefined;
        city?: string | undefined;
        region?: string | undefined;
        postalCode?: string | undefined;
        country?: string | undefined;
        countryCode?: string | undefined;
        timeZone?: string | undefined;
        remote?: boolean | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
    }[]] | undefined;
    metadata?: Record<string, unknown> | undefined;
    summary?: string | undefined;
    language?: string | undefined;
    applicationUrl?: string | undefined;
    postedAt?: unknown;
    updatedAt?: unknown;
    closesAt?: unknown;
    employmentType?: "other" | "full_time" | "part_time" | "contract" | "temporary" | "internship" | "volunteer" | "freelance" | undefined;
    experienceLevel?: "intern" | "entry" | "mid" | "senior" | "lead" | "director" | "executive" | undefined;
    workplaceType?: "remote" | "onsite" | "hybrid" | "flexible" | undefined;
    compensation?: {
        currency: string;
        periodicity: "hour" | "day" | "week" | "month" | "year" | "total";
        minAmount?: number | undefined;
        maxAmount?: number | undefined;
        isEstimated?: boolean | undefined;
        visible?: boolean | undefined;
        notes?: string | undefined;
    } | undefined;
    primaryLocation?: {
        raw?: string | undefined;
        formatted?: string | undefined;
        streetAddress?: string | undefined;
        city?: string | undefined;
        region?: string | undefined;
        postalCode?: string | undefined;
        country?: string | undefined;
        countryCode?: string | undefined;
        timeZone?: string | undefined;
        remote?: boolean | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
    } | undefined;
    tags?: string[] | undefined;
    skills?: string[] | undefined;
    benefits?: string[] | undefined;
    keywords?: string[] | undefined;
}>;
type NormalizedJob = z.infer<typeof NormalizedJobSchema>;

declare const OrganizationIdentifierSchema: z.ZodEffects<z.ZodObject<{
    externalId: z.ZodOptional<z.ZodString>;
    source: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    externalId?: string | undefined;
    source?: string | undefined;
    slug?: string | undefined;
}, {
    externalId?: string | undefined;
    source?: string | undefined;
    slug?: string | undefined;
}>, {
    externalId?: string | undefined;
    source?: string | undefined;
    slug?: string | undefined;
}, {
    externalId?: string | undefined;
    source?: string | undefined;
    slug?: string | undefined;
}>;
type OrganizationIdentifier = z.infer<typeof OrganizationIdentifierSchema>;
declare const OrganizationSizeSchema: z.ZodEffects<z.ZodObject<{
    label: z.ZodOptional<z.ZodString>;
    min: z.ZodOptional<z.ZodNumber>;
    max: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    label?: string | undefined;
    min?: number | undefined;
    max?: number | undefined;
}, {
    label?: string | undefined;
    min?: number | undefined;
    max?: number | undefined;
}>, {
    label?: string | undefined;
    min?: number | undefined;
    max?: number | undefined;
}, {
    label?: string | undefined;
    min?: number | undefined;
    max?: number | undefined;
}>;
type OrganizationSize = z.infer<typeof OrganizationSizeSchema>;
declare const SocialProfileSchema: z.ZodObject<{
    type: z.ZodEnum<["website", "linkedin", "twitter", "facebook", "instagram", "github", "youtube", "glassdoor", "crunchbase", "angelList", "other"]>;
    url: z.ZodString;
    handle: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "website" | "linkedin" | "twitter" | "facebook" | "instagram" | "github" | "youtube" | "glassdoor" | "crunchbase" | "angelList" | "other";
    url: string;
    handle?: string | undefined;
}, {
    type: "website" | "linkedin" | "twitter" | "facebook" | "instagram" | "github" | "youtube" | "glassdoor" | "crunchbase" | "angelList" | "other";
    url: string;
    handle?: string | undefined;
}>;
type SocialProfile = z.infer<typeof SocialProfileSchema>;
declare const NormalizedOrganizationSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    identifier: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        externalId: z.ZodOptional<z.ZodString>;
        source: z.ZodOptional<z.ZodString>;
        slug: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        externalId?: string | undefined;
        source?: string | undefined;
        slug?: string | undefined;
    }, {
        externalId?: string | undefined;
        source?: string | undefined;
        slug?: string | undefined;
    }>, {
        externalId?: string | undefined;
        source?: string | undefined;
        slug?: string | undefined;
    }, {
        externalId?: string | undefined;
        source?: string | undefined;
        slug?: string | undefined;
    }>>;
    name: z.ZodString;
    legalName: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    websiteUrl: z.ZodOptional<z.ZodString>;
    careersUrl: z.ZodOptional<z.ZodString>;
    logoUrl: z.ZodOptional<z.ZodString>;
    industries: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    size: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        label: z.ZodOptional<z.ZodString>;
        min: z.ZodOptional<z.ZodNumber>;
        max: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        label?: string | undefined;
        min?: number | undefined;
        max?: number | undefined;
    }, {
        label?: string | undefined;
        min?: number | undefined;
        max?: number | undefined;
    }>, {
        label?: string | undefined;
        min?: number | undefined;
        max?: number | undefined;
    }, {
        label?: string | undefined;
        min?: number | undefined;
        max?: number | undefined;
    }>>;
    headquarters: z.ZodOptional<z.ZodObject<{
        raw: z.ZodOptional<z.ZodString>;
        formatted: z.ZodOptional<z.ZodString>;
        streetAddress: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodString>;
        region: z.ZodOptional<z.ZodString>;
        postalCode: z.ZodOptional<z.ZodString>;
        country: z.ZodOptional<z.ZodString>;
        countryCode: z.ZodOptional<z.ZodString>;
        timeZone: z.ZodOptional<z.ZodString>;
        remote: z.ZodOptional<z.ZodBoolean>;
        coordinates: z.ZodOptional<z.ZodObject<{
            latitude: z.ZodNumber;
            longitude: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            latitude: number;
            longitude: number;
        }, {
            latitude: number;
            longitude: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        raw?: string | undefined;
        formatted?: string | undefined;
        streetAddress?: string | undefined;
        city?: string | undefined;
        region?: string | undefined;
        postalCode?: string | undefined;
        country?: string | undefined;
        countryCode?: string | undefined;
        timeZone?: string | undefined;
        remote?: boolean | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
    }, {
        raw?: string | undefined;
        formatted?: string | undefined;
        streetAddress?: string | undefined;
        city?: string | undefined;
        region?: string | undefined;
        postalCode?: string | undefined;
        country?: string | undefined;
        countryCode?: string | undefined;
        timeZone?: string | undefined;
        remote?: boolean | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
    }>>;
    locations: z.ZodOptional<z.ZodArray<z.ZodObject<{
        raw: z.ZodOptional<z.ZodString>;
        formatted: z.ZodOptional<z.ZodString>;
        streetAddress: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodString>;
        region: z.ZodOptional<z.ZodString>;
        postalCode: z.ZodOptional<z.ZodString>;
        country: z.ZodOptional<z.ZodString>;
        countryCode: z.ZodOptional<z.ZodString>;
        timeZone: z.ZodOptional<z.ZodString>;
        remote: z.ZodOptional<z.ZodBoolean>;
        coordinates: z.ZodOptional<z.ZodObject<{
            latitude: z.ZodNumber;
            longitude: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            latitude: number;
            longitude: number;
        }, {
            latitude: number;
            longitude: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        raw?: string | undefined;
        formatted?: string | undefined;
        streetAddress?: string | undefined;
        city?: string | undefined;
        region?: string | undefined;
        postalCode?: string | undefined;
        country?: string | undefined;
        countryCode?: string | undefined;
        timeZone?: string | undefined;
        remote?: boolean | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
    }, {
        raw?: string | undefined;
        formatted?: string | undefined;
        streetAddress?: string | undefined;
        city?: string | undefined;
        region?: string | undefined;
        postalCode?: string | undefined;
        country?: string | undefined;
        countryCode?: string | undefined;
        timeZone?: string | undefined;
        remote?: boolean | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
    }>, "many">>;
    remoteFriendly: z.ZodOptional<z.ZodBoolean>;
    foundedAt: z.ZodOptional<z.ZodEffects<z.ZodDate, Date, unknown>>;
    emails: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    phoneNumbers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    socialProfiles: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["website", "linkedin", "twitter", "facebook", "instagram", "github", "youtube", "glassdoor", "crunchbase", "angelList", "other"]>;
        url: z.ZodString;
        handle: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "website" | "linkedin" | "twitter" | "facebook" | "instagram" | "github" | "youtube" | "glassdoor" | "crunchbase" | "angelList" | "other";
        url: string;
        handle?: string | undefined;
    }, {
        type: "website" | "linkedin" | "twitter" | "facebook" | "instagram" | "github" | "youtube" | "glassdoor" | "crunchbase" | "angelList" | "other";
        url: string;
        handle?: string | undefined;
    }>, "many">>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    id?: string | undefined;
    identifier?: {
        externalId?: string | undefined;
        source?: string | undefined;
        slug?: string | undefined;
    } | undefined;
    legalName?: string | undefined;
    description?: string | undefined;
    websiteUrl?: string | undefined;
    careersUrl?: string | undefined;
    logoUrl?: string | undefined;
    industries?: string[] | undefined;
    size?: {
        label?: string | undefined;
        min?: number | undefined;
        max?: number | undefined;
    } | undefined;
    headquarters?: {
        raw?: string | undefined;
        formatted?: string | undefined;
        streetAddress?: string | undefined;
        city?: string | undefined;
        region?: string | undefined;
        postalCode?: string | undefined;
        country?: string | undefined;
        countryCode?: string | undefined;
        timeZone?: string | undefined;
        remote?: boolean | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
    } | undefined;
    locations?: {
        raw?: string | undefined;
        formatted?: string | undefined;
        streetAddress?: string | undefined;
        city?: string | undefined;
        region?: string | undefined;
        postalCode?: string | undefined;
        country?: string | undefined;
        countryCode?: string | undefined;
        timeZone?: string | undefined;
        remote?: boolean | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
    }[] | undefined;
    remoteFriendly?: boolean | undefined;
    foundedAt?: Date | undefined;
    emails?: string[] | undefined;
    phoneNumbers?: string[] | undefined;
    socialProfiles?: {
        type: "website" | "linkedin" | "twitter" | "facebook" | "instagram" | "github" | "youtube" | "glassdoor" | "crunchbase" | "angelList" | "other";
        url: string;
        handle?: string | undefined;
    }[] | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    name: string;
    id?: string | undefined;
    identifier?: {
        externalId?: string | undefined;
        source?: string | undefined;
        slug?: string | undefined;
    } | undefined;
    legalName?: string | undefined;
    description?: string | undefined;
    websiteUrl?: string | undefined;
    careersUrl?: string | undefined;
    logoUrl?: string | undefined;
    industries?: string[] | undefined;
    size?: {
        label?: string | undefined;
        min?: number | undefined;
        max?: number | undefined;
    } | undefined;
    headquarters?: {
        raw?: string | undefined;
        formatted?: string | undefined;
        streetAddress?: string | undefined;
        city?: string | undefined;
        region?: string | undefined;
        postalCode?: string | undefined;
        country?: string | undefined;
        countryCode?: string | undefined;
        timeZone?: string | undefined;
        remote?: boolean | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
    } | undefined;
    locations?: {
        raw?: string | undefined;
        formatted?: string | undefined;
        streetAddress?: string | undefined;
        city?: string | undefined;
        region?: string | undefined;
        postalCode?: string | undefined;
        country?: string | undefined;
        countryCode?: string | undefined;
        timeZone?: string | undefined;
        remote?: boolean | undefined;
        coordinates?: {
            latitude: number;
            longitude: number;
        } | undefined;
    }[] | undefined;
    remoteFriendly?: boolean | undefined;
    foundedAt?: unknown;
    emails?: string[] | undefined;
    phoneNumbers?: string[] | undefined;
    socialProfiles?: {
        type: "website" | "linkedin" | "twitter" | "facebook" | "instagram" | "github" | "youtube" | "glassdoor" | "crunchbase" | "angelList" | "other";
        url: string;
        handle?: string | undefined;
    }[] | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
type NormalizedOrganization = z.infer<typeof NormalizedOrganizationSchema>;

interface PaginationParams {
    cursor?: string;
    page?: number;
    pageSize?: number;
    limit?: number;
}
interface AdapterFilter {
    search?: string;
    locations?: Location[];
    employmentTypes?: EmploymentType[];
    experienceLevels?: ExperienceLevel[];
    workplaceTypes?: WorkplaceType[];
    remoteOnly?: boolean;
    includeClosed?: boolean;
    tags?: string[];
    metadata?: Record<string, unknown>;
}
interface AdapterFetchParams {
    pagination?: PaginationParams;
    since?: Date;
    until?: Date;
    filters?: AdapterFilter;
    signal?: AbortSignal;
    metadata?: Record<string, unknown>;
}
declare const buildJobFingerprint: (job: NormalizedJob) => string;

interface RateLimitTelemetry {
    limit?: number;
    remaining?: number;
    resetAt?: Date;
    periodSeconds?: number;
}
interface AdapterTelemetry {
    source: string;
    requestCount: number;
    itemsReceived: number;
    durationMs?: number;
    warnings?: string[];
    rateLimit?: RateLimitTelemetry;
    metadata?: Record<string, unknown>;
}
interface AdapterPullResult {
    jobs: NormalizedJob[];
    organizations: NormalizedOrganization[];
    nextCursor?: string;
    telemetry: AdapterTelemetry;
}
interface HydrateCompanyParams {
    organization: NormalizedOrganization;
    signal?: AbortSignal;
    metadata?: Record<string, unknown>;
}
interface HydrateCompanyResult {
    organization: NormalizedOrganization;
    telemetry: AdapterTelemetry;
}
declare abstract class JobSourceAdapter {
    readonly source: string;
    protected constructor(source: string);
    abstract pullListings(params: AdapterFetchParams): Promise<AdapterPullResult>;
    abstract hydrateCompany(params: HydrateCompanyParams): Promise<HydrateCompanyResult>;
    protected createTelemetry(overrides?: Partial<Omit<AdapterTelemetry, 'source'>>): AdapterTelemetry;
}

interface JoobleClientOptions {
    /** Override the API key used for authentication. Defaults to process.env.JOOBLE_API_KEY. */
    apiKey?: string;
    /** Override the base URL used by the HTTP client. */
    baseURL?: string;
    /** Provide a preconfigured axios instance (mainly for testing). */
    httpClient?: AxiosInstance;
    /** Enable axios proxy resolution. Disabled by default to keep tests deterministic. */
    useProxy?: boolean;
}
interface JoobleSearchRequest {
    keywords?: string;
    location?: string;
    radius?: number;
    page?: number;
    size?: number;
}
interface JoobleJob {
    id: string;
    title: string;
    location?: string;
    snippet?: string;
    salary?: string;
    type?: string;
    company?: string;
    link?: string;
    updated?: string;
    published?: string;
}
interface JoobleSearchResponse {
    totalCount?: number;
    jobs: JoobleJob[];
    error?: string;
}
interface JoobleClientResult {
    data: JoobleSearchResponse;
    durationMs: number;
    status: number;
}
declare function assertApiKey(apiKey?: string): string;
declare function cleanPayload(payload: JoobleSearchRequest): JoobleSearchRequest;
declare class JoobleClient {
    private readonly apiKey;
    private readonly http;
    constructor(options?: JoobleClientOptions);
    search(payload: JoobleSearchRequest, options?: {
        signal?: AbortSignal;
    }): Promise<JoobleClientResult>;
}

interface JoobleAdapterMetadata {
    keywords?: string[] | string;
    location?: string;
    radius?: number;
    page?: number | string;
    pageSize?: number | string;
}
interface JoobleAdapterConfig {
    keywords?: string[];
    location?: string;
    radius?: number;
    page: number;
    pageSize: number;
}
declare function parseKeywords(raw?: string | string[]): string[] | undefined;
declare function parseNumber(raw?: number | string | null): number | undefined;
declare function parseDate(raw?: string): Date | undefined;
declare function parseLocation(raw?: string): {
    raw: string;
    city: string;
    region: string | undefined;
    country: string | undefined;
} | undefined;
declare function parseSalary(raw?: string | null): string | undefined;
declare function slugify(value: string): string;
declare function toNormalized(job: JoobleJob): {
    job: NormalizedJob;
    organization: NormalizedOrganization;
} | null;
declare function buildConfig(params?: AdapterFetchParams, env?: NodeJS.ProcessEnv): JoobleAdapterConfig;
declare class JoobleAdapter extends JobSourceAdapter {
    readonly name = "Jooble";
    readonly source = "jooble";
    private readonly client;
    constructor(client?: JoobleClient);
    pullListings(params?: AdapterFetchParams): Promise<AdapterPullResult>;
    hydrateCompany({ organization }: HydrateCompanyParams): Promise<HydrateCompanyResult>;
}
declare function createJoobleAdapter(client?: JoobleClient): JoobleAdapter;

interface IngestedJob {
    job: NormalizedJob;
    fingerprint: string;
}
interface JobIngestionSummary {
    fetched: number;
    processed: number;
    deduplicated: number;
    created: number;
    updated: number;
    closed: number;
}
interface JobIngestRunRecord {
    id: string;
    startedAt: Date;
}
interface StartJobIngestRunParams {
    adapter: string;
    provider?: string;
    parameters?: Record<string, unknown>;
    startedAt: Date;
}
interface PersistJobIngestionParams {
    runId: string;
    provider: string;
    jobs: IngestedJob[];
    organizations: NormalizedOrganization[];
    startedAt: Date;
}
interface PersistJobIngestionResult {
    created: number;
    updated: number;
    closed: number;
}
interface CompleteJobIngestRunParams {
    runId: string;
    telemetry: AdapterTelemetry;
    summary: JobIngestionSummary;
    finishedAt: Date;
}
interface FailJobIngestRunParams {
    runId: string;
    error: unknown;
    finishedAt: Date;
}
interface JobIngestionRepository {
    startRun(params: StartJobIngestRunParams): Promise<JobIngestRunRecord>;
    persistIngestion(params: PersistJobIngestionParams): Promise<PersistJobIngestionResult>;
    completeRun(params: CompleteJobIngestRunParams): Promise<void>;
    failRun(params: FailJobIngestRunParams): Promise<void>;
}
interface JobIngestionRunnerOptions {
    adapter: JobSourceAdapter;
    repository: JobIngestionRepository;
    fetchParams?: AdapterFetchParams;
    now?: () => Date;
}
interface JobIngestionResult {
    runId: string;
    jobs: NormalizedJob[];
    organizations: NormalizedOrganization[];
    telemetry: AdapterTelemetry;
    summary: JobIngestionSummary;
}

declare class SupabaseJobIngestionRepository implements JobIngestionRepository {
    private readonly client;
    private readonly now;
    constructor(client: SupabaseClient, now?: () => Date);
    startRun(params: StartJobIngestRunParams): Promise<JobIngestRunRecord>;
    persistIngestion(params: PersistJobIngestionParams): Promise<PersistJobIngestionResult>;
    completeRun(params: CompleteJobIngestRunParams): Promise<void>;
    failRun(params: FailJobIngestRunParams): Promise<void>;
}

declare const runJobIngestion: (options: JobIngestionRunnerOptions) => Promise<JobIngestionResult>;

type AdapterFactory = (env: NodeJS.ProcessEnv) => JobSourceAdapter;
interface SyncJobSourcesOptions {
    argv?: string[];
    env?: NodeJS.ProcessEnv;
    ingest?: (options: JobIngestionRunnerOptions) => Promise<JobIngestionResult>;
    adapters?: Record<string, AdapterFactory>;
    repository?: JobIngestionRepository;
    logger?: Pick<typeof console, 'info'>;
}
declare function syncJobSources(options?: SyncJobSourcesOptions): Promise<JobIngestionResult>;

export { type AdapterFetchParams, type AdapterFilter, type AdapterPullResult, type AdapterTelemetry, type Compensation, type CompensationFrequency, CompensationFrequencySchema, CompensationSchema, type CompleteJobIngestRunParams, type Coordinates, CoordinatesSchema, type DateTime, DateTimeSchema, type EmploymentType, EmploymentTypeSchema, type ExperienceLevel, ExperienceLevelSchema, type FailJobIngestRunParams, type HydrateCompanyParams, type HydrateCompanyResult, type IngestedJob, type JobIdentifier, JobIdentifierSchema, type JobIngestRunRecord, type JobIngestionRepository, type JobIngestionResult, type JobIngestionRunnerOptions, type JobIngestionSummary, JobSourceAdapter, type JobStatus, JobStatusSchema, JoobleAdapter, type JoobleAdapterConfig, type JoobleAdapterMetadata, JoobleClient, type JoobleClientOptions, type JoobleClientResult, type JoobleJob, type JoobleSearchRequest, type JoobleSearchResponse, type Location, LocationSchema, type NormalizedJob, NormalizedJobSchema, type NormalizedOrganization, NormalizedOrganizationSchema, type OrganizationIdentifier, OrganizationIdentifierSchema, type OrganizationSize, OrganizationSizeSchema, type PaginationParams, type PersistJobIngestionParams, type PersistJobIngestionResult, type RateLimitTelemetry, type SocialProfile, SocialProfileSchema, type StartJobIngestRunParams, SupabaseJobIngestionRepository, type SyncJobSourcesOptions, type WorkplaceType, WorkplaceTypeSchema, assertApiKey, buildConfig, buildJobFingerprint, cleanPayload, createJoobleAdapter, parseDate, parseKeywords, parseLocation, parseNumber, parseSalary, runJobIngestion, slugify, syncJobSources, toNormalized };
