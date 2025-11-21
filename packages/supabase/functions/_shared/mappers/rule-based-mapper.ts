import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import type { IndustryMapping, ParsedJob } from "../types/external-job.ts";
import {
  containsKeyword,
  INDUSTRY_KEYWORDS,
  type IndustryKeywordConfig,
  normalizeText,
} from "./industry-keywords.ts";

interface IndustryMatch {
  config: IndustryKeywordConfig;
  score: number;
  matched_keywords: string[];
}

/**
 * Maps a job to industries using keyword-based rules
 */
export class RuleBasedIndustryMapper {
  private industries: Map<string, { id: string; slug: string; name: string }> =
    new Map();

  constructor(
    private supabaseUrl: string,
    private supabaseKey: string,
  ) {}

  /**
   * Initialize by loading industries from database
   */
  async initialize(): Promise<void> {
    const supabase = createClient(this.supabaseUrl, this.supabaseKey);

    const { data, error } = await supabase
      .from("industries")
      .select("id, slug, name")
      .eq("active", true);

    if (error) {
      throw new Error(`Failed to load industries: ${error.message}`);
    }

    for (const industry of data || []) {
      this.industries.set(industry.slug, industry);
    }

    console.log(`Initialized with ${this.industries.size} industries`);
  }

  /**
   * Map a job to industries based on keyword matching
   */
  async mapJobToIndustries(job: ParsedJob): Promise<IndustryMapping[]> {
    // Combine all searchable text
    const searchText = [
      job.title || "",
      job.description || "",
      job.job_category || "",
      job.company_name || "",
      ...(job.job_tags || []),
    ].join(" ");

    // Find all matching industries with scores
    const matches: IndustryMatch[] = [];

    for (const config of INDUSTRY_KEYWORDS) {
      // Check if industry exists in database
      const industry = this.industries.get(config.industry_slug);
      if (!industry) {
        continue;
      }

      // Check negative keywords first (exclude this industry)
      if (config.negative_keywords) {
        const hasNegativeKeyword = config.negative_keywords.some((keyword) =>
          containsKeyword(searchText, keyword)
        );
        if (hasNegativeKeyword) {
          continue;
        }
      }

      // Check required keywords (all must be present)
      if (config.required_keywords) {
        const hasAllRequired = config.required_keywords.every((keyword) =>
          containsKeyword(searchText, keyword)
        );
        if (!hasAllRequired) {
          continue;
        }
      }

      // Count matching keywords
      const matchedKeywords: string[] = [];
      for (const keyword of config.keywords) {
        if (containsKeyword(searchText, keyword)) {
          matchedKeywords.push(keyword);
        }
      }

      // Calculate score based on matches and weight
      if (matchedKeywords.length > 0) {
        // Base score: percentage of keywords matched
        const matchPercentage = matchedKeywords.length / config.keywords.length;
        // Apply weight multiplier
        const score = matchPercentage * (config.weight / 10);

        matches.push({
          config,
          score,
          matched_keywords: matchedKeywords,
        });
      }
    }

    // Sort by score (highest first)
    matches.sort((a, b) => b.score - a.score);

    // Convert to IndustryMapping format
    const mappings: IndustryMapping[] = [];

    for (const match of matches.slice(0, 3)) {
      // Take top 3 matches
      const industry = this.industries.get(match.config.industry_slug);
      if (!industry) continue;

      // Calculate confidence score (0-1)
      // Normalize score to 0-1 range
      const confidence = Math.min(match.score, 1);

      mappings.push({
        industry_id: industry.id,
        industry_name: industry.name,
        confidence_score: Number(confidence.toFixed(2)),
        mapped_by: "rule",
      });
    }

    return mappings;
  }

  /**
   * Get the primary industry mapping (highest confidence)
   */
  async getPrimaryIndustry(job: ParsedJob): Promise<IndustryMapping | null> {
    const mappings = await this.mapJobToIndustries(job);
    return mappings.length > 0 ? mappings[0] : null;
  }

  /**
   * Check if a job has sufficient industry mapping
   * Returns true if at least one industry with confidence >= threshold
   */
  hasSufficientMapping(mappings: IndustryMapping[], threshold = 0.5): boolean {
    return mappings.some((m) => m.confidence_score >= threshold);
  }
}
