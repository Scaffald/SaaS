/**
 * News REST API
 * Cached news articles by industry. Public endpoint.
 * Migrated from tRPC newsRouter.getByIndustry.
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const app = new Hono();

app.get(
  "/",
  zValidator(
    "query",
    z.object({
      industryId: z.string().uuid(),
      limit: z.coerce.number().int().min(1).max(50).default(10),
      category: z.string().optional(),
      region: z.string().optional(),
    }),
  ),
  async (c) => {
    const supabase = c.get("supabase");
    if (!supabase) return c.json({ error: "Unauthorized" }, 401);

    const input = c.req.valid("query");

    let query = supabase
      .schema("core")
      .from("cached_news_articles")
      .select(`
        id,
        title,
        description,
        link,
        pub_date,
        image_url,
        source_name,
        cached_at,
        feed_id,
        feed:news_feeds!inner(
          id,
          name,
          category,
          region
        )
      `)
      .eq("industry_id", input.industryId);

    if (input.category) {
      query = query.eq("news_feeds.category", input.category);
    }

    if (input.region) {
      query = query.eq("news_feeds.region", input.region);
    }

    const { data, error } = await query;

    if (error) {
      return c.json({
        error: `Failed to fetch news articles: ${error.message}`,
      }, 500);
    }

    // Sort by pub_date desc and limit
    const sorted = ((data as Record<string, unknown>[]) || [])
      .sort((a, b) => {
        const dateA = new Date(a.pub_date as string).getTime();
        const dateB = new Date(b.pub_date as string).getTime();
        return dateB - dateA;
      })
      .slice(0, input.limit)
      .map((article) => {
        const feed = article.feed as Record<string, unknown> | null;
        return {
          id: article.id,
          title: article.title ?? null,
          description: article.description ?? "",
          link: article.link ?? null,
          pubDate: article.pub_date,
          imageUrl: article.image_url ?? null,
          source: article.source_name ?? null,
          category: feed?.category ?? null,
          region: feed?.region ?? null,
        };
      });

    return c.json(sorted);
  },
);

export default app;
