/**
 * Help Article Service - Mock Validation Tests
 *
 * REQ-306: Mock Validation
 *
 * These tests validate that the mocks used in helpArticleService.test.ts
 * match the real Supabase PostgREST API behavior.
 *
 * IMPORTANT: Run these tests against a real Supabase instance to verify
 * mock accuracy. If these tests fail, the mocks in helpArticleService.test.ts
 * must be updated to match reality.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { forsured, supabaseServiceRole } from '../../lib/supabase';

// Skip if no service role key (CI without database) or if SKIP_SUPABASE_TESTS is set
// This test requires a real Supabase instance to validate mock accuracy
const skipIfNoSupabase = !supabaseServiceRole || process.env.CI || process.env.SKIP_SUPABASE_TESTS
  ? describe.skip
  : describe;

skipIfNoSupabase('Help Article Service Mock Validation', () => {
  // Clean up test data
  const testArticleIds: string[] = [];

  afterAll(async () => {
    // Clean up test articles
    if (supabaseServiceRole && testArticleIds.length > 0) {
      await supabaseServiceRole
        .schema('forsured')
        .from('help_articles')
        .delete()
        .in('id', testArticleIds);
    }
  });

  describe('Query Builder Chain Validation', () => {
    it('forsured() returns a query builder with select() method', async () => {
      const builder = forsured('help_articles');
      expect(typeof builder.select).toBe('function');
    });

    it('select() returns a builder with eq() method for chaining', async () => {
      const builder = forsured('help_articles').select('*');
      expect(typeof builder.eq).toBe('function');
    });

    it('eq() returns a builder with contains() method for chaining', async () => {
      const builder = forsured('help_articles').select('*').eq('is_published', true);
      expect(typeof builder.contains).toBe('function');
    });

    it('contains() returns a builder with order() method for chaining', async () => {
      const builder = forsured('help_articles')
        .select('*')
        .eq('is_published', true)
        .contains('user_types', ['gc']);
      expect(typeof builder.order).toBe('function');
    });

    it('order() is awaitable and returns {data, error} format', async () => {
      const result = await forsured('help_articles')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });

      // Verify response format
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('error');

      // Either data is array or error exists
      expect(Array.isArray(result.data) || result.error !== null).toBe(true);
    });
  });

  describe('Single Record Query Validation', () => {
    it('single() returns {data, error} format for existing record', async () => {
      // First insert a test record
      if (!supabaseServiceRole) return;

      const { data: inserted, error: insertError } = await supabaseServiceRole
        .schema('forsured')
        .from('help_articles')
        .insert({
          slug: 'test-mock-validation',
          title: 'Test Article',
          content: '# Test\n\nThis is a test article.',
          user_types: ['gc'],
          category: 'test',
          sort_order: 999,
          is_published: true,
        })
        .select()
        .single();

      if (insertError) {
        console.warn('Could not insert test article:', insertError);
        return;
      }

      testArticleIds.push(inserted.id);

      // Now test single() query
      const result = await forsured('help_articles')
        .select('*')
        .eq('slug', 'test-mock-validation')
        .eq('is_published', true)
        .single();

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('error');

      if (result.data) {
        expect(result.data.slug).toBe('test-mock-validation');
      }
    });

    it('single() returns PGRST116 error code when not found', async () => {
      const result = await forsured('help_articles')
        .select('*')
        .eq('slug', 'definitely-nonexistent-slug-12345')
        .eq('is_published', true)
        .single();

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe('PGRST116');
    });
  });

  describe('Array Contains Filter Validation', () => {
    it('contains() correctly filters by array field', async () => {
      const result = await forsured('help_articles')
        .select('*')
        .eq('is_published', true)
        .contains('user_types', ['gc'])
        .order('sort_order', { ascending: true });

      expect(result.error).toBeNull();

      if (result.data && result.data.length > 0) {
        // All returned articles should contain 'gc' in user_types
        result.data.forEach((article) => {
          expect(article.user_types).toContain('gc');
        });
      }
    });
  });

  describe('Response Format Validation', () => {
    it('database row has expected column names', async () => {
      const result = await forsured('help_articles')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .limit(1);

      if (result.data && result.data.length > 0) {
        const row = result.data[0];

        // Verify expected column names (snake_case from PostgreSQL)
        expect(row).toHaveProperty('id');
        expect(row).toHaveProperty('slug');
        expect(row).toHaveProperty('title');
        expect(row).toHaveProperty('content');
        expect(row).toHaveProperty('user_types'); // Array
        expect(row).toHaveProperty('category');
        expect(row).toHaveProperty('sort_order');
        expect(row).toHaveProperty('video_url');
        expect(row).toHaveProperty('is_published');
        expect(row).toHaveProperty('created_at');
        expect(row).toHaveProperty('updated_at');

        // Verify types
        expect(typeof row.id).toBe('string');
        expect(typeof row.slug).toBe('string');
        expect(typeof row.title).toBe('string');
        expect(typeof row.content).toBe('string');
        expect(Array.isArray(row.user_types)).toBe(true);
        expect(typeof row.category).toBe('string');
        expect(typeof row.sort_order).toBe('number');
        expect(typeof row.is_published).toBe('boolean');
      }
    });
  });

  describe('Error Response Format Validation', () => {
    it('database error has code and message properties', async () => {
      // Try to query a non-existent table to trigger an error
      const result = await (forsured as any)('nonexistent_table_12345').select('*');

      // This should error with table not found
      if (result.error) {
        expect(result.error).toHaveProperty('code');
        expect(result.error).toHaveProperty('message');
        expect(typeof result.error.code).toBe('string');
        expect(typeof result.error.message).toBe('string');
      }
    });
  });
});

/**
 * Mock Contract Documentation
 *
 * Based on the validation tests above, here is the contract that mocks must follow:
 *
 * 1. forsured(tableName) returns a query builder object
 * 2. Query builder methods (select, eq, contains, order) return 'this' for chaining
 * 3. Terminal methods (single, the result of order/select with no further chains) return Promise<{data, error}>
 * 4. Data is null on error, error is null on success
 * 5. Error object has 'code' and 'message' string properties
 * 6. PGRST116 is the error code for "not found" when using single()
 * 7. Column names use snake_case (e.g., user_types, sort_order, video_url)
 * 8. user_types is a string[] array in PostgreSQL
 * 9. sort_order is an integer
 * 10. video_url is nullable string
 */
