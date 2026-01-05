/**
 * CCPA PDF Generation Service
 *
 * Generates professional, branded PDF reports for CCPA data exports:
 * - Data Access Reports (Right to Know)
 * - Deletion Confirmation Reports (Right to Delete)
 * - Data Portability Exports
 *
 * Uses pdf-lib for pure JavaScript PDF generation compatible with Deno.
 */

import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib'
import type { UserDataExport } from './types.ts'

// Page configuration
const PAGE_WIDTH = 612 // Letter size in points
const PAGE_HEIGHT = 792
const MARGIN_LEFT = 50
const MARGIN_RIGHT = 50
const MARGIN_TOP = 50
const MARGIN_BOTTOM = 50
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT

// Typography sizes
const TITLE_SIZE = 24
const HEADING_SIZE = 16
const SUBHEADING_SIZE = 12
const BODY_SIZE = 10
const SMALL_SIZE = 8

// Colors
const PRIMARY_COLOR = rgb(0.1, 0.4, 0.7) // Scaffald blue
const SECONDARY_COLOR = rgb(0.3, 0.3, 0.3) // Dark gray
const LIGHT_COLOR = rgb(0.6, 0.6, 0.6) // Light gray

/**
 * PDF generation result
 */
export interface PDFGenerationResult {
  success: boolean
  pdfBytes: Uint8Array | null
  fileName: string
  sizeBytes: number
  pageCount: number
  generatedAt: string
  error?: string
}

/**
 * PDF generation options
 */
export interface PDFGenerationOptions {
  requestId: string
  requestType: 'access' | 'deletion' | 'correction' | 'portability'
  includeQRCode: boolean
  baseUrl: string
}

/**
 * Helper to add a new page and return the starting Y position
 */
function addNewPage(pdfDoc: PDFDocument): { page: PDFPage; yPosition: number } {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  return { page, yPosition: PAGE_HEIGHT - MARGIN_TOP }
}

/**
 * Draw text and return updated Y position
 */
function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  options: {
    font: Awaited<ReturnType<PDFDocument['embedFont']>>
    size: number
    color?: ReturnType<typeof rgb>
    maxWidth?: number
  }
): number {
  const { font, size, color = SECONDARY_COLOR, maxWidth = CONTENT_WIDTH } = options

  // Simple word wrapping
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const testWidth = (
      font as unknown as { widthOfTextAtSize: (text: string, size: number) => number }
    ).widthOfTextAtSize(testLine, size)

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  let currentY = y
  for (const line of lines) {
    page.drawText(line, {
      x,
      y: currentY,
      size,
      // biome-ignore lint/suspicious/noExplicitAny: Complex type inference from Supabase query
      font: font as any,
      color,
    })
    currentY -= size * 1.5
  }

  return currentY
}

/**
 * Draw a horizontal line
 */
function drawLine(page: PDFPage, y: number): void {
  page.drawLine({
    start: { x: MARGIN_LEFT, y },
    end: { x: PAGE_WIDTH - MARGIN_RIGHT, y },
    thickness: 1,
    color: LIGHT_COLOR,
  })
}

/**
 * Format a date for display
 */
function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'N/A'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Generate a Data Access Report PDF
 */
