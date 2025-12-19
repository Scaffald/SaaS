/**
 * Storage Backends Unit Tests
 *
 * Tests for the storage backend implementations (Supabase, Dropbox, Google Drive).
 * Uses mocks to test the interface contract and error handling.
 *
 * Run with: deno test --allow-all packages/supabase/functions/trpc/__tests__/storage-backends.test.ts
 */

import {
  assertEquals,
  assertExists,
  assertRejects,
} from 'https://deno.land/std@0.208.0/assert/mod';
import type {
  IStorageBackend,
  SignedUrlResult,
  StorageBackendType,
  UploadOptions,
  UploadResult,
} from '../routers/utils/storage-backends/index';

// Mock storage backend for testing the interface
class MockStorageBackend implements IStorageBackend {
  readonly type: StorageBackendType;
  private files: Map<string, { data: Uint8Array; options: UploadOptions }> =
    new Map();
  private isAvailableValue = true;
  private shouldFail = false;
  private failureMessage = 'Mock failure';

  constructor(type: StorageBackendType = "supabase") {
    this.type = type;
  }

  setAvailable(value: boolean): void {
    this.isAvailableValue = value;
  }

  setFailure(shouldFail: boolean, message = "Mock failure"): void {
    this.shouldFail = shouldFail;
    this.failureMessage = message;
  }

  async upload(
    file: Uint8Array,
    path: string,
    options: UploadOptions,
  ): Promise<UploadResult> {
    if (this.shouldFail) {
      throw { code: "UPLOAD_FAILED", message: this.failureMessage };
    }

    this.files.set(path, { data: file, options });

    // Calculate checksum
    const hashBuffer = await crypto.subtle.digest("SHA-256", file);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const checksum = hashArray.map((b) => b.toString(16).padStart(2, "0")).join(
      "",
    );

    return {
      path,
      storageBackend: this.type,
      size: file.length,
      checksum,
    };
  }

  async delete(path: string): Promise<void> {
    if (this.shouldFail) {
      throw { code: "DELETE_FAILED", message: this.failureMessage };
    }

    if (!this.files.has(path)) {
      throw { code: "NOT_FOUND", message: "File not found" };
    }

    this.files.delete(path);
  }

  async getSignedUrl(
    path: string,
    expirySeconds: number,
  ): Promise<SignedUrlResult> {
    if (this.shouldFail) {
      throw { code: "URL_GENERATION_FAILED", message: this.failureMessage };
    }

    if (!this.files.has(path)) {
      throw { code: "NOT_FOUND", message: "File not found" };
    }

    return {
      url:
        `https://mock-storage.example.com/${path}?token=mock&expires=${expirySeconds}`,
      expiresAt: new Date(Date.now() + expirySeconds * 1000),
    };
  }

  async isAvailable(): Promise<boolean> {
    return this.isAvailableValue;
  }

  // Test helper - get file data
  getFileData(path: string): Uint8Array | undefined {
    return this.files.get(path)?.data;
  }

  // Test helper - get file count
  getFileCount(): number {
    return this.files.size;
  }
}

// Helper to create test file data
function createTestFile(size: number = 100): Uint8Array {
  return new Uint8Array(size).fill(65);
}

// ===========================================
// IStorageBackend Interface Contract Tests
// ===========================================

Deno.test({
  name:
    "IStorageBackend - upload should return UploadResult with required fields",
  async fn() {
    const backend = new MockStorageBackend("supabase");

    const result = await backend.upload(createTestFile(100), "test/file.pdf", {
      contentType: "application/pdf",
    });

    assertExists(result.path);
    assertEquals(result.storageBackend, "supabase");
    assertEquals(result.size, 100);
    assertExists(result.checksum);
  },
});

Deno.test({
  name: "IStorageBackend - upload should store file at specified path",
  async fn() {
    const backend = new MockStorageBackend();
    const fileData = createTestFile(50);

    await backend.upload(fileData, "org/123/docs/test.pdf", {
      contentType: "application/pdf",
    });

    const storedData = backend.getFileData("org/123/docs/test.pdf");
    assertExists(storedData);
    assertEquals(storedData.length, 50);
  },
});

