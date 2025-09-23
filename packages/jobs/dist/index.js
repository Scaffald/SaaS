"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  CompensationFrequencySchema: () => CompensationFrequencySchema,
  CompensationSchema: () => CompensationSchema,
  CoordinatesSchema: () => CoordinatesSchema,
  DateTimeSchema: () => DateTimeSchema,
  EmploymentTypeSchema: () => EmploymentTypeSchema,
  ExperienceLevelSchema: () => ExperienceLevelSchema,
  JobIdentifierSchema: () => JobIdentifierSchema,
  JobSourceAdapter: () => JobSourceAdapter,
  JobStatusSchema: () => JobStatusSchema,
  JoobleAdapter: () => JoobleAdapter,
  JoobleClient: () => JoobleClient,
  LocationSchema: () => LocationSchema,
  NormalizedJobSchema: () => NormalizedJobSchema,
  NormalizedOrganizationSchema: () => NormalizedOrganizationSchema,
  OrganizationIdentifierSchema: () => OrganizationIdentifierSchema,
  OrganizationSizeSchema: () => OrganizationSizeSchema,
  SocialProfileSchema: () => SocialProfileSchema,
  SupabaseJobIngestionRepository: () => SupabaseJobIngestionRepository,
  WorkplaceTypeSchema: () => WorkplaceTypeSchema,
  assertApiKey: () => assertApiKey,
  buildConfig: () => buildConfig,
  buildJobFingerprint: () => buildJobFingerprint,
  cleanPayload: () => cleanPayload,
  createJoobleAdapter: () => createJoobleAdapter,
  parseDate: () => parseDate,
  parseKeywords: () => parseKeywords,
  parseLocation: () => parseLocation,
  parseNumber: () => parseNumber,
  parseSalary: () => parseSalary,
  runJobIngestion: () => runJobIngestion,
  slugify: () => slugify,
  syncJobSources: () => syncJobSources,
  toNormalized: () => toNormalized
});
module.exports = __toCommonJS(index_exports);

// src/adapters/base.ts
var JobSourceAdapter = class {
  source;
  constructor(source) {
    this.source = source;
  }
  createTelemetry(overrides = {}) {
    return {
      source: this.source,
      requestCount: overrides.requestCount ?? 0,
      itemsReceived: overrides.itemsReceived ?? 0,
      durationMs: overrides.durationMs,
      warnings: overrides.warnings ?? [],
      rateLimit: overrides.rateLimit,
      metadata: overrides.metadata
    };
  }
};

// src/adapters/jooble/client.ts
var import_axios = __toESM(require("axios"));
var import_node_perf_hooks = require("perf_hooks");
var DEFAULT_BASE_URL = "https://jooble.org/api";
function assertApiKey(apiKey) {
  const resolved = apiKey ?? process.env.JOOBLE_API_KEY;
  if (!resolved) {
    throw new Error("JOOBLE_API_KEY is not defined");
  }
  return resolved;
}
function cleanPayload(payload) {
  const result = {};
  if (payload.keywords) {
    result.keywords = payload.keywords;
  }
  if (payload.location) {
    result.location = payload.location;
  }
  if (typeof payload.radius === "number") {
    result.radius = payload.radius;
  }
  if (typeof payload.page === "number") {
    result.page = payload.page;
  }
  if (typeof payload.size === "number") {
    result.size = payload.size;
  }
  return result;
}
var JoobleClient = class {
  apiKey;
  http;
  constructor(options = {}) {
    this.apiKey = assertApiKey(options.apiKey);
    if (options.httpClient) {
      this.http = options.httpClient;
    } else {
      const axiosConfig = { baseURL: options.baseURL ?? DEFAULT_BASE_URL };
      if (!options.useProxy) {
        axiosConfig.proxy = false;
      }
      this.http = import_axios.default.create(axiosConfig);
    }
  }
  async search(payload, options = {}) {
    const cleanedPayload = cleanPayload(payload);
    const startedAt = import_node_perf_hooks.performance.now();
    try {
      const response = await this.http.post(
        `/${this.apiKey}`,
        cleanedPayload,
        { signal: options.signal }
      );
      if (response.data?.error) {
        throw new Error(response.data.error);
      }
      const durationMs = import_node_perf_hooks.performance.now() - startedAt;
      const data = {
        totalCount: response.data?.totalCount ?? response.data?.jobs?.length ?? 0,
        jobs: response.data?.jobs ?? []
      };
      return {
        data,
        durationMs,
        status: response.status
      };
    } catch (error) {
      if (import_axios.default.isAxiosError(error)) {
        const errorMessage = typeof error.response?.data === "string" ? error.response?.data : error.response?.data?.error ?? error.message;
        throw new Error(
          `Jooble request failed (${error.response?.status ?? "no-status"}): ${errorMessage}`
        );
      }
      throw error;
    }
  }
};

// src/domain/job.ts
var import_zod3 = require("zod");

