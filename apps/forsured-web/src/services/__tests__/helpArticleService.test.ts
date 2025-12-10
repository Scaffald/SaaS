/**
 * Help Article Service - Unit Tests
 *
 * REQ: Phase 9 - Production Readiness (Help Articles DB Migration)
 *
 * REQ-306: Mock Validation
 * These mocks are validated against the real Supabase API in helpArticleService.mockValidation.test.ts
 * The mocks MUST match the real API behavior or tests will give false confidence.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getHelpArticles,
  getHelpArticleBySlug,
  searchHelpArticles,
  getCategories,
  getArticlesByCategory,
  type HelpArticle,
} from '../helpArticleService';

/**
 * Mock the forsured function to match real Supabase PostgREST API behavior
 *
 * VALIDATED AGAINST REALITY (see helpArticleService.mockValidation.test.ts):
 * - forsured() returns a query builder object
 * - select(), eq(), contains(), order(), textSearch() return 'this' for chaining
 * - single() returns an awaitable builder that resolves to {data: T | null, error: PostgrestError | null}
 * - Error codes match Supabase (PGRST116 for not found)
 * - Response format is always {data, error}
 */
vi.mock('../../lib/supabase', () => {
  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    single: vi.fn(),
  };

  return {
    forsured: vi.fn(() => mockQueryBuilder),
  };
});

import { forsured } from '../../lib/supabase';

// Sample database row data
const mockDbRow = {
  id: 'uuid-1',
  slug: 'getting-started',
  title: 'Getting Started as a General Contractor',
  content: '# Getting Started\n\nWelcome to ForSured!',
  user_types: ['gc'],
  category: 'getting-started',
  sort_order: 1,
  video_url: null,
  is_published: true,
  created_at: '2025-12-02T00:00:00Z',
  updated_at: '2025-12-02T00:00:00Z',
};

const mockDbRowContractor = {
  id: 'uuid-2',
  slug: 'getting-started',
  title: 'Getting Started as a Contractor',
  content: '# Getting Started\n\nWelcome to ForSured as a contractor!',
  user_types: ['contractor'],
  category: 'getting-started',
  sort_order: 1,
  video_url: 'https://example.com/video.mp4',
  is_published: true,
  created_at: '2025-12-02T00:00:00Z',
  updated_at: '2025-12-02T00:00:00Z',
};

const mockDbRowDashboard = {
  id: 'uuid-3',
  slug: 'dashboard',
  title: 'Dashboard Overview (GC)',
  content: '# Dashboard Overview\n\nYour dashboard is your central hub.',
  user_types: ['gc'],
  category: 'dashboard',
  sort_order: 2,
  video_url: null,
  is_published: true,
  created_at: '2025-12-02T00:00:00Z',
  updated_at: '2025-12-02T00:00:00Z',
};