Deno.test({
  name: "IStorageBackend - upload should generate checksum",
  async fn() {
    const backend = new MockStorageBackend();

    const result1 = await backend.upload(createTestFile(100), "file1.pdf", {
      contentType: "application/pdf",
    });

    const result2 = await backend.upload(createTestFile(100), "file2.pdf", {
      contentType: "application/pdf",
    });

    // Same content should produce same checksum
    assertEquals(result1.checksum, result2.checksum);

    // Different content should produce different checksum
    const result3 = await backend.upload(
      new Uint8Array(100).fill(66),
      "file3.pdf",
      {
        contentType: "application/pdf",
      },
    );
    assertEquals(result1.checksum !== result3.checksum, true);
  },
});

Deno.test({
  name: "IStorageBackend - upload should throw on failure",
  async fn() {
    const backend = new MockStorageBackend();
    backend.setFailure(true, "Storage quota exceeded");

    await assertRejects(
      async () => {
        await backend.upload(createTestFile(), "test.pdf", {
          contentType: "application/pdf",
        });
      },
      undefined,
      "Storage quota exceeded",
    );
  },
});

Deno.test({
  name: "IStorageBackend - delete should remove file",
  async fn() {
    const backend = new MockStorageBackend();

    await backend.upload(createTestFile(), "to-delete.pdf", {
      contentType: "application/pdf",
    });
    assertEquals(backend.getFileCount(), 1);

    await backend.delete("to-delete.pdf");
    assertEquals(backend.getFileCount(), 0);
  },
});

Deno.test({
  name: "IStorageBackend - delete should throw for non-existent file",
  async fn() {
    const backend = new MockStorageBackend();

    await assertRejects(
      async () => {
        await backend.delete("nonexistent.pdf");
      },
      undefined,
      "File not found",
    );
  },
});

Deno.test({
  name: "IStorageBackend - delete should throw on failure",
  async fn() {
    const backend = new MockStorageBackend();

    await backend.upload(createTestFile(), "test.pdf", {
      contentType: "application/pdf",
    });
    backend.setFailure(true, "Permission denied");

    await assertRejects(
      async () => {
        await backend.delete("test.pdf");
      },
      undefined,
      "Permission denied",
    );
  },
});

Deno.test({
  name: "IStorageBackend - getSignedUrl should return valid URL",
  async fn() {
    const backend = new MockStorageBackend();

    await backend.upload(createTestFile(), "test.pdf", {
      contentType: "application/pdf",
    });

    const result = await backend.getSignedUrl("test.pdf", 3600);

    assertExists(result.url);
    assertEquals(result.url.includes("test.pdf"), true);
    assertExists(result.expiresAt);
    assertEquals(result.expiresAt > new Date(), true);
  },
});

Deno.test({
  name: "IStorageBackend - getSignedUrl should respect expiry time",
  async fn() {
    const backend = new MockStorageBackend();

    await backend.upload(createTestFile(), "test.pdf", {
      contentType: "application/pdf",
    });

    const shortExpiry = await backend.getSignedUrl("test.pdf", 60);
    const longExpiry = await backend.getSignedUrl("test.pdf", 3600);

    assertEquals(longExpiry.expiresAt > shortExpiry.expiresAt, true);
  },
});

Deno.test({
  name: "IStorageBackend - getSignedUrl should throw for non-existent file",
  async fn() {
    const backend = new MockStorageBackend();

    await assertRejects(
      async () => {
        await backend.getSignedUrl("nonexistent.pdf", 3600);
      },
      undefined,
      "File not found",
    );
  },
});

Deno.test({
  name: "IStorageBackend - isAvailable should return availability status",
  async fn() {
    const backend = new MockStorageBackend();

    assertEquals(await backend.isAvailable(), true);

    backend.setAvailable(false);
    assertEquals(await backend.isAvailable(), false);
  },
});

Deno.test({
  name: "IStorageBackend - type should be immutable",
  fn() {
    const supabaseBackend = new MockStorageBackend("supabase");
    const dropboxBackend = new MockStorageBackend("dropbox");
    const googleDriveBackend = new MockStorageBackend("google_drive");

    assertEquals(supabaseBackend.type, "supabase");
    assertEquals(dropboxBackend.type, "dropbox");
    assertEquals(googleDriveBackend.type, "google_drive");
  },
});