// src/domain/common.ts
var import_zod = require("zod");
var CoordinatesSchema = import_zod.z.object({
  latitude: import_zod.z.number().gte(-90).lte(90),
  longitude: import_zod.z.number().gte(-180).lte(180)
});
var LocationSchema = import_zod.z.object({
  raw: import_zod.z.string().trim().min(1).optional(),
  formatted: import_zod.z.string().trim().min(1).optional(),
  streetAddress: import_zod.z.string().trim().min(1).optional(),
  city: import_zod.z.string().trim().min(1).optional(),
  region: import_zod.z.string().trim().min(1).optional(),
  postalCode: import_zod.z.string().trim().min(1).optional(),
  country: import_zod.z.string().trim().min(2).optional(),
  countryCode: import_zod.z.string().trim().length(2).optional(),
  timeZone: import_zod.z.string().trim().min(1).optional(),
  remote: import_zod.z.boolean().optional(),
  coordinates: CoordinatesSchema.optional()
});
var CompensationFrequencySchema = import_zod.z.enum(["hour", "day", "week", "month", "year", "total"]);
var CompensationSchema = import_zod.z.object({
  currency: import_zod.z.string().trim().length(3, "Use ISO-4217 currency codes").transform((value) => value.toUpperCase()),
  minAmount: import_zod.z.number().nonnegative().optional(),
  maxAmount: import_zod.z.number().nonnegative().optional(),
  periodicity: CompensationFrequencySchema,
  isEstimated: import_zod.z.boolean().optional(),
  visible: import_zod.z.boolean().optional(),
  notes: import_zod.z.string().optional()
}).superRefine((value, ctx) => {
  if (value.minAmount === void 0 && value.maxAmount === void 0) {
    ctx.addIssue({
      code: import_zod.z.ZodIssueCode.custom,
      message: "Provide at least one compensation amount",
      path: ["minAmount"]
    });
  }
  if (value.minAmount !== void 0 && value.maxAmount !== void 0 && value.minAmount > value.maxAmount) {
    ctx.addIssue({
      code: import_zod.z.ZodIssueCode.custom,
      message: "minAmount must be less than or equal to maxAmount",
      path: ["minAmount"]
    });
  }
});
var DateTimeSchema = import_zod.z.preprocess((value) => {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return value;
}, import_zod.z.date());

// src/domain/organization.ts
var import_zod2 = require("zod");
var OrganizationIdentifierSchema = import_zod2.z.object({
  externalId: import_zod2.z.string().trim().min(1).optional(),
  source: import_zod2.z.string().trim().min(1).optional(),
  slug: import_zod2.z.string().trim().min(1).optional()
}).refine(
  (value) => Boolean(value.externalId || value.source || value.slug),
  "At least one organization identifier must be provided"
);
var OrganizationSizeSchema = import_zod2.z.object({
  label: import_zod2.z.string().trim().min(1).optional(),
  min: import_zod2.z.number().int().nonnegative().optional(),
  max: import_zod2.z.number().int().nonnegative().optional()
}).superRefine((value, ctx) => {
  if (value.min !== void 0 && value.max !== void 0 && value.min > value.max) {
    ctx.addIssue({
      code: import_zod2.z.ZodIssueCode.custom,
      message: "min must be less than or equal to max",
      path: ["min"]
    });
  }
});
var SocialProfileSchema = import_zod2.z.object({
  type: import_zod2.z.enum([
    "website",
    "linkedin",
    "twitter",
    "facebook",
    "instagram",
    "github",
    "youtube",
    "glassdoor",
    "crunchbase",
    "angelList",
    "other"
  ]),
  url: import_zod2.z.string().url(),
  handle: import_zod2.z.string().trim().min(1).optional()
});
var NormalizedOrganizationSchema = import_zod2.z.object({
  id: import_zod2.z.string().trim().min(1).optional(),
  identifier: OrganizationIdentifierSchema.optional(),
  name: import_zod2.z.string().trim().min(1),
  legalName: import_zod2.z.string().trim().min(1).optional(),
  description: import_zod2.z.string().optional(),
  websiteUrl: import_zod2.z.string().url().optional(),
  careersUrl: import_zod2.z.string().url().optional(),
  logoUrl: import_zod2.z.string().url().optional(),
  industries: import_zod2.z.array(import_zod2.z.string().trim().min(1)).optional(),
  size: OrganizationSizeSchema.optional(),
  headquarters: LocationSchema.optional(),
  locations: import_zod2.z.array(LocationSchema).optional(),
  remoteFriendly: import_zod2.z.boolean().optional(),
  foundedAt: DateTimeSchema.optional(),
  emails: import_zod2.z.array(import_zod2.z.string().email()).optional(),
  phoneNumbers: import_zod2.z.array(import_zod2.z.string().trim().min(1)).optional(),
  socialProfiles: import_zod2.z.array(SocialProfileSchema).optional(),
  metadata: import_zod2.z.record(import_zod2.z.unknown()).optional()
});

