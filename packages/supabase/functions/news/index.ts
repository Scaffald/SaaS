import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

type NewsSource = {
  id: string;
  label: string;
  feedUrl: string;
  siteUrl?: string;
};

type NewsArticle = {
  id: string;
  title: string;
  excerpt: string;
  imageUrl?: string;
  link: string;
  publishedAt?: string;
};

const NEWS_SOURCES: NewsSource[] = [
  {
    id: "1",
    label: "Global News (ENR National)",
    feedUrl: "https://www.enr.com/rss/1",
    siteUrl: "https://www.enr.com/",
  },
  {
    id: "articles",
    label: "Top Stories",
    feedUrl: "https://www.enr.com/rss/articles",
    siteUrl: "https://www.enr.com/articles",
  },
  {
    id: "2",
    label: "ENR California",
    feedUrl: "https://www.enr.com/rss/2",
    siteUrl: "https://www.enr.com/california",
  },
  {
    id: "3",
    label: "ENR Mid-Atlantic",
    feedUrl: "https://www.enr.com/rss/3",
    siteUrl: "https://www.enr.com/midatlantic",
  },
  {
    id: "4",
    label: "ENR Midwest",
    feedUrl: "https://www.enr.com/rss/4",
    siteUrl: "https://www.enr.com/midwest",
  },
  {
    id: "5",
    label: "ENR Mountain States",
    feedUrl: "https://www.enr.com/rss/5",
    siteUrl: "https://www.enr.com/mountainstates",
  },
  {
    id: "6",
    label: "ENR New York",
    feedUrl: "https://www.enr.com/rss/6",
    siteUrl: "https://www.enr.com/newyork",
  },
  {
    id: "7",
    label: "ENR New England",
    feedUrl: "https://www.enr.com/rss/7",
    siteUrl: "https://www.enr.com/newengland",
  },
  {
    id: "8",
    label: "ENR Northwest",
    feedUrl: "https://www.enr.com/rss/8",
    siteUrl: "https://www.enr.com/northwest",
  },
  {
    id: "9",
    label: "ENR Southeast",
    feedUrl: "https://www.enr.com/rss/9",
    siteUrl: "https://www.enr.com/southeast",
  },
  {
    id: "10",
    label: "ENR Southwest",
    feedUrl: "https://www.enr.com/rss/10",
    siteUrl: "https://www.enr.com/southwest",
  },
  {
    id: "11",
    label: "ENR Texas & Louisiana",
    feedUrl: "https://www.enr.com/rss/11",
    siteUrl: "https://www.enr.com/texas-louisiana",
  },
];

const NEWS_SOURCE_LOOKUP = NEWS_SOURCES.reduce<Record<string, NewsSource>>(
  (accumulator, source) => {
    accumulator[source.id] = source;
    return accumulator;
  },
  {},
);

const ARTICLE_LIMIT = 8;
const CACHE_TTL_SECONDS = 300; // 5 minutes
const STALE_WHILE_REVALIDATE_SECONDS = 600; // 10 minutes

const decodeHtmlEntities = (text: string): string => {
  const entities: Record<string, string> = {
    "&": "&",
    "<": "<",
    ">": ">",
    '"': '"',
    "&#39;": "'",
    "&apos;": "'",
    "&nbsp;": " ",
  };

  return text.replace(
    /&[a-zA-Z0-9#]+;/g,
    (entity) => entities[entity] || entity,
  );
};

const stripHtmlTags = (html: string): string => {
  return html
    .replace(/<[^>]*>/g, " ") // Remove HTML tags
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
};

const parseRssFeed = (xml: string): NewsArticle[] => {
  try {
    // Simple XML parsing for RSS feeds
    const items: NewsArticle[] = [];
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/g;
    let match: RegExpExecArray | null = itemRegex.exec(xml);

    while (match !== null) {
      const itemXml = match[1];

      const titleMatch = itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/);
      const linkMatch = itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/);
      const descriptionMatch = itemXml.match(
        /<description[^>]*>([\s\S]*?)<\/description>/,
      );
      const guidMatch = itemXml.match(/<guid[^>]*>([\s\S]*?)<\/guid>/);
      const pubDateMatch = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/);

      if (titleMatch && linkMatch) {
        const title = decodeHtmlEntities(titleMatch[1].trim());
        const link = linkMatch[1].trim();
        const description = descriptionMatch ? descriptionMatch[1].trim() : "";
        const guid = guidMatch ? guidMatch[1].trim() : link;
        const pubDate = pubDateMatch ? pubDateMatch[1].trim() : undefined;

        items.push({
          id: guid,
          title,
          link,
          excerpt: stripHtmlTags(decodeHtmlEntities(description)),
          publishedAt: pubDate,
        });
      }
      match = itemRegex.exec(xml);
    }

    return items;
  } catch (error) {
    console.error("Failed to parse RSS feed:", error);
    return [];
  }
};