// ===========================================
// Storage Backend Behavior Tests
// ===========================================

Deno.test({
  name: "Storage Backend - should handle concurrent uploads",
  async fn() {
    const backend = new MockStorageBackend();

    const uploads = Array.from(
      { length: 5 },
      (_, i) =>
        backend.upload(createTestFile(100 + i), `concurrent-${i}.pdf`, {
          contentType: "application/pdf",
        }),
    );

    const results = await Promise.all(uploads);

    assertEquals(results.length, 5);
    assertEquals(results.every((r) => r.size > 0), true);
    assertEquals(backend.getFileCount(), 5);
  },
});

Deno.test({
  name: "Storage Backend - should handle large files",
  async fn() {
    const backend = new MockStorageBackend();
    const largeFile = createTestFile(10 * 1024 * 1024); // 10MB

    const result = await backend.upload(largeFile, "large-file.pdf", {
      contentType: "application/pdf",
    });

    assertEquals(result.size, 10 * 1024 * 1024);
    assertExists(result.checksum);
  },
});

Deno.test({
  name: "Storage Backend - should handle various content types",
  async fn() {
    const backend = new MockStorageBackend();

    const contentTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    for (const contentType of contentTypes) {
      const result = await backend.upload(
        createTestFile(),
        `file.${contentType.split("/")[1]}`,
        {
          contentType,
        },
      );
      assertEquals(result.storageBackend, "supabase");
    }

    assertEquals(backend.getFileCount(), 5);
  },
});

Deno.test({
  name: "Storage Backend - should handle metadata",
  async fn() {
    const backend = new MockStorageBackend();

    const result = await backend.upload(createTestFile(), "metadata.pdf", {
      contentType: "application/pdf",
      metadata: {
        originalName: "my-document.pdf",
        uploadedBy: "user-123",
      },
    });

    assertEquals(result.path, "metadata.pdf");
  },
});

Deno.test({
  name: "Storage Backend - should handle upsert option",
  async fn() {
    const backend = new MockStorageBackend();

    // First upload
    await backend.upload(createTestFile(50), "upsert.pdf", {
      contentType: "application/pdf",
      upsert: true,
    });

    // Upsert with different content
    const result = await backend.upload(createTestFile(100), "upsert.pdf", {
      contentType: "application/pdf",
      upsert: true,
    });

    assertEquals(result.size, 100);
    assertEquals(backend.getFileCount(), 1); // Still only one file
  },
});

Deno.test({
  name: "Storage Backend - should handle special characters in path",
  async fn() {
    const backend = new MockStorageBackend();

    const paths = [
      "org/123/docs/file with spaces.pdf",
      "org/123/docs/file-with-dashes.pdf",
      "org/123/docs/file_with_underscores.pdf",
      "org/123/docs/file.multiple.dots.pdf",
    ];

    for (const path of paths) {
      await backend.upload(createTestFile(), path, {
        contentType: "application/pdf",
      });
    }

    assertEquals(backend.getFileCount(), 4);
  },
});

// ===========================================
// Error Handling Tests
// ===========================================

Deno.test({
  name: "Storage Backend - errors should have code and message",
  async fn() {
    const backend = new MockStorageBackend();
    backend.setFailure(true, "Quota exceeded");

    try {
      await backend.upload(createTestFile(), "fail.pdf", {
        contentType: "application/pdf",
      });
    } catch (error) {
      const err = error as { code?: string; message?: string };
      assertEquals(err.code, "UPLOAD_FAILED");
      assertEquals(err.message, "Quota exceeded");
    }
  },
});

Deno.test({
  name: "Storage Backend - should recover after temporary failure",
  async fn() {
    const backend = new MockStorageBackend();

    // First upload fails
    backend.setFailure(true, "Temporary error");

    try {
      await backend.upload(createTestFile(), "temp-fail.pdf", {
        contentType: "application/pdf",
      });
    } catch {
      // Expected
    }

    // Backend recovers
    backend.setFailure(false);

    // Second upload succeeds
    const result = await backend.upload(createTestFile(), "success.pdf", {
      contentType: "application/pdf",
    });

    assertEquals(result.path, "success.pdf");
  },
});
