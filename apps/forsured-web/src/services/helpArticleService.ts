// src/services/helpArticleService.ts
// Help Article Service - Database-backed with fallback to mock data
//
// This service provides help documentation content from the forsured.help_articles
// table. Falls back to in-memory mock data if database is unavailable.

import { forsured } from '../lib/supabase';

// =============================================================================
// TYPES
// =============================================================================

export type UserType = 'manager' | 'contractor' | 'broker' | 'admin';

export interface HelpArticle {
  id: string;
  slug: string;
  title: string;
  content: string; // Markdown content
  userTypes: UserType[];
  category: string;
  order: number;
  videoUrl?: string;
}

// Database row type
interface HelpArticleRow {
  id: string;
  slug: string;
  title: string;
  content: string;
  user_types: string[];
  category: string;
  sort_order: number;
  video_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// DATABASE SERVICE
// =============================================================================

/**
 * Convert database row to HelpArticle interface
 */
function rowToArticle(row: HelpArticleRow): HelpArticle {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    content: row.content,
    userTypes: row.user_types as UserType[],
    category: row.category,
    order: row.sort_order,
    videoUrl: row.video_url || undefined,
  };
}

/**
 * Get help articles from database
 *
 * @param userType - Filter by user type (gc, contractor, broker, admin)
 * @param searchQuery - Search query for title/content
 * @returns Array of help articles sorted by order
 */
export async function getHelpArticles(
  userType?: string,
  searchQuery?: string
): Promise<HelpArticle[]> {
  try {
    let query = forsured('help_articles')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true });

    // Filter by user type using array contains
    if (userType) {
      query = query.contains('user_types', [userType]);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[HelpArticleService] Database error:', error);
      // Fall back to mock data
      return getHelpArticlesFromMock(userType, searchQuery);
    }

    if (!data || data.length === 0) {
      console.warn('[HelpArticleService] No articles found in database, using mock');
      return getHelpArticlesFromMock(userType, searchQuery);
    }

    let articles = data.map(rowToArticle);

    // Apply search filter client-side (for more complex searching, use PostgreSQL full-text search)
    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      articles = articles.filter(
        (article) =>
          article.title.toLowerCase().includes(queryLower) ||
          article.content.toLowerCase().includes(queryLower)
      );
    }

    return articles;
  } catch (err) {
    console.error('[HelpArticleService] Error fetching articles:', err);
    return getHelpArticlesFromMock(userType, searchQuery);
  }
}

/**
 * Get a specific help article by slug and user type from database
 *
 * @param slug - URL-friendly article identifier
 * @param userType - User type to filter by
 * @returns HelpArticle or null if not found
 */
export async function getHelpArticleBySlug(
  slug: string,
  userType: string
): Promise<HelpArticle | null> {
  try {
    const { data, error } = await forsured('help_articles')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .contains('user_types', [userType])
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found - try mock data
        return getHelpArticleBySlugFromMock(slug, userType);
      }
      console.error('[HelpArticleService] Database error:', error);
      return getHelpArticleBySlugFromMock(slug, userType);
    }

    return rowToArticle(data);
  } catch (err) {
    console.error('[HelpArticleService] Error fetching article:', err);
    return getHelpArticleBySlugFromMock(slug, userType);
  }
}

/**
 * Search help articles using full-text search
 *
 * @param query - Search query
 * @param userType - Optional user type filter
 * @returns Array of matching articles
 */
export async function searchHelpArticles(
  query: string,
  userType?: string
): Promise<HelpArticle[]> {
  try {
    // Use PostgreSQL full-text search
    let dbQuery = forsured('help_articles')
      .select('*')
      .eq('is_published', true)
      .textSearch('title', query, { type: 'websearch' })
      .order('sort_order', { ascending: true });

    if (userType) {
      dbQuery = dbQuery.contains('user_types', [userType]);
    }

    const { data, error } = await dbQuery;

    if (error) {
      console.error('[HelpArticleService] Search error:', error);
      // Fall back to simple filter
      return getHelpArticles(userType, query);
    }

    return data?.map(rowToArticle) || [];
  } catch (err) {
    console.error('[HelpArticleService] Error searching articles:', err);
    return getHelpArticles(userType, query);
  }
}

/**
 * Get all categories for a user type
 *
 * @param userType - User type to filter by
 * @returns Array of unique categories
 */
export async function getCategories(userType?: string): Promise<string[]> {
  try {
    let query = forsured('help_articles')
      .select('category')
      .eq('is_published', true);

    if (userType) {
      query = query.contains('user_types', [userType]);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[HelpArticleService] Error fetching categories:', error);
      return getCategoriesFromMock(userType);
    }

    // Get unique categories
    const categories = [...new Set(data?.map((row) => row.category) || [])];
    return categories.sort();
  } catch (err) {
    console.error('[HelpArticleService] Error fetching categories:', err);
    return getCategoriesFromMock(userType);
  }
}

