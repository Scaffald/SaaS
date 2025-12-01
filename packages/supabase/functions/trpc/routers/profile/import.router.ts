import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { extractTextFromPdf as sharedExtractTextFromPdf } from "@app/trpc/utils";
import {
  clearImportDataInputSchema,
  type ImportMetadata,
  importMetadataSchema,
  type ImportPayload,
  importPayloadSchema,
  resumeFileTypeEnum,
  resumeParseInputSchema,
  saveImportDataInputSchema,
  validateJsonInputSchema,
} from "@app/trpc/schemas";
import type { Context } from '../../context';
import { protectedProcedure, t } from '../../middleware';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const IMPORT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Lazy loading for large packages to reduce bundle size
let JSZipClass: typeof import("jszip") | null = null;
let OpenAIClass: typeof import("openai") | null = null;

async function getJSZip(): Promise<typeof import("jszip")> {
  if (!JSZipClass) {
    JSZipClass = await import("jszip");
  }
  return JSZipClass;
}

async function getOpenAI(): Promise<typeof import("openai")> {
  if (!OpenAIClass) {
    OpenAIClass = await import("openai");
  }
  return OpenAIClass;
}

interface ParseOptions {
  useOpenAi: boolean;
}

interface ParsedResumeResult {
  payload: ImportPayload;
  metadata: {
    strategy: "openai" | "heuristic";
    extractedCharacters: number;
  };
}