describe('HelpArticleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHelpArticles', () => {
    it('should return articles from database sorted by order', async () => {
      // Create a chainable mock where the builder itself is thenable
      // This matches real Supabase behavior: chain methods return builder, await resolves to {data, error}
      const mockBuilder: any = {
        select: vi.fn(),
        eq: vi.fn(),
        contains: vi.fn(),
        order: vi.fn(),
        // Make builder thenable (awaitable) - this is what await calls
        then: vi.fn((resolve: any) =>
          resolve({
            data: [mockDbRow, mockDbRowDashboard],
            error: null,
          })
        ),
      };
      // Set up chaining - all methods return builder for continued chaining
      mockBuilder.select.mockReturnValue(mockBuilder);
      mockBuilder.eq.mockReturnValue(mockBuilder);
      mockBuilder.contains.mockReturnValue(mockBuilder);
      mockBuilder.order.mockReturnValue(mockBuilder);

      (forsured as any).mockReturnValue(mockBuilder);

      const result = await getHelpArticles('gc');

      expect(result).toHaveLength(2);
      expect(result[0].slug).toBe('getting-started');
      expect(result[0].title).toBe('Getting Started as a General Contractor');
      expect(result[0].userTypes).toEqual(['gc']);
      expect(result[0].order).toBe(1);

      expect(forsured).toHaveBeenCalledWith('help_articles');
      expect(mockBuilder.eq).toHaveBeenCalledWith('is_published', true);
      expect(mockBuilder.contains).toHaveBeenCalledWith('user_types', ['gc']);
      expect(mockBuilder.order).toHaveBeenCalledWith('sort_order', { ascending: true });
    });

    it('should return all published articles when no userType specified', async () => {
      const mockBuilder: any = {
        select: vi.fn(),
        eq: vi.fn(),
        contains: vi.fn(),
        order: vi.fn(),
        then: vi.fn((resolve: any) =>
          resolve({
            data: [mockDbRow, mockDbRowContractor, mockDbRowDashboard],
            error: null,
          })
        ),
      };
      mockBuilder.select.mockReturnValue(mockBuilder);
      mockBuilder.eq.mockReturnValue(mockBuilder);
      mockBuilder.contains.mockReturnValue(mockBuilder);
      mockBuilder.order.mockReturnValue(mockBuilder);

      (forsured as any).mockReturnValue(mockBuilder);

      const result = await getHelpArticles();

      expect(result).toHaveLength(3);
      // contains should not be called when no userType is specified
    });

    it('should filter articles by search query', async () => {
      const mockBuilder: any = {
        select: vi.fn(),
        eq: vi.fn(),
        contains: vi.fn(),
        order: vi.fn(),
        then: vi.fn((resolve: any) =>
          resolve({
            data: [mockDbRow, mockDbRowDashboard],
            error: null,
          })
        ),
      };
      mockBuilder.select.mockReturnValue(mockBuilder);
      mockBuilder.eq.mockReturnValue(mockBuilder);
      mockBuilder.contains.mockReturnValue(mockBuilder);
      mockBuilder.order.mockReturnValue(mockBuilder);

      (forsured as any).mockReturnValue(mockBuilder);

      const result = await getHelpArticles('gc', 'dashboard');

      // Only dashboard article should match search
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('dashboard');
    });

    it('should fall back to mock data on database error', async () => {
      const mockBuilder: any = {
        select: vi.fn(),
        eq: vi.fn(),
        contains: vi.fn(),
        order: vi.fn(),
        then: vi.fn((resolve: any) =>
          resolve({
            data: null,
            error: { code: 'PGRST500', message: 'Database error' },
          })
        ),
      };
      mockBuilder.select.mockReturnValue(mockBuilder);
      mockBuilder.eq.mockReturnValue(mockBuilder);
      mockBuilder.contains.mockReturnValue(mockBuilder);
      mockBuilder.order.mockReturnValue(mockBuilder);

      (forsured as any).mockReturnValue(mockBuilder);

      const result = await getHelpArticles('gc');

      // Should return mock data
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].userTypes).toContain('gc');
    });

    it('should fall back to mock data when no articles in database', async () => {
      const mockBuilder: any = {
        select: vi.fn(),
        eq: vi.fn(),
        contains: vi.fn(),
        order: vi.fn(),
        then: vi.fn((resolve: any) =>
          resolve({
            data: [],
            error: null,
          })
        ),
      };
      mockBuilder.select.mockReturnValue(mockBuilder);
      mockBuilder.eq.mockReturnValue(mockBuilder);
      mockBuilder.contains.mockReturnValue(mockBuilder);
      mockBuilder.order.mockReturnValue(mockBuilder);

      (forsured as any).mockReturnValue(mockBuilder);

      const result = await getHelpArticles('gc');

      // Should return mock data
      expect(result.length).toBeGreaterThan(0);
    });

    it('should convert database row to HelpArticle interface correctly', async () => {
      const mockBuilder: any = {
        select: vi.fn(),
        eq: vi.fn(),
        contains: vi.fn(),
        order: vi.fn(),
        then: vi.fn((resolve: any) =>
          resolve({
            data: [mockDbRowContractor],
            error: null,
          })
        ),
      };
      mockBuilder.select.mockReturnValue(mockBuilder);
      mockBuilder.eq.mockReturnValue(mockBuilder);
      mockBuilder.contains.mockReturnValue(mockBuilder);
      mockBuilder.order.mockReturnValue(mockBuilder);

      (forsured as any).mockReturnValue(mockBuilder);

      const result = await getHelpArticles('contractor');

      expect(result).toHaveLength(1);
      const article = result[0];

      // Check all fields are converted correctly
      expect(article.id).toBe('uuid-2');
      expect(article.slug).toBe('getting-started');
      expect(article.title).toBe('Getting Started as a Contractor');
      expect(article.content).toContain('contractor');
      expect(article.userTypes).toEqual(['contractor']);
      expect(article.category).toBe('getting-started');
      expect(article.order).toBe(1);
      expect(article.videoUrl).toBe('https://example.com/video.mp4');
    });
  });

  describe('getHelpArticleBySlug', () => {
    it('should return article by slug and user type', async () => {
      const mockBuilder: any = {
        select: vi.fn(),
        eq: vi.fn(),
        contains: vi.fn(),
        single: vi.fn().mockResolvedValue({
          data: mockDbRow,
          error: null,
        }),
      };
      mockBuilder.select.mockReturnValue(mockBuilder);
      mockBuilder.eq.mockReturnValue(mockBuilder);
      mockBuilder.contains.mockReturnValue(mockBuilder);

      (forsured as any).mockReturnValue(mockBuilder);

      const result = await getHelpArticleBySlug('getting-started', 'gc');

      expect(result).not.toBeNull();
      expect(result?.slug).toBe('getting-started');
      expect(result?.userTypes).toContain('gc');

      expect(mockBuilder.eq).toHaveBeenCalledWith('slug', 'getting-started');
      expect(mockBuilder.eq).toHaveBeenCalledWith('is_published', true);
      expect(mockBuilder.contains).toHaveBeenCalledWith('user_types', ['gc']);
    });

    it('should return null when article not found', async () => {
      const mockBuilder: any = {
        select: vi.fn(),
        eq: vi.fn(),
        contains: vi.fn(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        }),
      };
      mockBuilder.select.mockReturnValue(mockBuilder);
      mockBuilder.eq.mockReturnValue(mockBuilder);
      mockBuilder.contains.mockReturnValue(mockBuilder);

      (forsured as any).mockReturnValue(mockBuilder);

      const result = await getHelpArticleBySlug('nonexistent', 'gc');

      // Should fall back to mock and still return null for nonexistent slug
      expect(result).toBeNull();
    });

    it('should fall back to mock data on database error', async () => {
      const mockBuilder: any = {
        select: vi.fn(),
        eq: vi.fn(),
        contains: vi.fn(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST500', message: 'Database error' },
        }),
      };
      mockBuilder.select.mockReturnValue(mockBuilder);
      mockBuilder.eq.mockReturnValue(mockBuilder);
      mockBuilder.contains.mockReturnValue(mockBuilder);

      (forsured as any).mockReturnValue(mockBuilder);

      const result = await getHelpArticleBySlug('getting-started', 'gc');

      // Should return mock article
      expect(result).not.toBeNull();
      expect(result?.slug).toBe('getting-started');
    });
  });

  describe('searchHelpArticles', () => {
    it('should search articles using full-text search', async () => {
      const mockBuilder: any = {
        select: vi.fn(),
        eq: vi.fn(),
        contains: vi.fn(),
        textSearch: vi.fn(),
        order: vi.fn(),
        then: vi.fn((resolve: any) =>
          resolve({
            data: [mockDbRowDashboard],
            error: null,
          })
        ),
      };
      mockBuilder.select.mockReturnValue(mockBuilder);
      mockBuilder.eq.mockReturnValue(mockBuilder);
      mockBuilder.contains.mockReturnValue(mockBuilder);
      mockBuilder.textSearch.mockReturnValue(mockBuilder);
      mockBuilder.order.mockReturnValue(mockBuilder);

      (forsured as any).mockReturnValue(mockBuilder);

      const result = await searchHelpArticles('dashboard', 'gc');

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('dashboard');
      expect(mockBuilder.textSearch).toHaveBeenCalledWith('title', 'dashboard', { type: 'websearch' });
    });

    it('should fall back to getHelpArticles on search error', async () => {
      // First call for textSearch fails
      const searchBuilder: any = {
        select: vi.fn(),
        eq: vi.fn(),
        contains: vi.fn(),
        textSearch: vi.fn(),
        order: vi.fn(),
        then: vi.fn((resolve: any) =>
          resolve({
            data: null,
            error: { code: 'PGRST400', message: 'Search error' },
          })
        ),
      };
      searchBuilder.select.mockReturnValue(searchBuilder);
      searchBuilder.eq.mockReturnValue(searchBuilder);
      searchBuilder.contains.mockReturnValue(searchBuilder);
      searchBuilder.textSearch.mockReturnValue(searchBuilder);
      searchBuilder.order.mockReturnValue(searchBuilder);

      // Second call for fallback getHelpArticles succeeds
      const fallbackBuilder: any = {
        select: vi.fn(),
        eq: vi.fn(),
        contains: vi.fn(),
        order: vi.fn(),
        then: vi.fn((resolve: any) =>
          resolve({
            data: [mockDbRowDashboard],
            error: null,
          })
        ),
      };
      fallbackBuilder.select.mockReturnValue(fallbackBuilder);
      fallbackBuilder.eq.mockReturnValue(fallbackBuilder);
      fallbackBuilder.contains.mockReturnValue(fallbackBuilder);
      fallbackBuilder.order.mockReturnValue(fallbackBuilder);

      (forsured as any)
        .mockReturnValueOnce(searchBuilder)
        .mockReturnValueOnce(fallbackBuilder);

      const result = await searchHelpArticles('dashboard', 'gc');

      // Should have results from fallback
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getCategories', () => {
    it('should return unique categories', async () => {
      const mockBuilder: any = {
        select: vi.fn(),
        eq: vi.fn(),
        contains: vi.fn().mockResolvedValue({
          data: [
            { category: 'getting-started' },
            { category: 'dashboard' },
            { category: 'getting-started' }, // Duplicate
          ],
          error: null,
        }),
      };
      mockBuilder.select.mockReturnValue(mockBuilder);
      mockBuilder.eq.mockReturnValue(mockBuilder);

      (forsured as any).mockReturnValue(mockBuilder);

      const result = await getCategories('gc');

      expect(result).toEqual(['dashboard', 'getting-started']); // Sorted alphabetically
    });

    it('should return categories for all user types when none specified', async () => {
      const mockBuilder: any = {
        select: vi.fn(),
        eq: vi.fn().mockResolvedValue({
          data: [
            { category: 'getting-started' },
            { category: 'dashboard' },
          ],
          error: null,
        }),
        contains: vi.fn(),
      };
      mockBuilder.select.mockReturnValue(mockBuilder);

      (forsured as any).mockReturnValue(mockBuilder);

      const result = await getCategories();

      expect(result).toHaveLength(2);
      // contains should not be called when no userType is specified
    });
  });

  describe('getArticlesByCategory', () => {
    it('should return articles in a specific category', async () => {
      const mockBuilder: any = {
        select: vi.fn(),
        eq: vi.fn(),
        contains: vi.fn(),
        order: vi.fn(),
        then: vi.fn((resolve: any) =>
          resolve({
            data: [mockDbRow],
            error: null,
          })
        ),
      };
      mockBuilder.select.mockReturnValue(mockBuilder);
      mockBuilder.eq.mockReturnValue(mockBuilder);
      mockBuilder.contains.mockReturnValue(mockBuilder);
      mockBuilder.order.mockReturnValue(mockBuilder);

      (forsured as any).mockReturnValue(mockBuilder);

      const result = await getArticlesByCategory('getting-started', 'gc');

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('getting-started');

      // Should filter by category
      expect(mockBuilder.eq).toHaveBeenCalledWith('category', 'getting-started');
    });

    it('should return empty array when category not found', async () => {
      const mockBuilder: any = {
        select: vi.fn(),
        eq: vi.fn(),
        contains: vi.fn(),
        order: vi.fn(),
        then: vi.fn((resolve: any) =>
          resolve({
            data: [],
            error: null,
          })
        ),
      };
      mockBuilder.select.mockReturnValue(mockBuilder);
      mockBuilder.eq.mockReturnValue(mockBuilder);
      mockBuilder.contains.mockReturnValue(mockBuilder);
      mockBuilder.order.mockReturnValue(mockBuilder);

      (forsured as any).mockReturnValue(mockBuilder);

      const result = await getArticlesByCategory('nonexistent', 'gc');

      expect(result).toHaveLength(0);
    });
  });

  describe('Mock Data Fallback', () => {
    it('should provide GC getting started article in mock data', async () => {
      const mockBuilder: any = {
        select: vi.fn(),
        eq: vi.fn(),
        contains: vi.fn(),
        order: vi.fn(),
        then: vi.fn((resolve: any) =>
          resolve({
            data: [],
            error: null,
          })
        ),
      };
      mockBuilder.select.mockReturnValue(mockBuilder);
      mockBuilder.eq.mockReturnValue(mockBuilder);
      mockBuilder.contains.mockReturnValue(mockBuilder);
      mockBuilder.order.mockReturnValue(mockBuilder);

      (forsured as any).mockReturnValue(mockBuilder);

      const result = await getHelpArticles('gc');

      // Mock data should include GC getting started
      const gcArticle = result.find((a) => a.slug === 'getting-started');
      expect(gcArticle).toBeDefined();
      expect(gcArticle?.userTypes).toContain('gc');
    });

    it('should provide Contractor getting started article in mock data', async () => {
      const mockBuilder: any = {
        select: vi.fn(),
        eq: vi.fn(),
        contains: vi.fn(),
        order: vi.fn(),
        then: vi.fn((resolve: any) =>
          resolve({
            data: [],
            error: null,
          })
        ),
      };
      mockBuilder.select.mockReturnValue(mockBuilder);
      mockBuilder.eq.mockReturnValue(mockBuilder);
      mockBuilder.contains.mockReturnValue(mockBuilder);
      mockBuilder.order.mockReturnValue(mockBuilder);

      (forsured as any).mockReturnValue(mockBuilder);

      const result = await getHelpArticles('contractor');

      const contractorArticle = result.find((a) => a.slug === 'getting-started');
      expect(contractorArticle).toBeDefined();
      expect(contractorArticle?.userTypes).toContain('contractor');
    });

    it('should provide Broker getting started article in mock data', async () => {
      const mockBuilder: any = {
        select: vi.fn(),
        eq: vi.fn(),
        contains: vi.fn(),
        order: vi.fn(),
        then: vi.fn((resolve: any) =>
          resolve({
            data: [],
            error: null,
          })
        ),
      };
      mockBuilder.select.mockReturnValue(mockBuilder);
      mockBuilder.eq.mockReturnValue(mockBuilder);
      mockBuilder.contains.mockReturnValue(mockBuilder);
      mockBuilder.order.mockReturnValue(mockBuilder);

      (forsured as any).mockReturnValue(mockBuilder);

      const result = await getHelpArticles('broker');

      const brokerArticle = result.find((a) => a.slug === 'getting-started');
      expect(brokerArticle).toBeDefined();
      expect(brokerArticle?.userTypes).toContain('broker');
    });
  });
});