// src/domain/job.ts
var EmploymentTypeSchema = import_zod3.z.enum([
  "full_time",
  "part_time",
  "contract",
  "temporary",
  "internship",
  "volunteer",
  "freelance",
  "other"
]);
var ExperienceLevelSchema = import_zod3.z.enum([
  "intern",
  "entry",
  "mid",
  "senior",
  "lead",
  "director",
  "executive"
]);
var WorkplaceTypeSchema = import_zod3.z.enum(["onsite", "remote", "hybrid", "flexible"]);
var JobStatusSchema = import_zod3.z.enum(["open", "closed", "draft"]);
var JobIdentifierSchema = import_zod3.z.object({
  externalId: import_zod3.z.string().trim().min(1),
  source: import_zod3.z.string().trim().min(1),
  url: import_zod3.z.string().url().optional()
});
var NormalizedJobSchema = import_zod3.z.object({
  id: import_zod3.z.string().trim().min(1).optional(),
  identifier: JobIdentifierSchema,
  title: import_zod3.z.string().trim().min(1),
  url: import_zod3.z.string().url(),
  description: import_zod3.z.string().trim().min(1).optional(),
  summary: import_zod3.z.string().trim().min(1).optional(),
  language: import_zod3.z.string().trim().min(1).optional(),
  applicationUrl: import_zod3.z.string().url().optional(),
  postedAt: DateTimeSchema.optional(),
  updatedAt: DateTimeSchema.optional(),
  closesAt: DateTimeSchema.optional(),
  employmentType: EmploymentTypeSchema.optional(),
  experienceLevel: ExperienceLevelSchema.optional(),
  workplaceType: WorkplaceTypeSchema.optional(),
  compensation: CompensationSchema.optional(),
  locations: import_zod3.z.array(LocationSchema).nonempty().optional(),
  primaryLocation: LocationSchema.optional(),
  remote: import_zod3.z.boolean().optional(),
  tags: import_zod3.z.array(import_zod3.z.string().trim().min(1)).optional(),
  skills: import_zod3.z.array(import_zod3.z.string().trim().min(1)).optional(),
  benefits: import_zod3.z.array(import_zod3.z.string().trim().min(1)).optional(),
  keywords: import_zod3.z.array(import_zod3.z.string().trim().min(1)).optional(),
  organization: NormalizedOrganizationSchema,
  status: JobStatusSchema.optional(),
  metadata: import_zod3.z.record(import_zod3.z.unknown()).optional()
}).refine((value) => Boolean(value.description || value.summary), {
  message: "Provide a description or summary for the job listing",
  path: ["description"]
});

// src/adapters/jooble/adapter.ts
var DEFAULT_PAGE = 1;
var DEFAULT_PAGE_SIZE = 20;
var SOURCE_KEY = "jooble";
var SOURCE_NAME = "Jooble";
function parseKeywords(raw) {
  if (!raw) return void 0;
  if (Array.isArray(raw)) {
    return raw.map((value) => value.trim()).filter(Boolean);
  }
  return raw.split(/[,\s]+/).map((value) => value.trim()).filter(Boolean);
}
function parseNumber(raw) {
  if (raw === null || raw === void 0) return void 0;
  const value = typeof raw === "number" ? raw : Number.parseInt(raw, 10);
  return Number.isNaN(value) ? void 0 : value;
}
function parseDate(raw) {
  if (!raw) return void 0;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? void 0 : parsed;
}
function parseLocation(raw) {
  if (!raw) return void 0;
  const parts = raw.split(",").map((part) => part.trim()).filter(Boolean);
  return {
    raw,
    city: parts[0],
    region: parts.length > 1 ? parts[1] : void 0,
    country: parts.length > 2 ? parts.slice(2).join(", ") : void 0
  };
}
function parseSalary(raw) {
  if (!raw) return void 0;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : void 0;
}
function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function toNormalized(job) {
  if (!job.id || !job.title || !job.link) {
    return null;
  }
  const organizationName = job.company?.trim() || "Unknown organization";
  const organizationSlug = slugify(organizationName) || `${SOURCE_KEY}-${job.id}`;
  const organization = NormalizedOrganizationSchema.parse({
    id: organizationSlug,
    identifier: {
      externalId: organizationSlug,
      source: SOURCE_KEY,
      slug: organizationSlug
    },
    name: organizationName
  });
  const location = parseLocation(job.location);
  const postedAt = parseDate(job.published ?? job.updated);
  const updatedAt = parseDate(job.updated);
  const normalizedJob = NormalizedJobSchema.parse({
    id: `${SOURCE_KEY}-${job.id}`,
    identifier: {
      externalId: job.id,
      source: SOURCE_KEY,
      url: job.link
    },
    title: job.title,
    url: job.link,
    description: job.snippet ?? job.title,
    summary: job.snippet,
    postedAt,
    updatedAt,
    locations: location ? [location] : void 0,
    primaryLocation: location,
    organization,
    metadata: {
      rawSalary: parseSalary(job.salary),
      rawType: job.type,
      sourceUrl: job.link
    }
  });
  return { job: normalizedJob, organization: normalizedJob.organization };
}
function buildConfig(params = {}, env = process.env) {
  const defaults = {
    keywords: parseKeywords(env.JOOBLE_SEARCH_KEYWORDS),
    location: env.JOOBLE_SEARCH_LOCATION ?? void 0,
    radius: parseNumber(env.JOOBLE_SEARCH_RADIUS),
    page: DEFAULT_PAGE,
    pageSize: parseNumber(env.JOOBLE_SEARCH_PAGE_SIZE) ?? DEFAULT_PAGE_SIZE
  };
  const metadata = params.metadata ?? {};
  const metadataKeywords = parseKeywords(metadata.keywords);
  const keywords = metadataKeywords ?? parseKeywords(params.filters?.search) ?? defaults.keywords;
  const metadataLocation = metadata.location ?? void 0;
  const filtersLocation = params.filters?.locations?.[0];
  const location = metadataLocation ?? filtersLocation?.formatted ?? filtersLocation?.raw ?? filtersLocation?.city ?? defaults.location;
  const radius = parseNumber(metadata.radius) ?? defaults.radius;
  const cursorPage = parseNumber(params.pagination?.cursor ?? void 0);
  const paginationPage = params.pagination?.page;
  const metadataPage = parseNumber(metadata.page);
  const page = Math.max(metadataPage ?? paginationPage ?? cursorPage ?? defaults.page, 1);
  const metadataPageSize = parseNumber(metadata.pageSize);
  const paginationPageSize = params.pagination?.pageSize;
  const paginationLimit = params.pagination?.limit;
  const pageSize = Math.max(
    metadataPageSize ?? paginationPageSize ?? paginationLimit ?? defaults.pageSize,
    1
  );
  return {
    keywords,
    location,
    radius,
    page,
    pageSize
  };
}
var JoobleAdapter = class extends JobSourceAdapter {
  name = SOURCE_NAME;
  source = SOURCE_KEY;
  client;
  constructor(client = new JoobleClient()) {
    super(SOURCE_KEY);
    this.client = client;
  }
  async pullListings(params = {}) {
    const config = buildConfig(params);
    const payload = {
      keywords: config.keywords?.join(" "),
      location: config.location,
      radius: config.radius,
      page: config.page,
      size: config.pageSize
    };
    const response = await this.client.search(payload, { signal: params.signal });
    const organizations = /* @__PURE__ */ new Map();
    const jobs = [];
    for (const entry of response.data.jobs) {
      const normalized = toNormalized(entry);
      if (!normalized) continue;
      jobs.push(normalized.job);
      organizations.set(
        normalized.organization.id ?? normalized.organization.name,
        normalized.organization
      );
    }
    const totalCount = response.data.totalCount ?? jobs.length;
    const totalPages = config.pageSize > 0 ? Math.ceil(totalCount / config.pageSize) : 0;
    const nextCursor = config.page < totalPages ? String(config.page + 1) : void 0;
    return {
      jobs,
      organizations: Array.from(organizations.values()),
      nextCursor,
      telemetry: this.createTelemetry({
        requestCount: 1,
        itemsReceived: jobs.length,
        durationMs: response.durationMs,
        metadata: {
          config,
          totalCount,
          status: response.status
        }
      })
    };
  }
  async hydrateCompany({ organization }) {
    return {
      organization,
      telemetry: this.createTelemetry({
        requestCount: 0,
        itemsReceived: 1
      })
    };
  }
};
function createJoobleAdapter(client) {
  return new JoobleAdapter(client);
}

