/**
 * Public Profile Print Button (SC-40 Phase B).
 *
 * Renders a "Download PDF" Button on the public profile route at
 * /users/[slug]. On press it injects a `@media print` stylesheet that
 * hides nav/drawer chrome and tunes typography for letter paper, then
 * calls `window.print()`. The user picks "Save as PDF" in the system
 * print dialog.
 *
 * Web-only. Returns null on native (the public profile route is typically
 * opened in the device browser anyway).
 *
 * The PDF is the same React tree as the public profile page — single
 * source of truth, no parallel layout to maintain. v1.4.0 can replace
 * this with a true PDF artifact (server-side or @react-pdf/renderer)
 * if we want pixel-perfect output.
 */

import { Button } from '@scaffald/ui'
import { Download } from 'lucide-react-native'
import { useCallback, useEffect } from 'react'
import { Platform } from 'react-native'

const STYLE_ELEMENT_ID = 'scf-public-profile-print-styles'

const PRINT_STYLESHEET = `
@media print {
  @page {
    size: letter;
    margin: 0.5in;
  }
  html, body {
    background: #ffffff !important;
  }
  /* Anything marked as print-hide is removed from the printed copy.
     The print button itself, the dashboard nav chrome, the drawer
     mount point, and the mobile bottom tab bar all carry this attr. */
  [data-print-hide="true"],
  header[data-testid="dashboard-header"],
  nav[role="navigation"],
  [data-testid="mobile-bottom-nav"],
  [data-testid="drawer"],
  [data-testid="drawer-overlay"],
  [data-testid="breadcrumbs"] {
    display: none !important;
  }
  /* Avoid splitting profile sections across pages where possible. */
  [data-testid$="-widget"],
  [data-testid$="-section"] {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  /* Keep colors crisp on print (no auto-grayscaling). */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
`.trim()

function ensurePrintStylesheet() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ELEMENT_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ELEMENT_ID
  style.textContent = PRINT_STYLESHEET
  document.head.appendChild(style)
}

export function PublicProfilePrintButton() {
  // Inject the stylesheet on mount so the first Cmd+P also works,
  // not just clicks on our button.
  useEffect(() => {
    if (Platform.OS !== 'web') return
    ensurePrintStylesheet()
  }, [])

  const handlePrint = useCallback(() => {
    if (Platform.OS !== 'web') return
    ensurePrintStylesheet()
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print()
    }
  }, [])

  if (Platform.OS !== 'web') return null

  return (
    <Button
      variant="outline"
      iconStart={Download}
      onPress={handlePrint}
      accessibilityLabel="Download profile as PDF (print)"
      // The data attribute is what hides the button from the printed copy.
      // RN-Web forwards unknown props onto the underlying DOM element.
      {...({ 'data-print-hide': 'true' } as Record<string, string>)}
    >
      Download PDF
    </Button>
  )
}