export async function generateDataAccessPDF(
  data: UserDataExport,
  options: PDFGenerationOptions
): Promise<PDFGenerationResult> {
  const startTime = Date.now()

  try {
    // Create PDF document
    const pdfDoc = await PDFDocument.create()
    // Note: pdf-lib doesn't support metadata methods like setTitle, setAuthor, etc.
    // These would need to be set via the document's info dictionary if needed

    // Embed fonts
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Add title page
    let { page, yPosition } = addNewPage(pdfDoc)

    // Title
    yPosition = drawText(page, 'CCPA Data Access Report', MARGIN_LEFT, yPosition, {
      font: helveticaBold as unknown as typeof helvetica,
      size: TITLE_SIZE,
      color: PRIMARY_COLOR,
    })

    yPosition -= 20

    // Subtitle
    yPosition = drawText(
      page,
      'California Consumer Privacy Act - Right to Know',
      MARGIN_LEFT,
      yPosition,
      {
        font: helvetica,
        size: SUBHEADING_SIZE,
        color: SECONDARY_COLOR,
      }
    )

    yPosition -= 30
    drawLine(page, yPosition)
    yPosition -= 30

    // Request summary
    yPosition = drawText(page, 'Request Summary', MARGIN_LEFT, yPosition, {
      font: helveticaBold as unknown as typeof helvetica,
      size: HEADING_SIZE,
      color: PRIMARY_COLOR,
    })
    yPosition -= 20

    const summaryLines = [
      `Request ID: ${options.requestId.slice(0, 8)}...`,
      `Generated: ${formatDate(data.metadata.exportedAt)}`,
      `Data Sources: ${data.metadata.dataSources.length} source(s)`,
      `Total Records: ${data.metadata.totalRecords}`,
      `Data Size: ${formatBytes(data.metadata.approximateSizeBytes)}`,
    ]

    for (const line of summaryLines) {
      yPosition = drawText(page, line, MARGIN_LEFT, yPosition, {
        font: helvetica,
        size: BODY_SIZE,
      })
    }

    yPosition -= 20

    // Verification notice
    if (options.includeQRCode) {
      yPosition = drawText(
        page,
        `Verify this report: ${options.baseUrl}/verify/${options.requestId}`,
        MARGIN_LEFT,
        yPosition,
        {
          font: helvetica,
          size: SMALL_SIZE,
          color: LIGHT_COLOR,
        }
      )
    }

    yPosition -= 40

    // Table of Contents
    yPosition = drawText(page, 'Contents', MARGIN_LEFT, yPosition, {
      font: helveticaBold as unknown as typeof helvetica,
      size: HEADING_SIZE,
      color: PRIMARY_COLOR,
    })
    yPosition -= 20

    const tocItems = [
      '1. Personal Information',
      '2. Professional Information',
      '3. Financial Information',
      '4. Usage Information',
      '5. Sensitive Information',
      '6. Communications',
    ]

    for (const item of tocItems) {
      yPosition = drawText(page, item, MARGIN_LEFT, yPosition, {
        font: helvetica,
        size: BODY_SIZE,
      })
    }
    // Section 1: Personal Information
    ;({ page, yPosition } = addNewPage(pdfDoc))

    yPosition = drawText(page, '1. Personal Information', MARGIN_LEFT, yPosition, {
      font: helveticaBold as unknown as typeof helvetica,
      size: HEADING_SIZE,
      color: PRIMARY_COLOR,
    })
    yPosition -= 10
    drawLine(page, yPosition)
    yPosition -= 20

    const personalInfo = data.personalInformation
    const personalLines = [
      `Name: ${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim() ||
        'Not provided',
      `Email: ${personalInfo.email || 'Not provided'}`,
      `Phone: ${personalInfo.phone || 'Not provided'}`,
      `Account Created: ${formatDate(personalInfo.accountCreatedAt ?? undefined)}`,
      `Last Login: ${formatDate(personalInfo.lastSignInAt ?? undefined)}`,
    ]

    for (const line of personalLines) {
      yPosition = drawText(page, line, MARGIN_LEFT, yPosition, {
        font: helvetica,
        size: BODY_SIZE,
      })
    }

    yPosition -= 20

    // Address
    if (personalInfo.address) {
      yPosition = drawText(page, 'Address:', MARGIN_LEFT, yPosition, {
        font: helveticaBold as unknown as typeof helvetica,
        size: BODY_SIZE,
      })
      yPosition -= 5

      const addr = personalInfo.address as Record<string, unknown>
      const addressLines = [
        addr.street as string | undefined,
        `${addr.city || ''}, ${addr.state || ''} ${addr.postalCode || ''}`.trim() || undefined,
        addr.country as string | undefined,
      ].filter(Boolean)

      for (const line of addressLines) {
        if (line) {
          yPosition = drawText(page, line, MARGIN_LEFT + 20, yPosition, {
            font: helvetica,
            size: BODY_SIZE,
          })
        }
      }
    }

    // Section 2: Professional Information
    yPosition -= 40

    yPosition = drawText(page, '2. Professional Information', MARGIN_LEFT, yPosition, {
      font: helveticaBold as unknown as typeof helvetica,
      size: HEADING_SIZE,
      color: PRIMARY_COLOR,
    })
    yPosition -= 10
    drawLine(page, yPosition)
    yPosition -= 20

    const profInfo = data.professionalInformation

    // Skills
    yPosition = drawText(
      page,
      `Skills: ${profInfo.skills.length} item(s)`,
      MARGIN_LEFT,
      yPosition,
      {
        font: helveticaBold as unknown as typeof helvetica,
        size: SUBHEADING_SIZE,
      }
    )
    yPosition -= 10

    if (profInfo.skills.length > 0) {
      const skillNames = profInfo.skills
        .slice(0, 20)
        .map((s) => (typeof s === 'string' ? s : (s as { name?: string }).name || 'Unknown'))
        .join(', ')
      yPosition = drawText(page, skillNames, MARGIN_LEFT + 20, yPosition, {
        font: helvetica,
        size: BODY_SIZE,
      })

      if (profInfo.skills.length > 20) {
        yPosition = drawText(
          page,
          `... and ${profInfo.skills.length - 20} more`,
          MARGIN_LEFT + 20,
          yPosition,
          {
            font: helvetica,
            size: SMALL_SIZE,
            color: LIGHT_COLOR,
          }
        )
      }
    }

    yPosition -= 20

    // Education
    yPosition = drawText(
      page,
      `Education: ${profInfo.education.length} item(s)`,
      MARGIN_LEFT,
      yPosition,
      {
        font: helveticaBold as unknown as typeof helvetica,
        size: SUBHEADING_SIZE,
      }
    )
    yPosition -= 10

    for (const edu of profInfo.education.slice(0, 5)) {
      const eduItem = edu as { institution?: string; degree?: string; fieldOfStudy?: string }
      const eduText = [eduItem.institution, eduItem.degree, eduItem.fieldOfStudy]
        .filter(Boolean)
        .join(' - ')
      if (eduText) {
        yPosition = drawText(page, `• ${eduText}`, MARGIN_LEFT + 20, yPosition, {
          font: helvetica,
          size: BODY_SIZE,
        })
      }
    }

    // Experience
    yPosition -= 20
    yPosition = drawText(
      page,
      `Work Experience: ${profInfo.experience.length} item(s)`,
      MARGIN_LEFT,
      yPosition,
      {
        font: helveticaBold as unknown as typeof helvetica,
        size: SUBHEADING_SIZE,
      }
    )
    yPosition -= 10

    for (const exp of profInfo.experience.slice(0, 5)) {
      const expItem = exp as { company?: string; title?: string }
      const expText = [expItem.title, expItem.company].filter(Boolean).join(' at ')
      if (expText) {
        yPosition = drawText(page, `• ${expText}`, MARGIN_LEFT + 20, yPosition, {
          font: helvetica,
          size: BODY_SIZE,
        })
      }
    }
    // Section 3: Financial Information
    ;({ page, yPosition } = addNewPage(pdfDoc))

    yPosition = drawText(page, '3. Financial Information', MARGIN_LEFT, yPosition, {
      font: helveticaBold as unknown as typeof helvetica,
      size: HEADING_SIZE,
      color: PRIMARY_COLOR,
    })
    yPosition -= 10
    drawLine(page, yPosition)
    yPosition -= 20

    const finInfo = data.financialInformation

    yPosition = drawText(
      page,
      `Payment Provider Connected: ${finInfo.stripeConnected ? 'Yes' : 'No'}`,
      MARGIN_LEFT,
      yPosition,
      {
        font: helvetica,
        size: BODY_SIZE,
      }
    )

    yPosition = drawText(
      page,
      `Payment Transactions: ${finInfo.payments.length} record(s)`,
      MARGIN_LEFT,
      yPosition,
      {
        font: helvetica,
        size: BODY_SIZE,
      }
    )

    // Section 4: Usage Information
    yPosition -= 40

    yPosition = drawText(page, '4. Usage Information', MARGIN_LEFT, yPosition, {
      font: helveticaBold as unknown as typeof helvetica,
      size: HEADING_SIZE,
      color: PRIMARY_COLOR,
    })
    yPosition -= 10
    drawLine(page, yPosition)
    yPosition -= 20

    const usageInfo = data.usageInformation

    const usageLines = [
      `Job Applications: ${usageInfo.applicationCount}`,
      `Profile Views: ${usageInfo.profileViews.length} viewer(s)`,
      `Connections: ${usageInfo.connectionCount}`,
    ]

    for (const line of usageLines) {
      yPosition = drawText(page, line, MARGIN_LEFT, yPosition, {
        font: helvetica,
        size: BODY_SIZE,
      })
    }

    // Section 5: Sensitive Information
    yPosition -= 40

    yPosition = drawText(page, '5. Sensitive Information', MARGIN_LEFT, yPosition, {
      font: helveticaBold as unknown as typeof helvetica,
      size: HEADING_SIZE,
      color: PRIMARY_COLOR,
    })
    yPosition -= 10
    drawLine(page, yPosition)
    yPosition -= 20

    const sensitiveInfo = data.sensitiveInformation

    const sensitiveLines = [
      `Background Checks: ${sensitiveInfo.backgroundChecks.length} record(s)`,
      `ID Verifications: ${sensitiveInfo.idVerifications.length} record(s)`,
      `Personality Assessments: ${sensitiveInfo.personalityAssessments.length} record(s)`,
    ]

    for (const line of sensitiveLines) {
      yPosition = drawText(page, line, MARGIN_LEFT, yPosition, {
        font: helvetica,
        size: BODY_SIZE,
      })
    }
    // Section 6: Communications
    ;({ page, yPosition } = addNewPage(pdfDoc))

    yPosition = drawText(page, '6. Communications', MARGIN_LEFT, yPosition, {
      font: helveticaBold as unknown as typeof helvetica,
      size: HEADING_SIZE,
      color: PRIMARY_COLOR,
    })
    yPosition -= 10
    drawLine(page, yPosition)
    yPosition -= 20

    const commsInfo = data.communications

    const commsLines = [
      `Reviews Received: ${commsInfo.reviews.length}`,
      `Feedback Submitted: ${commsInfo.feedback.length}`,
    ]

    for (const line of commsLines) {
      yPosition = drawText(page, line, MARGIN_LEFT, yPosition, {
        font: helvetica,
        size: BODY_SIZE,
      })
    }

    // Footer on last page
    yPosition = MARGIN_BOTTOM + 30
    drawLine(page, yPosition)
    yPosition -= 20

    yPosition = drawText(
      page,
      'This report was generated in compliance with the California Consumer Privacy Act (CCPA).',
      MARGIN_LEFT,
      yPosition,
      {
        font: helvetica,
        size: SMALL_SIZE,
        color: LIGHT_COLOR,
      }
    )

    yPosition = drawText(
      page,
      `Report generated by Scaffald on ${formatDate(new Date().toISOString())}`,
      MARGIN_LEFT,
      yPosition,
      {
        font: helvetica,
        size: SMALL_SIZE,
        color: LIGHT_COLOR,
      }
    )

    // Serialize PDF
    const pdfBytes = await pdfDoc.save()

    const generationTime = Date.now() - startTime
    console.log(`[pdf-generator] Data access PDF generated in ${generationTime}ms`)

    return {
      success: true,
      pdfBytes,
      fileName: `ccpa-data-access-${options.requestId.slice(0, 8)}.pdf`,
      sizeBytes: pdfBytes.length,
      pageCount: pdfDoc.getPageCount(),
      generatedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('[pdf-generator] Error generating data access PDF:', error)
    return {
      success: false,
      pdfBytes: null,
      fileName: '',
      sizeBytes: 0,
      pageCount: 0,
      generatedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Generate a Deletion Confirmation PDF
 */
export async function generateDeletionConfirmationPDF(
  _data: UserDataExport,
  deletedCategories: string[],
  retainedCategories: { category: string; reason: string }[],
  options: PDFGenerationOptions
): Promise<PDFGenerationResult> {
  const startTime = Date.now()

  try {
    // Create PDF document
    const pdfDoc = await PDFDocument.create()
    // Note: pdf-lib doesn't support metadata methods like setTitle, setAuthor, etc.
    // These would need to be set via the document's info dictionary if needed

    // Embed fonts
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Add page
    let { page, yPosition } = addNewPage(pdfDoc)

    // Title
    yPosition = drawText(page, 'CCPA Deletion Confirmation', MARGIN_LEFT, yPosition, {
      font: helveticaBold as unknown as typeof helvetica,
      size: TITLE_SIZE,
      color: PRIMARY_COLOR,
    })

    yPosition -= 20

    // Subtitle
    yPosition = drawText(
      page,
      'California Consumer Privacy Act - Right to Delete',
      MARGIN_LEFT,
      yPosition,
      {
        font: helvetica,
        size: SUBHEADING_SIZE,
        color: SECONDARY_COLOR,
      }
    )

    yPosition -= 30
    drawLine(page, yPosition)
    yPosition -= 30

    // Request summary
    yPosition = drawText(page, 'Request Summary', MARGIN_LEFT, yPosition, {
      font: helveticaBold as unknown as typeof helvetica,
      size: HEADING_SIZE,
      color: PRIMARY_COLOR,
    })
    yPosition -= 20

    const summaryLines = [
      `Request ID: ${options.requestId.slice(0, 8)}...`,
      `Deletion Completed: ${formatDate(new Date().toISOString())}`,
      `Categories Deleted: ${deletedCategories.length}`,
      `Categories Retained: ${retainedCategories.length}`,
    ]

    for (const line of summaryLines) {
      yPosition = drawText(page, line, MARGIN_LEFT, yPosition, {
        font: helvetica,
        size: BODY_SIZE,
      })
    }

    yPosition -= 30

    // Deleted data section
    yPosition = drawText(page, 'Data Deleted', MARGIN_LEFT, yPosition, {
      font: helveticaBold as unknown as typeof helvetica,
      size: HEADING_SIZE,
      color: PRIMARY_COLOR,
    })
    yPosition -= 10
    drawLine(page, yPosition)
    yPosition -= 20

    if (deletedCategories.length > 0) {
      for (const category of deletedCategories) {
        yPosition = drawText(page, `✓ ${category}`, MARGIN_LEFT + 20, yPosition, {
          font: helvetica,
          size: BODY_SIZE,
        })
      }
    } else {
      yPosition = drawText(
        page,
        'No data was eligible for deletion.',
        MARGIN_LEFT + 20,
        yPosition,
        {
          font: helvetica,
          size: BODY_SIZE,
          color: LIGHT_COLOR,
        }
      )
    }

    yPosition -= 30

    // Retained data section
    yPosition = drawText(page, 'Data Retained (Legal Requirements)', MARGIN_LEFT, yPosition, {
      font: helveticaBold as unknown as typeof helvetica,
      size: HEADING_SIZE,
      color: PRIMARY_COLOR,
    })
    yPosition -= 10
    drawLine(page, yPosition)
    yPosition -= 20

    if (retainedCategories.length > 0) {
      for (const item of retainedCategories) {
        yPosition = drawText(page, `• ${item.category}`, MARGIN_LEFT + 20, yPosition, {
          font: helveticaBold as unknown as typeof helvetica,
          size: BODY_SIZE,
        })
        yPosition = drawText(page, `  Reason: ${item.reason}`, MARGIN_LEFT + 30, yPosition, {
          font: helvetica,
          size: SMALL_SIZE,
          color: LIGHT_COLOR,
        })
        yPosition -= 5
      }
    } else {
      yPosition = drawText(page, 'No data was retained.', MARGIN_LEFT + 20, yPosition, {
        font: helvetica,
        size: BODY_SIZE,
        color: LIGHT_COLOR,
      })
    }

    // Footer
    yPosition = MARGIN_BOTTOM + 30
    drawLine(page, yPosition)
    yPosition -= 20

    yPosition = drawText(
      page,
      'This confirmation was generated in compliance with the California Consumer Privacy Act (CCPA).',
      MARGIN_LEFT,
      yPosition,
      {
        font: helvetica,
        size: SMALL_SIZE,
        color: LIGHT_COLOR,
      }
    )

    yPosition = drawText(
      page,
      `Confirmation generated by Scaffald on ${formatDate(new Date().toISOString())}`,
      MARGIN_LEFT,
      yPosition,
      {
        font: helvetica,
        size: SMALL_SIZE,
        color: LIGHT_COLOR,
      }
    )

    // Serialize PDF
    const pdfBytes = await pdfDoc.save()

    const generationTime = Date.now() - startTime
    console.log(`[pdf-generator] Deletion confirmation PDF generated in ${generationTime}ms`)

    return {
      success: true,
      pdfBytes,
      fileName: `ccpa-deletion-confirmation-${options.requestId.slice(0, 8)}.pdf`,
      sizeBytes: pdfBytes.length,
      pageCount: pdfDoc.getPageCount(),
      generatedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('[pdf-generator] Error generating deletion confirmation PDF:', error)
    return {
      success: false,
      pdfBytes: null,
      fileName: '',
      sizeBytes: 0,
      pageCount: 0,
      generatedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Generate PDF based on request type
 */
export async function generateCCPAPDF(
  data: UserDataExport,
  options: PDFGenerationOptions
): Promise<PDFGenerationResult> {
  switch (options.requestType) {
    case 'access':
    case 'portability':
      return generateDataAccessPDF(data, options)
    case 'deletion':
      // For deletion, we need additional context about what was deleted
      // This would be called separately with deletion details
      return generateDeletionConfirmationPDF(
        data,
        ['Personal Information', 'Professional Information'],
        [],
        options
      )
    case 'correction':
      // Correction reports use the same format as access reports
      return generateDataAccessPDF(data, options)
    default:
      return {
        success: false,
        pdfBytes: null,
        fileName: '',
        sizeBytes: 0,
        pageCount: 0,
        generatedAt: new Date().toISOString(),
        error: `Unsupported request type: ${options.requestType}`,
      }
  }
}

/**
 * Estimate PDF size before generation
 */
export function estimatePDFSize(data: UserDataExport): {
  estimatedBytes: number
  estimatedPages: number
  category: 'small' | 'medium' | 'large' | 'very_large'
} {
  // Rough estimation based on data size
  const dataString = JSON.stringify(data)
  const baseSize = 50000 // ~50KB base PDF overhead

  // Estimate compression ratio (PDF is usually smaller than JSON)
  const compressionRatio = 0.6
  const estimatedBytes = Math.round(baseSize + dataString.length * compressionRatio)

  // Estimate pages (rough: ~3KB per page)
  const estimatedPages = Math.max(4, Math.ceil(estimatedBytes / 3000))

  // Categorize
  let category: 'small' | 'medium' | 'large' | 'very_large'
  if (estimatedBytes < 1024 * 1024) {
    category = 'small' // <1MB
  } else if (estimatedBytes < 10 * 1024 * 1024) {
    category = 'medium' // 1-10MB
  } else if (estimatedBytes < 100 * 1024 * 1024) {
    category = 'large' // 10-100MB
  } else {
    category = 'very_large' // >100MB
  }

  return {
    estimatedBytes,
    estimatedPages,
    category,
  }
}