// src/utils/index.ts
var import_node_crypto = require("crypto");
var normalize = (value) => value ? value.trim().toLowerCase() : "";
var normalizeLocation = (location) => {
  if (!location) {
    return "";
  }
  return [
    location.city,
    location.region,
    location.countryCode ?? location.country,
    location.timeZone
  ].map(normalize).filter(Boolean).join(":");
};
var buildJobFingerprint = (job) => {
  const hash = (0, import_node_crypto.createHash)("sha256");
  const locationValues = job.locations?.length ? job.locations.map((loc) => normalizeLocation(loc)).sort().join("|") : normalizeLocation(job.primaryLocation);
  const postedDate = job.postedAt ? new Date(job.postedAt).toISOString().slice(0, 10) : "";
  const values = [
    normalize(job.identifier.externalId),
    normalize(job.identifier.source),
    normalize(job.title),
    normalize(job.organization.name),
    normalize(job.url),
    locationValues,
    postedDate
  ];
  hash.update(values.join("|"));
  return hash.digest("hex");
};

// src/services/supabase-repository.ts
var import_node_crypto2 = require("crypto");
var KNOWN_PROVIDERS = /* @__PURE__ */ new Set([
  "manual",
  "indeed",
  "ziprecruiter",
  "linkedin",
  "greenhouse",
  "workday",
  "other"
]);
var normalizeProvider = (provider) => {
  if (!provider) return "other";
  const normalized = provider.toLowerCase();
  return KNOWN_PROVIDERS.has(normalized) ? normalized : "other";
};
var toIso = (value) => value.toISOString();
var toNullableIso = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return toIso(date);
};
var prepareJson = (value) => {
  if (value instanceof Date) {
    return toIso(value);
  }
  if (value instanceof Set) {
    return Array.from(value.values()).map((entry) => prepareJson(entry));
  }
  if (value instanceof Map) {
    return Object.fromEntries(
      Array.from(value.entries()).map(([key, entry]) => [String(key), prepareJson(entry)])
    );
  }
  if (Array.isArray(value)) {
    return value.map((entry) => prepareJson(entry));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        prepareJson(entry)
      ])
    );
  }
  return value;
};
var isDefined = (value) => value != null;
var serializeOrganizationSource = (organization, provider, timestampIso) => {
  const externalId = organization.identifier?.externalId ?? organization.identifier?.slug ?? void 0;
  if (!organization.id || !externalId) {
    return void 0;
  }
  return {
    organization_id: organization.id,
    provider,
    external_organization_id: externalId,
    metadata: prepareJson(organization.metadata ?? {}),
    updated_at: timestampIso
  };
};
var resolvePrimaryLocation = (job) => {
  if (job.primaryLocation) return job.primaryLocation;
  if (job.locations?.length) return job.locations[0];
  return void 0;
};
var formatLocation = (location) => {
  if (!location) return null;
  const parts = [location.city, location.region, location.countryCode ?? location.country].map((value) => value ? value.trim() : "").filter(Boolean);
  return parts.length ? parts.join(", ") : null;
};
var normalizeRemoteOption = (job) => {
  if (job.workplaceType) {
    return job.workplaceType;
  }
  if (job.remote === true) return "remote";
  if (job.remote === false) return "onsite";
  return null;
};
var buildJobPayload = (job, provider, timestampIso) => {
  const { job: normalized, fingerprint } = job;
  const externalId = normalized.identifier.externalId;
  if (!externalId) {
    throw new Error("Normalized job is missing an external identifier");
  }
  if (!normalized.organization.id) {
    throw new Error(`Job ${externalId} is missing an organization id`);
  }
  const location = resolvePrimaryLocation(normalized);
  const payload = {
    source_provider: provider,
    external_id: externalId,
    external_url: normalized.url ?? normalized.identifier.url ?? null,
    title: normalized.title,
    description: normalized.description ?? normalized.summary ?? null,
    employment_type: normalized.employmentType ?? null,
    position_level: normalized.experienceLevel ?? null,
    remote_option: normalizeRemoteOption(normalized),
    organization_id: normalized.organization.id,
    status: normalized.status ?? "open",
    compensation: prepareJson(normalized.compensation ?? null),
    posted_at: toNullableIso(normalized.postedAt ?? null),
    closes_at: toNullableIso(normalized.closesAt ?? null),
    source_posted_at: toNullableIso(normalized.postedAt ?? null),
    source_updated_at: toNullableIso(normalized.updatedAt ?? null),
    last_seen_at: timestampIso,
    updated_at: timestampIso,
    location: formatLocation(location),
    address: prepareJson(location ?? null),
    raw_payload: prepareJson({ fingerprint, normalizedJob: normalized })
  };
  if (normalized.id) {
    payload.id = normalized.id;
  }
  return payload;
};
var buildJobSourceRecord = (job, provider, jobId, firstSeenIso, timestampIso) => {
  const preparedJob = prepareJson(job.job);
  const payloadHash = (0, import_node_crypto2.createHash)("sha256").update(JSON.stringify(preparedJob)).digest("hex");
  return {
    job_id: jobId,
    provider,
    external_id: job.job.identifier.externalId,
    content_hash: job.fingerprint,
    payload_hash: payloadHash,
    first_seen_at: firstSeenIso,
    last_seen_at: timestampIso,
    updated_at: timestampIso
  };
};
var serializeError = (error) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }
  return prepareJson(error);
};
var SupabaseJobIngestionRepository = class {
  constructor(client, now = () => /* @__PURE__ */ new Date()) {
    this.client = client;
    this.now = now;
  }
  async startRun(params) {
    const provider = normalizeProvider(params.provider);
    const startedAtIso = toIso(params.startedAt);
    const { data, error } = await this.client.from("job_ingest_runs").insert({
      adapter: params.adapter,
      provider,
      parameters: prepareJson(params.parameters ?? {}),
      status: "running",
      started_at: startedAtIso
    }).select("id, started_at").single();
    if (error) {
      throw new Error(`Failed to create job ingest run: ${error.message}`);
    }
    return {
      id: data.id,
      startedAt: new Date(data.started_at)
    };
  }
  async persistIngestion(params) {
    const provider = normalizeProvider(params.provider);
    const timestamp = this.now();
    const timestampIso = toIso(timestamp);
    const startIso = toIso(params.startedAt);
    const organizationRecords = params.organizations.map((organization) => serializeOrganizationSource(organization, provider, timestampIso)).filter(isDefined);
    if (organizationRecords.length) {
      const { error } = await this.client.from("organization_sources").upsert(organizationRecords, { onConflict: "provider,external_organization_id" });
      if (error) {
        throw new Error(`Failed to upsert organization sources: ${error.message}`);
      }
    }
    const ingestedJobs = params.jobs;
    const externalIds = Array.from(
      new Set(
        ingestedJobs.map((entry) => entry.job.identifier.externalId).filter((id) => Boolean(id))
      )
    );
    const existingJobMap = /* @__PURE__ */ new Map();
    if (externalIds.length) {
      const { data, error } = await this.client.from("jobs").select("id, external_id").eq("source_provider", provider).in("external_id", externalIds);
      if (error) {
        throw new Error(`Failed to lookup existing jobs: ${error.message}`);
      }
      for (const row of data ?? []) {
        if (row.external_id && row.id) {
          existingJobMap.set(row.external_id, row.id);
        }
      }
    }
    const jobPayloads = ingestedJobs.map((entry) => buildJobPayload(entry, provider, timestampIso));
    let created = 0;
    const updatedJobMap = new Map(existingJobMap);
    if (jobPayloads.length) {
      created = jobPayloads.filter((payload) => {
        const externalId = payload.external_id;
        return externalId ? !existingJobMap.has(externalId) : false;
      }).length;
      const { data, error } = await this.client.from("jobs").upsert(jobPayloads, { onConflict: "source_provider,external_id" }).select("id, external_id");
      if (error) {
        throw new Error(`Failed to upsert jobs: ${error.message}`);
      }
      for (const row of data ?? []) {
        if (row.external_id && row.id) {
          updatedJobMap.set(row.external_id, row.id);
        }
      }
    }
    const existingSourceRecords = /* @__PURE__ */ new Map();
    if (externalIds.length) {
      const { data, error } = await this.client.from("job_source_records").select("external_id, first_seen_at").eq("provider", provider).in("external_id", externalIds);
      if (error) {
        throw new Error(`Failed to lookup job source records: ${error.message}`);
      }
      for (const row of data ?? []) {
        if (row.external_id && row.first_seen_at) {
          existingSourceRecords.set(row.external_id, row.first_seen_at);
        }
      }
    }
    const sourceRecords = ingestedJobs.map((entry) => {
      const externalId = entry.job.identifier.externalId;
      if (!externalId) return void 0;
      const jobId = updatedJobMap.get(externalId);
      if (!jobId) return void 0;
      const firstSeen = existingSourceRecords.get(externalId) ?? startIso;
      return buildJobSourceRecord(entry, provider, jobId, firstSeen, timestampIso);
    }).filter(isDefined);
    if (sourceRecords.length) {
      const { error } = await this.client.from("job_source_records").upsert(sourceRecords, { onConflict: "provider,external_id" });
      if (error) {
        throw new Error(`Failed to upsert job source records: ${error.message}`);
      }
    }
    const { data: closedJobs, error: closeError } = await this.client.from("jobs").update({
      status: "closed",
      last_seen_at: timestampIso,
      updated_at: timestampIso
    }).eq("source_provider", provider).lt("last_seen_at", startIso).neq("status", "closed").select("id");
    if (closeError) {
      throw new Error(`Failed to close stale jobs: ${closeError.message}`);
    }
    const closed = closedJobs?.length ?? 0;
    const updated = jobPayloads.length - created;
    return {
      created,
      updated,
      closed
    };
  }
  async completeRun(params) {
    const finishedAtIso = toIso(params.finishedAt);
    const { error } = await this.client.from("job_ingest_runs").update({
      status: "succeeded",
      total_jobs: params.summary.processed,
      created_jobs: params.summary.created,
      updated_jobs: params.summary.updated,
      deleted_jobs: params.summary.closed,
      finished_at: finishedAtIso,
      updated_at: finishedAtIso,
      error_payload: null
    }).eq("id", params.runId);
    if (error) {
      throw new Error(`Failed to complete job ingest run: ${error.message}`);
    }
  }
  async failRun(params) {
    const finishedAtIso = toIso(params.finishedAt);
    const { error } = await this.client.from("job_ingest_runs").update({
      status: "failed",
      finished_at: finishedAtIso,
      updated_at: finishedAtIso,
      error_payload: serializeError(params.error)
    }).eq("id", params.runId);
    if (error) {
      throw new Error(`Failed to record failed job ingest run: ${error.message}`);
    }
  }
};

