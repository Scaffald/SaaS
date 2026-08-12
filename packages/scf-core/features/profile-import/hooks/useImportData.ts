import { useImportData as useSDKImportData } from "@scf/core/utils/profile-import-sdk-hooks";
import type {
  GeneralImportEntry,
  ExperienceImportEntry,
  EducationImportEntry,
  SkillImportEntry,
  CertificationImportEntry,
} from "@scaffald/sdk";
import { useMemo } from "react";

export interface ImportSection<TItem> {
  id: string;
  title: string;
  items: TItem[];
}

export interface ImportExperienceItem {
  id: string;
  jobTitle: string;
  companyName: string;
  startDate?: string | null;
  endDate?: string | null;
  isCurrent?: boolean;
  confidenceScore?: number | null;
  raw?: Record<string, unknown>;
}

export interface ImportEducationItem {
  id: string;
  degree?: string;
  institution?: string;
  startDate?: string | null;
  endDate?: string | null;
  confidenceScore?: number | null;
  raw?: Record<string, unknown>;
}

export interface ImportSkillItem {
  id: string;
  name: string;
  confidenceScore?: number | null;
  taxonomy?: string;
  raw?: Record<string, unknown>;
}

export interface ImportCertificationItem {
  id: string;
  name: string;
  issuer?: string;
  issueDate?: string | null;
  confidenceScore?: number | null;
  raw?: Record<string, unknown>;
}

export interface ImportGeneralItem {
  id: string;
  firstName?: string;
  lastName?: string;
  headline?: string;
  summary?: string;
  confidenceScore?: number | null;
  raw?: Record<string, unknown>;
}

export interface ImportData {
  general: ImportSection<ImportGeneralItem>;
  experience: ImportSection<ImportExperienceItem>;
  education: ImportSection<ImportEducationItem>;
  skills: ImportSection<ImportSkillItem>;
  certifications: ImportSection<ImportCertificationItem>;
}

export function useImportData() {
  const { data, isPending: isLoading, refetch, isError } = useSDKImportData();

  const importData: ImportData | null = useMemo(() => {
    const payload = data?.payload;
    if (!payload) return null;

    return {
      general: {
        id: "general",
        title: "General Info",
        items:
          payload.general?.map((item: GeneralImportEntry, index: number) => ({
            id: `general-${index}`,
            firstName: item.first_name,
            lastName: item.last_name,
            headline: item.headline,
            summary: item.summary,
            confidenceScore: item.confidence_score,
            raw: item as unknown as Record<string, unknown>,
          })) ?? [],
      },
      experience: {
        id: "experience",
        title: "Experience",
        items:
          payload.experience?.map(
            (item: ExperienceImportEntry, index: number) => ({
              id: `experience-${index}`,
              jobTitle: item.job_title ?? "",
              companyName: item.company_name ?? "",
              startDate: item.start_date ?? null,
              endDate: item.end_date ?? null,
              isCurrent: item.is_current ?? undefined,
              confidenceScore: item.confidence_score,
              raw: item as unknown as Record<string, unknown>,
            })
          ) ?? [],
      },
      education: {
        id: "education",
        title: "Education",
        items:
          payload.education?.map(
            (item: EducationImportEntry, index: number) => ({
              id: `education-${index}`,
              degree: item.degree,
              institution: item.institution,
              startDate: item.start_date ?? null,
              endDate: item.end_date ?? null,
              confidenceScore: item.confidence_score,
              raw: item as unknown as Record<string, unknown>,
            })
          ) ?? [],
      },
      skills: {
        id: "skills",
        title: "Skills",
        items:
          payload.skills?.map((item: SkillImportEntry, index: number) => ({
            id: String(item.name ?? `skill-${index}`),
            name: item.name ?? "Unknown Skill",
            confidenceScore: item.confidence_score,
            taxonomy: item.taxonomy,
            raw: item as unknown as Record<string, unknown>,
          })) ?? [],
      },
      certifications: {
        id: "certifications",
        title: "Certifications",
        items:
          payload.certifications?.map(
            (item: CertificationImportEntry, index: number) => ({
              id: `certification-${index}`,
              name: item.name ?? "",
              issuer: item.issuer,
              issueDate: item.issue_date ?? null,
              confidenceScore: item.confidence_score,
              raw: item as unknown as Record<string, unknown>,
            })
          ) ?? [],
      },
      // Import data transformation from API format to UI format
    } as ImportData;
  }, [data]);

  return {
    importData,
    metadata: data ?? null,
    isLoading,
    isError,
    /**
     * The query succeeded and there is simply nothing to review.
     *
     * `GET /v1/profiles/import/data` returns a bare `null` for a user who has
     * never uploaded a resume, which is a perfectly normal state — but the
     * screen treated a null payload as a failure and told the user "We couldn't
     * load your import data" with a Retry button that could only ever produce
     * the same null (#589).
     */
    isEmpty: !isLoading && !isError && importData === null,
    refetch,
  };
}
