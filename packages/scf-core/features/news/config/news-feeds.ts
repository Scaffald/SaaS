import type { IndustryFeeds } from './types';

/**
 * Construction industry news feeds configuration
 * Based on ENR (Engineering News-Record) RSS feeds
 */
export const CONSTRUCTION_FEEDS: IndustryFeeds = {
  name: "Construction",
  national: [
    {
      id: "enr-main",
      name: "ENR National",
      url: "https://www.enr.com/rss/1",
      category: "general",
    },
    {
      id: "construction-methods",
      name: "Construction Methods",
      url: "https://www.enr.com/rss/topic/115-construction-methods",
      category: "technology",
    },
    {
      id: "safety-health",
      name: "Safety & Health",
      url: "https://www.enr.com/rss/topic/555-safety-health",
      category: "safety",
    },
    {
      id: "construction-technology",
      name: "Construction Technology",
      url: "https://www.enr.com/rss/topic/587-construction-technology",
      category: "technology",
    },
    {
      id: "workforce",
      name: "Workforce",
      url: "https://www.enr.com/rss/topic/556-workforce",
      category: "workforce",
    },
  ],
  regional: [
    {
      id: "enr-california",
      name: "ENR California",
      url: "https://www.enr.com/rss/2",
      region: "california",
    },
    {
      id: "enr-midwest",
      name: "ENR Midwest",
      url: "https://www.enr.com/rss/4",
      region: "midwest",
    },
    {
      id: "enr-new-york",
      name: "ENR New York",
      url: "https://www.enr.com/rss/6",
      region: "new-york",
    },
    {
      id: "enr-new-england",
      name: "ENR New England",
      url: "https://www.enr.com/rss/7",
      region: "new-england",
    },
    {
      id: "enr-northwest",
      name: "ENR Northwest",
      url: "https://www.enr.com/rss/8",
      region: "northwest",
    },
    {
      id: "enr-southeast",
      name: "ENR Southeast",
      url: "https://www.enr.com/rss/9",
      region: "southeast",
    },
    {
      id: "enr-southwest",
      name: "ENR Southwest",
      url: "https://www.enr.com/rss/10",
      region: "southwest",
    },
    {
      id: "enr-texas-louisiana",
      name: "ENR Texas & Louisiana",
      url: "https://www.enr.com/rss/11",
      region: "texas-louisiana",
    },
    {
      id: "enr-mountain-states",
      name: "ENR Mountain States",
      url: "https://www.enr.com/rss/5",
      region: "mountain-states",
    },
    {
      id: "enr-mid-atlantic",
      name: "ENR Mid-Atlantic",
      url: "https://www.enr.com/rss/3",
      region: "mid-atlantic",
    },
  ],
  topical: [
    {
      id: "buildings",
      name: "Buildings",
      url: "https://www.enr.com/rss/topic/114-buildings",
      category: "projects",
    },
    {
      id: "design",
      name: "Design",
      url: "https://www.enr.com/rss/topic/116-design",
      category: "technology",
    },
    {
      id: "sustainability",
      name: "Sustainability",
      url: "https://www.enr.com/rss/topic/118-sustainability",
      category: "sustainability",
    },
    {
      id: "power-industrial",
      name: "Power & Industrial",
      url: "https://www.enr.com/rss/topic/129-power-industrial",
      category: "projects",
    },
    {
      id: "transportation",
      name: "Transportation",
      url: "https://www.enr.com/rss/topic/130-transportation",
      category: "projects",
    },
    {
      id: "water-dams",
      name: "Water & Dams",
      url: "https://www.enr.com/rss/topic/131-water-dams",
      category: "projects",
    },
    {
      id: "companies",
      name: "Companies",
      url: "https://www.enr.com/rss/topic/120-companies",
      category: "finance",
    },
    {
      id: "finance",
      name: "Finance",
      url: "https://www.enr.com/rss/topic/122-finance",
      category: "finance",
    },
    {
      id: "equipment",
      name: "Equipment",
      url: "https://www.enr.com/rss/topic/498-equipment",
      category: "equipment",
    },
    {
      id: "materials",
      name: "Materials",
      url: "https://www.enr.com/rss/topic/500-materials",
      category: "equipment",
    },
  ],
};

/**
 * Get available feeds by industry
 */
export function getFeedsByIndustry(industry: string): IndustryFeeds {
  switch (industry.toLowerCase()) {
    case "construction":
      return CONSTRUCTION_FEEDS;
    default:
      // Return construction as default for now
      return CONSTRUCTION_FEEDS;
  }
}

/**
 * Get default feed selection for a given industry
 */
export function getDefaultFeeds(industry: string): string[] {
  const feeds = getFeedsByIndustry(industry);

  // Return a mix of national and high-value topical feeds
  return [
    feeds.national[0]?.id, // Main national feed
    feeds.topical.find((f) => f.category === "safety")?.id, // Safety
    feeds.topical.find((f) => f.category === "technology")?.id, // Technology
  ].filter(Boolean) as string[];
}

/**
 * Find a feed by ID across all categories
 */
export function findFeedById(industry: string, feedId: string) {
  const feeds = getFeedsByIndustry(industry);
  const allFeeds = [...feeds.national, ...feeds.regional, ...feeds.topical];
  return allFeeds.find((feed) => feed.id === feedId);
}