const createFallbackArticles = (source?: NewsSource): NewsArticle[] => {
  const now = new Date();
  const isoDate = Number.isNaN(now.getTime()) ? undefined : now.toISOString();
  const siteUrl = source?.siteUrl ?? source?.feedUrl ?? "https://www.enr.com/";

  return [
    {
      id: `${source?.id ?? "fallback"}-1`,
      title: source?.label
        ? `${source.label} headlines coming soon`
        : "Industry headlines coming soon",
      excerpt:
        "We will load the latest construction industry headlines as soon as the RSS feed becomes available. In the meantime, visit the ENR newsroom to stay up to date.",
      link: siteUrl,
      publishedAt: isoDate,
    },
  ];
};

/**
 * Validate that a URL is a valid HTTP/HTTPS URL
 */
const isValidUrl = (urlString: string): boolean => {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const handler = async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { ...corsHeaders, Allow: "GET" },
    });
  }

  const url = new URL(req.url);
  const feedUrl = url.searchParams.get("url");
  const source = url.searchParams.get("source");

  // Handle generic RSS proxy endpoint (?url=)
  if (feedUrl) {
    // Validate URL
    if (!isValidUrl(feedUrl)) {
      return new Response(
        JSON.stringify({
          error: "Invalid URL. Must be a valid HTTP or HTTPS URL.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    try {
      const response = await fetch(feedUrl, {
        headers: {
          Accept: "application/xml, text/xml;q=0.9, */*;q=0.8",
          "User-Agent": "SCF-Scaffald/1.0 (+https://scaffald.com)",
        },
        signal: AbortSignal.timeout(8000), // 8 second timeout
      });

      if (!response.ok) {
        return new Response(
          JSON.stringify({
            error: `Feed request failed with status ${response.status}`,
          }),
          {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const xml = await response.text();

      // Return raw XML with CORS headers for client-side parsing
      return new Response(xml, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control":
            `s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}`,
          Vary: "Accept-Encoding",
        },
      });
    } catch (error) {
      console.warn("RSS proxy error:", error);

      // Provide more specific error messages
      let errorMessage = "Unable to fetch RSS feed";
      if (error instanceof Error) {
        if (error.name === "AbortError" || error.message.includes("timeout")) {
          errorMessage = "Request timeout: RSS feed took too long to respond";
        } else if (error.message.includes("Failed to fetch")) {
          errorMessage = "Network error: Unable to reach RSS feed";
        } else {
          errorMessage = `Error fetching RSS feed: ${error.message}`;
        }
      }

      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // Handle existing source-based endpoint (?source=)
  if (!source) {
    return new Response(
      JSON.stringify({
        error: "Missing parameter. Provide either 'source' or 'url' parameter.",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const newsSource = NEWS_SOURCE_LOOKUP[source];
  if (!newsSource) {
    return new Response(JSON.stringify({ error: "Unsupported news source" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const response = await fetch(newsSource.feedUrl, {
      headers: {
        Accept: "application/xml, text/xml;q=0.9, */*;q=0.8",
        "User-Agent": "SCF-Scaffald/1.0 (+https://scaffald.com)",
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(8000), // 8 second timeout
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: `Feed request failed with status ${response.status}`,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const xml = await response.text();
    const articles = parseRssFeed(xml).slice(0, ARTICLE_LIMIT);

    return new Response(JSON.stringify({ articles }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control":
          `s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}`,
        Vary: "Accept-Encoding",
      },
    });
  } catch (error) {
    console.warn("News API error:", error);

    // In development, return fallback articles
    const isProd = Deno.env.get("NODE_ENV") === "production";
    if (!isProd) {
      const fallbackArticles = createFallbackArticles(newsSource);
      return new Response(JSON.stringify({ articles: fallbackArticles }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Unable to reach RSS source" }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
};

serve(handler);
