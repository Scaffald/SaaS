/**
 * Resume router baseline coverage.
 */

import { Buffer } from 'node:buffer';

import { assert, assertEquals, assertExists } from '../shared/assert.ts';

import { callTRPCEndpoint, loadCachedTokens } from '../shared/setup.ts';
import { requireAuthSetup } from '../shared/test-context.ts';

const TEST_PDF_CONTENT = `%PDF-1.1
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT /F1 12 Tf 72 120 Td (Sample Resume Text) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000115 00000 n 
0000000181 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
240
%%EOF`;

interface UploadResponse {
  resumeId: string;
  filePath: string;
  fileSize: number;
}

async function uploadSampleResume(
  authToken: string,
  overrides?: Partial<{
    mimeType: string;
    fileName: string;
    fileData: string;
    fileSize: number;
  }>,
): Promise<UploadResponse> {
  const mimeType = overrides?.mimeType ?? 'application/pdf';
  const fileName = overrides?.fileName ??
    `resume-${crypto.randomUUID()}.${mimeType === "application/pdf" ? "pdf" : "doc"}`;

  const fileBytes = overrides?.fileData
    ? Buffer.from(
      overrides.fileData.replace(/^data:[^;]+;base64,/, ""),
      "base64",
    )
    : Buffer.from(TEST_PDF_CONTENT, "utf-8");

  const base64Payload = overrides?.fileData ??
    `data:${mimeType};base64,${fileBytes.toString("base64")}`;
  const declaredSize = overrides?.fileSize ?? fileBytes.byteLength;

  const response = await callTRPCEndpoint(
    "resume.upload",
    {
      fileData: base64Payload,
      fileName,
      fileSize: declaredSize,
      mimeType,
    },
    {
      type: "mutation",
      authToken,
    },
  );

  const result = response[0]?.result?.data as
    | { success: boolean; resumeId: string; filePath: string }
    | undefined;

  assertExists(result, "Upload should return success payload");
  assert(result.success, "Upload success flag should be true");

  return {
    resumeId: result.resumeId,
    filePath: result.filePath,
    fileSize: fileBytes.byteLength,
  };
}

Deno.test({
  name: "Resume router - hasUploaded requires authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint("resume.hasUploaded");

    const error = response[0]?.error;
    assertExists(error, "Expected UNAUTHORIZED error");
    assertEquals(error?.data?.code, "UNAUTHORIZED");
  },
});

Deno.test({
  name: "Resume router - hasUploaded returns boolean for user",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const response = await callTRPCEndpoint(
      "resume.hasUploaded",
      undefined,
      { authToken: tokens.regular.token },
    );

    const data = response[0]?.result?.data;
    assertExists(data, "Expected response payload");
    assertEquals(typeof data.hasUploaded, "boolean");
  },
});

Deno.test({
  name: "Resume router - upload rejects unsupported mime types",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const response = await callTRPCEndpoint(
      "resume.upload",
      {
        fileData: "data:text/plain;base64,ZmFrZSBiYXNlNjQgZmlsZQ==",
        fileName: "resume.txt",
        fileSize: 32,
        mimeType: "text/plain",
      },
      {
        type: "mutation",
        authToken: tokens.regular.token,
      },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected BAD_REQUEST error for invalid mime type");
    assertEquals(error?.data?.code, "BAD_REQUEST");
    assertEquals(
      error?.message,
      "Please upload a PDF or Word document",
    );
  },
});

Deno.test({
  name: "Resume router - upload enforces 1MB size limit",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const response = await callTRPCEndpoint(
      "resume.upload",
      {
        fileData: "data:application/pdf;base64,AA==",
        fileName: "large-resume.pdf",
        fileSize: 1_048_577,
        mimeType: "application/pdf",
      },
      {
        type: "mutation",
        authToken: tokens.regular.token,
      },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected BAD_REQUEST error for oversized file");
    assertEquals(error?.data?.code, "BAD_REQUEST");
    assertEquals(
      error?.message,
      "File size exceeds 1MB limit. Please upload a smaller file.",
    );
  },
});

Deno.test({
  name: "Resume router - upload stores resume metadata and flags user as uploaded",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const upload = await uploadSampleResume(tokens.regular.token);
    assert(upload.fileSize < 1_048_576, "Sample file should be under size limit");

    const hasUploadedResponse = await callTRPCEndpoint(
      "resume.hasUploaded",
      undefined,
      { authToken: tokens.regular.token },
    );

    const data = hasUploadedResponse[0]?.result?.data as
      | { hasUploaded: boolean }
      | undefined;
    assertExists(data, "hasUploaded should return payload");
    assertEquals(data.hasUploaded, true);

    // Basic sanity check that file path was namespaced by user id
    assert(
      upload.filePath.startsWith(`${tokens.regular.userId}/`),
      "Stored file should be scoped to user",
    );
  },
});

Deno.test({
  name: "Resume router - parse succeeds when OpenAI is disabled and seeds wizard state",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    // Ensure no OpenAI traffic occurs during the test.
    Deno.env.delete("OPENAI_API_KEY");

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const { resumeId } = await uploadSampleResume(tokens.regular.token);

    const sections = [
      "general",
      "experience",
      "education",
      "skills",
      "certifications",
      "employment",
    ] as const;

    const parseResponse = await callTRPCEndpoint(
      "resume.parse",
      {
        resumeId,
        sections: [...sections],
      },
      {
        type: "mutation",
        authToken: tokens.regular.token,
      },
    );

    const parseResult = parseResponse[0]?.result?.data as
      | {
        success: boolean;
        parsedData: Record<string, unknown>;
        errors?: Array<{ section: string; message: string }>;
      }
      | undefined;

    assertExists(parseResult, "Parse mutation should return payload");
    assert(parseResult.success, "Parse should succeed when OpenAI disabled");
    assertExists(parseResult.errors, "Errors should describe missing sections");
    assertEquals(parseResult.errors?.length ?? 0, sections.length);
    assert(
      parseResult.errors?.every((error) =>
        error.message.includes("OpenAI API key is not configured")
      ),
      "Each section should surface OpenAI disabled warning",
    );

    const wizardResponse = await callTRPCEndpoint(
      "resume.getWizardState",
      { resumeId },
      { authToken: tokens.regular.token },
    );

    const wizardData = wizardResponse[0]?.result?.data as
      | {
        id: string;
        resumeId: string;
        errors?: Array<{ section: string; message: string }>;
        parsedData?: Record<string, unknown>;
      }
      | null
      | undefined;

    assertExists(wizardData, "Wizard state should be created after parsing");
    assertEquals(wizardData?.resumeId, resumeId);
    assertEquals(wizardData?.errors?.length ?? 0, sections.length);
  },
});

Deno.test({
  name: "Resume router - parse rejects unknown resume identifiers",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const response = await callTRPCEndpoint(
      "resume.parse",
      {
        resumeId: crypto.randomUUID(),
        sections: ["general"],
      },
      {
        type: "mutation",
        authToken: tokens.regular.token,
      },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected NOT_FOUND error for unknown resume");
    assertEquals(error?.data?.code, "NOT_FOUND");
  },
});