function decodeBase64File(base64: string): Uint8Array {
  try {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i += 1) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Failed to decode file payload: ${
        error instanceof Error ? error.message : String(error)
      }`,
    });
  }
}

async function scanForMalware(
  fileBytes: Uint8Array,
  fileName: string,
): Promise<void> {
  if (fileBytes.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Uploaded file is empty",
    });
  }

  const suspiciousExtensions = [".exe", ".bat", ".cmd", ".sh", ".com"];
  const lowered = fileName.toLowerCase();
  if (suspiciousExtensions.some((ext) => lowered.endsWith(ext))) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Executable files are not allowed",
    });
  }

  // Placeholder for real malware scanning (VirusTotal, etc.)
  console.log("[profileImport] Malware scan placeholder executed");
}

async function extractTextFromDocx(fileBytes: Uint8Array): Promise<string> {
  try {
    const JSZip = await getJSZip();
    const zip = await JSZip.default.loadAsync(fileBytes.buffer);
    const docFile = zip.file("word/document.xml");
    if (!docFile) {
      console.warn("[profileImport] Missing document.xml in DOCX archive");
      throw new Error("document.xml not found");
    }
    const xmlContent = await docFile.async("string");
    return xmlContent.replace(/<\/w:p>/g, "\n").replace(/<[^>]+>/g, " ");
  } catch (error) {
    console.warn("[profileImport] DOCX extraction failed:", error);
    try {
      return new TextDecoder("utf-8", { fatal: false }).decode(fileBytes);
    } catch {
      return "";
    }
  }
}

async function extractResumeText(
  fileBytes: Uint8Array,
  fileType: z.infer<typeof resumeFileTypeEnum>,
): Promise<string> {
  switch (fileType) {
    case "application/pdf":
      return (
        await sharedExtractTextFromPdf(fileBytes, {
          namespace: "profileImport",
        })
      ).text;
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return await extractTextFromDocx(fileBytes);
    default:
      return "";
  }
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n|\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function heuristicParseResume(text: string): ImportPayload {
  const lines = extractLines(text);
  const payload: ImportPayload = {
    general: [],
    experience: [],
    education: [],
    skills: [],
    certifications: [],
  };

  if (lines.length > 0) {
    const firstLine = lines[0];
    const nameParts = firstLine.split(" ").filter(Boolean);
    if (nameParts.length >= 2) {
      payload.general.push({
        first_name: nameParts[0],
        last_name: nameParts[nameParts.length - 1],
        headline: lines[1]?.slice(0, 120),
        confidence_score: 65,
      });
    }
  }

  for (const line of lines) {
    const experienceMatch = line.match(
      /^(?:-|\*)?\s*(?<title>[A-Za-z0-9&/,\s]+)\s+at\s+(?<company>[A-Za-z0-9&/,\s]+)\s*(?<dates>\d{4}[^,]*)?/i,
    );
    if (experienceMatch?.groups) {
      const { title, company, dates } = experienceMatch.groups;
      let startDate: string | undefined;
      let endDate: string | undefined;
      if (dates) {
        const rangeMatch = dates.match(
          /(?<start>\d{4})(?:\s*[-–/]\s*(?<end>\d{4}|present|current))?/i,
        );
        if (rangeMatch?.groups) {
          startDate = rangeMatch.groups.start ?? undefined;
          const endGroup = rangeMatch.groups.end;
          if (endGroup && !/present|current/i.test(endGroup)) {
            endDate = endGroup;
          }
        }
      }

      payload.experience.push({
        job_title: title.trim(),
        company_name: company.trim(),
        start_date: startDate ?? null,
        end_date: endDate ?? null,
        is_current: !endDate,
        confidence_score: 60,
      });
      continue;
    }

    const educationMatch = line.match(
      /^(?:-|\*)?\s*(?<degree>(Associate|Bachelor|Master|PhD|Diploma|Certificate)[^,]*)[, ]+(?<institution>[A-Za-z0-9&\s]+)(?<years>\d{4}[^,]*)?/i,
    );
    if (educationMatch?.groups) {
      payload.education.push({
        institution: educationMatch.groups.institution.trim(),
        degree: educationMatch.groups.degree.trim(),
        confidence_score: 55,
      });
      continue;
    }

    if (/skills[:|-]/i.test(line)) {
      const skills = line
        .replace(/skills[:|-]/i, "")
        .split(/[,•]/)
        .map((skill) => skill.trim())
        .filter(Boolean);
      for (const skill of skills) {
        payload.skills.push({
          name: skill,
          confidence_score: 70,
        });
      }
      continue;
    }

    if (/certifications?/i.test(line)) {
      payload.certifications.push({
        name: line.replace(/certifications?:?/i, "").trim(),
        confidence_score: 50,
      });
    }
  }

  return payload;
}

function sanitizeString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  // Remove control characters (ASCII 0-31 and 127) using character class
  const controlChars = String.fromCharCode(...Array.from({ length: 32 }, (_, i) => i), 127)
  const withoutControl = trimmed.replace(new RegExp(`[${controlChars.replace(/[[\]\\]/g, '\\$&')}]+`, 'g'), "")
  const strippedScripts = withoutControl.replace(
    /<script.*?>.*?<\/script>/gim,
    "",
  );
  const strippedTags = strippedScripts.replace(/<[^>]+>/g, "");
  return strippedTags.replace(/[<>]/g, "");
}

function sanitizePayload(payload: ImportPayload): ImportPayload {
  const sanitizeCollection = <T>(
    items: T[] | undefined,
    mapper: (item: T) => Record<string, unknown>,
  ): Record<string, unknown>[] => {
    if (!items || items.length === 0) return [];
    return items
      .map((item) => {
        const mapped = mapper(item);
        const sanitizedEntries = Object.entries(mapped).reduce<
          Record<string, unknown>
        >(
          (acc, [key, value]) => {
            if (typeof value === "string") {
              const sanitized = sanitizeString(value);
              if (sanitized !== null) {
                acc[key] = sanitized;
              }
            } else if (Array.isArray(value)) {
              acc[key] = value
                .filter((entry) => typeof entry === "string")
                .map((entry) => sanitizeString(entry) ?? "")
                .filter((entry) => entry.length > 0);
            } else if (value !== undefined && value !== null) {
              acc[key] = value;
            }
            return acc;
          },
          {},
        );
        return sanitizedEntries;
      })
      .filter((record) => Object.keys(record).length > 0);
  };

  return {
    general: sanitizeCollection(payload.general, (item) => ({
      first_name: item.first_name,
      last_name: item.last_name,
      headline: item.headline,
      summary: item.summary,
      confidence_score: item.confidence_score,
    })) as ImportPayload["general"],
    experience: sanitizeCollection(payload.experience, (item) => ({
      job_title: item.job_title,
      company_name: item.company_name,
      start_date: item.start_date,
      end_date: item.end_date,
      is_current: item.is_current,
      confidence_score: item.confidence_score,
    })) as ImportPayload["experience"],
    education: sanitizeCollection(payload.education, (item) => ({
      degree: item.degree,
      institution: item.institution,
      start_date: item.start_date,
      end_date: item.end_date,
      confidence_score: item.confidence_score,
    })) as ImportPayload["education"],
    skills: sanitizeCollection(payload.skills, (item) => ({
      name: item.name,
      taxonomy: item.taxonomy,
      confidence_score: item.confidence_score,
    })) as ImportPayload["skills"],
    certifications: sanitizeCollection(payload.certifications, (item) => ({
      name: item.name,
      issuer: item.issuer,
      issue_date: item.issue_date,
      confidence_score: item.confidence_score,
    })) as ImportPayload["certifications"],
  };
}

async function generateStructuredPayload(
  text: string,
  options: ParseOptions,
): Promise<ParsedResumeResult> {
  const normalized = normalizeWhitespace(text);
  if (normalized.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Could not extract text from resume file",
    });
  }

  if (options.useOpenAi) {
    try {
      const apiKey = Deno.env.get("OPENAI_API_KEY");
      if (apiKey) {
        const OpenAI = await getOpenAI();
        const openai = new OpenAI.default({ apiKey });
        const prompt = `
Extract resume details into the following JSON schema:
{
  "general": [{ "first_name": string, "last_name": string, "headline": string?, "summary": string?, "confidence_score": number }],
  "experience": [{ "job_title": string, "company_name": string, "start_date": string?, "end_date": string?, "is_current": boolean?, "confidence_score": number }],
  "education": [{ "institution": string, "degree": string?, "start_date": string?, "end_date": string?, "confidence_score": number }],
  "skills": [{ "name": string, "taxonomy": string?, "confidence_score": number }],
  "certifications": [{ "name": string, "issuer": string?, "issue_date": string?, "confidence_score": number }]
}
Return strictly valid JSON and no additional commentary. Dates should use ISO-8601 (YYYY-MM-DD) when possible.

Resume:
${normalized}
`;
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0,
          messages: [
            {
              role: "system",
              content: "You are a structured data extractor that outputs JSON.",
            },
            { role: "user", content: prompt },
          ],
        });

        const content = completion.choices[0]?.message?.content;
        if (content) {
          const sanitized = content.replace(/```json|```/g, "").trim();
          const parsedJson = JSON.parse(sanitized);
          const parsed = importPayloadSchema.safeParse(parsedJson);
          if (parsed.success) {
            return {
              payload: parsed.data,
              metadata: {
                strategy: "openai",
                extractedCharacters: normalized.length,
              },
            };
          }
          console.warn(
            "[profileImport] OpenAI response failed schema validation",
          );
        }
      }
    } catch (error) {
      console.warn("[profileImport] OpenAI parsing failed:", error);
    }
  }

  const heuristicPayload = heuristicParseResume(normalized);
  return {
    payload: heuristicPayload,
    metadata: {
      strategy: "heuristic",
      extractedCharacters: normalized.length,
    },
  };
}

async function loadImportMetadata(
  supabase: Context["supabase"],
  userId: string,
): Promise<ImportMetadata | null> {
  const { data, error } = await supabase
    .schema("core")
    .from("preferences")
    .select("import_metadata")
    .eq("user_id", userId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  if (!data?.import_metadata) {
    return null;
  }

  const parsed = importMetadataSchema.safeParse(data.import_metadata);
  return parsed.success ? parsed.data : null;
}

async function clearImportMetadata(
  supabase: Context["supabase"],
  userId: string,
): Promise<void> {
  const { error } = await supabase.schema("core").from("preferences").upsert(
    {
      user_id: userId,
      import_metadata: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw error;
  }
}

export const profileImportRouter = t.router({
  parseResume: protectedProcedure.input(resumeParseInputSchema).mutation(
    async ({ ctx, input }) => {
      const { user } = ctx;
      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      if (input.fileSize > MAX_FILE_SIZE_BYTES) {
        throw new TRPCError({
          code: "PAYLOAD_TOO_LARGE",
          message: "Resume file must be 5MB or smaller",
        });
      }

      const fileBytes = decodeBase64File(input.fileBase64);
      await scanForMalware(fileBytes, input.fileName);
      const extractedText = await extractResumeText(fileBytes, input.fileType);

      const { payload, metadata } = await generateStructuredPayload(
        extractedText,
        {
          useOpenAi: true,
        },
      );

      return {
        payload: sanitizePayload(payload),
        metadata: {
          ...metadata,
          fileName: input.fileName,
          fileSize: input.fileSize,
          fileType: input.fileType,
        },
      };
    },
  ),

  validateJson: protectedProcedure
    .input(validateJsonInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const parsed = importPayloadSchema.safeParse(input.payload);
      if (!parsed.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Provided JSON does not match expected schema",
        });
      }

      return {
        payload: sanitizePayload(parsed.data),
      };
    }),

  saveImportData: protectedProcedure
    .input(saveImportDataInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx;
      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const storedAt = new Date();
      const expiresAt = new Date(storedAt.getTime() + IMPORT_TTL_MS);
      const sanitizedPayload = sanitizePayload(input.payload);

      const metadata: ImportMetadata = {
        version: 1,
        source: input.source,
        storedAt: storedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        payload: sanitizedPayload,
      };

      const { error } = await supabase.schema("core").from("preferences")
        .upsert(
          {
            user_id: user.id,
            import_metadata: metadata,
            updated_at: storedAt.toISOString(),
          },
          { onConflict: "user_id" },
        );

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to persist import data: ${error.message}`,
        });
      }

      return {
        metadata,
      };
    }),

  getImportData: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx;
    if (!user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    try {
      const metadata = await loadImportMetadata(supabase, user.id);
      if (!metadata) {
        return null;
      }

      const now = Date.now();
      if (now > Date.parse(metadata.expiresAt)) {
        await clearImportMetadata(supabase, user.id);
        return null;
      }

      return metadata;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[profileImport] getImportData error:", message);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to load import data: ${message}`,
      });
    }
  }),

  clearImportData: protectedProcedure
    .input(clearImportDataInputSchema)
    .mutation(async ({ ctx }) => {
      const { supabase, user } = ctx;
      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      await clearImportMetadata(supabase, user.id);
      return { success: true };
    }),
});
