import OpenAI from 'openai';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ExtractedCertificateSchema, type ExtractedCertificate } from './schemas/extracted-certificate.js';
import type { PageImage } from '../extraction/pdf-to-images.js';

export interface ExtractionResult {
  data: ExtractedCertificate;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  } | null;
  duration_ms: number;
}

export class AIExtractionService {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model = 'gpt-4o') {
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required. Set it in your .env file.');
    }
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  /**
   * Extract structured certificate data from PDF page images.
   *
   * @param pages - Base64-encoded PNG images of each page
   * @param systemPrompt - The system prompt to use for extraction
   * @returns Typed extraction result with usage stats
   */
  async extractCertificate(
    pages: PageImage[],
    systemPrompt: string,
  ): Promise<ExtractionResult> {
    const startTime = Date.now();

    const imageContent = pages.map((page) => ({
      type: 'image_url' as const,
      image_url: {
        url: `data:image/png;base64,${page.base64}`,
        detail: 'high' as const,
      },
    }));

    // biome-ignore lint/suspicious/noExplicitAny: Zod v3 compat layer types don't match zod-to-json-schema's expected Zod v3 types
    const jsonSchema = zodToJsonSchema(ExtractedCertificateSchema as any, { target: 'openAi' }) as Record<string, unknown>;

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            ...imageContent,
            {
              type: 'text' as const,
              text: 'Extract all insurance data from this ACORD certificate. Identify every coverage type, limit, endorsement, and named party. Check the Description of Operations box for endorsement references. Flag any fields that appear ambiguous or low-confidence.',
            },
          ],
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'certificate_extraction',
          strict: true,
          schema: jsonSchema,
        },
      },
      temperature: 0,
    });

    const duration_ms = Date.now() - startTime;

    const message = completion.choices[0]?.message;
    if (!message?.content) {
      const refusal = message?.refusal;
      throw new Error(
        refusal
          ? `Model refused extraction: ${refusal}`
          : 'AI extraction returned no content',
      );
    }

    const parsed = ExtractedCertificateSchema.parse(JSON.parse(message.content));

    return {
      data: parsed,
      model: completion.model,
      usage: completion.usage
        ? {
            prompt_tokens: completion.usage.prompt_tokens,
            completion_tokens: completion.usage.completion_tokens,
            total_tokens: completion.usage.total_tokens,
          }
        : null,
      duration_ms,
    };
  }
}