// src/services/index.ts
var dedupeWarnings = (existing, warnings) => {
  if (!warnings?.length) return;
  for (const warning of warnings) {
    existing.add(warning);
  }
};
var mergeMetadata = (target, source) => {
  if (!source) return target;
  return { ...target ?? {}, ...source };
};
var toIsoString = (value) => value.toISOString();
var sanitizeValue = (value) => {
  if (value instanceof Date) {
    return toIsoString(value);
  }
  if (value instanceof Set) {
    return Array.from(value.values()).map((entry) => sanitizeValue(entry));
  }
  if (value instanceof Map) {
    return Object.fromEntries(
      Array.from(value.entries()).map(([key, entry]) => [String(key), sanitizeValue(entry)])
    );
  }
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeValue(entry));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        sanitizeValue(entry)
      ])
    );
  }
  return value;
};
var sanitizeParameters = (params) => {
  if (!params) return {};
  const { signal, ...rest } = params;
  return sanitizeValue(rest);
};
var getOrganizationKey = (organization) => {
  return organization.id ?? organization.identifier?.externalId ?? organization.identifier?.slug ?? organization.name;
};
var buildTelemetry = (source, requestCount, itemsReceived, durationMs, warnings, rateLimit, metadata) => ({
  source,
  requestCount,
  itemsReceived,
  durationMs,
  warnings: Array.from(warnings ?? []),
  rateLimit,
  metadata
});
var createPageParams = (baseParams, cursor) => {
  if (!baseParams && cursor === void 0) {
    return void 0;
  }
  const pagination = cursor !== void 0 ? { ...baseParams?.pagination ?? {}, cursor } : baseParams?.pagination;
  if (!baseParams) {
    return pagination ? { pagination } : void 0;
  }
  return {
    ...baseParams,
    ...pagination ? { pagination } : {}
  };
};
var runJobIngestion = async (options) => {
  const { adapter, repository, fetchParams, now = () => /* @__PURE__ */ new Date() } = options;
  const startedAt = now();
  const run = await repository.startRun({
    adapter: adapter.constructor?.name ?? adapter.source,
    provider: adapter.source,
    parameters: sanitizeParameters(fetchParams),
    startedAt
  });
  const jobMap = /* @__PURE__ */ new Map();
  const organizationMap = /* @__PURE__ */ new Map();
  const warningSet = /* @__PURE__ */ new Set();
  let metadata;
  let rateLimit;
  let totalDuration = 0;
  let hasDuration = false;
  let totalFetched = 0;
  let requestCount = 0;
  let itemsReceived = 0;
  const seenCursors = /* @__PURE__ */ new Set();
  let cursor = fetchParams?.pagination?.cursor;
  if (cursor !== void 0) {
    seenCursors.add(cursor);
  }
  try {
    while (true) {
      const pageParams = createPageParams(fetchParams, cursor) ?? {};
      const result = await adapter.pullListings(pageParams);
      requestCount += result.telemetry.requestCount ?? 0;
      itemsReceived += result.telemetry.itemsReceived ?? 0;
      if (result.telemetry.durationMs !== void 0) {
        totalDuration += result.telemetry.durationMs;
        hasDuration = true;
      }
      dedupeWarnings(warningSet, result.telemetry.warnings);
      metadata = mergeMetadata(metadata, result.telemetry.metadata);
      if (result.telemetry.rateLimit) {
        rateLimit = result.telemetry.rateLimit;
      }
      totalFetched += result.jobs.length;
      for (const job of result.jobs) {
        const fingerprint = buildJobFingerprint(job);
        if (!jobMap.has(fingerprint)) {
          jobMap.set(fingerprint, { job, fingerprint });
        }
        const orgKey = getOrganizationKey(job.organization);
        if (!organizationMap.has(orgKey)) {
          organizationMap.set(orgKey, job.organization);
        }
      }
      for (const organization of result.organizations ?? []) {
        const orgKey = getOrganizationKey(organization);
        if (!organizationMap.has(orgKey)) {
          organizationMap.set(orgKey, organization);
        }
      }
      const nextCursor = result.nextCursor;
      if (nextCursor === void 0 || nextCursor === null || nextCursor === "") {
        break;
      }
      if (seenCursors.has(nextCursor)) {
        break;
      }
      seenCursors.add(nextCursor);
      cursor = nextCursor;
    }
    const ingestedJobs = Array.from(jobMap.values());
    const organizations = Array.from(organizationMap.values());
    const persistence = await repository.persistIngestion({
      runId: run.id,
      provider: adapter.source,
      jobs: ingestedJobs,
      organizations,
      startedAt: run.startedAt ?? startedAt
    });
    const summary = {
      fetched: totalFetched,
      processed: ingestedJobs.length,
      deduplicated: totalFetched - ingestedJobs.length,
      created: persistence.created,
      updated: persistence.updated,
      closed: persistence.closed
    };
    const telemetry = buildTelemetry(
      adapter.source,
      requestCount,
      itemsReceived,
      hasDuration ? totalDuration : void 0,
      warningSet,
      rateLimit,
      metadata
    );
    const finishedAt = now();
    await repository.completeRun({
      runId: run.id,
      telemetry,
      summary,
      finishedAt
    });
    return {
      runId: run.id,
      jobs: ingestedJobs.map((entry) => entry.job),
      organizations,
      telemetry,
      summary
    };
  } catch (error) {
    const finishedAt = now();
    await repository.failRun({
      runId: run.id,
      error,
      finishedAt
    });
    throw error;
  }
};