/**
 * Get articles by category
 *
 * @param category - Category to filter by
 * @param userType - Optional user type filter
 * @returns Array of articles in the category
 */
export async function getArticlesByCategory(
  category: string,
  userType?: string
): Promise<HelpArticle[]> {
  try {
    let query = forsured('help_articles')
      .select('*')
      .eq('is_published', true)
      .eq('category', category)
      .order('sort_order', { ascending: true });

    if (userType) {
      query = query.contains('user_types', [userType]);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[HelpArticleService] Error fetching category articles:', error);
      return getArticlesByCategoryFromMock(category, userType);
    }

    return data?.map(rowToArticle) || [];
  } catch (err) {
    console.error('[HelpArticleService] Error fetching category articles:', err);
    return getArticlesByCategoryFromMock(category, userType);
  }
}

// =============================================================================
// MOCK DATA FALLBACK
// =============================================================================

const mockArticles: HelpArticle[] = [
  {
    id: 'gc-getting-started',
    slug: 'getting-started',
    title: 'Getting Started as a General Contractor',
    content: `# Getting Started as a General Contractor

Welcome to ForSured! This guide will help you set up your account and start
managing subcontractor compliance in minutes.

## Step 1: Complete Your Company Profile

After signing up, you'll be guided through setting up your company profile.

## Step 2: Create Your First Project

1. Click **"New Project"** from your dashboard
2. Enter the project details
3. Customize insurance requirements (or use your defaults)
4. Click **"Create Project"**

## Step 3: Invite Contractors

1. Open your project
2. Click **"Invite Contractor"**
3. Enter the contractor's email address

## Need Help?

- **FAQ**: [Common questions answered](/gc/help/faq)
- **Support**: [Contact us](/support)`,
    userTypes: ['gc'],
    category: 'getting-started',
    order: 1,
  },
  {
    id: 'contractor-getting-started',
    slug: 'getting-started',
    title: 'Getting Started as a Contractor',
    content: `# Getting Started as a Contractor

Welcome to ForSured! This guide will help you get compliant and stay
compliant with your general contractors' insurance requirements.

## How ForSured Works

1. **GC invites you** to their project
2. **You upload** your certificates of insurance (COIs)
3. **ForSured validates** your coverage automatically
4. **You stay notified** when documents need renewal

## Step 1: Accept Your Invitation

When a GC invites you, check your email for the invitation.

## Step 2: Upload Your COIs

1. Go to **Documents** in your dashboard
2. Click **"+ Upload Document"**
3. Select document type
4. Choose your file (PDF recommended)
5. Click **"Upload"**`,
    userTypes: ['contractor'],
    category: 'getting-started',
    order: 1,
  },
  {
    id: 'broker-getting-started',
    slug: 'getting-started',
    title: 'Getting Started as a Broker',
    content: `# Getting Started as a Broker

Welcome to ForSured! As a broker, you can help your contractor clients
stay compliant with GC insurance requirements.

## Broker Access

Broker accounts are invite-only.

## Your Dashboard

As a broker, you see:

- **All your clients** in one place
- **Compliance status** across all projects
- **Expiring policies** that need attention
- **Document requests** from GCs`,
    userTypes: ['broker'],
    category: 'getting-started',
    order: 1,
  },
];

/**
 * Get help articles from mock data (fallback)
 */
function getHelpArticlesFromMock(
  userType?: string,
  searchQuery?: string
): HelpArticle[] {
  let articles = [...mockArticles];

  if (userType) {
    articles = articles.filter((article) =>
      article.userTypes.includes(userType as UserType)
    );
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    articles = articles.filter(
      (article) =>
        article.title.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query)
    );
  }

  return articles.sort((a, b) => a.order - b.order);
}

/**
 * Get help article by slug from mock data (fallback)
 */
function getHelpArticleBySlugFromMock(
  slug: string,
  userType: string
): HelpArticle | null {
  return (
    mockArticles.find(
      (article) =>
        article.slug === slug &&
        article.userTypes.includes(userType as UserType)
    ) || null
  );
}

/**
 * Get categories from mock data (fallback)
 */
function getCategoriesFromMock(userType?: string): string[] {
  let articles = [...mockArticles];

  if (userType) {
    articles = articles.filter((article) =>
      article.userTypes.includes(userType as UserType)
    );
  }

  const categories = [...new Set(articles.map((a) => a.category))];
  return categories.sort();
}

/**
 * Get articles by category from mock data (fallback)
 */
function getArticlesByCategoryFromMock(
  category: string,
  userType?: string
): HelpArticle[] {
  let articles = mockArticles.filter((a) => a.category === category);

  if (userType) {
    articles = articles.filter((article) =>
      article.userTypes.includes(userType as UserType)
    );
  }

  return articles.sort((a, b) => a.order - b.order);
}