// src/cli/index.ts
var DEFAULT_ADAPTER_FACTORIES = {
  jooble: (env) => createJoobleAdapter(new JoobleClient({ apiKey: env.JOOBLE_API_KEY }))
};
var InMemoryJobIngestionRepository = class {
  sequence = 0;
  async startRun(params) {
    this.sequence += 1;
    return { id: `local-run-${this.sequence}`, startedAt: params.startedAt };
  }
  async persistIngestion(params) {
    return {
      created: params.jobs.length,
      updated: 0,
      closed: 0
    };
  }
  async completeRun() {
    return void 0;
  }
  async failRun() {
    return void 0;
  }
};
var createDefaultRepository = () => new InMemoryJobIngestionRepository();
var normalizeKey = (key) => key.trim().toLowerCase();
var parseArgv = (argv) => {
  const entries = /* @__PURE__ */ new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const raw = token.slice(2);
    if (!raw) continue;
    const equalsIndex = raw.indexOf("=");
    let key = raw;
    let value;
    if (equalsIndex >= 0) {
      key = raw.slice(0, equalsIndex);
      value = raw.slice(equalsIndex + 1);
    } else {
      const next = argv[index + 1];
      if (next && !next.startsWith("--")) {
        value = next;
        index += 1;
      }
    }
    const normalizedKey = normalizeKey(key);
    const normalizedValue = value ?? "true";
    const existing = entries.get(normalizedKey);
    if (existing) {
      existing.push(normalizedValue);
    } else {
      entries.set(normalizedKey, [normalizedValue]);
    }
  }
  return entries;
};
var getLastValue = (map, keys) => {
  for (const key of keys) {
    const values = map.get(normalizeKey(key));
    if (values?.length) {
      const candidate = values[values.length - 1]?.trim();
      if (candidate) return candidate;
    }
  }
  return void 0;
};
var getAllValues = (map, keys) => {
  const result = [];
  for (const key of keys) {
    const values = map.get(normalizeKey(key));
    if (values?.length) {
      for (const value of values) {
        if (value?.trim()) {
          result.push(value.trim());
        }
      }
    }
  }
  return result;
};
var parseInteger = (value, label) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid integer for --${label}: ${value}`);
  }
  return parsed;
};
var parseBoolean = (value, label) => {
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  throw new Error(`Invalid boolean for --${label}: ${value}`);
};
var parseDate2 = (value, label) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date for --${label}: ${value}`);
  }
  return parsed;
};
var parseList = (values) => {
  const entries = values.flatMap((entry) => entry.split(",")).map((entry) => entry.trim()).filter(Boolean);
  return entries.length ? entries : void 0;
};
var parseMetadata = (map, prefix) => {
  const metadata = {};
  for (const [key, values] of map.entries()) {
    if (!key.startsWith(prefix)) continue;
    const path = key.slice(prefix.length);
    if (!path) continue;
    const value = values[values.length - 1];
    if (value === void 0) continue;
    const normalized = value.trim();
    if (!normalized) continue;
    const lowered = normalized.toLowerCase();
    if (["true", "false"].includes(lowered)) {
      metadata[path] = lowered === "true";
      continue;
    }
    const asNumber = Number(normalized);
    if (!Number.isNaN(asNumber) && normalized === asNumber.toString()) {
      metadata[path] = asNumber;
      continue;
    }
    if (normalized.startsWith("{") && normalized.endsWith("}") || normalized.startsWith("[") && normalized.endsWith("]")) {
      try {
        metadata[path] = JSON.parse(normalized);
        continue;
      } catch {
      }
    }
    metadata[path] = normalized;
  }
  return Object.keys(metadata).length ? metadata : void 0;
};
var parseCliArguments = (argv) => {
  const args = parseArgv(argv);
  const adapterKey = getLastValue(args, ["adapter", "adapter-key"])?.toLowerCase() ?? "jooble";
  const fetchParams = {};
  const paginationCursor = getLastValue(args, ["pagination.cursor", "cursor"]);
  const paginationPageValue = getLastValue(args, ["pagination.page", "page"]);
  const paginationPageSizeValue = getLastValue(args, [
    "pagination.page-size",
    "pagination.pagesize",
    "page-size",
    "pagesize"
  ]);
  const paginationLimitValue = getLastValue(args, ["pagination.limit", "limit"]);
  const pagination = {};
  if (paginationCursor) {
    pagination.cursor = paginationCursor;
  }
  if (paginationPageValue) {
    pagination.page = parseInteger(paginationPageValue, "page");
  }
  if (paginationPageSizeValue) {
    pagination.pageSize = parseInteger(paginationPageSizeValue, "page-size");
  }
  if (paginationLimitValue) {
    pagination.limit = parseInteger(paginationLimitValue, "limit");
  }
  if (Object.keys(pagination).length) {
    fetchParams.pagination = pagination;
  }
  const sinceValue = getLastValue(args, ["since"]);
  if (sinceValue) {
    fetchParams.since = parseDate2(sinceValue, "since");
  }
  const untilValue = getLastValue(args, ["until"]);
  if (untilValue) {
    fetchParams.until = parseDate2(untilValue, "until");
  }
  const metadata = parseMetadata(args, "metadata.");
  if (metadata) {
    fetchParams.metadata = metadata;
  }
  const filters = {};
  const search = getLastValue(args, ["filters.search", "search"]);
  if (search) {
    filters.search = search;
  }
  const locationValues = getAllValues(args, [
    "filters.location",
    "filters.locations",
    "location",
    "locations"
  ]);
  if (locationValues.length) {
    filters.locations = locationValues.map((value) => ({ raw: value, formatted: value }));
  }
  const employmentTypes = parseList(
    getAllValues(args, [
      "filters.employment-types",
      "filters.employmenttypes",
      "employment-types",
      "employmenttypes"
    ])
  );
  if (employmentTypes) {
    filters.employmentTypes = employmentTypes;
  }
  const experienceLevels = parseList(
    getAllValues(args, [
      "filters.experience-levels",
      "filters.experiencelevels",
      "experience-levels",
      "experiencelevels"
    ])
  );
  if (experienceLevels) {
    filters.experienceLevels = experienceLevels;
  }
  const workplaceTypes = parseList(
    getAllValues(args, [
      "filters.workplace-types",
      "filters.workplacetypes",
      "workplace-types",
      "workplacetypes"
    ])
  );
  if (workplaceTypes) {
    filters.workplaceTypes = workplaceTypes;
  }
  const remoteOnlyValue = getLastValue(args, [
    "filters.remote-only",
    "filters.remoteonly",
    "remote-only",
    "remoteonly"
  ]);
  if (remoteOnlyValue) {
    filters.remoteOnly = parseBoolean(remoteOnlyValue, "remote-only");
  }
  const includeClosedValue = getLastValue(args, [
    "filters.include-closed",
    "filters.includeclosed",
    "include-closed",
    "includeclosed"
  ]);
  if (includeClosedValue) {
    filters.includeClosed = parseBoolean(includeClosedValue, "include-closed");
  }
  const tagValues = parseList(getAllValues(args, ["filters.tags", "tags"]));
  if (tagValues) {
    filters.tags = tagValues;
  }
  const filterMetadata = parseMetadata(args, "filters.metadata.");
  if (filterMetadata) {
    filters.metadata = filterMetadata;
  }
  if (Object.keys(filters).length) {
    fetchParams.filters = filters;
  }
  return { adapterKey, fetchParams };
};
async function syncJobSources(options = {}) {
  const {
    argv = process.argv.slice(2),
    env = process.env,
    ingest = runJobIngestion,
    adapters = DEFAULT_ADAPTER_FACTORIES,
    repository = createDefaultRepository(),
    logger = console
  } = options;
  const { adapterKey, fetchParams } = parseCliArguments(argv);
  const adapterFactory = adapters[adapterKey];
  if (!adapterFactory) {
    throw new Error(`Unsupported adapter: ${adapterKey}`);
  }
  const adapter = adapterFactory(env);
  const result = await ingest({ adapter, repository, fetchParams });
  const { summary, telemetry } = result;
  logger.info(`Run ID: ${result.runId}`);
  logger.info(
    `Jobs fetched=${summary.fetched}, processed=${summary.processed}, deduplicated=${summary.deduplicated}`
  );
  logger.info(
    `Persistence: created=${summary.created}, updated=${summary.updated}, closed=${summary.closed}`
  );
  logger.info("Telemetry:", telemetry);
  return result;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CompensationFrequencySchema,
  CompensationSchema,
  CoordinatesSchema,
  DateTimeSchema,
  EmploymentTypeSchema,
  ExperienceLevelSchema,
  JobIdentifierSchema,
  JobSourceAdapter,
  JobStatusSchema,
  JoobleAdapter,
  JoobleClient,
  LocationSchema,
  NormalizedJobSchema,
  NormalizedOrganizationSchema,
  OrganizationIdentifierSchema,
  OrganizationSizeSchema,
  SocialProfileSchema,
  SupabaseJobIngestionRepository,
  WorkplaceTypeSchema,
  assertApiKey,
  buildConfig,
  buildJobFingerprint,
  cleanPayload,
  createJoobleAdapter,
  parseDate,
  parseKeywords,
  parseLocation,
  parseNumber,
  parseSalary,
  runJobIngestion,
  slugify,
  syncJobSources,
  toNormalized
});
